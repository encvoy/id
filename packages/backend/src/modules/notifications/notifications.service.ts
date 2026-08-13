import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationTarget, Prisma } from '@prisma/client';
import { CLIENT_ID } from 'src/constants';
import { TLocalizedTextValue } from 'src/utils/localized-text';
import { prisma } from '../prisma';
import {
  CreateNotificationDto,
  ListNotificationsDto,
  UpdateNotificationDto,
} from './notifications.dto';

export type TWidgetNotificationType = 'system' | 'organization' | 'client';

export type TWidgetNotification = {
  id: string;
  title: string | TLocalizedTextValue;
  content: string | TLocalizedTextValue;
  type: TWidgetNotificationType;
};

export type TNotificationListItem = Notification & {
  read_count: number;
  total_target: number;
};

type TNotificationStats = {
  read_count: number;
  total_target: number;
};

@Injectable()
export class NotificationsService {
  private readonly defaultListLimit = 10;

  private readonly widgetSelect = {
    id: true,
    title: true,
    content: true,
    client_id: true,
    client: {
      select: {
        parent_id: true,
      },
    },
  } satisfies Prisma.NotificationSelect;

  private getWidgetNotificationType(notification: {
    client_id: string | null;
    client?: { parent_id: string | null } | null;
  }): TWidgetNotificationType {
    if (this.isGlobalNotificationClientId(notification.client_id)) {
      return 'system';
    }

    if (notification.client?.parent_id === null) {
      return 'organization';
    }

    return 'client';
  }

  private toWidgetNotification(notification: {
    id: string;
    title: Prisma.JsonValue;
    content: Prisma.JsonValue;
    client_id: string | null;
    client?: { parent_id: string | null } | null;
  }): TWidgetNotification {
    return {
      id: notification.id,
      title: notification.title as string | TLocalizedTextValue,
      content: notification.content as string | TLocalizedTextValue,
      type: this.getWidgetNotificationType(notification),
    };
  }

  private isGlobalNotificationClientId(clientId: string | null | undefined): boolean {
    return clientId == null || clientId === CLIENT_ID;
  }

  private normalizeNotificationClientId(clientId: string | null): string | null {
    return this.isGlobalNotificationClientId(clientId) ? null : clientId;
  }

  private getDashboardScopeClientIds(clientId: string | null): (string | null)[] {
    return this.isGlobalNotificationClientId(clientId) ? [null, CLIENT_ID] : [clientId];
  }

  private normalizePayload<T extends CreateNotificationDto | UpdateNotificationDto>(
    payload: T,
    target: NotificationTarget,
    existingUserIds: string[] = [],
  ) {
    return {
      ...payload,
      user_ids:
        target === NotificationTarget.USER_LIST
          ? (payload.user_ids ?? existingUserIds).map((id) => String(id))
          : [],
    };
  }

  private toNotificationData<T extends CreateNotificationDto | UpdateNotificationDto>(
    payload: T,
    target: NotificationTarget,
    existingUserIds: string[] = [],
  ) {
    const normalizedPayload = this.normalizePayload(payload, target, existingUserIds);

    return {
      ...(normalizedPayload.title !== undefined
        ? { title: normalizedPayload.title as Prisma.InputJsonValue }
        : {}),
      ...(normalizedPayload.content !== undefined
        ? { content: normalizedPayload.content as Prisma.InputJsonValue }
        : {}),
      ...(normalizedPayload.target !== undefined ? { target: normalizedPayload.target } : {}),
      ...(normalizedPayload.is_active !== undefined
        ? { is_active: normalizedPayload.is_active }
        : {}),
      user_ids: normalizedPayload.user_ids,
    };
  }

  private validateUserListTarget(target: NotificationTarget, userIds?: Array<string | number>) {
    if (target === NotificationTarget.USER_LIST && !userIds?.length) {
      throw new BadRequestException('user_ids is required for USER_LIST notifications');
    }
  }

  private async resolveNotification(
    notificationOrId: Notification | string,
  ): Promise<Notification> {
    if (typeof notificationOrId !== 'string') {
      return notificationOrId;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationOrId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  private getTargetUsersWhere(notification: Notification): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      deleted: null,
    };

    if (!this.isGlobalNotificationClientId(notification.client_id)) {
      where.roles = {
        some: {
          client_id: notification.client_id,
        },
      };
    }

    return where;
  }

  private async getReadCountsByNotificationIds(notificationIds: string[]) {
    if (!notificationIds.length) {
      return new Map<string, number>();
    }

    const groupedReads = await prisma.notificationRead.groupBy({
      by: ['notification_id'],
      where: {
        notification_id: {
          in: notificationIds,
        },
      },
      _count: {
        notification_id: true,
      },
    });

    return new Map(groupedReads.map((item) => [item.notification_id, item._count.notification_id]));
  }

  private async getTotalTargetByNotification(
    notification: Notification,
    allTargetCountCache: Map<string, Promise<number>>,
  ) {
    const baseWhere = this.getTargetUsersWhere(notification);

    switch (notification.target) {
      case NotificationTarget.ALL: {
        const cacheKey = this.normalizeNotificationClientId(notification.client_id) ?? '__global__';
        if (!allTargetCountCache.has(cacheKey)) {
          allTargetCountCache.set(cacheKey, prisma.user.count({ where: baseWhere }));
        }

        return allTargetCountCache.get(cacheKey) as Promise<number>;
      }
      case NotificationTarget.NEW_USERS:
        return prisma.user.count({
          where: {
            ...baseWhere,
            created_at: { gte: notification.created_at },
          },
        });
      case NotificationTarget.EXISTING_USERS:
        return prisma.user.count({
          where: {
            ...baseWhere,
            created_at: { lt: notification.created_at },
          },
        });
      case NotificationTarget.USER_LIST:
        return prisma.user.count({
          where: {
            ...baseWhere,
            id: { in: notification.user_ids.map((id) => String(id)) },
          },
        });
    }
  }

  private async enrichNotificationsWithStats(
    notifications: Notification[],
  ): Promise<TNotificationListItem[]> {
    if (!notifications.length) {
      return [];
    }

    const readCounts = await this.getReadCountsByNotificationIds(
      notifications.map((notification) => notification.id),
    );
    const allTargetCountCache = new Map<string, Promise<number>>();
    const totalTargets = await Promise.all(
      notifications.map((notification) =>
        this.getTotalTargetByNotification(notification, allTargetCountCache),
      ),
    );

    return notifications.map((notification, index) => ({
      ...notification,
      read_count: readCounts.get(notification.id) ?? 0,
      total_target: totalTargets[index],
    }));
  }

  private async getStatsByNotification(notification: Notification): Promise<TNotificationStats> {
    const [notificationWithStats] = await this.enrichNotificationsWithStats([notification]);
    return {
      read_count: notificationWithStats.read_count,
      total_target: notificationWithStats.total_target,
    };
  }

  private buildListWhere(
    clientId: string | null,
    params: ListNotificationsDto,
  ): Prisma.NotificationWhereInput {
    const { filter } = params;
    const scopeClientIds = this.getDashboardScopeClientIds(clientId);
    const andWhere: Prisma.NotificationWhereInput[] = [
      scopeClientIds.length === 1
        ? { client_id: scopeClientIds[0] }
        : {
            OR: scopeClientIds.map((scopeClientId) => ({
              client_id: scopeClientId,
            })),
          },
    ];

    if (filter) {
      andWhere.push(filter);
    }

    return andWhere.length === 1 ? andWhere[0] : { AND: andWhere };
  }

  private async listByScope(clientId: string | null, params: ListNotificationsDto) {
    const { sortBy, sortDirection } = params;
    const limit = params.limit ?? this.defaultListLimit;
    const offset = params.offset ?? 0;
    const where = this.buildListWhere(clientId, params);
    const orderBy = {
      [sortBy || 'created_at']: sortDirection || 'desc',
    } as Prisma.NotificationOrderByWithRelationInput;

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
      }),
      prisma.notification.count({ where }),
    ]);

    const items = await this.enrichNotificationsWithStats(notifications);

    return { items, totalCount };
  }

  private async createByScope(clientId: string | null, payload: CreateNotificationDto) {
    this.validateUserListTarget(payload.target, payload.user_ids);

    return prisma.notification.create({
      data: {
        title: payload.title as Prisma.InputJsonValue,
        content: payload.content as Prisma.InputJsonValue,
        target: payload.target,
        is_active: payload.is_active,
        user_ids: this.toNotificationData(payload, payload.target).user_ids,
        client: clientId ? { connect: { client_id: clientId } } : undefined,
      } as never,
    });
  }

  private async resolveNotificationScope(clientId: string): Promise<(string | null)[]> {
    const scopeChain: string[] = [];
    const visited = new Set<string>();
    let currentClientId: string | null = clientId;

    while (currentClientId && !visited.has(currentClientId)) {
      visited.add(currentClientId);

      const client = await prisma.client.findUnique({
        where: { client_id: currentClientId },
        select: {
          client_id: true,
          parent_id: true,
        },
      });

      scopeChain.push(currentClientId);
      currentClientId = client?.parent_id ?? null;
    }

    return [null, ...scopeChain.reverse()];
  }

  async listByClient(clientId: string, params: ListNotificationsDto) {
    return this.listByScope(clientId, params);
  }

  async getById(notificationOrId: Notification | string): Promise<TNotificationListItem> {
    const notification = await this.resolveNotification(notificationOrId);

    return {
      ...notification,
      ...(await this.getStatsByNotification(notification)),
    };
  }

  async createByClient(clientId: string, payload: CreateNotificationDto) {
    return this.createByScope(this.normalizeNotificationClientId(clientId), payload);
  }

  async updateById(notificationOrId: Notification | string, payload: UpdateNotificationDto) {
    const currentNotification = await this.resolveNotification(notificationOrId);
    const target = payload.target ?? currentNotification.target;
    this.validateUserListTarget(target, payload.user_ids ?? currentNotification.user_ids);

    return prisma.notification.update({
      where: { id: currentNotification.id },
      data: this.toNotificationData(payload, target, currentNotification.user_ids) as never,
    });
  }

  async archiveById(notificationOrId: Notification | string) {
    const notification = await this.resolveNotification(notificationOrId);

    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        is_active: false,
      },
    });
  }

  async getUnreadForUser(userId: string, clientId: string): Promise<TWidgetNotification[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        created_at: true,
      },
    });

    if (!user) {
      return [];
    }

    const clientScope = await this.resolveNotificationScope(clientId);
    const scopedClientIds = clientScope.filter(
      (scopeClientId): scopeClientId is string =>
        scopeClientId !== null && !this.isGlobalNotificationClientId(scopeClientId),
    );

    const notifications = await prisma.notification.findMany({
      where: {
        is_active: true,
        reads: {
          none: {
            user_id: user.id,
          },
        },
        OR: [
          { client_id: null },
          { client_id: CLIENT_ID },
          ...(scopedClientIds.length
            ? [
                {
                  client_id: {
                    in: scopedClientIds,
                  },
                },
              ]
            : []),
        ],
        AND: [
          {
            OR: [
              { target: NotificationTarget.ALL },
              {
                target: NotificationTarget.NEW_USERS,
                created_at: {
                  lte: user.created_at,
                },
              },
              {
                target: NotificationTarget.EXISTING_USERS,
                created_at: {
                  gt: user.created_at,
                },
              },
              {
                target: NotificationTarget.USER_LIST,
                user_ids: {
                  has: String(user.id),
                },
              },
            ],
          },
        ],
      },
      select: this.widgetSelect,
      orderBy: {
        created_at: 'desc',
      },
    });

    return notifications.map((notification) => this.toWidgetNotification(notification));
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    if (!notificationIds.length) {
      return;
    }

    await prisma.notificationRead.createMany({
      data: notificationIds.map((notification_id) => ({
        notification_id,
        user_id: userId,
      })),
      skipDuplicates: true,
    });
  }
}

import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Scope, UserId } from 'src/decorators';
import { prepareListResponse } from 'src/helpers';
import { Actions } from '../../enums';
import { CustomLogger } from '../logger';
import {
  CreateNotificationDto,
  ListNotificationsDto,
  NotificationDto,
  NotificationListItemDto,
  UpdateNotificationDto,
} from './notifications.dto';
import { NotificationsActions } from './notifications.roles';
import { NotificationsService } from './notifications.service';
import { NotificationAccessGuard, TNotificationRequest } from './notification.access.guard';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

const notificationResponseHeaders = {
  'X-Total-Count': {
    description: 'Total number of notifications matching the current filter.',
    schema: { type: 'number', example: 25 },
  },
  'X-Per-Page': {
    description: 'Profile size used for the current response.',
    schema: { type: 'number', example: 10 },
  },
  'X-Current-Offset': {
    description: 'Offset of the current page.',
    schema: { type: 'number', example: 0 },
  },
  'X-Next-Offset': {
    description: 'Offset to request the next page.',
    schema: { type: 'number', example: 10 },
  },
};

const createNotificationExamples = {
  allUsers: {
    summary: 'Notification for all application users',
    value: {
      title: {
        'ru-RU': 'Плановые работы',
        'en-US': 'Scheduled maintenance',
      },
      content: {
        'ru-RU': 'Сервис будет недоступен в субботу с 02:00 до 04:00.',
        'en-US': 'The service will be unavailable on Saturday from 02:00 to 04:00.',
      },
      target: 'ALL',
      is_active: true,
    },
  },
  userList: {
    summary: 'Notification for a selected list of users',
    value: {
      title: {
        'ru-RU': 'Проверка доступа',
        'en-US': 'Access check',
      },
      content: {
        'ru-RU': 'Для вашего аккаунта доступна новая функция.',
        'en-US': 'A new feature is available for your account.',
      },
      target: 'USER_LIST',
      user_ids: ['3c1e0f1b-5857-4aa2-98a8-df8db597cdb5', '53b5ea98-f6f7-4c21-b0fa-f894d58f970f'],
      is_active: true,
    },
  },
};

const updateNotificationExamples = {
  archiveLikeUpdate: {
    summary: 'Disable a notification without using the archive endpoint',
    value: {
      is_active: false,
    },
  },
  changeAudience: {
    summary: 'Change the notification audience',
    value: {
      target: 'USER_LIST',
      user_ids: ['3c1e0f1b-5857-4aa2-98a8-df8db597cdb5', '53b5ea98-f6f7-4c21-b0fa-f894d58f970f'],
    },
  },
};

@common.Controller('v1/clients/:client_id/notifications')
@swagger.ApiTags('Notifications')
@swagger.ApiBearerAuth()
@common.UseGuards(NotificationAccessGuard)
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly logger: CustomLogger,
  ) {}

  private getNotification(request: TNotificationRequest) {
    return request.notification as NonNullable<TNotificationRequest['notification']>;
  }

  @common.Get()
  @swagger.ApiOperation({
    summary: 'Get notifications list',
    description:
      'Returns a list of notifications for the specified application. Supports filtering, sorting, and pagination via query parameters. The total number of items is returned in HTTP headers.',
  })
  @swagger.ApiParam({
    name: 'client_id',
    example: 'my-client-id',
    description:
      'Application identifier for which notifications should be returned. For the system application, use its client_id to work with global notifications.',
  })
  @swagger.ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    example: '{"is_active":true,"target":"ALL"}',
    description:
      'JSON string with notification field filters. Example: {"is_active":true,"target":"ALL"}.',
  })
  @swagger.ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'created_at',
    description: 'Sort field. Common values: created_at, updated_at, is_active, target.',
  })
  @swagger.ApiQuery({
    name: 'sortDirection',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort direction.',
  })
  @swagger.ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of items per page. Default is 10.',
  })
  @swagger.ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    description: 'Offset from the beginning of the result set.',
  })
  @swagger.ApiOkResponse({
    description: 'List of notifications with calculated read statistics and audience size.',
    type: NotificationListItemDto,
    isArray: true,
    headers: notificationResponseHeaders,
  })
  @swagger.ApiForbiddenResponse({
    description:
      'Access denied: the request was sent without an access token, with an invalid token, or the user does not have notifications:list permission for the specified application.',
  })
  @Scope(NotificationsActions.list)
  async list(
    @common.Param('client_id') clientId: string,
    @common.Query() query: ListNotificationsDto,
    @common.Res() res: Response,
  ) {
    const { items, totalCount } = await this.service.listByClient(clientId, query);
    return prepareListResponse(res, items, totalCount, query);
  }

  @common.Post()
  @swagger.ApiOperation({
    summary: 'Create notification',
    description:
      'Creates a new notification for the specified application. If target = USER_LIST, the user_ids field is required.',
  })
  @swagger.ApiParam({
    name: 'client_id',
    example: 'my-client-id',
    description:
      'Application identifier in whose context the notification is created. For the system application, use its client_id to create a global notification.',
  })
  @swagger.ApiBody({
    type: CreateNotificationDto,
    description: 'Payload of the notification to create.',
    examples: createNotificationExamples,
  })
  @swagger.ApiCreatedResponse({
    description: 'Notification created successfully.',
    type: NotificationDto,
  })
  @swagger.ApiBadRequestResponse({
    description: 'Invalid payload, for example user_ids is missing when target = USER_LIST.',
  })
  @swagger.ApiForbiddenResponse({
    description:
      'Access denied: the request was sent without an access token, with an invalid token, or the user does not have notifications:write permission for the specified application.',
  })
  @Scope(NotificationsActions.write)
  async create(
    @common.Param('client_id') clientId: string,
    @common.Body() body: CreateNotificationDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const notification = await this.service.createByClient(clientId, body);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.NOTIFICATION_CREATE,
      description: '',
      details: {
        target: notification.id,
        changed_fields: getDefinedKeys(body),
      },
    });

    return notification;
  }

  @common.Get(':id')
  @swagger.ApiOperation({
    summary: 'Get notification by id',
    description:
      'Returns a single notification together with statistics: how many users have read it and how many users belong to its target audience.',
  })
  @swagger.ApiParam({
    name: 'client_id',
    example: 'my-client-id',
    description: 'Application identifier in whose scope the notification is searched.',
  })
  @swagger.ApiParam({
    name: 'id',
    example: '3c1e0f1b-5857-4aa2-98a8-df8db597cdb5',
    description: 'Notification identifier.',
  })
  @swagger.ApiOkResponse({
    description: 'Notification found.',
    type: NotificationListItemDto,
  })
  @swagger.ApiForbiddenResponse({
    description:
      'Access denied: the request was sent without an access token, with an invalid token, or the user does not have notifications:list permission for the specified application.',
  })
  @swagger.ApiNotFoundResponse({
    description: 'Notification was not found or does not belong to the specified client_id.',
  })
  @Scope(NotificationsActions.list)
  async getById(@common.Req() request: TNotificationRequest) {
    return this.service.getById(this.getNotification(request));
  }

  @common.Put(':id')
  @swagger.ApiOperation({
    summary: 'Update notification',
    description:
      'Partially updates a notification. You can change the text, audience, user list, and activity flag.',
  })
  @swagger.ApiParam({
    name: 'client_id',
    example: 'my-client-id',
    description: 'Application identifier in whose scope the notification is updated.',
  })
  @swagger.ApiParam({
    name: 'id',
    example: '3c1e0f1b-5857-4aa2-98a8-df8db597cdb5',
    description: 'Notification identifier.',
  })
  @swagger.ApiBody({
    type: UpdateNotificationDto,
    description: 'Notification fields to update. Partial payload is allowed.',
    examples: updateNotificationExamples,
  })
  @swagger.ApiOkResponse({
    description: 'Notification updated successfully.',
    type: NotificationDto,
  })
  @swagger.ApiBadRequestResponse({
    description: 'Invalid payload, for example user_ids is missing when target = USER_LIST.',
  })
  @swagger.ApiForbiddenResponse({
    description:
      'Access denied: the request was sent without an access token, with an invalid token, or the user does not have notifications:write permission for the specified application.',
  })
  @swagger.ApiNotFoundResponse({
    description: 'Notification was not found or does not belong to the specified client_id.',
  })
  @Scope(NotificationsActions.write)
  async update(
    @common.Req() request: TNotificationRequest,
    @common.Body() body: UpdateNotificationDto,
    @UserId() userId: string,
  ) {
    const notification = this.getNotification(request);
    const updatedNotification = await this.service.updateById(notification, body);

    await this.logger.logEvent({
      ip_address: request.ip,
      device: request.headers['user-agent'],
      user_id: userId,
      client_id: request.params.client_id,
      event: Actions.NOTIFICATION_UPDATE,
      description: '',
      details: {
        target: notification.id,
        changed_fields: getDefinedKeys(body),
      },
    });

    return updatedNotification;
  }

  @common.Delete(':id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({
    summary: 'Archive notification',
    description:
      'Archives a notification using a soft-delete approach: the record remains in the database, but becomes inactive and is no longer shown to users.',
  })
  @swagger.ApiParam({
    name: 'client_id',
    example: 'my-client-id',
    description: 'Application identifier in whose scope the notification is archived.',
  })
  @swagger.ApiParam({
    name: 'id',
    example: '3c1e0f1b-5857-4aa2-98a8-df8db597cdb5',
    description: 'Notification identifier.',
  })
  @swagger.ApiNoContentResponse({
    description: 'Notification archived successfully.',
  })
  @swagger.ApiForbiddenResponse({
    description:
      'Access denied: the request was sent without an access token, with an invalid token, or the user does not have notifications:delete permission for the specified application.',
  })
  @swagger.ApiNotFoundResponse({
    description: 'Notification was not found or does not belong to the specified client_id.',
  })
  @Scope(NotificationsActions.delete)
  async archive(@common.Req() request: TNotificationRequest, @UserId() userId: string) {
    const notification = this.getNotification(request);
    await this.service.archiveById(notification);

    await this.logger.logEvent({
      ip_address: request.ip,
      device: request.headers['user-agent'],
      user_id: userId,
      client_id: request.params.client_id,
      event: Actions.NOTIFICATION_ARCHIVE,
      description: '',
      details: {
        target: notification.id,
        changed_fields: ['is_active'],
      },
    });
  }
}

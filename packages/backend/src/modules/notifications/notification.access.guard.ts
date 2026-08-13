import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { Request } from 'express';
import { CLIENT_ID } from 'src/constants';
import { prisma } from '../../modules/prisma/prisma.client';

export type TNotificationRequest = Request & {
  notification?: Notification;
};

@Injectable()
export class NotificationAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TNotificationRequest>();
    const notificationId = request.params.id;

    if (!notificationId) {
      return true;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const clientId = request.params.client_id ?? null;
    const allowedClientIds = clientId === CLIENT_ID ? [null, CLIENT_ID] : [clientId];

    if (!allowedClientIds.includes(notification.client_id)) {
      throw new NotFoundException('Notification not found');
    }

    request.notification = notification;

    return true;
  }
}

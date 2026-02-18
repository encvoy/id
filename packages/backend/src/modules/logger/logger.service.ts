import { ConsoleLogger, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ListInputDto } from 'src/custom.dto';
import { CONSOLE_LOG_LEVELS } from '../../constants';
import { Ei18nCodes, UserRoles } from '../../enums';
import { prisma } from '../prisma/prisma.client';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface LogEventBase {
  id: string;
  date: Date;
  ip_address: string;
  user_id: string;
  client_id: string;
  device: string;
  event: string;
  description?: string;
  details: object;
}

export interface LogEventCreate {
  ip_address: string;
  user_id: string;
  client_id: string;
  device: string;
  event: string;
  description?: string;
  details: object;
}

@Injectable()
export class CustomLogger extends ConsoleLogger {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldLogs() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    try {
      const count = await prisma.log.count({
        where: {
          date: {
            lte: threeMonthsAgo,
          },
        },
      });
      await prisma.log.deleteMany({
        where: {
          date: {
            lte: threeMonthsAgo,
          },
        },
      });
      console.info('Deleted old logs:', count);
    } catch (error) {
      console.error('Log cleanup error:', error);
    }
  }

  /**
   * Logging an Event
   */
  async logEvent(params: LogEventCreate) {
    if (!params.device) {
      params.device = 'unknown';
    }

    // We write an event to the log
    await prisma.log.create({
      data: {
        ...params,
        details: JSON.stringify(params.details),
      },
    });
  }

  /**
   * Retrieving Event Log Entries
   */
  private async getEvents(
    params: ListInputDto,
    user_ids?: number[],
    client_ids?: string[],
    self?: number,
  ) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;

    let where: Prisma.LogWhereInput = {
      ...filter,
      user_id: user_ids ? { in: user_ids.map((id) => id.toString()) } : filter?.user_id.toString(),
      client_id: client_ids ? { in: client_ids } : filter?.client_id,
      OR: [
        { event: { contains: search || '', mode: 'insensitive' } },
        { description: { contains: search || '', mode: 'insensitive' } },
      ],
    };

    if (self) {
      where = {
        AND: [
          {
            ...filter,
            user_id: { in: user_ids.map((id) => id.toString()) },
            client_id: { in: client_ids },
          },
          {
            ...filter,
            user_id: self.toString(),
          },
        ],
      };
    }

    // We generate request parameters
    const findParams: Prisma.LogFindManyArgs<DefaultArgs> = {
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortDirection },
    };

    // We get a list of records and the total number (necessary for working with the list)
    const [logs, totalCount] = await Promise.all([
      prisma.log.findMany(findParams),
      prisma.log.count({ where: findParams.where }),
    ]);

    return { logs, totalCount };
  }

  /**
   * Retrieving Event Log Entries
   */
  public async list(params: ListInputDto, user_id: string, role: UserRoles) {
    const intUserId = parseInt(user_id, 10);

    // The owner and editor of the main application can view all logs
    if (role === UserRoles.OWNER || role === UserRoles.EDITOR) {
      return this.getEvents(params);
    }

    // We create an array of client_ids for which the user has the Editor or Owner role
    const clients = await prisma.role.findMany({
      where: {
        user_id: intUserId,
        role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
      },
      select: { client_id: true },
    });

    // If the user does not have admin rights in the applications, we return only their own logs
    if (!clients?.length || parseInt(params.filter?.user_id) === intUserId) {
      return this.getEvents(params, [intUserId]);
    }

    const clientIds = clients.map((c) => c.client_id);

    // We create an array of user_ids to which the user has access
    const users =
      (await prisma.role.findMany({
        where: {
          client_id: { in: clientIds },
        },
        select: { id: true },
      })) || [];

    const userIds = users.map((u) => u.id);

    // We add the user's own ID to the array, since they can view their own logs
    userIds.push(intUserId);

    // If the user and client filters are not specified, we return the full valid list of logs
    if (!params.filter?.user_id && !params.filter?.client_id) {
      return this.getEvents(params, userIds, clientIds, intUserId);
    }

    if (params.filter?.user_id && !userIds.includes(parseInt(params.filter?.user_id))) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    return this.getEvents(params, userIds);
  }

  async log(message: any, stack?: string, context?: string) {
    if (CONSOLE_LOG_LEVELS.includes('log')) super.log(message || '', stack || message.event);
  }

  async warn(message: any, stack?: string, context?: string) {
    if (CONSOLE_LOG_LEVELS.includes('warn')) super.warn(message, stack, context);
  }

  async error(message: any, stack?: string, context?: string) {
    if (CONSOLE_LOG_LEVELS.includes('error')) super.error(message || '', stack || message.event);
  }

  async debug(message: any, stack?: string, context?: string) {
    if (CONSOLE_LOG_LEVELS.includes('debug')) super.debug(message, stack, context);
  }
}

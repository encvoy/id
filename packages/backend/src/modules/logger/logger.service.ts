import { ConsoleLogger, ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as winston from 'winston';
import TransportStream from 'winston-transport';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ListInputDto } from 'src/custom.dto';
import { CLIENT_ID, CONSOLE_LOG_LEVELS } from '../../constants';
import { Ei18nCodes, UserRoles } from '../../enums';
import { prisma } from '../prisma/prisma.client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WinstonService } from '../winston/winston.service';

export interface LogEventBase {
  id: string;
  date: Date;
  ip_address?: string | null;
  user_id?: string | null;
  client_id?: string | null;
  device?: string | null;
  event: string;
  description?: string | null;
  details: object;
}

export interface LogEventCreate {
  ip_address?: string | null;
  user_id?: string | null;
  client_id?: string | null;
  device?: string | null;
  event: string;
  description?: string | null;
  details: object;
}

@Injectable()
export class CustomLogger extends ConsoleLogger implements OnModuleInit {
  private winstonLogger: winston.Logger;
  private externalTransport?: TransportStream;
  private winstonEnabled = false;
  private configCache: any = null;

  constructor(private readonly moduleRef: ModuleRef) {
    super();
    // Initialize with default settings.
    this.createDefaultWinstonLogger();
  }

  private get winstonService() {
    try {
      return this.moduleRef.get(WinstonService, { strict: false });
    } catch {
      return null;
    }
  }

  async onModuleInit() {
    // Load settings after module initialization.
    await this.initializeWinston();
  }

  private hasSameConfig(nextConfig: any) {
    return JSON.stringify(this.configCache || {}) === JSON.stringify(nextConfig || {});
  }

  private async initializeWinston() {
    // Read Winston settings from the database.
    const winstonService = this.winstonService;
    if (!winstonService) {
      // Use the default logger until Winston is initialized.
      this.createDefaultWinstonLogger();
      return;
    }

    try {
      const config = await winstonService.get();
      const nextEnabled = config?.enabled || false;

      if (this.hasSameConfig(config)) {
        this.winstonEnabled = nextEnabled;
        return;
      }

      this.configCache = config;
      this.winstonEnabled = nextEnabled;
      if (this.winstonEnabled) {
        this.createWinstonLoggerFromConfig(config);
      } else {
        this.createDefaultWinstonLogger();
      }
    } catch (error) {
      // Fall back to default settings when loading fails.
      console.error('Failed to load Winston config:', error);
      this.createDefaultWinstonLogger();
    }
  }

  private createDefaultWinstonLogger() {
    const transports: winston.transport[] = [];
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    );

    this.winstonLogger = winston.createLogger({
      level: 'info',
      transports,
      defaultMeta: {
        service: 'backend',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }

  private createWinstonLoggerFromConfig(config: any) {
    const transports: winston.transport[] = [];

    // Console output is always JSON.
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    );

    // External transport, such as Loki or HTTP.
    if (config.export_enabled && config.export_url) {
      try {
        if (config.export_provider === 'loki' || config.export_provider === 'http') {
          // Built-in Winston HTTP transport.
          this.externalTransport = new winston.transports.Http({
            host: new URL(config.export_url).hostname,
            port: new URL(config.export_url).port ? parseInt(new URL(config.export_url).port) : 443,
            path: new URL(config.export_url).pathname,
            ssl: new URL(config.export_url).protocol === 'https:',
            headers: config.export_api_key ? { Authorization: config.export_api_key } : undefined,
          });
          transports.push(this.externalTransport);
        }
        // Additional transports can be added here.
      } catch (error) {
        console.error('Failed to initialize external log transport:', error);
      }
    }

    this.winstonLogger = winston.createLogger({
      level: config.log_level || 'info',
      transports,
      defaultMeta: {
        service: config.service_name || 'backend',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }

  public async reconfigureWinston() {
    // Reload Winston configuration from the database.
    await this.initializeWinston();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncWinstonConfigFromRedis() {
    await this.initializeWinston();
  }

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
  private async getEvents(params: ListInputDto, visibilityWhere?: Prisma.LogWhereInput) {
    const { filter, limit, sortBy, sortDirection, offset, search } = params;
    const { organization_id: _organizationId, ...filterWithoutOrganization } = filter || {};

    let where: Prisma.LogWhereInput = {
      ...filterWithoutOrganization,
      OR: [
        { event: { contains: search || '', mode: 'insensitive' } },
        { description: { contains: search || '', mode: 'insensitive' } },
      ],
    };

    if (visibilityWhere) {
      where = {
        AND: [where, visibilityWhere],
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
    // The owner and editor of the main application can view all logs
    if (role === UserRoles.OWNER || role === UserRoles.EDITOR) {
      return this.getEvents(params);
    }

    const requestedOrganizationId =
      typeof params.filter?.organization_id === 'string'
        ? params.filter.organization_id
        : undefined;

    const organizationRoles = await prisma.role.findMany({
      where: {
        user_id,
        role: { in: [UserRoles.OWNER, UserRoles.EDITOR] },
        client: {
          client_id: { not: CLIENT_ID },
          parent_id: null,
        },
      },
      select: { client_id: true },
    });

    const accessibleOrganizationIds = organizationRoles.map((client) => client.client_id);
    if (requestedOrganizationId && !accessibleOrganizationIds.includes(requestedOrganizationId)) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    const organizationIds = requestedOrganizationId
      ? [requestedOrganizationId]
      : accessibleOrganizationIds;

    if (!organizationIds.length) {
      if (params.filter?.user_id && params.filter.user_id.toString() !== user_id) {
        throw new ForbiddenException(Ei18nCodes.T3E0026);
      }

      return this.getEvents(params, { user_id });
    }

    const [clients, users] = await Promise.all([
      prisma.client.findMany({
        where: {
          OR: [{ client_id: { in: organizationIds } }, { parent_id: { in: organizationIds } }],
        },
        select: { client_id: true },
      }),
      prisma.user.findMany({
        where: {
          org_id: { in: organizationIds },
        },
        select: { id: true },
      }),
    ]);

    const clientIds = clients.map((client) => client.client_id);
    const scopedClientIds = Array.from(new Set([CLIENT_ID, ...clientIds]));
    const userIds = Array.from(new Set([...users.map((user) => user.id), user_id]));

    if (params.filter?.user_id && !userIds.includes(params.filter.user_id.toString())) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    if (params.filter?.client_id && !scopedClientIds.includes(params.filter.client_id.toString())) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }

    return this.getEvents(params, {
      OR: [
        {
          AND: [{ user_id: { in: userIds } }, { client_id: { in: scopedClientIds } }],
        },
        { client_id: { in: clientIds } },
      ],
    });
  }

  log(message: any, stack?: string, context?: string) {
    if (!CONSOLE_LOG_LEVELS.includes('log')) return;
    this.writeStructuredLog('info', message, stack, context);
  }

  warn(message: any, stack?: string, context?: string) {
    if (!CONSOLE_LOG_LEVELS.includes('warn')) return;
    this.writeStructuredLog('warn', message, stack, context);
  }

  error(message: any, stack?: string, context?: string) {
    if (!CONSOLE_LOG_LEVELS.includes('error')) return;
    this.writeStructuredLog('error', message, stack, context);
  }

  debug(message: any, stack?: string, context?: string) {
    if (!CONSOLE_LOG_LEVELS.includes('debug')) return;
    this.writeStructuredLog('debug', message, stack, context);
  }

  /**
   * Build a structured payload and write it to Winston.
   */
  private writeStructuredLog(level: string, message: any, stack?: string, context?: string) {
    // Use cached settings without asynchronous calls.
    const config = this.configCache || {};
    const redactHeaders = config.redact_headers || 'authorization,cookie,set-cookie';
    const serviceName = config.service_name || 'backend';
    const environment = process.env.NODE_ENV || 'development';

    // Generate a request ID when one is not provided.
    const request_id = message?.request_id || uuidv4();

    // Redact sensitive data.
    const redact = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      const redacted = { ...obj };
      const sensitive = redactHeaders.split(',');
      for (const key of sensitive) {
        if (redacted[key]) redacted[key] = '[REDACTED]';
      }
      if (redacted.details && typeof redacted.details === 'object') {
        for (const k of sensitive) {
          if (redacted.details[k]) redacted.details[k] = '[REDACTED]';
        }
      }
      return redacted;
    };

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      service: serviceName,
      environment,
      context: context || message?.context,
      message: typeof message === 'string' ? message : message?.message || '',
      event: message?.event,
      request_id,
      trace_id: message?.trace_id,
      user_id: message?.user_id,
      client_id: message?.client_id,
      organization_id: message?.organization_id,
      method: message?.method,
      url: message?.url,
      status_code: message?.status_code,
      duration_ms: message?.duration_ms,
      ip_address: message?.ip_address,
      device: message?.device,
      details: redact(message?.details),
      kind: message?.kind || 'runtime',
      stack,
    };

    // Check whether the logger is initialized.
    if (this.winstonLogger) {
      this.winstonLogger.log(level, payload.message, payload);
    } else {
      // Fall back to the standard console when Winston is unavailable.
      super.log(payload.message, stack, context);
    }
  }
}

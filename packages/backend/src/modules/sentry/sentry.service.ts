import { BadRequestException, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { DOMAIN, NODE_ENV, VERSION } from 'src/constants';
import { Ei18nCodes } from 'src/enums';
import { app } from 'src/main';
import { ErrorHandlingService } from 'src/middlewares/exceptionFilters/error.handling.service';
import { SettingsService } from 'src/modules';
import { SentryUpdateDto } from './sentry.dto';

interface SentrySettingsConfig {
  dsn: string;
  user_id: string;
  enabled: boolean;
}

const SettingsSentryName = 'sentry';

@Injectable()
export class SentryService {
  constructor(private readonly errorHandlingService: ErrorHandlingService) {
    this.errorHandlingService.onError(async (error, userId, request) => {
      try {
        await this.captureException(error, userId, request);
      } catch (error) {
        console.error('Error captureException:', error);
      }
    });
  }

  get settingsService() {
    return app.get(SettingsService, { strict: false });
  }

  /**
   * A unique key issued for each project in Sentry
   */
  private dsn: string = null;
  /**
   * User ID for whose actions traces and errors should be sent
   */
  private user_id: string = null;
  /**
   * Sentry enable flag
   */
  public enabled = false;

  /**
   * Cache sync flag
   */
  private syncCache = false;

  /**
   * Updating Sentry settings
   */
  public async update(body: SentryUpdateDto) {
    if (body.dsn || body.dsn === null) {
      this.dsn = body.dsn;
    }

    if (body.user_id || body.user_id === null) {
      this.user_id = body.user_id;
    }

    this.turnOffSentry();

    if (body.enabled === true) {
      if (!this.dsn) {
        throw new BadRequestException(Ei18nCodes.T3E0013);
      }
      await this.turnOnSentry();
    }

    await this.settingsService.updateSettings({
      name: SettingsSentryName,
      value: {
        dsn: this.dsn,
        user_id: this.user_id,
        enabled: this.enabled,
      },
    });
  }

  /**
   * Getting Sentry settings
   */
  public async get() {
    if (!this.syncCache) {
      const config = await this.settingsService.getSettingsByName<SentrySettingsConfig>(
        SettingsSentryName,
      );
      this.dsn = config.dsn;
      this.user_id = config.user_id;
      this.enabled = config.enabled;
      this.syncCache = true;
    }
    return {
      dsn: this.dsn,
      user_id: this.user_id,
      enabled: this.enabled,
    };
  }

  private turnOffSentry() {
    if (this.enabled) {
      Sentry.close();
      this.enabled = false;
    }
  }

  /**
   * Initializing Sentry with the configured settings
   */
  public async turnOnSentry() {
    if (!this.dsn) {
      throw new BadRequestException(Ei18nCodes.T3E0013);
    }

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: 1.0,
      includeLocalVariables: true,
      release: `v${VERSION}`,
      environment: NODE_ENV,
    });

    Sentry.setTag('domain', DOMAIN || DOMAIN);

    this.enabled = true;
  }

  /**
   * Sanitize sensitive data from request object
   */
  private sanitizeRequest(request: any): any {
    const maskValue = (value: any): any => {
      if (value === null || value === undefined || value === '') {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map((item) => maskValue(item));
      }
      if (typeof value === 'object' && value !== null) {
        const masked: any = {};
        for (const key in value) {
          masked[key] = maskValue(value[key]);
        }
        return masked;
      }
      return '***';
    };

    return {
      method: request.method,
      url: request.url,
      headers: maskValue(request.headers),
      body: maskValue(request.body),
      query: maskValue(request.query),
      params: maskValue(request.params),
    };
  }

  /**
   * Sending an error to Sentry
   */
  public async captureException(exception: any, user_id: string, request?: any) {
    if (!this.enabled) return;

    Sentry.withScope((scope) => {
      if (request) {
        const sanitizedRequest = this.sanitizeRequest(request);

        scope.setTag('http.method', request.method);
        scope.setTag('http.url', request.url);
        scope.setTag('http.status', request.statusCode || 'unknown');

        scope.setContext('HTTP Request', {
          method: request.method,
          url: request.url,
          query: sanitizedRequest.query,
          params: sanitizedRequest.params,
        });

        scope.setExtra('request_body', sanitizedRequest.body);
        scope.setExtra('request_headers', sanitizedRequest.headers);
        scope.setUser({ id: user_id });
      }

      if (this.user_id && this.user_id !== user_id) return;

      Sentry.captureException(exception);
      console.info('Error sent to Sentry');
    });
  }
}

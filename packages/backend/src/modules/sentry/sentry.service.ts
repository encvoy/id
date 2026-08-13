import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
import { DOMAIN, NODE_ENV, VERSION } from 'src/constants';
import { Ei18nCodes } from 'src/enums';
import { ErrorHandlingService } from 'src/middlewares/exceptionFilters/error.handling.service';
import { SettingsService } from 'src/modules/settings/settings.service';
import { SentryUpdateDto } from './sentry.dto';

interface SentrySettingsConfig {
  dsn: string;
  user_id: string;
  enabled: boolean;
}

const SettingsSentryName = 'sentry';
const DEFAULT_SENTRY_SETTINGS: SentrySettingsConfig = {
  dsn: '',
  user_id: '',
  enabled: false,
};

@Injectable()
export class SentryService {
  private configSnapshot: SentrySettingsConfig = { ...DEFAULT_SENTRY_SETTINGS };
  private runtimeSignature: string | null = null;

  constructor(
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly settingsService: SettingsService,
  ) {
    this.errorHandlingService.onError(async (error, userId, request) => {
      try {
        await this.captureException(error, userId, request);
      } catch (error) {
        console.error('Error captureException:', error);
      }
    });
  }

  private normalizeConfig(
    config?: Partial<SentrySettingsConfig> | null,
  ): SentrySettingsConfig {
    return {
      ...DEFAULT_SENTRY_SETTINGS,
      ...(config || {}),
      enabled: Boolean(config?.enabled),
    };
  }

  private getConfigSignature(config: SentrySettingsConfig): string {
    return JSON.stringify(config);
  }

  public get enabled() {
    return this.configSnapshot.enabled;
  }

  public get runtimeEnabled() {
    return this.configSnapshot.enabled && Sentry.isEnabled();
  }

  private async loadConfig(forceRefresh = false): Promise<SentrySettingsConfig> {
    const config = await this.settingsService.getSettingsByName<Partial<SentrySettingsConfig>>(
      SettingsSentryName,
      forceRefresh,
    );
    this.configSnapshot = this.normalizeConfig(config);
    return this.configSnapshot;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncRuntimeWithStoredConfig() {
    try {
      const config = await this.loadConfig();
      await this.syncRuntimeWithConfig(config);
    } catch (error) {
      console.error('Failed to sync Sentry runtime config from Redis:', error);
    }
  }

  private async syncRuntimeWithConfig(config: SentrySettingsConfig) {
    const nextSignature = config.enabled ? this.getConfigSignature(config) : null;

    if (!config.enabled) {
      await this.turnOffSentry();
      this.runtimeSignature = null;
      return;
    }

    if (!config.dsn) {
      throw new BadRequestException(Ei18nCodes.T3E0013);
    }

    if (this.runtimeSignature === nextSignature && Sentry.isEnabled()) {
      return;
    }

    await this.turnOffSentry();
    this.turnOnSentry(config);
    this.runtimeSignature = nextSignature;
  }

  /**
   * Updating Sentry settings
   */
  public async update(body: SentryUpdateDto) {
    const currentConfig = await this.get();
    const nextConfig: SentrySettingsConfig = {
      ...currentConfig,
      ...(body.dsn !== undefined ? { dsn: body.dsn } : {}),
      ...(body.user_id !== undefined ? { user_id: body.user_id } : {}),
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
    };

    if (nextConfig.enabled && !nextConfig.dsn) {
      throw new BadRequestException(Ei18nCodes.T3E0013);
    }

    await this.settingsService.updateSettings({
      name: SettingsSentryName,
      value: nextConfig as any,
    });

    this.configSnapshot = nextConfig;
    await this.syncRuntimeWithConfig(nextConfig);
  }

  /**
   * Getting Sentry settings
   */
  public async get(forceRefresh = false) {
    return { ...(await this.loadConfig(forceRefresh)) };
  }

  private async turnOffSentry() {
    if (Sentry.isEnabled()) {
      await Sentry.close(2000);
    }
  }

  /**
   * Initializing Sentry with the configured settings
   */
  private turnOnSentry(config: SentrySettingsConfig) {
    if (!config.dsn) {
      throw new BadRequestException(Ei18nCodes.T3E0013);
    }

    Sentry.init({
      dsn: config.dsn,
      tracesSampleRate: 1.0,
      includeLocalVariables: true,
      release: `v${VERSION}`,
      environment: NODE_ENV,
    });

    Sentry.setTag('domain', DOMAIN || DOMAIN);
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
    const config = await this.loadConfig();
    await this.syncRuntimeWithConfig(config);

    if (!config.enabled || !Sentry.isEnabled()) return;

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

      if (config.user_id && config.user_id !== user_id) return;

      Sentry.captureException(exception);
      console.info('Error sent to Sentry');
    });
  }
}

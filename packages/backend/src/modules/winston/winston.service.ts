import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsService } from 'src/modules/settings/settings.service';
import { WinstonUpdateDto, LogExportProvider } from './winston.dto';
import { Ei18nCodes } from 'src/enums';

interface WinstonSettingsConfig {
  enabled: boolean;
  export_enabled: boolean;
  export_provider: LogExportProvider;
  export_url: string;
  export_api_key: string;
  audit_export_enabled: boolean;
  redact_headers: string;
  service_name: string;
  log_level: string;
}

const SettingsWinstonName = 'winston';
const DEFAULT_WINSTON_SETTINGS: WinstonSettingsConfig = {
  enabled: false,
  export_enabled: false,
  export_provider: LogExportProvider.STDOUT,
  export_url: '',
  export_api_key: '',
  audit_export_enabled: false,
  redact_headers: 'authorization,cookie,set-cookie',
  service_name: 'backend',
  log_level: 'info',
};

@Injectable()
export class WinstonService {
  private configSnapshot: WinstonSettingsConfig = { ...DEFAULT_WINSTON_SETTINGS };

  constructor(private readonly settingsService: SettingsService) {}

  private normalizeConfig(
    config?: Partial<WinstonSettingsConfig> | null,
  ): WinstonSettingsConfig {
    return {
      ...DEFAULT_WINSTON_SETTINGS,
      ...(config || {}),
    };
  }

  public get enabled() {
    return this.configSnapshot.enabled;
  }

  public getConfig(): WinstonSettingsConfig {
    return { ...this.configSnapshot };
  }

  /**
   * Updating Winston settings
   */
  public async update(body: WinstonUpdateDto) {
    const currentConfig = await this.get();
    const nextConfig: WinstonSettingsConfig = {
      ...currentConfig,
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      ...(body.export_enabled !== undefined ? { export_enabled: body.export_enabled } : {}),
      ...(body.export_provider !== undefined ? { export_provider: body.export_provider } : {}),
      ...(body.export_url !== undefined ? { export_url: body.export_url } : {}),
      ...(body.export_api_key !== undefined ? { export_api_key: body.export_api_key } : {}),
      ...(body.audit_export_enabled !== undefined
        ? { audit_export_enabled: body.audit_export_enabled }
        : {}),
      ...(body.redact_headers !== undefined ? { redact_headers: body.redact_headers } : {}),
      ...(body.service_name !== undefined ? { service_name: body.service_name } : {}),
      ...(body.log_level !== undefined ? { log_level: body.log_level } : {}),
    };

    // Validate export URL if export is enabled
    if (nextConfig.export_enabled && !nextConfig.export_url) {
      throw new BadRequestException(Ei18nCodes.T3E0013);
    }

    await this.settingsService.updateSettings({
      name: SettingsWinstonName,
      value: nextConfig as any,
    });

    this.configSnapshot = nextConfig;
  }

  /**
   * Getting Winston settings
   */
  public async get(forceRefresh = false) {
    const settings = await this.settingsService.getSettingsByName<Partial<WinstonSettingsConfig>>(
      SettingsWinstonName,
      forceRefresh,
    );
    this.configSnapshot = this.normalizeConfig(settings);

    return { ...this.configSnapshot };
  }
}

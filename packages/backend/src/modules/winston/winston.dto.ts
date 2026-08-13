import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { IsAnyUrl } from 'src/custom.dto';

export enum LogExportProvider {
  LOKI = 'loki',
  HTTP = 'http',
  GRAYLOG = 'graylog',
  STDOUT = 'stdout',
}

/**
 * DTO for updating Winston logging settings
 */
export class WinstonUpdateDto {
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Enable or disable Winston structured logging',
  })
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Enable or disable external log export',
  })
  export_enabled?: boolean;

  @IsEnum(LogExportProvider)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'External log export provider',
    enum: LogExportProvider,
    example: LogExportProvider.LOKI,
  })
  export_provider?: LogExportProvider;

  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'External log export URL',
    example: 'https://logs.example.com/loki/api/v1/push',
  })
  export_url?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'API key for external log export (optional)',
  })
  export_api_key?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Enable or disable audit log export',
  })
  audit_export_enabled?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Comma-separated list of headers to redact from logs',
    example: 'authorization,cookie,set-cookie',
  })
  redact_headers?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Service identifier used in structured logs',
    example: 'backend',
  })
  service_name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Log level (e.g., info, debug, warn, error)',
    example: 'info',
  })
  log_level?: string;
}

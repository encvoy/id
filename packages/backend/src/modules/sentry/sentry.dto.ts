import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsAnyUrl } from 'src/custom.dto';

/**
 * DTO for updating Sentry settings
 */
export class SentryUpdateDto {
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'A unique key issued for each project in Sentry',
    example: 'https://sentry.io',
  })
  dsn?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Enable or disable sending traces and errors to Sentry',
  })
  enabled?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The user ID for whose actions traces and errors should be sent',
  })
  user_id?: string;
}

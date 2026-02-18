import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { EProviderTypes } from 'src/enums';
import { BaseCreateProviderDto } from '../../providers.dto';

export class ParamsTOTPDto {
  @IsString()
  @ApiProperty()
  issuer_name: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 2 })
  window_size?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 6 })
  code_length?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 30 })
  time_step?: number;
}

export class CreateTOTPProviderDto extends BaseCreateProviderDto<ParamsTOTPDto> {
  @IsString()
  @ApiProperty()
  type: EProviderTypes.TOTP;
}

export class UpdateTOTPProviderDto extends PartialType(CreateTOTPProviderDto) {}

export class SetupTOTPDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  appName?: string;
}

export class ConfirmTOTPSetupDto {
  @IsString()
  @ApiProperty()
  token: string;
}

export class VerifyTOTPDto {
  @IsString()
  @ApiProperty()
  identifier: string;

  @IsString()
  @ApiProperty()
  code: string;
}

export class DisableTOTPDto {
  @IsString()
  @ApiProperty()
  token: string;
}

export class RegenerateBackupCodesDto {
  @IsString()
  @ApiProperty()
  token: string;
}

export class TOTPStatusDto {
  @IsString()
  @ApiProperty()
  userId: string;
}

export interface TTOTPProviderParams {
  issuer_name: string;
  window_size: number;
  code_length: number;
  time_step: number;
}

export interface TTOTPProviderParams {
  issuer_name: string;
  window_size: number;
  code_length: number;
  time_step: number;
}

export interface TTOTPProvider {
  id: string;
  type: string;
  params: TTOTPProviderParams;
}

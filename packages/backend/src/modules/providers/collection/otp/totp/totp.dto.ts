import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Equals, IsNumber, IsOptional, IsString } from 'class-validator';
import { EProviderTypes } from 'src/enums';
import { BaseCreateProviderDto, ProviderParamsDto } from '../../../providers.dto';

export class ParamsTOTPDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 6, enum: [6, 8] })
  digits?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 30 })
  period?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ default: 'SHA1', enum: ['SHA1', 'SHA256', 'SHA512'] })
  algorithm?: string;

  // Legacy aliases for backward compatibility with already-deployed clients.
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 6, deprecated: true })
  code_length?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ default: 30, deprecated: true })
  time_step?: number;
}

export class CreateTOTPProviderDto extends BaseCreateProviderDto<ParamsTOTPDto> {
  @Equals(EProviderTypes.TOTP)
  @ApiProperty({ enum: [EProviderTypes.TOTP] })
  type: EProviderTypes.TOTP;

  @ProviderParamsDto(ParamsTOTPDto)
  params?: ParamsTOTPDto;
}

export class UpdateParamsTOTPDto extends PartialType(ParamsTOTPDto, {
  skipNullProperties: false,
}) {}

export class UpdateTOTPProviderDto extends PartialType(
  OmitType(CreateTOTPProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsTOTPDto)
  params?: UpdateParamsTOTPDto;
}

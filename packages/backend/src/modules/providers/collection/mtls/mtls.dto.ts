import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Equals, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsAnyUrl } from 'src/custom.dto';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  ProviderParamsDto,
} from 'src/modules/providers/providers.dto';

export const PROVIDER_TYPE_MTLS = 'MTLS';

export class ParamsMTLSDto extends BaseParamsProviderDto {
  @IsAnyUrl()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional()
  issuer?: string;
}

export class CreateMTLSProviderDto extends BaseCreateProviderDto<ParamsMTLSDto> {
  @Equals(PROVIDER_TYPE_MTLS)
  @ApiProperty({ example: PROVIDER_TYPE_MTLS })
  type: string;

  @ProviderParamsDto(ParamsMTLSDto)
  params?: ParamsMTLSDto;
}

export class UpdateParamsMTLSDto extends PartialType(ParamsMTLSDto, {
  skipNullProperties: false,
}) {}

export class UpdateMTLSProviderDto extends PartialType(
  OmitType(CreateMTLSProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsMTLSDto)
  params?: UpdateParamsMTLSDto;
}

export class AuthByMTLSDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}

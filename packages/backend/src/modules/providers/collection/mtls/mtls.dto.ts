import { InternalServerErrorException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Equals, IsOptional, IsString } from 'class-validator';
import { BaseCreateProviderDto, BaseParamsProviderDto } from 'src/modules/providers/providers.dto';

export const PROVIDER_TYPE_MTLS = 'MTLS';

export class ParamsMTLSDto extends BaseParamsProviderDto {}

export class CreateMTLSProviderDto extends BaseCreateProviderDto<ParamsMTLSDto> {
  @Equals(PROVIDER_TYPE_MTLS)
  @ApiProperty({ example: PROVIDER_TYPE_MTLS })
  type: string;
}

export class UpdateMTLSProviderDto extends PartialType(CreateMTLSProviderDto) {}

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

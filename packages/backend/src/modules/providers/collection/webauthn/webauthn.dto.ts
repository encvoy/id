import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Equals, IsOptional } from 'class-validator';
import { IsBooleanCustom } from 'src/custom.dto';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  ProviderParamsDto,
} from '../../providers.dto';

export const PROVIDER_TYPE_WEBAUTHN = 'WEBAUTHN';

export class ParamsWebAuthnDto extends BaseParamsProviderDto {
  @IsBooleanCustom()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'If true, use cross-platform authenticators; if false, use platform authenticators',
    default: false,
  })
  authenticatorAttachment?: boolean;
}

export class CreateWebAuthnProviderDto extends BaseCreateProviderDto<ParamsWebAuthnDto> {
  @Equals(PROVIDER_TYPE_WEBAUTHN)
  @ApiProperty({ example: PROVIDER_TYPE_WEBAUTHN })
  type: string;

  @ProviderParamsDto(ParamsWebAuthnDto)
  params?: ParamsWebAuthnDto;
}

export class UpdateParamsWebAuthnDto extends PartialType(ParamsWebAuthnDto, {
  skipNullProperties: false,
}) {}

export class UpdateWebAuthnProviderDto extends PartialType(
  OmitType(CreateWebAuthnProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsWebAuthnDto)
  params?: UpdateParamsWebAuthnDto;
}

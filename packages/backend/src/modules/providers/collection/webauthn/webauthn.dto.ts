import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';
import { BaseCreateProviderDto, BaseParamsProviderDto } from '../../providers.dto';

export const PROVIDER_TYPE_WEBAUTHN = 'WEBAUTHN';

export class ParamsWebAuthnDto extends BaseParamsProviderDto {}

export class CreateWebAuthnProviderDto extends BaseCreateProviderDto<ParamsWebAuthnDto> {
  @Equals(PROVIDER_TYPE_WEBAUTHN)
  @ApiProperty({ example: PROVIDER_TYPE_WEBAUTHN })
  type: string;
}

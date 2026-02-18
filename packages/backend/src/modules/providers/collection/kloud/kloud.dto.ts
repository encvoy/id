import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import * as cv from 'class-validator';
import { IsAnyUrl, IsPhoneNumberCustom } from 'src/custom.dto';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  TypeProviderDTO,
} from 'src/modules/providers/providers.dto';

export class VerificationStatusKloudDTO extends TypeProviderDTO {
  type: 'KLOUD';

  @IsPhoneNumberCustom()
  phone_number: string;

  @cv.IsString()
  @ApiProperty()
  provider_id: string;
}

export class VerificationSendCodeKloudDTO extends TypeProviderDTO {
  type: 'KLOUD';

  @IsPhoneNumberCustom()
  phone_number: string;

  @cv.IsString()
  @ApiProperty({ example: 'client_id' })
  client_id: string;

  @cv.IsString()
  @ApiProperty({ example: 'provider_id' })
  provider_id: string;
}

export class ParamsKloudDto extends BaseParamsProviderDto {
  @cv.Matches(/^[^\n ]*$/, { message: 'The identifier cannot contain spaces' })
  @cv.MaxLength(255)
  @cv.MinLength(1)
  @cv.IsString()
  @ApiProperty()
  external_client_id: string;

  @cv.Matches(/^[^\n ]*$/, { message: 'The secret key cannot contain spaces' })
  @cv.MaxLength(255)
  @cv.MinLength(1)
  @cv.IsString()
  @ApiProperty()
  external_client_secret: string;

  @cv.MaxLength(2000)
  @IsAnyUrl()
  @cv.IsOptional()
  @ApiPropertyOptional()
  issuer?: string;
}

export class CreateKloudProviderDto extends BaseCreateProviderDto<ParamsKloudDto> {
  @cv.Equals('KLOUD')
  @ApiProperty({ example: 'KLOUD' })
  type: 'KLOUD';
}

export class UpdateKloudProviderDto extends PartialType(CreateKloudProviderDto) {}

export class AuthByKloudDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '5ej45v6543qxctv' })
  code?: string;

  @IsPhoneNumberCustom()
  @cv.IsOptional()
  phone_number?: string;

  @cv.IsOptional()
  @cv.IsString()
  @ApiPropertyOptional({ example: '1' })
  provider_id?: string;

  @cv.IsOptional()
  @cv.IsString()
  @ApiPropertyOptional({ example: '1' })
  phone_numberCountry?: string;
}

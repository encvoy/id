import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import * as cv from 'class-validator';
import { IsAnyUrl, IsPhoneNumberCustom } from '../../../../custom.dto';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  ProviderParamsDto,
  TypeProviderDTO,
} from '../../providers.dto';

export class VerificationStatusPhoneDTO extends TypeProviderDTO {
  type: 'PHONE';

  @IsPhoneNumberCustom()
  phone_number: string;
}

export class VerificationSendCodePhoneDTO extends TypeProviderDTO {
  type: 'PHONE';

  @IsPhoneNumberCustom()
  phone_number: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'fCn3OxmkdlEBliBpD5znj' })
  uid?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'client_id' })
  client_id?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'provider_id' })
  provider_id?: string;
}

export class ConfirmPhoneNumberDTO {
  @IsPhoneNumberCustom()
  phone_number: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1234' })
  code: string;
}

export class ParamsPhoneDto extends BaseParamsProviderDto {
  @cv.IsNotEmpty()
  @cv.Matches(/^[^\n ]*$/, { message: 'The identifier cannot contain spaces' })
  @cv.MaxLength(255)
  @cv.IsString()
  @ApiProperty()
  external_client_id: string;

  @cv.IsNotEmpty()
  @cv.Matches(/^[^\n ]*$/, { message: 'The secret key cannot contain spaces' })
  @cv.MaxLength(255)
  @cv.IsString()
  @ApiProperty()
  external_client_secret: string;

  @cv.MaxLength(2000)
  @IsAnyUrl()
  @cv.IsOptional()
  @ApiPropertyOptional()
  issuer?: string;
}

export class CreatePhoneProviderDto extends BaseCreateProviderDto<ParamsPhoneDto> {
  @cv.Equals('PHONE')
  @ApiProperty({ example: 'PHONE' })
  type: 'PHONE';

  @ProviderParamsDto(ParamsPhoneDto)
  params?: ParamsPhoneDto;
}

export class UpdateParamsPhoneDto extends PartialType(ParamsPhoneDto, {
  skipNullProperties: false,
}) {}

export class UpdatePhoneProviderDto extends PartialType(
  OmitType(CreatePhoneProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsPhoneDto)
  params?: UpdateParamsPhoneDto;
}

export class AuthByPhoneDto {
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

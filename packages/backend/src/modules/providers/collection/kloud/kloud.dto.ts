import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import * as cv from 'class-validator';
import { IsAnyUrl, IsPhoneNumberCustom } from 'src/custom.dto';
import {
  BaseCreateProviderDto,
  BaseParamsProviderDto,
  ProviderParamsDto,
  TypeProviderDTO,
} from 'src/modules/providers/providers.dto';

export class VerificationStatusKloudDTO extends TypeProviderDTO {
  type: 'KLOUD';

  @IsPhoneNumberCustom()
  phone_number: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty()
  provider_id: string;
}

export class VerificationSendCodeKloudDTO extends TypeProviderDTO {
  type: 'KLOUD';

  @IsPhoneNumberCustom()
  phone_number: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'client_id' })
  client_id: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'provider_id' })
  provider_id: string;
}

export class ParamsKloudDto extends BaseParamsProviderDto {
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

export class CreateKloudProviderDto extends BaseCreateProviderDto<ParamsKloudDto> {
  @cv.Equals('KLOUD')
  @ApiProperty({ example: 'KLOUD' })
  type: 'KLOUD';

  @ProviderParamsDto(ParamsKloudDto)
  params?: ParamsKloudDto;
}

export class UpdateParamsKloudDto extends PartialType(ParamsKloudDto, {
  skipNullProperties: false,
}) {}

export class UpdateKloudProviderDto extends PartialType(
  OmitType(CreateKloudProviderDto, ['params'] as const),
  { skipNullProperties: false },
) {
  @ProviderParamsDto(UpdateParamsKloudDto)
  params?: UpdateParamsKloudDto;
}

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

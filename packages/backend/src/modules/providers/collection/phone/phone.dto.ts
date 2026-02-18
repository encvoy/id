import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Equals, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsAnyUrl, IsPhoneNumberCustom } from '../../../../custom.dto';
import { BaseCreateProviderDto, BaseParamsProviderDto, TypeProviderDTO } from '../../providers.dto';
import * as cv from 'class-validator';

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
  @IsOptional()
  @ApiPropertyOptional({ example: 'client_id' })
  client_id?: string;

  @cv.IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'provider_id' })
  provider_id?: string;
}

export class ConfirmPhoneNumberDTO {
  @IsPhoneNumberCustom()
  phone_number: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '1234' })
  code: string;
}

export class ParamsPhoneDto extends BaseParamsProviderDto {
  @Matches(/^[^\n ]*$/, { message: 'The identifier cannot contain spaces' })
  @MaxLength(255)
  @MinLength(1)
  @IsString()
  @ApiProperty()
  external_client_id: string;

  @Matches(/^[^\n ]*$/, { message: 'The secret key cannot contain spaces' })
  @MaxLength(255)
  @MinLength(1)
  @IsString()
  @ApiProperty()
  external_client_secret: string;

  @MaxLength(2000)
  @IsAnyUrl()
  @IsOptional()
  @ApiPropertyOptional()
  issuer?: string;
}

export class CreatePhoneProviderDto extends BaseCreateProviderDto<ParamsPhoneDto> {
  @Equals('PHONE')
  @ApiProperty({ example: 'PHONE' })
  type: 'PHONE';
}

export class UpdatePhoneProviderDto extends PartialType(CreatePhoneProviderDto) {}

export class AuthByPhoneDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '5ej45v6543qxctv' })
  code?: string;

  @IsPhoneNumberCustom()
  @IsOptional()
  phone_number?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '1' })
  provider_id?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '1' })
  phone_numberCountry?: string;
}

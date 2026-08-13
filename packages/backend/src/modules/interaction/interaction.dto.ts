import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsBooleanCustom, IsEmailCustom, IsPhoneNumberCustom } from '../../custom.dto';
import { TransformFromEncodeURI } from '../../decorators';
import { ELocales } from '../../enums';

export class InteractionLoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: ['login', 'consent'] })
  prompt: 'login' | 'consent';

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  provider_id?: string;
}

export class FillMissingRequiredFieldsDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  nickname?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  family_name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  given_name?: string;

  @IsPhoneNumberCustom()
  @ApiPropertyOptional({ example: '232367' })
  @IsOptional()
  phone_number?: string;

  @IsString()
  @Transform(({ value }) => (value ? value.trim() : undefined))
  @IsOptional()
  @ApiPropertyOptional({ example: '232367' })
  login?: string;

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: string;

  @IsBooleanCustom()
  @IsOptional()
  data_processing_agreement?: boolean;

  @IsEmailCustom()
  @ApiPropertyOptional({ example: '232367' })
  @IsOptional()
  email?: string;

  @TransformFromEncodeURI()
  @IsISO8601()
  @IsOptional()
  @ApiPropertyOptional({ example: '2022-06-29T14:00:00.000Z' })
  birthdate?: string;

  @TransformFromEncodeURI()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  external_account_info?: string;

  @IsBooleanCustom()
  @IsOptional()
  public_profile_consent?: boolean;
}

export class InteractionRegDto extends FillMissingRequiredFieldsDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  password?: string;

  @IsEnum(ELocales)
  @IsOptional()
  @ApiPropertyOptional({ enum: ELocales })
  locale?: ELocales;
}

export class AuthByKloudDto {
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
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Qwerty123' })
  current_password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Qwerty123' })
  new_password: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '1' })
  provider_id?: string;
}

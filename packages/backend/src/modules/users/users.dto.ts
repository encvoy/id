import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as cv from 'class-validator';
import { IsAnyUrl, IsBooleanCustom, IsEmailCustom, IsPhoneNumberCustom } from '../../custom.dto';
import { EClaimPrivacy, EProviderTypes } from '../../enums';
import { UpdateClientDto } from '../clients/clients.dto';

export type UserApps = {
  role: string;
  client: Omit<UpdateClientDto, 'show_avatar_in_widget'> & { client_id: string };
}[];

export type UserInfo = {
  sub?: string;
  email?: string;
  birthdate?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  picture?: string;
  custom_fields?: { [key: string]: string | boolean | number };
};

export class CreateUserDTO {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  nickname?: string;

  @cv.IsString()
  @ApiProperty({ example: 'Qwerty123' })
  password: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '2000-02-20T21:00:00.000Z' })
  birthdate?: string;

  @ApiPropertyOptional()
  @cv.IsOptional()
  @cv.IsString()
  picture?: string;

  @cv.IsString()
  @Transform(({ value }) => (value ? value.trim() : undefined))
  @ApiProperty({ example: 'Qwerty123' })
  login: string;

  @ApiPropertyOptional()
  @cv.IsOptional()
  custom_fields?: string;

  @ApiPropertyOptional({ example: 'Qwerty123' })
  @cv.IsOptional()
  @cv.IsString()
  given_name?: string;

  @ApiPropertyOptional({ example: 'Qwerty123' })
  @cv.IsOptional()
  @cv.IsString()
  family_name?: string;

  @ApiPropertyOptional({ description: 'Available only to Administrator' })
  @cv.IsOptional()
  @IsEmailCustom()
  email?: string;

  @ApiPropertyOptional({ description: 'Available only to Administrator' })
  @IsPhoneNumberCustom()
  @cv.IsOptional()
  phone_number?: string;
}

export class AvailableLoginsDto {
  @cv.IsString()
  @cv.IsOptional()
  given_name?: string;

  @cv.IsString()
  @cv.IsOptional()
  family_name?: string;
}

export class CheckUniqueFieldAvailabilityDto {
  @cv.IsString()
  field_name: string;

  @cv.IsString()
  value: string;
}

export class UpdateUserDTO {
  @IsPhoneNumberCustom()
  @ApiPropertyOptional()
  @cv.IsOptional()
  phone_number?: string;

  @IsEmailCustom()
  @ApiPropertyOptional()
  @cv.IsOptional()
  email?: string;

  @cv.IsString()
  @ApiPropertyOptional({ example: 'bob' })
  @cv.IsOptional()
  nickname?: string;

  @cv.IsString()
  @ApiPropertyOptional({ example: '2000-02-20T21:00:00.000Z' })
  @cv.IsOptional()
  birthdate?: string;

  @cv.IsString()
  @Transform(({ value }) => (value ? value.trim() : undefined))
  @ApiPropertyOptional({ example: 'bob' })
  @cv.IsOptional()
  login?: string;

  @ApiPropertyOptional({ example: 'bob' })
  @cv.IsOptional()
  @cv.IsString()
  given_name?: string;

  @ApiPropertyOptional({ example: 'bobs' })
  @cv.IsOptional()
  @cv.IsString()
  family_name?: string;

  @IsBooleanCustom()
  @ApiPropertyOptional()
  @cv.IsOptional()
  data_processing_agreement?: boolean;

  @ApiPropertyOptional()
  @cv.IsOptional()
  custom_fields?: string;
}

export class UpdateUserAvatarDTO {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value === 'null' ? null : value))
  @cv.IsOptional()
  picture?: string;
}

export class ExternalAccountByUserDto {
  @cv.IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  token: string;

  @IsAnyUrl()
  @ApiProperty()
  userinfo_endpoint: string;

  @cv.IsString()
  @ApiProperty()
  provider_name: string;

  @IsAnyUrl()
  @ApiPropertyOptional({ example: 'https://accounts.google.com' })
  issuer?: string;

  @cv.IsString()
  @ApiPropertyOptional({ enum: EProviderTypes, example: EProviderTypes?.GOOGLE || 'GOOGLE' })
  type?: string;
}

export class UpdatePassDTO {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  old_password?: string;

  @cv.IsString()
  @ApiProperty({ example: 'Qwerty123' })
  password: string;
}

export class CheckPassDTO {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  password?: string;
}

export class CheckAppsBeforeDeleteDTO {
  @ApiProperty()
  can_delete: string;
}

export class CreateUserResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  given_name: string;
}

export class UpdateExternalAccountDTO {
  @cv.IsEnum(EClaimPrivacy)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: EClaimPrivacy, example: EClaimPrivacy.private })
  claim_privacy?: EClaimPrivacy;
}

export class SetPrivateScopesDTO {
  @cv.IsEnum(EClaimPrivacy)
  @ApiProperty({ enum: EClaimPrivacy, example: EClaimPrivacy.private })
  claim_privacy: EClaimPrivacy;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional()
  field: string;
}

export class EmailDTO {
  @IsEmailCustom()
  email: string;
}

export class SettingsDTO {
  @cv.IsBoolean()
  @ApiPropertyOptional()
  @cv.IsOptional()
  profile_privacy?: boolean;
}

export class ConfirmEmailDTO extends EmailDTO {
  @cv.IsString()
  @ApiProperty({ example: '232367' })
  code?: string;
}

export class RecoverPasswordDTO {
  @cv.IsString()
  @ApiProperty({ example: '232367' })
  code: string;

  @cv.IsString()
  @ApiProperty()
  identifier: string;

  @cv.IsString()
  @ApiProperty({ example: 'qwerty' })
  password: string;
}

export class GetMissingProvidersDto {
  @cv.IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  identifier: string;

  @cv.IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  password: string;
}

export class DeleteSearchHistoryDto {
  @ApiPropertyOptional()
  @cv.IsOptional()
  @cv.IsString()
  search_item?: string;

  @ApiPropertyOptional()
  @cv.IsOptional()
  @cv.IsBoolean()
  delete_all?: boolean;
}

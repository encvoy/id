import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as cv from 'class-validator';
import { IsAnyUrl, IsBooleanCustom, IsEmailCustom, IsPhoneNumberCustom } from '../../custom.dto';
import { EClaimPrivacy, ELocales, EProviderTypes, SortDirection } from '../../enums';
import { UpdateClientDto } from '../clients/clients.dto';

export enum UserContactField {
  email = 'email',
  phone_number = 'phone_number',
}

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
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'Qwerty123' })
  password?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '2000-02-20T21:00:00.000Z' })
  birthdate?: string;

  @ApiPropertyOptional()
  @cv.IsOptional()
  @cv.IsString()
  picture?: string;

  @cv.IsNotEmpty()
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

  @IsBooleanCustom()
  @ApiPropertyOptional({
    description: 'Create email as verified contact. Defaults to false on backend.',
    default: false,
  })
  @cv.IsOptional()
  email_verified?: boolean;

  @IsBooleanCustom()
  @ApiPropertyOptional({
    description: 'Create phone as verified contact. Defaults to false on backend.',
    default: false,
  })
  @cv.IsOptional()
  phone_number_verified?: boolean;

  @IsBooleanCustom()
  @ApiPropertyOptional({
    description: 'Require the user to change the password on the next authorization.',
    default: false,
  })
  @cv.IsOptional()
  password_change_required?: boolean;

  @IsBooleanCustom()
  @ApiPropertyOptional({
    description: 'Send account creation email with credentials. Defaults to false on backend.',
    default: false,
  })
  @cv.IsOptional()
  send_account_create_email?: boolean;
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
  @ApiProperty({
    example: 'email',
    description: 'Unique profile field key to check.',
  })
  @cv.IsNotEmpty()
  @cv.IsString()
  field_name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Field value that should be checked for uniqueness.',
  })
  @cv.IsNotEmpty()
  @cv.IsString()
  value: string;

  @ApiPropertyOptional({
    description:
      'Current user id. When provided, this user is excluded from the uniqueness check.',
  })
  @cv.IsOptional()
  @cv.IsString()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Client id used to resolve organization-specific uniqueness scope.',
  })
  @cv.IsOptional()
  @cv.IsString()
  client_id?: string;

  @ApiPropertyOptional({
    description: 'Organization id used to check uniqueness in an explicit organization scope.',
  })
  @cv.IsOptional()
  @cv.IsString()
  organization_id?: string;
}

export class CheckFieldAvailabilityResponseDto {
  @ApiProperty()
  available: boolean;

  @ApiProperty({ type: [String] })
  validation_errors: string[];
}

export class ListUsersAutocompleteDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ description: 'Search by string' })
  search?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'created_at', description: 'Field to sort by' })
  sortBy?: string;

  @cv.IsEnum(SortDirection)
  @cv.IsOptional()
  @ApiPropertyOptional({
    enum: SortDirection,
    example: 'asc',
    description: 'Sorting direction',
  })
  sortDirection?: SortDirection;

  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @cv.IsNumber()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 10, description: 'Number of records to retrieve' })
  limit?: number;

  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @cv.IsNumber()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 0, description: 'Offset' })
  offset?: number;

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return [];
      }

      try {
        const parsedValue = JSON.parse(trimmedValue) as unknown;
        if (Array.isArray(parsedValue)) {
          return parsedValue.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to a single-value array when the query param is not JSON.
      }

      return [trimmedValue];
    }

    return [];
  })
  @cv.IsOptional()
  @cv.IsString({ each: true })
  @cv.ArrayUnique()
  @ApiPropertyOptional({
    type: [String],
    description: 'Exact client user IDs to resolve for preselected autocomplete values.',
  })
  user_ids?: string[];
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

  @IsBooleanCustom()
  @ApiPropertyOptional()
  @cv.IsOptional()
  password_change_required?: boolean;

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
  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  token: string;

  @cv.IsNotEmpty()
  @IsAnyUrl()
  @ApiProperty()
  userinfo_endpoint: string;

  @cv.IsNotEmpty()
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

  @cv.IsNotEmpty()
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
  @cv.IsNotEmpty()
  @ApiProperty()
  can_delete: string;
}

export class CreateUserResDto {
  @cv.IsNotEmpty()
  @ApiProperty()
  id: string;

  @cv.IsNotEmpty()
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

  @cv.IsEnum(ELocales)
  @ApiPropertyOptional({ enum: ELocales, nullable: true })
  @cv.IsOptional()
  locale?: ELocales | null;
}

export class ConfirmEmailDTO extends EmailDTO {
  @cv.IsString()
  @ApiProperty({ example: '232367' })
  code?: string;
}

export class RecoverPasswordDTO {
  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: '232367' })
  code: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty()
  identifier: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'qwerty' })
  password: string;
}

export class GetMissingProvidersDto {
  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  identifier: string;

  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'Qwerty1234123' })
  password: string;
}

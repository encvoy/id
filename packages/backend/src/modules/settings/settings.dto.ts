import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import * as validator from 'class-validator';
import { IsAnyUrl, IsBooleanCustom, IsEmailCustom, IsLocalizedText } from '../../custom.dto';
import { EClaimPrivacy, Ei18nCodes, ELocales, RegistrationPolicyVariants } from '../../enums';
import type { TLocalizedTextDto } from 'src/utils/localized-text-dto';

export enum TargetType {
  user = 'USER',
  client = 'CLIENT',
  provider = 'PROVIDER',
}

export enum UserProfileFields {
  sub = 'sub',
  email = 'email',
  birthdate = 'birthdate',
  family_name = 'family_name',
  given_name = 'given_name',
  login = 'login',
  nickname = 'nickname',
  phone_number = 'phone_number',
  picture = 'picture',
  data_processing_agreement = 'data_processing_agreement',
  password = 'password',
  // custom_fields = 'custom_fields',
}

export enum ESettingsNames {
  ignore_required_fields_for_clients = 'ignore_required_fields_for_clients',
  authorize_only_admins = 'authorize_only_admins',
  registration_policy = 'registration_policy',
  default_public_profile_claims_gravatar = 'default_public_profile_claims_gravatar',
  default_public_profile_claims_oauth = 'default_public_profile_claims_oauth',
  allowed_login_fields = 'allowed_login_fields',
  two_factor_authentication = 'two_factor_authentication',
  data_processing_agreement = 'data_processing_agreement',
  i18n = 'i18n',
  copyright = 'copyright',
  manual_url = 'manual_url',
  prohibit_identifier_binding = 'prohibit_identifier_binding',
  system_style = 'system_style',
  theme_light = 'theme_light',
  theme_dark = 'theme_dark',
  prohibit_restore_deleted_users = 'prohibit_restore_deleted_users',
  delete_profile_after_days = 'delete_profile_after_days',
  log_retention_days = 'log_retention_days',
}

export enum ProfileFieldTypes {
  general = 'general',
  custom = 'custom',
}

export enum AuthMethodTypes {
  login = 'login',
  session = 'session',
  oauth = 'oauth',
  otp = 'otp',
  mtls = 'mtls',
  webauthn = 'webauthn',
}

export type ProfileField = GeneralProfileField | CustomProfileField;

interface BaseProfileField {
  type: ProfileFieldTypes;
  field: string;
}

export interface GeneralProfileField extends BaseProfileField {
  type: ProfileFieldTypes.general;
  title: string;
  validate_on_authorization?: boolean;
}

export interface CustomProfileField extends BaseProfileField {
  type: ProfileFieldTypes.custom;
  id: string;
  organization_id?: string | null;
  title: string | TLocalizedTextDto;
  mapping_vcard: string | null;
  validate_on_authorization?: boolean;
}

export const listProfileFields: GeneralProfileField[] = [
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.sub,
    title: Ei18nCodes.T3F0001,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.login,
    title: Ei18nCodes.T3F0002,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.email,
    title: Ei18nCodes.T3F0003,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.given_name,
    title: Ei18nCodes.T3F0004,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.family_name,
    title: Ei18nCodes.T3F0005,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.phone_number,
    title: Ei18nCodes.T3F0006,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.birthdate,
    title: Ei18nCodes.T3F0007,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.nickname,
    title: Ei18nCodes.T3F0008,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.picture,
    title: Ei18nCodes.T3F0009,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.data_processing_agreement,
    title: Ei18nCodes.T3F0010,
  },
  {
    type: ProfileFieldTypes.general,
    field: UserProfileFields.password,
    title: Ei18nCodes.T3F0011,
  },
];

export class TwoFactorAuthenticationDto {
  @validator.IsArray()
  @validator.IsString({ each: true })
  @ApiProperty()
  available_provider_ids: string[];

  @validator.IsArray()
  @validator.IsEnum(AuthMethodTypes, { each: true })
  @ApiProperty()
  controlled_methods: AuthMethodTypes[];
}

export class I18nDto {
  @validator.IsNotEmpty()
  @validator.IsString()
  @ApiProperty()
  default_language: string;
}

export type { TLocalizedTextDto };

export class EditSettingsDto {
  @validator.IsBoolean()
  @validator.IsOptional()
  @ApiPropertyOptional()
  authorize_only_admins?: boolean;

  @validator.IsBoolean()
  @validator.IsOptional()
  @ApiPropertyOptional()
  ignore_required_fields_for_clients?: boolean;

  @validator.IsBoolean()
  @validator.IsOptional()
  @ApiPropertyOptional()
  auto_merge_users?: boolean;

  @validator.IsEnum(RegistrationPolicyVariants)
  @validator.IsOptional()
  @ApiProperty({ enum: RegistrationPolicyVariants, example: RegistrationPolicyVariants.allowed })
  @ApiPropertyOptional()
  registration_policy?: RegistrationPolicyVariants;

  @validator.IsString()
  @validator.IsOptional()
  @ApiPropertyOptional()
  default_public_profile_claims_oauth?: string;

  @validator.IsString()
  @validator.IsOptional()
  @ApiPropertyOptional()
  default_public_profile_claims_gravatar?: string;

  @validator.IsString()
  @validator.IsOptional()
  @ApiPropertyOptional()
  system_style?: string;

  @validator.IsString()
  @validator.IsOptional()
  @ApiPropertyOptional()
  theme_light?: string;

  @validator.IsString()
  @validator.IsOptional()
  @ApiPropertyOptional()
  theme_dark?: string;

  @validator.IsString()
  @validator.IsOptional()
  @ApiPropertyOptional()
  allowed_login_fields?: string;

  @IsAnyUrl()
  @validator.IsOptional()
  @ApiPropertyOptional()
  data_processing_agreement?: string;

  @validator.IsBoolean()
  @validator.IsOptional()
  @ApiPropertyOptional()
  prohibit_identifier_binding?: boolean;

  @validator.IsOptional()
  @ApiPropertyOptional()
  two_factor_authentication?: TwoFactorAuthenticationDto;

  @validator.IsOptional()
  @ApiPropertyOptional()
  i18n?: I18nDto;

  @validator.IsOptional()
  @IsLocalizedText(Object.values(ELocales))
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Copyright 2026',
      'en-US': 'Copyright 2026',
    },
  })
  copyright?: TLocalizedTextDto;

  @validator.ValidateIf((_, value) => value !== '')
  @IsAnyUrl()
  @validator.IsOptional()
  @ApiPropertyOptional({
    type: 'string',
    example: 'https://your-domain/docs/',
  })
  manual_url?: string;

  @validator.IsBoolean()
  @validator.IsOptional()
  @ApiPropertyOptional()
  prohibit_restore_deleted_users?: boolean;

  @Type(() => Number)
  @validator.IsInt()
  @validator.Min(-1)
  @validator.IsOptional()
  @ApiPropertyOptional({
    type: 'integer',
    example: 30,
    description: '0 - delete immediately, -1 - never delete automatically',
  })
  delete_profile_after_days?: number;

  @Type(() => Number)
  @validator.IsInt()
  @validator.Min(-1)
  @validator.IsOptional()
  @ApiPropertyOptional({
    type: 'integer',
    example: 30,
    description: 'Number of days to retain logs, -1 - never delete automatically',
  })
  log_retention_days?: number;
}

export class UpdateRuleDto {
  @validator.IsString()
  @validator.IsOptional()
  default?: string;

  @validator.IsBoolean()
  @validator.IsOptional()
  editable?: boolean;

  @validator.IsBoolean()
  @validator.IsOptional()
  required?: boolean;

  @validator.IsBoolean()
  @validator.IsOptional()
  unique?: boolean;

  @validator.IsBoolean()
  @validator.IsOptional()
  active?: boolean;
}

export class CreateRuleDto extends UpdateRuleDto {
  @validator.IsEnum(TargetType)
  @validator.IsOptional()
  @ApiPropertyOptional({ enum: TargetType, example: 'USER' })
  target?: TargetType;

  @validator.IsNotEmpty()
  @validator.IsString()
  field_name: string;
}

export class CreateCustomFieldDto {
  @validator.IsNotEmpty()
  @validator.IsString()
  @validator.Matches(/^[a-zA-Z]+(_[a-zA-Z]+)*$/, {
    message: 'Value field must contain only Latin letters and underscores',
  })
  field: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  title: string;

  @validator.IsString()
  @validator.IsOptional()
  mapping_vcard?: string;
}

export class UpdateCustomFieldDto extends PartialType(CreateCustomFieldDto) {}

export class CreateProfileFieldDto {
  @validator.IsString()
  @validator.IsOptional()
  organization_id?: string;

  @validator.IsString()
  @validator.IsOptional()
  client_id?: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  @validator.Matches(/^[a-zA-Z0-9]+(_[a-zA-Z0-9]+)*$/, {
    message: 'Field name must contain only Latin letters, numbers, and underscores',
  })
  field: string;

  @validator.IsObject()
  @validator.IsNotEmptyObject()
  @IsLocalizedText(Object.values(ELocales))
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Поле',
      'en-US': 'Field',
    },
  })
  title: TLocalizedTextDto;

  @validator.IsString()
  @validator.IsOptional()
  default: string;

  @validator.IsString()
  @validator.IsOptional()
  mapping_vcard?: string;

  @IsBooleanCustom()
  required: boolean;

  @IsBooleanCustom()
  unique: boolean;

  @IsBooleanCustom()
  active: boolean;

  @IsBooleanCustom()
  editable: boolean;

  @validator.IsEnum(EClaimPrivacy)
  claim: EClaimPrivacy;

  @IsBooleanCustom()
  @validator.IsOptional()
  validate_on_authorization?: boolean;
}

export class UpdateProfileFieldDto extends PartialType(CreateProfileFieldDto) {
  @IsBooleanCustom()
  @validator.IsOptional()
  allowed_as_login?: boolean;
}

export class CreateRuleValidationDto {
  @validator.IsObject()
  @validator.IsNotEmptyObject()
  @IsLocalizedText(Object.values(ELocales))
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Минимум 8 символов',
      'en-US': 'Minimum 8 characters',
    },
  })
  title: TLocalizedTextDto;

  @validator.IsObject()
  @validator.IsNotEmptyObject()
  @IsLocalizedText(Object.values(ELocales))
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Пароль должен содержать минимум 8 символов',
      'en-US': 'Password must contain at least 8 characters',
    },
  })
  error: TLocalizedTextDto;

  @validator.IsString()
  @validator.IsNotEmpty()
  regex: string;

  @validator.IsBoolean()
  @validator.IsOptional()
  active?: boolean;
}
export class UpdateRuleValidationDto extends PartialType(CreateRuleValidationDto) {}

export class GetProfileFieldsDto {
  @validator.IsEnum(ProfileFieldTypes)
  @validator.IsOptional()
  type?: ProfileFieldTypes;

  @validator.IsString()
  @validator.IsOptional()
  organization_id?: string;

  @validator.IsString()
  @validator.IsOptional()
  client_id?: string;
}

export class EmailEnvDto {
  @validator.IsNumber()
  port: number;

  @IsEmailCustom()
  root_mail: string;

  @validator.IsNotEmpty()
  @validator.IsUrl()
  hostname: string;

  @validator.IsNotEmpty()
  @validator.IsString()
  password: string;

  @validator.IsNumber()
  @validator.IsOptional()
  ttl?: number = 900;

  @validator.IsString()
  @validator.IsOptional()
  alias?: string;
}

export class CreateClientTypeDto {
  @validator.IsObject()
  @validator.IsNotEmptyObject()
  @IsLocalizedText(Object.values(ELocales))
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Внутреннее приложение',
      'en-US': 'Internal application',
    },
  })
  name: TLocalizedTextDto;
}

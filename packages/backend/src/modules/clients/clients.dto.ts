import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as cv from 'class-validator';
import { IsAnyUrl, IsLocalizedText } from '../../custom.dto';
import { TransformToArray, TransformToBoolean, TransformToNumber } from '../../decorators';
import { ECoverModes, ELocales, SortDirection, UserRoles } from '../../enums';
import { TLocalizedTextDto } from 'src/utils/localized-text-dto';

const CLIENT_NAME_LOCALES = Object.values(ELocales);

export enum EAuthMethodTypes {
  client_secret_basic = 'client_secret_basic',
  client_secret_post = 'client_secret_post',
  client_secret_jwt = 'client_secret_jwt',
  private_key_jwt = 'private_key_jwt',
  none = 'none',
}

enum ESigningAlgTypes {
  RS256 = 'RS256',
  PS256 = 'PS256',
}

enum ESubjectTypes {
  public = 'public',
  pairwise = 'pairwise',
}

enum EApplicationTypes {
  web = 'web',
  native = 'native',
}

enum EResponseTypes {
  code_token = 'code token',
  code_id_token_token = 'code id_token token',
  code_id_token = 'code id_token',
  code = 'code',
  id_token = 'id_token',
  none = 'none',
}

export class CreateClientDto {
  @cv.IsNotEmpty()
  @cv.IsObject()
  @IsLocalizedText(CLIENT_NAME_LOCALES, {
    fallbackLocale: ELocales.ru,
    requireAtLeastOne: true,
    maxPerLang: 50,
    validationOptions: {
      message: 'name must contain at least one non-empty localized value, each up to 50 chars',
    },
  })
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Приложение',
      'en-US': 'Application',
    },
  })
  name: TLocalizedTextDto;

  @cv.IsNotEmpty()
  @IsAnyUrl()
  @cv.MaxLength(2000)
  @ApiProperty()
  domain: string;

  @IsAnyUrl()
  @cv.MaxLength(2000, { each: true })
  @ApiProperty({ type: [String] })
  redirect_uris: string[];

  @cv.IsString()
  @cv.IsOptional()
  @cv.MaxLength(255)
  @ApiPropertyOptional()
  description?: string;

  @cv.IsString({ each: true })
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @TransformToArray()
  grant_types?: string[];

  @cv.IsString({ each: true })
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @TransformToArray()
  response_types?: EResponseTypes[];

  @IsAnyUrl()
  @cv.MaxLength(2000, { each: true })
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String] })
  post_logout_redirect_uris?: string[];

  @cv.IsEnum(EAuthMethodTypes)
  @cv.IsOptional()
  @ApiPropertyOptional()
  token_endpoint_auth_method?: EAuthMethodTypes;

  @cv.IsEnum(EAuthMethodTypes)
  @cv.IsOptional()
  @ApiPropertyOptional()
  introspection_endpoint_auth_method?: EAuthMethodTypes;

  @cv.IsEnum(EAuthMethodTypes)
  @cv.IsOptional()
  @ApiPropertyOptional()
  revocation_endpoint_auth_method?: EAuthMethodTypes;

  @cv.IsEnum(ESigningAlgTypes)
  @cv.IsOptional()
  @ApiPropertyOptional()
  id_token_signed_response_alg?: ESigningAlgTypes;

  @cv.IsEnum(ESubjectTypes)
  @cv.IsOptional()
  @ApiPropertyOptional()
  subject_type?: ESubjectTypes;

  @IsAnyUrl()
  @cv.MaxLength(2000, { each: true })
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String] })
  request_uris?: string[];

  @cv.IsOptional()
  @cv.IsBoolean()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  catalog?: boolean;

  @cv.IsOptional()
  @IsLocalizedText(CLIENT_NAME_LOCALES, {
    fallbackLocale: ELocales.ru,
    maxPerLang: 50,
    validationOptions: {
      message: 'catalog_name must be a localized text object with string values up to 50 chars',
    },
  })
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Приложение',
      'en-US': 'Application',
    },
  })
  catalog_name?: TLocalizedTextDto;

  @cv.IsOptional()
  @cv.IsBoolean()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  mini_widget?: boolean;

  @cv.IsOptional()
  @cv.IsBoolean()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  authorize_only_admins?: boolean;

  @cv.IsOptional()
  @cv.IsBoolean()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  authorize_only_employees?: boolean;

  @cv.IsOptional()
  @cv.IsBoolean()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  authorize_auto_by_session?: boolean;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional()
  parent_id?: string;

  @cv.IsOptional()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  require_auth_time?: boolean;

  @cv.IsOptional()
  @TransformToBoolean()
  @ApiPropertyOptional({ type: Boolean })
  require_signed_request_object?: boolean;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional()
  type_id?: string;
}

export class UpdateAvatarClientDto {
  @cv.IsOptional()
  @Transform(({ value }) => (value === 'null' ? null : value))
  @ApiPropertyOptional({ example: 'avatar' })
  avatar?: string;

  @cv.IsOptional()
  @Transform(({ value }) => (value === 'null' ? null : value))
  @ApiPropertyOptional({ example: 'cover' })
  cover?: string;
}

export class TransferClientOwnerDto {
  @cv.IsString()
  @cv.IsNotEmpty()
  @ApiProperty({ description: 'Target owner user id' })
  user_id: string;
}

// TODO: Simplify these types.
export class WidgetColorsDto {
  @cv.IsString()
  @cv.Matches(/(^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$)/, {
    message: 'button_color must be hex string',
  })
  @cv.IsOptional()
  @ApiPropertyOptional()
  button_color?: string;

  @cv.IsString()
  @cv.Matches(/(^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$)/, { message: 'font_color must be hex string' })
  @cv.IsOptional()
  @ApiPropertyOptional()
  font_color?: string;

  @cv.IsString()
  @cv.Matches(/(^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$)/, { message: 'link_color must be hex string' })
  @cv.IsOptional()
  @ApiPropertyOptional()
  link_color?: string;
}
export class UpdateClientDto extends PartialType(
  OmitType(CreateClientDto, ['grant_types', 'redirect_uris', 'post_logout_redirect_uris'] as const),
) {
  @cv.IsEnum(ECoverModes)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: ECoverModes })
  cover_mode?: ECoverModes;

  @cv.IsEnum(EApplicationTypes)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: EApplicationTypes })
  application_type?: EApplicationTypes;

  @IsAnyUrl()
  @cv.MaxLength(2000, { each: true })
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String] })
  redirect_uris?: string[];

  @IsAnyUrl()
  @cv.MaxLength(2000, { each: true })
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String] })
  post_logout_redirect_uris?: string[];

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  show_avatar_in_widget: boolean;

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  hide_widget_header: boolean;

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  hide_widget_footer: boolean;

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  hide_widget_create_account: boolean;

  @cv.IsBoolean()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  hide_avatars_of_big_providers: boolean;

  @cv.IsArray()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String], example: ['1'] })
  @TransformToArray()
  required_providers_ids?: string[];

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional()
  widget_info?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional()
  widget_info_out?: string;

  @cv.IsOptional()
  @ApiPropertyOptional()
  widget_colors?: WidgetColorsDto;

  @cv.IsOptional()
  @IsLocalizedText(CLIENT_NAME_LOCALES, {
    fallbackLocale: ELocales.ru,
    validationOptions: {
      message: 'widget_title must be a localized text object with string values',
    },
  })
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Вход в APP_NAME',
      'en-US': 'Sign in to APP_NAME',
    },
  })
  widget_title?: TLocalizedTextDto;

  @TransformToNumber()
  @cv.IsOptional()
  @ApiPropertyOptional()
  access_token_ttl?: number;

  @TransformToNumber()
  @cv.IsOptional()
  @ApiPropertyOptional()
  refresh_token_ttl?: number;

  @cv.IsArray()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: [String], example: ['1'] })
  @TransformToArray()
  grant_types?: string[];
}

export enum Columns {
  nickname = 'nickname',
  role = 'role',
  status = 'status',
}

export enum ClientFilterFields {
  client_id = 'client_id',
  name = 'name',
  domain = 'domain',
  created_at = 'created_at',
}

export class GetUsersDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: 'John' })
  search_string?: string;

  @cv.IsEnum(Columns)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: Columns, example: 'role' })
  sort_by?: Columns;

  @cv.IsEnum(SortDirection)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: SortDirection, example: 'asc' })
  sort_direction?: SortDirection;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_records?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_skip?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  last_record_id?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  search_param_user_id?: string;

  @cv.IsString()
  @cv.IsOptional()
  search_filter?: string;
}

export class GetClientsByUserIdDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  search_string?: string;

  @cv.IsEnum(ClientFilterFields)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: ClientFilterFields, example: 'client_id' })
  sort_by?: ClientFilterFields;

  @cv.IsEnum(SortDirection)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: SortDirection, example: 'asc' })
  sort_direction?: SortDirection;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_records?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_skip?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  last_record_id?: string;
}

export class GetClientsByScopeDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  search_string?: string;

  @cv.IsEnum(ClientFilterFields)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: ClientFilterFields, example: 'client_id' })
  sort_by?: ClientFilterFields;

  @cv.IsEnum(SortDirection)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: SortDirection, example: 'asc' })
  sort_direction?: SortDirection;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_records?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  last_record_id?: string;
}

export class GetApplicationsCountDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  search_string?: string;
}

export class GetAllClientsDto {
  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  search_string?: string;

  @cv.IsEnum(ClientFilterFields)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: ClientFilterFields, example: 'client_id' })
  sort_by?: ClientFilterFields;

  @cv.IsEnum(SortDirection)
  @cv.IsOptional()
  @ApiPropertyOptional({ enum: SortDirection, example: 'asc' })
  sort_direction?: SortDirection;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_records?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  number_of_skip?: string;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional({ example: '1' })
  last_record_id?: string;
}

export class UpdateRoleDTO {
  @cv.IsEnum(UserRoles)
  @ApiProperty({ enum: UserRoles, example: UserRoles.USER })
  role: UserRoles;
}

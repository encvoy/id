import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import * as cv from 'class-validator';
import { TransformToArray } from 'src/decorators';
import { IsBooleanCustom, IsLocalizedText } from '../../custom.dto';
import { EProviderGroups, ELocales } from 'src/enums';
import { Transform } from 'class-transformer';
import { TLocalizedTextDto } from 'src/utils/localized-text-dto';

export class TypeProviderDTO {
  @cv.IsNotEmpty()
  @cv.IsString()
  @ApiProperty({ example: 'EMAIL' })
  type: string;
}

export class BindProviderDto {
  @cv.IsString()
  @ApiProperty({ type: String })
  provider_id: string;

  @cv.IsNumber()
  @cv.IsOptional()
  @ApiPropertyOptional({ type: Number })
  index?: number;
}

export class GetProviderResDto {
  @ApiProperty()
  id: number;

  @cv.IsNotEmpty()
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Email',
      'en-US': 'Email',
    },
  })
  name: TLocalizedTextDto;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  is_active: boolean;

  @cv.IsNotEmpty()
  @ApiProperty()
  redirect_uri: string;

  @cv.IsNotEmpty()
  @ApiProperty()
  issuer: string;

  @cv.IsNotEmpty()
  @ApiProperty()
  client_id: string;

  @ApiPropertyOptional()
  avatar?: string | null;

  @cv.IsNotEmpty()
  @ApiProperty()
  external_client_id: string;

  @cv.IsNotEmpty()
  @ApiProperty()
  external_client_secret: string;

  @cv.IsNotEmpty()
  @ApiProperty()
  authorization_endpoint: string;

  @cv.IsNotEmpty()
  @ApiProperty()
  token_endpoint: string;

  @ApiPropertyOptional()
  userinfo_endpoint_uri?: string | null;
}

export class GetExternalClientSecretResDto {
  @cv.IsNotEmpty()
  @ApiProperty()
  client_secret: string;
}

export class BaseParamsProviderDto {}

export class BaseCreateProviderDto<T = BaseParamsProviderDto> {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @cv.IsNotEmpty()
  @cv.IsString()
  type: string;

  @cv.IsNotEmpty()
  @cv.IsObject()
  @IsLocalizedText(Object.values(ELocales), {
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
      'ru-RU': 'Провайдер',
      'en-US': 'Provider',
    },
  })
  name: TLocalizedTextDto;

  @cv.Matches(/^$|[^ ]+/, { message: 'The description cannot consist only of spaces' })
  @cv.MaxLength(255)
  @cv.IsOptional()
  @cv.IsString()
  @ApiPropertyOptional()
  description?: string;

  @cv.IsOptional()
  @ApiPropertyOptional()
  params?: T;

  @IsBooleanCustom()
  @cv.IsOptional()
  is_public?: boolean;

  @cv.IsNumber()
  @cv.IsIn([0, 1, 2])
  @cv.IsOptional()
  @ApiPropertyOptional()
  default_public?: number;

  @IsBooleanCustom()
  @cv.IsOptional()
  password_required?: boolean;

  @cv.IsEnum(EProviderGroups)
  @Transform(({ value }) => {
    return value === '' ? undefined : value;
  })
  @cv.IsOptional()
  @ApiPropertyOptional()
  groupe?: EProviderGroups;

  @cv.IsNumber()
  @cv.IsOptional()
  @ApiPropertyOptional()
  index?: number;
}

export function ProviderParamsDto<T>(paramsDto: new () => T): PropertyDecorator {
  return applyDecorators(
    cv.IsOptional(),
    cv.ValidateNested(),
    Type(() => paramsDto),
    ApiPropertyOptional({ type: paramsDto }),
  ) as PropertyDecorator;
}

export class BaseUpdateProviderDto extends IntersectionType(
  PartialType(BaseCreateProviderDto<BaseParamsProviderDto>),
) {
  @IsBooleanCustom()
  @cv.IsOptional()
  show_provider_avatar?: boolean;

  @cv.IsString()
  @cv.IsOptional()
  @ApiPropertyOptional()
  provider_title?: string;
}

export class AvatarProviderDto {
  @cv.IsOptional()
  @cv.IsString()
  @ApiPropertyOptional()
  avatar?: string | null;
}

export class AllProvidersDto {
  @cv.IsArray()
  @cv.IsOptional()
  @TransformToArray()
  types?: string[];

  @IsBooleanCustom()
  @cv.IsOptional()
  only_active?: boolean;

  @IsBooleanCustom()
  @cv.IsOptional()
  is_public?: boolean;

  @cv.IsString()
  @cv.IsOptional()
  action?: string;
}

export class ListProvidersDto {
  @IsBooleanCustom()
  @cv.IsOptional()
  only_active?: boolean;
}

export class UpdateListProvidersDto {
  @cv.IsArray()
  @ApiProperty({ type: [Number] })
  big: number[];

  @cv.IsArray()
  @ApiProperty({ type: [Number] })
  small: number[];
}

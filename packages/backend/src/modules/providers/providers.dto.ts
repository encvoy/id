import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import * as cv from 'class-validator';
import { TransformToArray } from 'src/decorators';
import { IsBooleanCustom } from '../../custom.dto';
import { EProviderGroups } from 'src/enums';
import { Transform } from 'class-transformer';

export class TypeProviderDTO {
  @cv.IsString()
  @ApiProperty({ example: 'EMAIL' })
  type: string;
}

export class BindProviderDto {
  @cv.IsArray()
  @ApiProperty({ type: [Number] })
  providers: number[];
}

export class GetProviderResDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  redirect_uri: string;

  @ApiProperty()
  issuer: string;

  @ApiProperty()
  client_id: string;

  @ApiPropertyOptional()
  avatar?: string | null;

  @ApiProperty()
  external_client_id: string;

  @ApiProperty()
  external_client_secret: string;

  @ApiProperty()
  authorization_endpoint: string;

  @ApiProperty()
  token_endpoint: string;

  @ApiPropertyOptional()
  userinfo_endpoint_uri?: string | null;
}

export class GetExternalClientSecretResDto {
  @ApiProperty()
  client_secret: string;
}

export class BaseParamsProviderDto {}

export class BaseCreateProviderDto<T = BaseParamsProviderDto> {
  @cv.IsString()
  type: string;

  @cv.Matches(/[^ ]+/, { message: 'The name cannot consist only of spaces' })
  @cv.Matches(/^[^ ]+( *[^ ]+)*?$/, { message: 'The name cannot begin or end with spaces' })
  @cv.MaxLength(50)
  @cv.MinLength(1)
  @cv.IsString()
  @ApiProperty()
  name: string;

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

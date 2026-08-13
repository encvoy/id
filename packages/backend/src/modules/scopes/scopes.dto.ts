import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import * as validator from 'class-validator';
import { IsBooleanCustom, IsLocalizedText } from 'src/custom.dto';
import { ELocales } from 'src/enums';
import { TLocalizedTextDto } from 'src/utils/localized-text-dto';

export class CreateOidcScopeDto {
  @validator.IsNotEmpty()
  @validator.IsString()
  @validator.Matches(/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/)
  @ApiProperty({ example: 'employee_profile' })
  name: string;

  @validator.IsObject()
  @validator.IsNotEmptyObject()
  @IsLocalizedText(Object.values(ELocales))
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Профиль сотрудника',
      'en-US': 'Employee profile',
    },
  })
  title: TLocalizedTextDto;

  @validator.IsOptional()
  @validator.IsObject()
  @IsLocalizedText(Object.values(ELocales), {
    requireAtLeastOne: false,
  })
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Возвращает дополнительные поля профиля сотрудника',
      'en-US': 'Returns additional employee profile fields',
    },
  })
  description?: TLocalizedTextDto;

  @validator.IsOptional()
  @validator.IsString()
  @validator.Matches(/^[A-Za-z][A-Za-z0-9]*$/)
  @ApiPropertyOptional({ example: 'BadgeOutlined' })
  icon?: string;

  @validator.IsOptional()
  @validator.IsArray()
  @validator.IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['department', 'position'] })
  fields?: string[];

  @validator.IsOptional()
  @IsBooleanCustom()
  @ApiPropertyOptional({ default: true })
  active?: boolean;
}

export class UpdateOidcScopeDto extends PartialType(CreateOidcScopeDto) {}

export class BindOidcScopeFieldDto {
  @validator.IsOptional()
  @validator.IsString()
  @ApiPropertyOptional({ example: 'clwprofilefieldid' })
  profile_field_id?: string;

  @validator.IsOptional()
  @validator.IsString()
  @validator.Matches(/^[A-Za-z0-9]+(_[A-Za-z0-9]+)*$/)
  @ApiPropertyOptional({ example: 'department' })
  field?: string;

  @validator.IsOptional()
  @validator.IsString()
  @validator.Matches(/^[A-Za-z0-9]+(_[A-Za-z0-9]+)*$/)
  @ApiPropertyOptional({ example: 'department' })
  claim_name?: string;

  @validator.IsOptional()
  @Type(() => Number)
  @validator.IsInt()
  @validator.Min(0)
  @ApiPropertyOptional({ default: 0 })
  order?: number;
}

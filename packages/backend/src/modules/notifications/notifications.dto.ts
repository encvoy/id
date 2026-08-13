import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationTarget } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsLocalizedText, ListInputDto } from 'src/custom.dto';
import { ELocales } from 'src/enums';
import type { TLocalizedTextDto } from 'src/utils/localized-text-dto';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const NOTIFICATION_LOCALES = Object.values(ELocales);
const NOTIFICATION_TITLE_MAX_LENGTH = 255;
const NOTIFICATION_CONTENT_MAX_LENGTH = 5000;

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsLocalizedText(NOTIFICATION_LOCALES, {
    fallbackLocale: ELocales.ru,
    requireAtLeastOne: true,
    maxPerLang: NOTIFICATION_TITLE_MAX_LENGTH,
    validationOptions: {
      message: `title must contain at least one non-empty localized value, each up to ${NOTIFICATION_TITLE_MAX_LENGTH} chars`,
    },
  })
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Плановые работы',
      'en-US': 'Scheduled maintenance',
    },
    description: 'Short notification title displayed to the user.',
  })
  title: TLocalizedTextDto;

  @IsNotEmpty()
  @IsLocalizedText(NOTIFICATION_LOCALES, {
    fallbackLocale: ELocales.ru,
    requireAtLeastOne: true,
    maxPerLang: NOTIFICATION_CONTENT_MAX_LENGTH,
    validationOptions: {
      message: `content must contain at least one non-empty localized value, each up to ${NOTIFICATION_CONTENT_MAX_LENGTH} chars`,
    },
  })
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Сервис будет недоступен в субботу с 02:00 до 04:00.',
      'en-US': 'The service will be unavailable on Saturday from 02:00 to 04:00.',
    },
    description: 'Main notification message.',
  })
  content: TLocalizedTextDto;

  @IsEnum(NotificationTarget)
  @ApiProperty({
    enum: NotificationTarget,
    default: NotificationTarget.ALL,
    description:
      'Target audience for the notification: all users, new users, existing users, or a specific list of users.',
  })
  target: NotificationTarget;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (value === undefined || value === null || value === '') {
      return [];
    }
    return [String(value).trim()].filter(Boolean);
  })
  @ApiPropertyOptional({
    type: [String],
    example: ['3c1e0f1b-5857-4aa2-98a8-df8db597cdb5', '53b5ea98-f6f7-4c21-b0fa-f894d58f970f'],
    description: 'List of user IDs. Required only when target = USER_LIST.',
  })
  user_ids?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return value;
  })
  @ApiPropertyOptional({
    default: true,
    description:
      'Notification activity flag. Inactive notifications remain in the list but are no longer shown to users.',
  })
  is_active?: boolean;
}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}

export class ListNotificationsDto extends ListInputDto {}

export class MarkNotificationsReadDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (value === undefined || value === null || value === '') {
      return [];
    }
    return [value];
  })
  @ApiPropertyOptional({
    type: [String],
    example: ['3c1e0f1b-5857-4aa2-98a8-df8db597cdb5'],
    description: 'List of notification IDs marked as read by the user.',
  })
  notification_ids?: string[];
}

export class NotificationDto {
  @ApiProperty({
    example: '3c1e0f1b-5857-4aa2-98a8-df8db597cdb5',
    format: 'uuid',
    description: 'Unique notification identifier.',
  })
  id: string;

  @ApiProperty({
    example: '2026-03-23T10:00:00.000Z',
    format: 'date-time',
    description: 'Notification creation date and time.',
  })
  created_at: Date;

  @ApiProperty({
    example: '2026-03-23T10:05:00.000Z',
    format: 'date-time',
    description: 'Notification last update date and time.',
  })
  updated_at: Date;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Плановые работы',
      'en-US': 'Scheduled maintenance',
    },
    description: 'Short notification title.',
  })
  title: TLocalizedTextDto;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: {
      'ru-RU': 'Сервис будет недоступен в субботу с 02:00 до 04:00.',
      'en-US': 'The service will be unavailable on Saturday from 02:00 to 04:00.',
    },
    description: 'Main notification message.',
  })
  content: TLocalizedTextDto;

  @ApiProperty({
    example: true,
    description: 'Notification activity flag.',
  })
  is_active: boolean;

  @ApiProperty({
    enum: NotificationTarget,
    example: NotificationTarget.ALL,
    description: 'Target audience of the notification.',
  })
  target: NotificationTarget;

  @ApiProperty({
    type: [String],
    example: ['3c1e0f1b-5857-4aa2-98a8-df8db597cdb5', '53b5ea98-f6f7-4c21-b0fa-f894d58f970f'],
    description: 'List of users for target = USER_LIST.',
  })
  user_ids: string[];

  @ApiPropertyOptional({
    example: 'my-client-id',
    nullable: true,
    description:
      'Application identifier the notification belongs to. For global notifications, this value is null.',
  })
  client_id?: string | null;
}

export class NotificationListItemDto extends NotificationDto {
  @ApiProperty({
    example: 12,
    description: 'Number of users who marked the notification as read.',
  })
  read_count: number;

  @ApiProperty({
    example: 128,
    description: 'Number of users included in the notification target audience.',
  })
  total_target: number;
}

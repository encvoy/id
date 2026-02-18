import * as swagger from '@nestjs/swagger';
import * as cv from 'class-validator';
import { isUrl, preparePhoneNumber, PHONE_REGEX } from './helpers';
import { Transform } from 'class-transformer';
import { SortDirection } from './enums';
import { BadRequestException } from '@nestjs/common';

/**
 *
 * Allows setting localhost and any protocols
 */
export function IsAnyUrl(property?: string, validationOptions?: cv.ValidationOptions) {
  return function (object?: Object, propertyName?: string) {
    cv.registerDecorator({
      name: 'IsAnyUrl',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string[] | string) {
          if (typeof value === 'string') return isUrl(value);
          return value.every((url) => (url ? isUrl(url) : true));
        },
        defaultMessage() {
          return `Invalid URL format: ${propertyName} `;
        },
      },
    });
  };
}

export function IsPhoneNumberCustom(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    swagger.ApiProperty({
      description: 'Phone number',
      example: '79999999999',
    })(target, propertyKey);

    cv.ValidateIf(
      (o) => o[propertyKey] !== null && o[propertyKey] !== undefined && o[propertyKey] !== '',
    )(target, propertyKey);

    cv.Matches(PHONE_REGEX, {
      message: 'Invalid phone number format',
    })(target, propertyKey);

    Transform(({ value }) => (value ? preparePhoneNumber(value) : null))(target, propertyKey);
  };
}

export function IsEmailCustom(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    swagger.ApiProperty({
      description: 'E-mail',
      example: 'test@mail.com',
    })(target, propertyKey);

    Transform(({ value }) => {
      if (value === '') return null;
      if (typeof value === 'string') return value.toLowerCase().trim();
      return value;
    })(target, propertyKey);

    cv.ValidateIf((o) => {
      const isOptional = Reflect.getMetadata('design:type', target, propertyKey) === Boolean;
      return !isOptional;
    })(target, propertyKey);

    cv.IsEmail({}, { message: 'Invalid email format' })(target, propertyKey);
  };
}

export function IsBooleanCustom(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    cv.IsBoolean({ message: 'The value must be boolean' })(target, propertyKey);

    cv.ValidateIf((o) => o[propertyKey] !== null && o[propertyKey] !== undefined)(
      target,
      propertyKey,
    );

    Transform(({ value }) => {
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true') return true;
        if (lowerValue === 'false') return false;
        if (lowerValue === '') return null;
        throw new BadRequestException(`The field value must be boolean`);
      }
      return value;
    })(target, propertyKey);
  };
}

export class ListInputDto {
  @cv.IsString()
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({ description: 'Search by string' })
  search?: string;

  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @cv.IsObject()
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({ type: Object, description: 'Filters for data' })
  filter?: Record<string, any>;

  @cv.IsString()
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({ example: 'created_at', description: 'Field to sort by' })
  sortBy?: string;

  @cv.IsEnum(SortDirection)
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({
    enum: SortDirection,
    example: 'asc',
    description: 'Sorting direction',
  })
  sortDirection?: SortDirection;

  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @cv.IsNumber()
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({ example: 10, description: 'Number of records to retrieve' })
  limit?: number;

  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @cv.IsNumber()
  @cv.IsOptional()
  @swagger.ApiPropertyOptional({ example: 0, description: 'Offset' })
  offset?: number;
}

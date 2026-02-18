import { BadRequestException, Type } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common/decorators';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Ei18nCodes } from 'src/enums';

export const PROVIDER_METADATA = 'provider';
export const IsProvider = () => SetMetadata(PROVIDER_METADATA, true);

export const PROVIDER_METHOD_METADATA = 'provider:method';

export function ProviderMethod(dto: Type<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Save the DTO in the metadata
    Reflect.defineMetadata(PROVIDER_METHOD_METADATA, dto, target, propertyKey);

    // Original method
    const originalMethod = descriptor.value;

    // Decorate the method
    descriptor.value = function (...args: any[]) {
      if (!args.length) {
        throw new BadRequestException(Ei18nCodes.T3E0018);
      }

      const params = plainToClass(dto, args[0]);
      const errors = validateSync(params, { whitelist: true, forbidNonWhitelisted: true });

      if (errors.length > 0) {
        const messages = errors.map((error) => Object.values(error.constraints || {}).join(', '));
        throw new BadRequestException(messages.join('; '));
      }

      args[0] = params;

      return originalMethod.apply(this, args);
    };
  };
}

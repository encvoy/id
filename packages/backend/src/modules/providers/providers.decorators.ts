import { BadRequestException, Type } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common/decorators';
import { plainToClass } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { Ei18nCodes } from 'src/enums';

export const PROVIDER_METADATA = 'provider';
export const IsProvider = () => SetMetadata(PROVIDER_METADATA, true);

export const PROVIDER_METHOD_METADATA = 'provider:method';

const collectValidationMessages = (errors: ValidationError[], parentPath = ''): string[] =>
  errors.flatMap((error) => {
    const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownMessages = Object.values(error.constraints || {}).map(
      (message) => `${propertyPath}: ${message}`,
    );
    return [...ownMessages, ...collectValidationMessages(error.children || [], propertyPath)];
  });

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
        throw new BadRequestException(collectValidationMessages(errors).join('; '));
      }

      args[0] = params;

      return originalMethod.apply(this, args);
    };
  };
}

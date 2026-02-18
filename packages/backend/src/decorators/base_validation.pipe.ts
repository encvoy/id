import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Validation pipe that determines DTO type based on request content
 */
@Injectable()
export abstract class BaseValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!value) {
      throw new InternalServerErrorException('No data submitted');
    }

    // Logic for determining DTO type based on request content
    const dtoType = this.determineDtoType(value);

    // Transform to DTO
    const object = plainToInstance(dtoType, value);

    // Validation
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    // Return all validation errors
    if (errors.length) {
      const msg = errors.map((error) => Object.values(error.constraints).join(', ')).join(', ');
      throw new BadRequestException(msg);
    }

    return object;
  }

  /**
   * Determine DTO type based on request content
   */
  protected abstract determineDtoType(value: any): any;
}

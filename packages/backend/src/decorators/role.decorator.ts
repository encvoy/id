import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Key for role value
 */
export const ROLE_KEY = 'role';

/**
 * Decorator to get role
 */
export const Role = createParamDecorator((data: unknown, context: ExecutionContext) => {
  return Reflect.getMetadata(ROLE_KEY, context.getHandler());
});

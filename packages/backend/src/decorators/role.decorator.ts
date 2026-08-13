import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Key for role value
 */
export const ROLE_KEY = 'role';

/**
 * Decorator to get role
 */
export const Role = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & Record<string, string | null>>();
  return request?.[ROLE_KEY] ?? null;
});

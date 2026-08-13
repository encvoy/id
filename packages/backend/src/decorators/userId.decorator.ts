import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Key for user_id value
 */
export const USER_ID_KEY = 'user_id';

/**
 * Decorator to get user_id
 */
export const UserId = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & Record<string, string | null>>();
  return request?.[USER_ID_KEY] ?? null;
});

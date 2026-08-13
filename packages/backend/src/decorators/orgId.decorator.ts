import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Key for organization ID value
 */
export const ORG_ID_KEY = 'org_id';

/**
 * Decorator to get organization ID
 */
export const OrgId = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & Record<string, string | null>>();
  return request?.[ORG_ID_KEY] ?? null;
});

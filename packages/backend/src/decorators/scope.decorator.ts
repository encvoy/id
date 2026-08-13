import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiOAuth2 } from '@nestjs/swagger';

/**
 * Key for scope value
 */
export const SCOPE_KEY = 'scope';

/**
 * Decorator to set scope, defining access to the resource
 */
export const Scope = (scope: string) =>
  applyDecorators(SetMetadata(SCOPE_KEY, scope), ApiOAuth2([scope]));

import { SetMetadata } from '@nestjs/common';

/**
 * Key for scope value
 */
export const SCOPE_KEY = 'scope';

/**
 * Decorator to set scope, defining access to the resource
 */
export const Scope = (scope: string) => SetMetadata(SCOPE_KEY, scope);

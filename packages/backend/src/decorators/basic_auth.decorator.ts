import { SetMetadata } from '@nestjs/common';

/**
 * Key for Basic Auth metadata
 */
export const BASIC_AUTH_KEY = 'basic_auth_allowed';

/**
 * Decorator to allow Basic authorization on endpoint
 * By default, Basic Auth is disabled for security
 */
export const BasicAuth = () => SetMetadata(BASIC_AUTH_KEY, true);

import { PROVIDER_TYPE_HOTP, PROVIDER_TYPE_TOTP } from './modules/providers/collection/otp';
import { resolveRuntimeDomain } from './runtime-domain';

export const VERSION = '1.2.17';

export const NODE_ENV = process.env['NODE_ENV'] || 'production';
export const DOMAIN = resolveRuntimeDomain(process.env);

//auth
export let CLIENT_ID = '';

export const setClientId = (clientId: string) => {
  CLIENT_ID = clientId;
};

export const TIME_TO_RESEND = 30;
export const BIND_UID_TTL = 1800;

//redis
export const REDIS_PORT = parseInt(process.env['REDIS_PORT'] || '6379', 10);
export const REDIS_HOST = process.env['REDIS_HOST'] || '127.0.0.1';

//throttle
export const RATE_LIMIT = parseInt(process.env['RATE_LIMIT'] || '15', 10);
export const RATE_LIMIT_TTL_SEC = parseInt(process.env['RATE_LIMIT_TTL_SEC'] || '900', 10);

//log
export const CONSOLE_LOG_LEVELS = (process.env['CONSOLE_LOG_LEVELS'] || 'log warn error').split(
  ' ',
);

//admin
export const ADMIN_LOGIN = process.env['ADMIN_LOGIN'] || 'root';
export const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] || 'changethis';

//metrica
export const GOOGLE_METRICA_ID = process?.env?.['GOOGLE_METRICA_ID'];

export const OIDC_SESSION_TTL = parseInt(process.env.OIDC_SESSION_TTL || `${24 * 60 * 60}`, 10);

/**
 * The number of days after which user profiles are deleted
 */
export const DELETE_PROFILE_AFTER_DAYS = parseInt(process.env['DELETE_PROFILE_AFTER_DAYS'] || '30');

export const PROVIDER_TYPE_CREDENTIALS = 'CREDENTIALS';
export const PROVIDER_TYPE_GITHUB = 'GITHUB';
export const PROVIDER_TYPE_GOOGLE = 'GOOGLE';
export const PROVIDER_TYPE_CUSTOM = 'CUSTOM';

export const LIST_PROVIDERS_AUTH = [
  PROVIDER_TYPE_GITHUB,
  PROVIDER_TYPE_GOOGLE,
  PROVIDER_TYPE_CUSTOM,
  'WEBAUTHN',
  'MTLS',
  PROVIDER_TYPE_HOTP,
  PROVIDER_TYPE_TOTP,
];

import { findDtoEnv } from './helpers';
import { PROVIDER_TYPE_HOTP, PROVIDER_TYPE_TOTP } from './modules/providers/collection/otp';
import { EmailEnvDto } from './modules/settings/settings.dto';

export const VERSION = '1.0.10';

export const NODE_ENV = process.env['NODE_ENV'] || 'production';
export const DOMAIN = process.env['DOMAIN'] || process.env['VITE_DOMAIN'];

export const COPYRIGHT = process?.env?.['COPYRIGHT'] ? JSON.parse(process?.env?.['COPYRIGHT']) : {};

//auth
export const CLIENT_ID = process.env['CLIENT_ID'] || process.env['VITE_CLIENT_ID'];
export const CLIENT_SECRET = process.env['CLIENT_SECRET'];

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

//mail
export const EMAIL_PROVIDER = findDtoEnv<EmailEnvDto>('EMAIL_PROVIDER', EmailEnvDto);
export const EMAIL_PROVIDER_2 = findDtoEnv<EmailEnvDto>('EMAIL_PROVIDER_2', EmailEnvDto);

//admin
export const ADMIN_LOGIN = process.env['ADMIN_LOGIN'] || 'root';
export const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] || 'changethis';

//metrica
export const GOOGLE_METRICA_ID = process?.env?.['GOOGLE_METRICA_ID'];

/**
 * Custom styles used in the dashboard.
 */
export const CUSTOM_STYLES = findDtoEnv(
  process.env['CUSTOM_STYLES'] || process.env['VITE_CUSTOM_STYLES'],
);

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

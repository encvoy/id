import { resolveRuntimeDomain } from '../runtime-domain';

const SENSITIVE_RESPONSE_KEYS = new Set([
  'hashed_password',
  'hashed_email',
  'hashed_email_md5',
  'bearer_token',
  'secret_reference',
]);

const PUBLIC_IMAGES_PATH = 'public/images/';

export const normalizePublicImageUrl = (value: string): string => {
  const normalizedValue = value.trim();
  const isUrlOrPath =
    normalizedValue.startsWith('http://') ||
    normalizedValue.startsWith('https://') ||
    normalizedValue.startsWith('/') ||
    normalizedValue.startsWith(PUBLIC_IMAGES_PATH);
  const publicImagesIndex = normalizedValue.indexOf(PUBLIC_IMAGES_PATH);

  if (!isUrlOrPath || publicImagesIndex === -1) {
    return value;
  }

  const publicDomain = resolveRuntimeDomain(process.env).replace(/\/+$/, '');
  if (!publicDomain) {
    return value;
  }

  return `${publicDomain}/${normalizedValue.slice(publicImagesIndex)}`;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (value instanceof Date || Buffer.isBuffer(value)) {
    return false;
  }

  return typeof (value as { pipe?: unknown }).pipe !== 'function';
};

export function sanitizeResponseBody<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (typeof value === 'string') {
    return normalizePublicImageUrl(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResponseBody(item, seen)) as T;
  }

  if (!isObjectLike(value)) {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value) as T;
  }

  const sanitized: Record<string, unknown> = {};
  seen.set(value, sanitized);

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_RESPONSE_KEYS.has(key)) {
      continue;
    }

    sanitized[key] = sanitizeResponseBody(nestedValue, seen);
  }

  return sanitized as T;
}

import { ELocales } from 'src/enums';

export type TLocalizedTextDto = Record<string, string>;

export type TLocalizedTextValidationOptions = {
  allowedLocales: readonly string[];
  requireAtLeastOne?: boolean;
  maxPerLang?: number;
};

export const normalizeLocalizedTextInput = (
  value: unknown,
  fallbackLocale: string = ELocales.ru,
) => {
  if (typeof value === 'string') {
    return {
      [fallbackLocale]: value,
    };
  }

  return value;
};

export const isStringRecord = (value: unknown): value is TLocalizedTextDto => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return Object.values(value as Record<string, unknown>).every(
    (localizedValue) => typeof localizedValue === 'string',
  );
};

export const isLocalizedTextValue = (
  value: unknown,
  options: TLocalizedTextValidationOptions,
): value is TLocalizedTextDto => {
  const { allowedLocales, requireAtLeastOne = false, maxPerLang } = options;

  if (!isStringRecord(value)) return false;

  const entries = Object.entries(value);
  if (!entries.every(([locale]) => allowedLocales.includes(locale))) {
    return false;
  }

  if (requireAtLeastOne && !entries.some(([, localizedValue]) => localizedValue.trim().length > 0)) {
    return false;
  }

  if (typeof maxPerLang === 'number' && !entries.every(([, localizedValue]) => localizedValue.length <= maxPerLang)) {
    return false;
  }

  return true;
};

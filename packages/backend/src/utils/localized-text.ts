import { ELocales } from 'src/enums';
import { prisma } from 'src/modules/prisma/prisma.client';
import type { I18nService } from 'nestjs-i18n';

export type TLocalizedTextValue = Partial<Record<ELocales, string>> | Record<string, string>;

export const createLocalizedTextFallback = (
  value: string,
  defaultLocale: string = ELocales.ru,
): TLocalizedTextValue => ({
  [defaultLocale]: value,
});

export const getDefaultLocale = async () => {
  const i18nSettings = await prisma.settings.findFirst({
    where: { name: 'i18n' },
    select: { value: true },
  });

  if (
    i18nSettings?.value &&
    typeof i18nSettings.value === 'object' &&
    !Array.isArray(i18nSettings.value) &&
    'default_language' in i18nSettings.value &&
    typeof i18nSettings.value.default_language === 'string'
  ) {
    return i18nSettings.value.default_language;
  }

  return ELocales.ru;
};

export const isTranslationKey = (value: string) => value.startsWith('translation.');

export const toLocalizedTextValue = async (
  value: unknown,
  i18nService: I18nService,
): Promise<TLocalizedTextValue> => {
  const defaultLocale = await getDefaultLocale();

  if (typeof value === 'string') {
    if (!value.trim()) {
      return {};
    }

    if (isTranslationKey(value)) {
      return Object.values(ELocales).reduce<TLocalizedTextValue>((acc, locale) => {
        const translated = i18nService.translate(value, { lang: locale });

        if (typeof translated === 'string' && translated.trim()) {
          acc[locale] = translated;
        }

        return acc;
      }, {});
    }

    return createLocalizedTextFallback(value, defaultLocale);
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as TLocalizedTextValue;
};

export const resolveLocalizedText = (
  value: unknown,
  locale: string = ELocales.ru,
  defaultLocale: string = ELocales.ru,
) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  const localizedText = value as Record<string, string>;
  const exactValue = localizedText[locale];
  if (typeof exactValue === 'string' && exactValue.trim()) {
    return exactValue;
  }

  const shortLocale = locale.split('-')[0];
  const matchedValue = Object.entries(localizedText).find(
    ([key, localizedValue]) =>
      typeof localizedValue === 'string' &&
      localizedValue.trim().length &&
      (key === shortLocale || key.startsWith(`${shortLocale}-`)),
  )?.[1];
  if (matchedValue) {
    return matchedValue;
  }

  const defaultValue = localizedText[defaultLocale];
  if (typeof defaultValue === 'string' && defaultValue.trim()) {
    return defaultValue;
  }

  return (
    Object.values(localizedText).find(
      (localizedValue) => typeof localizedValue === 'string' && localizedValue.trim().length,
    ) || ''
  );
};

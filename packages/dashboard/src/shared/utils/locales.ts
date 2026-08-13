import * as yup from "yup";

export const SYSTEM_LANGUAGE_OPTIONS = [
  {
    value: "ru-RU",
    shortLabel: "ru",
    labelKey: "pages.settings.locale.russian",
  },
  {
    value: "en-US",
    shortLabel: "en",
    labelKey: "pages.settings.locale.english",
  },
  {
    value: "es-ES",
    shortLabel: "es",
    labelKey: "pages.settings.locale.spanish",
  },
  {
    value: "fr-FR",
    shortLabel: "fr",
    labelKey: "pages.settings.locale.french",
  },
  {
    value: "de-DE",
    shortLabel: "de",
    labelKey: "pages.settings.locale.german",
  },
  {
    value: "it-IT",
    shortLabel: "it",
    labelKey: "pages.settings.locale.italian",
  },
] as const;

export type TSystemLanguage = typeof SYSTEM_LANGUAGE_OPTIONS[number]["value"];

export type TLocalizedText = Record<string, string>;

export const DEFAULT_SYSTEM_LANGUAGE: TSystemLanguage = "ru-RU";
export const I18NEXT_LANGUAGE_STORAGE_KEY = "i18nextLng";
export const SYSTEM_LANGUAGE_CODES = SYSTEM_LANGUAGE_OPTIONS.map(
  (language) => language.value
) as readonly TSystemLanguage[];

const SYSTEM_LANGUAGE_ALIAS_MAP: Record<string, TSystemLanguage> = {
  ru: "ru-RU",
  "ru-ru": "ru-RU",
  en: "en-US",
  "en-us": "en-US",
  es: "es-ES",
  "es-es": "es-ES",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  de: "de-DE",
  "de-de": "de-DE",
  it: "it-IT",
  "it-it": "it-IT",
};

const locales = ["en-US", "ru-RU", "es-ES", "fr-FR", "de-DE", "it-IT"] as const;

type Locale = typeof locales[number];

const htmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const decodeHtmlEntities = (value: string): string => {
  let decoded = value;

  for (let i = 0; i < 3; i++) {
    const previous = decoded;

    decoded = decoded
      .replace(
        /&amp;|&lt;|&gt;|&quot;|&#39;/g,
        (entity) => htmlEntityMap[entity] || entity
      )
      .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) =>
        String.fromCodePoint(Number.parseInt(hex, 16))
      )
      .replace(/&#(\d+);/g, (_match, decimal) =>
        String.fromCodePoint(Number.parseInt(decimal, 10))
      );

    if (decoded === previous) {
      break;
    }
  }

  return decoded;
};

export const createLocalizedValue = (
  key: Locale,
  value: string,
  defaultValue: string
): Record<Locale, string> => {
  return locales.reduce((acc, locale) => {
    acc[locale] = locale === key ? value : defaultValue;
    return acc;
  }, {} as Record<Locale, string>);
};

export const normalizeSystemLanguage = (
  locale?: string | null
): TSystemLanguage => {
  if (!locale) {
    return DEFAULT_SYSTEM_LANGUAGE;
  }

  const trimmedLocale = locale.trim();
  if (!trimmedLocale) {
    return DEFAULT_SYSTEM_LANGUAGE;
  }

  if (SYSTEM_LANGUAGE_CODES.includes(trimmedLocale as TSystemLanguage)) {
    return trimmedLocale as TSystemLanguage;
  }

  const normalizedLocale = trimmedLocale.toLowerCase();
  if (SYSTEM_LANGUAGE_ALIAS_MAP[normalizedLocale]) {
    return SYSTEM_LANGUAGE_ALIAS_MAP[normalizedLocale];
  }

  const shortLocale = normalizedLocale.split("-")[0];
  if (SYSTEM_LANGUAGE_ALIAS_MAP[shortLocale]) {
    return SYSTEM_LANGUAGE_ALIAS_MAP[shortLocale];
  }

  return DEFAULT_SYSTEM_LANGUAGE;
};

export const syncStoredSystemLanguage = (locale?: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      I18NEXT_LANGUAGE_STORAGE_KEY,
      normalizeSystemLanguage(locale)
    );
  } catch (error) {
    console.warn("syncStoredSystemLanguage:", error);
  }
};

export const getSystemLanguageOptions = (
  translate: (key: string) => string
) => {
  return SYSTEM_LANGUAGE_OPTIONS.map((language) => ({
    ...language,
    label: translate(language.labelKey),
  }));
};

export const createLocalizedText = (languages: readonly string[]) => {
  return languages.reduce<TLocalizedText>((acc, locale) => {
    acc[locale] = "";
    return acc;
  }, {});
};

const isLocalizedTextRecord = (
  value: unknown
): value is Record<string, unknown> => {
  return !!value && typeof value === "object" && !Array.isArray(value);
};

export const parseLocalizedText = (value: unknown): TLocalizedText | null => {
  if (typeof value === "string") {
    try {
      return parseLocalizedText(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (!isLocalizedTextRecord(value)) return null;

  const entries = Object.entries(value).filter(
    ([, localizedValue]) => typeof localizedValue === "string"
  );

  if (!entries.length) return null;

  return entries.reduce<TLocalizedText>((acc, [locale, localizedValue]) => {
    acc[locale] = decodeHtmlEntities(localizedValue as string);
    return acc;
  }, {});
};

export const getLocalizedTextMap = (
  value: unknown,
  fallbackLocale: string = DEFAULT_SYSTEM_LANGUAGE
): TLocalizedText => {
  const parsedValue = parseLocalizedText(value);

  if (parsedValue) return parsedValue;

  if (typeof value === "string" && value.trim().length) {
    return {
      [fallbackLocale]: decodeHtmlEntities(value),
    };
  }

  return {};
};

export const getLocalizedTextValues = (value: unknown): string[] => {
  const parsedValue = parseLocalizedText(value);

  if (parsedValue) return Object.values(parsedValue).map(decodeHtmlEntities);

  if (typeof value === "string") return [decodeHtmlEntities(value)];

  return [];
};

export const getLocalizedTextValue = (
  value: unknown,
  locale: string = DEFAULT_SYSTEM_LANGUAGE
): string => {
  const parsedValue = parseLocalizedText(value);

  if (!parsedValue)
    return typeof value === "string" ? decodeHtmlEntities(value) : "";

  const localeValue = parsedValue[locale];
  if (localeValue) return decodeHtmlEntities(localeValue);

  const shortLocale = locale.split("-")[0];
  const matchedValue = Object.entries(parsedValue).find(
    ([key, localizedValue]) =>
      localizedValue &&
      (key === shortLocale || key.startsWith(`${shortLocale}-`))
  )?.[1];
  if (matchedValue) return decodeHtmlEntities(matchedValue);

  const defaultLocaleValue = parsedValue[DEFAULT_SYSTEM_LANGUAGE];
  if (defaultLocaleValue) return decodeHtmlEntities(defaultLocaleValue);

  const firstNonEmptyValue = Object.values(parsedValue).find(
    (localizedValue) => localizedValue.trim().length
  );

  return decodeHtmlEntities(
    firstNonEmptyValue || Object.values(parsedValue)[0] || ""
  );
};

export const stringifyLocalizedText = (value: TLocalizedText) =>
  JSON.stringify(value);

interface IBuildLocalizedTextSchemaOptions {
  translate: (key: string, options?: any) => string;
  required?: boolean;
  maxLength?: number;
  fallbackLocale?: string;
}

export const buildLocalizedTextSchema = ({
  translate,
  required = true,
  maxLength,
  fallbackLocale = DEFAULT_SYSTEM_LANGUAGE,
}: IBuildLocalizedTextSchemaOptions) => {
  let schema = yup
    .mixed<TLocalizedText>()
    .transform((value) => getLocalizedTextMap(value, fallbackLocale));

  if (required) {
    schema = schema
      .test(
        "localized-text-required",
        translate("errors.requiredField"),
        (value) =>
          getLocalizedTextValues(value).some(
            (localizedValue) => localizedValue.trim().length > 0
          )
      )
      .required(translate("errors.requiredField"));
  }

  if (typeof maxLength === "number") {
    schema = schema.test(
      "localized-text-max-length",
      translate("errors.valueMaxLength", { maxLength }),
      (value) =>
        getLocalizedTextValues(value).every(
          (localizedValue) => localizedValue.length <= maxLength
        )
    );
  }

  return schema;
};

import { buildPublicUrl, INTERACTION_ID } from './constant';
import {
  IFieldEnv,
  TLocalizedTextCompatible,
  isMTLSProvider,
  isTrustedKerberosProvider,
  TProviders,
} from '@/types/types';
import { UseFormSetError } from 'react-hook-form';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const getImageURL = (path?: string): string | undefined => {
  if (!path || typeof path !== 'string') return undefined;
  const publicImagesIndex = path.indexOf('public/images/');
  if (publicImagesIndex >= 0) {
    return buildPublicUrl(path.slice(publicImagesIndex));
  }
  return path.startsWith('http://') || path.startsWith('https://')
    ? path
    : buildPublicUrl(path);
};

export const getTimezoneOffsetInHours = () => new Date().getTimezoneOffset() / 60;

const localeMap: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

export const normalizeWidgetLocale = (locale?: string): string => {
  if (!locale) {
    return 'en-US';
  }

  return localeMap[locale] || locale;
};

export const getLocalizedTextValue = (
  value: TLocalizedTextCompatible | null | undefined,
  locale: string,
) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  const exactValue = value[locale];
  if (typeof exactValue === 'string' && exactValue.trim()) {
    return exactValue;
  }

  const normalizedLocale = normalizeWidgetLocale(locale);
  const normalizedExactValue = value[normalizedLocale];
  if (typeof normalizedExactValue === 'string' && normalizedExactValue.trim()) {
    return normalizedExactValue;
  }

  const shortLocale = normalizedLocale.split('-')[0];
  const matchedValue = Object.entries(value).find(
    ([key, localizedValue]) =>
      typeof localizedValue === 'string' &&
      localizedValue.trim().length &&
      (key === shortLocale || key.startsWith(`${shortLocale}-`)),
  )?.[1];
  if (matchedValue) {
    return matchedValue;
  }

  return (
    Object.values(value).find(
      (localizedValue) => typeof localizedValue === 'string' && localizedValue.trim().length,
    ) || ''
  );
};

export const formatWidgetTitle = (
  template: TLocalizedTextCompatible | null | undefined,
  projectName: TLocalizedTextCompatible | null | undefined,
  locale: string,
) => {
  const localizedTemplate = getLocalizedTextValue(template, locale);
  const localizedProjectName = getLocalizedTextValue(projectName, locale);

  if (!localizedTemplate) {
    return localizedProjectName;
  }

  return localizedTemplate
    .replace('WIDGET_APP_NAME', localizedProjectName)
    .replace('APP_NAME', localizedProjectName);
};

export const isNotValidValue = (
  value: string,
  fieldName: string,
  setError: UseFormSetError<any>,
  field?: IFieldEnv,
  locale: string = 'en-US',
) => {
  for (const validation of field?.validations || []) {
    if (!validation.regex) continue;
    let regex: RegExp;
    try {
      regex = new RegExp(validation.regex);
      if (!regex.test(value)) {
        setError(fieldName, { message: getLocalizedTextValue(validation.error, locale) });
        return true;
      }
    } catch (error) {
      console.error('validationRegex:', validation.regex);
    }
  }

  return false;
};

export const navigateToHash = (hash: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.hash = hash;
};

export const redirectToProvider = (
  provider: TProviders[number],
  _router?: AppRouterInstance,
) => {
  if (isMTLSProvider(provider)) {
    window.location.assign(
      `${provider.params?.issuer}/api/mtls/auth?uid=${INTERACTION_ID}&provider_id=${provider.id.toString()}`,
    );
    return;
  }

  if (isTrustedKerberosProvider(provider) && provider.params?.use_kerberos) {
    window.location.assign(
      buildPublicUrl(
        `/api/interaction/${INTERACTION_ID}/negotiate?provider_id=${provider.id.toString()}`,
      ),
    );
    return;
  }

  navigateToHash(`#${provider.type.toLocaleLowerCase()}/${provider.id}`);
};

export const isValidEmail = (value: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return regex.test(value);
};

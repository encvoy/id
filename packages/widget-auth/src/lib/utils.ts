import { DOMAIN, INTERACTION_ID } from './constant';
import { EProviderTypes, IFieldEnv, IMTLSParams, TProviders } from '@/types/types';
import { UseFormSetError } from 'react-hook-form';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const getImageURL = (path?: string): string | undefined => {
  if (!path || typeof path !== 'string') return undefined;
  return path.startsWith('http://') || path.startsWith('https://') ? path : `${DOMAIN}/${path}`;
};

export const getTimezoneOffsetInHours = () => new Date().getTimezoneOffset() / 60;

export const isNotValidValue = (
  value: string,
  fieldName: string,
  setError: UseFormSetError<any>,
  field?: IFieldEnv,
) => {
  for (const validation of field?.validations || []) {
    if (!validation.regex) continue;
    let regex: RegExp;
    try {
      regex = new RegExp(validation.regex);
      if (!regex.test(value)) {
        setError(fieldName, { message: validation.error });
        return true;
      }
    } catch (error) {
      console.error('validationRegex:', validation.regex);
    }
  }

  return false;
};

export const redirectToProvider = (provider: TProviders[number], router: AppRouterInstance) => {
  if (provider.type === EProviderTypes.MTLS) {
    const params = provider?.params as IMTLSParams;
    window.location.href = `${params?.issuer}/api/mtls/auth?uid=${INTERACTION_ID}&provider_id=${provider.id.toString()}`;
    return;
  }
  router.replace(`#${provider.type.toLocaleLowerCase()}/${provider.id}`);
};

export const isValidEmail = (value: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return regex.test(value);
};

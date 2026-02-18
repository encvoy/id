import { IFieldEnv, IWidgetEnv, TProviders } from '@/types/types';

const rawData: any = typeof window !== 'undefined' ? (window as any).__WIDGET_DATA__ : null;
export const INITIAL_ROUTE: string = rawData?.initialRoute || '';
export const LOGIN: string = rawData?.login || '';
export const DETAILS: { missingOIDCScope?: string } = rawData?.details || {};
export let LOGGED_USERS_PARSED: any[] = [];
if (typeof rawData?.loggedUsers === 'string' && rawData?.loggedUsers) {
  try {
    LOGGED_USERS_PARSED = JSON.parse(rawData.loggedUsers);
  } catch (e) {
    console.warn('Failed to parse loggedUsers:', e);
    LOGGED_USERS_PARSED = [];
  }
} else if (Array.isArray(rawData?.loggedUsers)) {
  LOGGED_USERS_PARSED = rawData.loggedUsers;
}

const envVars = rawData?.envVars ?? {};
export const FIELD: IFieldEnv = envVars.FIELD;
export const WIDGET: IWidgetEnv = envVars.WIDGET;
export const MESSAGE: string = envVars.MESSAGE || '';
export const MESSAGE_DETAIL: string = envVars.MESSAGE_DETAIL || '';
export const TIME_TO_RESEND: number = Number(envVars.TIME_TO_RESEND) || 30;
export const CLIENT_ID: string = envVars.CLIENT_ID ?? '';
export const PROJECT_NAME: string = envVars.PROJECT_NAME ?? 'Trusted ID';
export const DOMAIN: string = envVars.DOMAIN ?? '';
export const PROVIDERS: TProviders = envVars?.['PROVIDERS'] || [];
export const PRIVATE_REQUIRED_FIELDS = envVars?.['PRIVATE_REQUIRED_FIELDS'] || [];
export const DATA_PROCESSING_POLICY_URL = envVars.SETTINGS?.DATA_PROCESSING_POLICY_URL || '';
export const ALLOWED_LOGIN_FIELDS = envVars.SETTINGS?.ALLOWED_LOGIN_FIELDS || '';
export const COPYRIGHT = envVars.COPYRIGHT;

export const INTERACTION_ID =
  rawData?.interactionId ||
  (typeof window !== 'undefined'
    ? window.location.pathname.split('/interaction/')[1]?.split('/')[0]
    : '');

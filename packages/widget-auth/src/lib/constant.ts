import {
  IFieldEnv,
  IWidgetEnv,
  IWidgetNotification,
  TLocalizedTextCompatible,
  TProviders,
} from '@/types/types';

const rawData: any = typeof window !== 'undefined' ? (window as any).__WIDGET_DATA__ : null;
export const INITIAL_ROUTE: string = rawData?.initialRoute || '';
export const AUTH_STAGE: string = rawData?.authStage || '';
export const LOGIN: string = rawData?.login || '';
export const DETAILS: {
  missingBaseOIDCScope?: string;
  missingCustomOIDCScope?: Array<{
    name: string;
    icon?: string | null;
    title?: string | Record<string, string> | null;
    description?: string | Record<string, string> | null;
  }>;
} = rawData?.details || {};
export const NOTIFICATIONS: IWidgetNotification[] = Array.isArray(rawData?.notifications)
  ? rawData.notifications
  : [];
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

export const setLoggedUsersParsed = (loggedUsers: any[]) => {
  LOGGED_USERS_PARSED = loggedUsers;

  if (typeof window !== 'undefined' && window.__WIDGET_DATA__) {
    window.__WIDGET_DATA__.loggedUsers = loggedUsers.length ? JSON.stringify(loggedUsers) : undefined;
  }
};

const envVars = rawData?.envVars ?? {};
export const FIELD: IFieldEnv = envVars.FIELD;
export const FORM_ERRORS: Record<string, string> = envVars.FORM_ERRORS || {};
export const consumeFormError = (fieldName: string): string | undefined => {
  const message = FORM_ERRORS[fieldName];
  delete FORM_ERRORS[fieldName];

  if (typeof window !== 'undefined' && window.__WIDGET_DATA__?.envVars?.FORM_ERRORS) {
    delete window.__WIDGET_DATA__.envVars.FORM_ERRORS[fieldName];
  }

  return message;
};
export const WIDGET: IWidgetEnv = envVars.WIDGET;
export const MESSAGE: TLocalizedTextCompatible = envVars.MESSAGE || '';
export const MESSAGE_DETAIL: string = envVars.MESSAGE_DETAIL || '';
let currentMessageDetail: string = envVars.MESSAGE_DETAIL || '';
export const getMessageDetail = (): string => currentMessageDetail;
export const clearMessageDetail = (): void => {
  currentMessageDetail = '';
  if (typeof window !== 'undefined' && (window as any).__WIDGET_DATA__?.envVars) {
    (window as any).__WIDGET_DATA__.envVars.MESSAGE_DETAIL = '';
  }
};
export const USERNAME: string = envVars.USERNAME || '';
export const TIME_TO_RESEND: number = Number(envVars.TIME_TO_RESEND) || 30;
export const CLIENT_ID: string = envVars.CLIENT_ID ?? '';
export const USER_ID: string = envVars.USER_ID ?? '';
export const PROJECT_NAME: TLocalizedTextCompatible = envVars.PROJECT_NAME ?? 'Trusted ID';
export const DOMAIN: string = envVars.DOMAIN ?? '';
export const PROVIDERS: TProviders = envVars?.['PROVIDERS'] || [];
export const PRIVATE_REQUIRED_FIELDS: TLocalizedTextCompatible[] =
  envVars?.['PRIVATE_REQUIRED_FIELDS'] || [];
export const DATA_PROCESSING_POLICY_URL = envVars.SETTINGS?.DATA_PROCESSING_POLICY_URL || '';
export const ALLOWED_LOGIN_FIELDS = envVars.SETTINGS?.ALLOWED_LOGIN_FIELDS || '';
export const COPYRIGHT: Record<string, string> = envVars.COPYRIGHT || {};

export const INTERACTION_ID =
  rawData?.interactionId ||
  (typeof window !== 'undefined'
    ? window.location.pathname.split('/interaction/')[1]?.split('/')[0]
    : '');

export const buildPublicUrl = (path: string): string =>
  `${DOMAIN.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

export const INTERACTION_URL = buildPublicUrl(`/api/interaction/${INTERACTION_ID}`);

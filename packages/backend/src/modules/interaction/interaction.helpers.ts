import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { Client } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import Cookies from 'cookies';
import { Request, Response } from 'express';
import fs from 'fs';
import { I18nService } from 'nestjs-i18n';
import path from 'path';
import { ECoverModes, Ei18nCodes, ELocales, RegistrationPolicyVariants } from 'src/enums';
import { v4 as uuidv4 } from 'uuid';
import * as constants from '../../constants';
import { getObjectKeys, isEmpty } from '../../helpers';
import { TPrompt } from '../oidc/oidc.types';
import { prisma } from '../prisma/prisma.client';
import { RedisAdapter } from '../redis/redis.adapter';
import { UserModel } from '../repository';
import { ESettingsNames } from '../settings/settings.dto';
import { TLocalizedTextValue } from 'src/utils/localized-text';
import { sanitizeResponseBody } from 'src/utils/response-sanitizer';

export type TWidgetLocalizedText = string | TLocalizedTextValue;

export interface IValidation {
  created_at: Date;
  id: string;
  updated_at: Date;
  active: boolean;
  error: TWidgetLocalizedText;
  title: TWidgetLocalizedText;
  regex: string;
}

interface MissingRequiredField {
  field_name: string;
  title?: TWidgetLocalizedText;
  default?: string;
  validations?: IValidation[];
}

export interface IWidget {
  res: Response;
  initialRoute: string;
  authStage?: 'second-factor-challenge' | 'second-factor-enrollment';
  client: Client;
  details?: TPrompt['details'];
  uid?: string;
  user?: Pick<UserModel, 'id' | 'email_verified' | 'login' | 'given_name' | 'nickname'>;
  login?: string;
  username?: string;
  externalAccountInfo?: any;
  loggedUsers?: string;
  publicProfileClaims?: string;
  missingProviderIds?: string[];
  missingRequiredFields?: MissingRequiredField[];
  privateRequiredFields?: TWidgetLocalizedText[];
  field?: {
    type: string;
    title: TWidgetLocalizedText;
    unique?: boolean;
    field_name: string;
    default_value: string | undefined;
    validations: IValidation[];
  };
  providers?: {
    avatar: string;
    description: string;
    id: string;
    name: JsonValue;
    type: string;
    is_public: boolean;
  }[];
  message?: TWidgetLocalizedText;
  messageDetail?: string;
  formErrors?: Record<string, string>;
  notifications?: {
    id: string;
    title: TWidgetLocalizedText;
    content: TWidgetLocalizedText;
    type: 'system' | 'organization' | 'client';
  }[];
}

const resolveDefaultLanguage = (i18nSettings: unknown) => {
  if (i18nSettings && typeof i18nSettings === 'object' && !Array.isArray(i18nSettings)) {
    const defaultLanguage = (i18nSettings as Record<string, unknown>).default_language;
    if (typeof defaultLanguage === 'string') {
      return defaultLanguage;
    }
  }

  return ELocales.ru;
};

const getWidgetFaviconUrl = (favicon?: string | null) => {
  if (!favicon) {
    return undefined;
  }

  if (favicon.startsWith('http://') || favicon.startsWith('https://')) {
    return favicon;
  }

  return `${constants.DOMAIN.replace(/\/$/, '')}/${favicon.replace(/^\//, '')}`;
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const injectWidgetFavicon = (html: string, favicon?: string | null) => {
  const faviconUrl = getWidgetFaviconUrl(favicon);
  if (!faviconUrl) {
    return html;
  }

  const faviconTag = `<link id="widget-favicon" rel="icon" href="${escapeHtmlAttribute(
    faviconUrl,
  )}"/>`;
  return html.replace('</head>', `${faviconTag}</head>`);
};

export const renderWidget = async ({
  res,
  initialRoute,
  authStage,
  client,
  details,
  uid,
  user,
  login,
  username,
  externalAccountInfo,
  loggedUsers,
  publicProfileClaims,
  missingProviderIds,
  missingRequiredFields,
  privateRequiredFields,
  providers,
  message,
  messageDetail,
  formErrors,
  field,
  notifications,
}: IWidget) => {
  const settings = await prisma.settings.findMany();
  const settingsObject: { [key: string]: string | number | boolean | object } = settings.reduce(
    (acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    },
    {},
  );
  const registration_policy = settingsObject.registration_policy;
  const prohibit_identifier_binding = settingsObject.prohibit_identifier_binding;
  const allowed_login_fields = settingsObject.allowed_login_fields;
  const i18n = settingsObject[ESettingsNames.i18n];
  const defaultLanguage = resolveDefaultLanguage(i18n);
  const copyright = settingsObject[ESettingsNames.copyright] || {};

  // Read Next.js generated HTML and inject variables
  // Use process.cwd() to get the backend root directory
  const htmlPath = path.join(process.cwd(), 'views', 'widget', 'index.html');
  let html = '';
  try {
    html = fs.readFileSync(htmlPath, 'utf-8');
  } catch (error) {
    console.warn('Widget HTML not found');
    return;
  }

  if (client.parent_id) {
    const parentClient = await prisma.client.findUnique({
      where: { client_id: client.parent_id },
      select: { cover_mode: true, cover: true },
    });

    switch (parentClient?.cover_mode) {
      case ECoverModes.INHERIT:
        if (!client.cover) {
          client.cover = parentClient.cover;
        }
        break;
      case ECoverModes.REPLACE:
        client.cover = parentClient.cover;
        break;

      default:
        break;
    }
  }

  const envVarsNew = {
    WIDGET: {
      TITLE: client.widget_title,
      INFO: client.widget_info,
      INFO_OUT: client.widget_info_out,
      HIDE_BIND_ACCOUNT: prohibit_identifier_binding,
      HIDE_CREATE_ACCOUNT:
        client.hide_widget_create_account ||
        registration_policy !== RegistrationPolicyVariants.allowed,
      LOGO: client.show_avatar_in_widget ? client.avatar : undefined,
      FAVICON: client.avatar ?? undefined,
      COLORS: isEmpty(client.widget_colors) ? undefined : client.widget_colors,
      HIDE_FOOTER: client.hide_widget_footer,
      HIDE_HEADER: client.hide_widget_header,
      HIDE_AVATARS_OF_BIG_PROVIDERS: client.hide_avatars_of_big_providers,
      COVER: client.cover,
      LANG: defaultLanguage,
    },

    FIELD: field,
    PROVIDERS: providers,

    SETTINGS: {
      REGISTRATION_POLICY: registration_policy,
      DATA_PROCESSING_POLICY_URL: settingsObject.data_processing_agreement,
      ALLOWED_LOGIN_FIELDS: allowed_login_fields,
    },

    MESSAGE: message || '',
    MESSAGE_DETAIL: messageDetail || '',
    FORM_ERRORS: formErrors || {},

    TIME_TO_RESEND: constants.TIME_TO_RESEND,
    CLIENT_ID: client.client_id,
    REDIRECT_URI: client.redirect_uris,
    POST_LOGOUT_REDIRECT_URIS: client.post_logout_redirect_uris,
    GOOGLE_METRICA_ID: constants.GOOGLE_METRICA_ID,
    PROJECT_NAME: client.name ?? '',
    APP_NAME: client.name ?? '',
    USER_ID: user?.id,
    USERNAME: username || login || user?.given_name || user?.nickname || '',
    COPYRIGHT: copyright,
    DOMAIN: constants.DOMAIN,
    MISSING_PROVIDER_IDS: missingProviderIds,
    MISSING_REQUIRED_FIELDS: missingRequiredFields,
    PRIVATE_REQUIRED_FIELDS: privateRequiredFields,
  };

  // Inject script with backend data at the very start of <body> before React hydration
  const scriptTag = `<script id="__WIDGET_DATA__">window.__WIDGET_DATA__=${JSON.stringify({
    envVars: sanitizeResponseBody(envVarsNew),
    initialRoute: initialRoute,
    authStage,
    interactionId: uid || '',
    externalAccountInfo: externalAccountInfo ?? null,
    publicProfileClaims: publicProfileClaims || '',
    loggedUsers: loggedUsers || '',
    login: login || '',
    details: details || {},
    notifications: notifications || [],
    version: constants.VERSION,
  })}</script>`;

  html = html.replace('<body>', `<body>${scriptTag}`);
  html = injectWidgetFavicon(html, client.avatar);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
};

export const showSuccessWidget = async (
  res: Response,
  successMessage?: string,
  uid?: string,
  client?: Client,
  i18nService?: Pick<I18nService<Record<string, string>>, 'translate'>,
) => {
  const settings = await prisma.settings.findMany();
  const settingsObject: { [key: string]: string | number | boolean | object } = settings.reduce(
    (acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    },
    {},
  );
  const registration_policy = settingsObject.registration_policy;
  const prohibit_identifier_binding = settingsObject.prohibit_identifier_binding;
  const i18n = settingsObject[ESettingsNames.i18n];
  const copyright = settingsObject[ESettingsNames.copyright] || {};
  const defaultLanguage = resolveDefaultLanguage(i18n);

  const avatar = (() => {
    if (client?.show_avatar_in_widget) {
      return client.avatar;
    }
  })();

  const htmlPath = path.join(process.cwd(), 'views', 'widget', 'index.html');
  let html = '';
  try {
    html = fs.readFileSync(htmlPath, 'utf-8');
  } catch (error) {
    console.warn('Widget HTML not found');
    return;
  }

  if (client?.parent_id) {
    const parentClient = await prisma.client.findUnique({
      where: { client_id: client.parent_id },
      select: { cover_mode: true, cover: true },
    });

    switch (parentClient?.cover_mode) {
      case ECoverModes.INHERIT:
        if (!client.cover) {
          client.cover = parentClient.cover;
        }
        break;
      case ECoverModes.REPLACE:
        client.cover = parentClient.cover;
        break;

      default:
        break;
    }
  }

  let msg = successMessage || '';
  if (msg && i18nService) {
    msg = i18nService.translate(successMessage, {
      lang: defaultLanguage,
    });
  }

  const envVarsNew = JSON.stringify({
    WIDGET: {
      TITLE: client?.widget_title,
      INFO: client?.widget_info,
      INFO_OUT: client?.widget_info_out,
      HIDE_BIND_ACCOUNT: prohibit_identifier_binding,
      HIDE_CREATE_ACCOUNT:
        client?.hide_widget_create_account ||
        registration_policy !== RegistrationPolicyVariants.allowed,
      LOGO: client?.show_avatar_in_widget ? avatar : undefined,
      FAVICON: client?.avatar ?? undefined,
      COLORS: isEmpty(client?.widget_colors) ? undefined : client?.widget_colors,
      HIDE_FOOTER: client?.hide_widget_footer,
      HIDE_HEADER: client?.hide_widget_header,
      COVER: client?.cover,
      LANG: defaultLanguage,
    },

    SETTINGS: {
      REGISTRATION_POLICY: registration_policy,
      DATA_PROCESSING_POLICY_URL: settingsObject.data_processing_agreement,
    },

    MESSAGE: msg,

    TIME_TO_RESEND: constants.TIME_TO_RESEND,
    CLIENT_ID: client?.client_id,
    REDIRECT_URI: client?.redirect_uris,
    POST_LOGOUT_REDIRECT_URIS: client?.post_logout_redirect_uris,
    GOOGLE_METRICA_ID: constants.GOOGLE_METRICA_ID,
    PROJECT_NAME: client?.name ?? '',
    APP_NAME: client?.name ?? '',
    USER_ID: undefined,
    USERNAME: undefined,
    COPYRIGHT: copyright,
    DOMAIN: constants.DOMAIN,
  });

  const scriptTag = `<script id="__WIDGET_DATA__">window.__WIDGET_DATA__=${JSON.stringify({
    envVars: sanitizeResponseBody(JSON.parse(envVarsNew)),
    initialRoute: 'success',
    interactionId: uid || '',
    externalAccountInfo: null,
    publicProfileClaims: '',
    loggedUsers: '',
    login: '',
    details: {},
    version: constants.VERSION,
  })}</script>`;

  html = html.replace('<body>', `<body>${scriptTag}`);
  html = injectWidgetFavicon(html, client?.avatar);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
};

export const showErrorWidget = async (
  res: Response,
  errorMessage: string,
  uid?: string,
  client?: Client,
  errorMessageDetail?: string,
  hideButtons?: boolean,
  i18nService?: Pick<I18nService<Record<string, string>>, 'translate'>,
) => {
  const settings = await prisma.settings.findMany();
  const settingsObject: { [key: string]: string | number | boolean | object } = settings.reduce(
    (acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    },
    {},
  );
  const registration_policy = settingsObject.registration_policy;
  const prohibit_identifier_binding = settingsObject.prohibit_identifier_binding;
  const i18n = settingsObject[ESettingsNames.i18n];
  const copyright = settingsObject[ESettingsNames.copyright] || {};
  const defaultLanguage = resolveDefaultLanguage(i18n);

  const avatar = (() => {
    if (client?.show_avatar_in_widget) {
      return client.avatar;
    }
  })();

  const htmlPath = path.join(process.cwd(), 'views', 'widget', 'index.html');
  let html = '';
  try {
    html = fs.readFileSync(htmlPath, 'utf-8');
  } catch (error) {
    console.warn('Widget HTML not found');
    return;
  }

  if (client?.parent_id) {
    const parentClient = await prisma.client.findUnique({
      where: { client_id: client.parent_id },
      select: { cover_mode: true, cover: true },
    });

    switch (parentClient?.cover_mode) {
      case ECoverModes.INHERIT:
        if (!client.cover) {
          client.cover = parentClient.cover;
        }
        break;
      case ECoverModes.REPLACE:
        client.cover = parentClient.cover;
        break;

      default:
        break;
    }
  }

  let msg = errorMessage;
  if (msg && i18nService) {
    msg = i18nService.translate(errorMessage, {
      lang: defaultLanguage,
    });
  }

  const envVarsNew = JSON.stringify({
    WIDGET: {
      TITLE: client?.widget_title,
      INFO: client?.widget_info,
      INFO_OUT: client?.widget_info_out,
      HIDE_BIND_ACCOUNT: prohibit_identifier_binding,
      HIDE_CREATE_ACCOUNT:
        client?.hide_widget_create_account ||
        registration_policy !== RegistrationPolicyVariants.allowed,
      LOGO: client?.show_avatar_in_widget ? avatar : undefined,
      FAVICON: client?.avatar ?? undefined,
      COLORS: isEmpty(client?.widget_colors) ? undefined : client?.widget_colors,
      HIDE_FOOTER: client?.hide_widget_footer,
      HIDE_HEADER: client?.hide_widget_header,
      COVER: client?.cover,
      LANG: defaultLanguage,
    },

    SETTINGS: {
      REGISTRATION_POLICY: registration_policy,
      DATA_PROCESSING_POLICY_URL: settingsObject.data_processing_agreement,
    },

    MESSAGE: msg,
    MESSAGE_DETAIL: errorMessageDetail,

    TIME_TO_RESEND: constants.TIME_TO_RESEND,
    CLIENT_ID: client?.client_id,
    REDIRECT_URI: client?.redirect_uris,
    POST_LOGOUT_REDIRECT_URIS: client?.post_logout_redirect_uris,
    GOOGLE_METRICA_ID: constants.GOOGLE_METRICA_ID,
    PROJECT_NAME: client?.name ?? '',
    APP_NAME: client?.name ?? '',
    USER_ID: undefined,
    USERNAME: undefined,
    COPYRIGHT: copyright,
    DOMAIN: constants.DOMAIN,
  });

  const scriptTag = `<script id="__WIDGET_DATA__">window.__WIDGET_DATA__=${JSON.stringify({
    envVars: sanitizeResponseBody(JSON.parse(envVarsNew)),
    initialRoute: 'error',
    interactionId: uid || '',
    externalAccountInfo: null,
    publicProfileClaims: '',
    loggedUsers: '',
    login: '',
    details: {},
    version: constants.VERSION,
  })}</script>`;

  html = html.replace('<body>', `<body>${scriptTag}`);
  html = injectWidgetFavicon(html, client?.avatar);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
};

export const saveLoggedUserSession = async (
  req: Request,
  res: Response,
  loggedUsersInfo: RedisAdapter,
  loggedUsersTokens: RedisAdapter,
  {
    id,
    nickname,
    picture,
    email,
  }: Pick<
    UserModel,
    'id' | 'email_verified' | 'login' | 'given_name' | 'nickname' | 'picture' | 'email'
  >,
) => {
  try {
    const activeSessions = req.cookies._sess;
    let alreadyLogged = false;

    if (activeSessions)
      await Promise.all(
        activeSessions?.split(' ').map(async (sessionCode: string) => {
          const { id: storedId } = (await loggedUsersInfo.get(sessionCode)) || {};
          if (id === storedId) alreadyLogged = true;
        }),
      );

    if (!alreadyLogged) {
      const sessionToken = uuidv4();
      const userInfoKey = uuidv4();

      await loggedUsersInfo.upsert(
        userInfoKey,
        { id, nickname, picture, email, sessionToken },
        constants.OIDC_SESSION_TTL,
      );

      await loggedUsersTokens.upsert(sessionToken, id, constants.OIDC_SESSION_TTL);
      res.cookie('_sess', activeSessions ? activeSessions + ' ' + userInfoKey : userInfoKey, {
        httpOnly: true,
        // secure: true,
      });
    }
  } catch (e) {
    throw new InternalServerErrorException(Ei18nCodes.T3E0078, { cause: e });
  }
};

export const updateLoggedUserSession = async (
  req: Request,
  user: Partial<UserModel>,
  loggedUsersInfo: RedisAdapter,
) => {
  const userInfoCodes = req.cookies._sess?.split(' ');

  if (userInfoCodes)
    for (const userInfoCode of userInfoCodes) {
      const currentData = await loggedUsersInfo.get(userInfoCode);

      if (currentData?.id === user.id) {
        const newData = getObjectKeys(currentData).reduce((acc, key) => {
          if (key in user && user[key] !== undefined) acc[key] = user[key];

          return acc;
        }, {});

        await loggedUsersInfo.upsert(
          userInfoCode,
          { ...currentData, ...newData },
          constants.OIDC_SESSION_TTL,
        );
        return;
      }
    }
};

export const getLoggedUsers = async (
  req: Request,
  res: Response,
  loggedUsersInfo: RedisAdapter,
) => {
  const loggedUsersSessionCookie = req.cookies._sess;
  const cookie = new Cookies(req, res);
  let loggedUsers = [];

  if (loggedUsersSessionCookie)
    loggedUsers = await Promise.all(
      (loggedUsersSessionCookie?.split(' ') || []).map(async (sessionId) => {
        if (sessionId) {
          const result = await loggedUsersInfo.get(sessionId);
          if (!result) {
            const newSessionCookie = loggedUsersSessionCookie?.replace(sessionId, '');
            cookie.set('_sess', newSessionCookie, {
              httpOnly: true,
              // secure: true,
              overwrite: true,
            });
            return undefined;
          }

          return { sessionId, ...result };
        }
      }),
    );

  loggedUsers = loggedUsers.filter((result) => result);

  return loggedUsers?.length ? loggedUsers : undefined;
};

export async function findUserAndExternalAccount(
  issuer: string,
  insensitive: boolean,
  ...sub: string[]
) {
  // Remove undefined values from the subject array.
  const filteredSub = sub.filter((s) => s !== undefined && s !== null);

  // Return an empty result when no subjects remain.
  if (filteredSub.length === 0) {
    return { user: undefined };
  }

  const externalAccount = await prisma.externalAccount.findFirst({
    where: { sub: { in: filteredSub, mode: insensitive ? 'insensitive' : undefined }, issuer },
    select: {
      user_id: true,
      id: true,
      user: true,
      avatar: true,
      label: true,
      profile_link: true,
    },
  });

  return externalAccount || { user: undefined };
}

/**
 * Sets the PKCE values ​​from the request to res.locals
 */
export function setPkceValuesFromRequest(req: Request, res: Response, provider_id: string) {
  res.locals.code_verifier =
    req.query?.code_verifier ?? req.cookies?.[`pkce_code_verifier_${provider_id}`] ?? undefined;
  res.locals.device_id =
    req.query?.device_id ?? req.cookies?.[`pkce_device_id_${provider_id}`] ?? undefined;
  res.locals.state = req.query?.state ?? req.cookies?.[`pkce_state_${provider_id}`] ?? undefined;
}

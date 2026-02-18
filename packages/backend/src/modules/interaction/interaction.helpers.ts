import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { Client, Rule, User } from '@prisma/client';
import Cookies from 'cookies';
import { Request, Response } from 'express';
import fs from 'fs';
import { I18nService } from 'nestjs-i18n';
import path from 'path';
import { ECoverModes, Ei18nCodes, RegistrationPolicyVariants } from 'src/enums';
import { app } from 'src/main';
import { v4 as uuidv4 } from 'uuid';
import * as constants from '../../constants';
import { getObjectKeys, isEmpty } from '../../helpers';
import { TPrompt } from '../oidc/oidc.types';
import { prisma } from '../prisma/prisma.client';
import { RedisAdapter } from '../redis/redis.adapter';
import { ESettingsNames } from '../settings/settings.dto';
import { SettingsService } from '../settings/settings.service';

export interface IValidation {
  created_at: Date;
  id: number;
  updated_at: Date;
  active: boolean;
  error: string;
  title: string;
  regex: string;
}

export interface IWidget {
  res: Response;
  initialRoute: string;
  client: Client;
  details?: TPrompt['details'];
  uid?: string;
  user?: Pick<User, 'id' | 'email_verified' | 'login' | 'given_name' | 'nickname'>;
  login?: string;
  externalAccountInfo?: any;
  loggedUsers?: string;
  publicProfileClaims?: string;
  missingProviderIds?: string[];
  missingRequiredFields?: Rule[];
  privateRequiredFields?: string[];
  field?: {
    type: string;
    title: string;
    field_name: string;
    default_value: string | undefined;
    validations: IValidation[];
  };
  providers?: {
    avatar: string;
    description: string;
    id: number;
    name: string;
    type: string;
    is_public: boolean;
  }[];
  message?: string;
  messageDetail?: string;
}

export const renderWidget = async ({
  res,
  initialRoute,
  client,
  details,
  uid,
  user,
  login,
  externalAccountInfo,
  loggedUsers,
  publicProfileClaims,
  missingProviderIds,
  missingRequiredFields,
  privateRequiredFields,
  providers,
  message,
  messageDetail,
  field,
}: IWidget) => {
  const settings = await prisma.settings.findMany();
  const settingsObject: { [key: string]: string | number | boolean } = settings.reduce(
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

  const avatar = (() => {
    if (client.show_avatar_in_widget) {
      return client.avatar;
    }
  })();
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
      TITLE: client.widget_title
        .replace('WIDGET_APP_NAME', client.name)
        .replace('APP_NAME', client.name),
      INFO: client.widget_info,
      INFO_OUT: client.widget_info_out,
      HIDE_BIND_ACCOUNT: prohibit_identifier_binding,
      HIDE_CREATE_ACCOUNT:
        client.hide_widget_create_account ||
        registration_policy !== RegistrationPolicyVariants.allowed,
      LOGO: client.show_avatar_in_widget ? avatar : undefined,
      COLORS: isEmpty(client.widget_colors) ? undefined : client.widget_colors,
      HIDE_FOOTER: client.hide_widget_footer,
      HIDE_HEADER: client.hide_widget_header,
      HIDE_AVATARS_OF_BIG_PROVIDERS: client.hide_avatars_of_big_providers,
      COVER: client.cover,
      LANG: i18n['default_language'] || 'en-US',
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

    TIME_TO_RESEND: constants.TIME_TO_RESEND,
    CLIENT_ID: client.client_id,
    REDIRECT_URI: client.redirect_uris,
    POST_LOGOUT_REDIRECT_URIS: client.post_logout_redirect_uris,
    GOOGLE_METRICA_ID: constants.GOOGLE_METRICA_ID,
    PROJECT_NAME: client.name,
    APP_NAME: client.name,
    USER_ID: user?.id,
    USERNAME: user?.given_name || user?.nickname,
    COPYRIGHT: constants.COPYRIGHT,
    DOMAIN: constants.DOMAIN,
    MISSING_PROVIDER_IDS: missingProviderIds,
    MISSING_REQUIRED_FIELDS: missingRequiredFields,
    PRIVATE_REQUIRED_FIELDS: privateRequiredFields,
  };

  // Inject script with backend data at the very start of <body> before React hydration
  const scriptTag = `<script id="__WIDGET_DATA__">window.__WIDGET_DATA__=${JSON.stringify({
    envVars: envVarsNew,
    initialRoute: initialRoute,
    interactionId: uid || '',
    externalAccountInfo: externalAccountInfo ?? null,
    publicProfileClaims: publicProfileClaims || '',
    loggedUsers: loggedUsers || '',
    login: login || '',
    details: details || {},
    version: constants.VERSION,
  })}</script>`;

  html = html.replace('<body>', `<body>${scriptTag}`);

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
};

export const showSuccessWidget = async (
  res: Response,
  successMessage?: string,
  uid?: string,
  client?: Client,
) => {
  const settings = await prisma.settings.findMany();
  const settingsObject: { [key: string]: string | number | boolean } = settings.reduce(
    (acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    },
    {},
  );
  const registration_policy = settingsObject.registration_policy;
  const prohibit_identifier_binding = settingsObject.prohibit_identifier_binding;

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
  if (msg) {
    const settingsService = app.get(SettingsService, { strict: false });
    const i18n = app.get(I18nService<Record<string, any>>, { strict: false });
    const locale = await settingsService.getSettingsByName<{ default_language: string }>(
      ESettingsNames.i18n,
    );
    msg = i18n.translate(successMessage, {
      lang: locale.default_language,
    });
  }

  const envVarsNew = JSON.stringify({
    WIDGET: {
      TITLE: client?.widget_title
        ?.replace('WIDGET_APP_NAME', client.name)
        ?.replace('APP_NAME', client.name),
      INFO: client?.widget_info,
      INFO_OUT: client?.widget_info_out,
      HIDE_BIND_ACCOUNT: prohibit_identifier_binding,
      HIDE_CREATE_ACCOUNT:
        client?.hide_widget_create_account ||
        registration_policy !== RegistrationPolicyVariants.allowed,
      LOGO: client?.show_avatar_in_widget ? avatar : undefined,
      COLORS: isEmpty(client?.widget_colors) ? undefined : client?.widget_colors,
      HIDE_FOOTER: client?.hide_widget_footer,
      HIDE_HEADER: client?.hide_widget_header,
      COVER: client?.cover,
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
    PROJECT_NAME: client?.name,
    APP_NAME: client?.name,
    USER_ID: undefined,
    USERNAME: undefined,
    COPYRIGHT: constants.COPYRIGHT,
    DOMAIN: constants.DOMAIN,
  });

  const scriptTag = `<script id="__WIDGET_DATA__">window.__WIDGET_DATA__=${JSON.stringify({
    envVars: JSON.parse(envVarsNew),
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
) => {
  const settings = await prisma.settings.findMany();
  const settingsObject: { [key: string]: string | number | boolean } = settings.reduce(
    (acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    },
    {},
  );
  const registration_policy = settingsObject.registration_policy;
  const prohibit_identifier_binding = settingsObject.prohibit_identifier_binding;

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
  if (msg) {
    const settingsService = app.get(SettingsService, { strict: false });
    const i18n = app.get(I18nService<Record<string, any>>, { strict: false });
    const locale = await settingsService.getSettingsByName<{ default_language: string }>(
      ESettingsNames.i18n,
    );
    msg = i18n.translate(errorMessage, {
      lang: locale.default_language,
    });
  }

  const envVarsNew = JSON.stringify({
    WIDGET: {
      TITLE: client?.widget_title
        ?.replace('WIDGET_APP_NAME', client.name)
        ?.replace('APP_NAME', client.name),
      INFO: client?.widget_info,
      INFO_OUT: client?.widget_info_out,
      HIDE_BIND_ACCOUNT: prohibit_identifier_binding,
      HIDE_CREATE_ACCOUNT:
        client?.hide_widget_create_account ||
        registration_policy !== RegistrationPolicyVariants.allowed,
      LOGO: client?.show_avatar_in_widget ? avatar : undefined,
      COLORS: isEmpty(client?.widget_colors) ? undefined : client?.widget_colors,
      HIDE_FOOTER: client?.hide_widget_footer,
      HIDE_HEADER: client?.hide_widget_header,
      COVER: client?.cover,
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
    PROJECT_NAME: client?.name,
    APP_NAME: client?.name,
    USER_ID: undefined,
    USERNAME: undefined,
    COPYRIGHT: constants.COPYRIGHT,
    DOMAIN: constants.DOMAIN,
  });

  const scriptTag = `<script id="__WIDGET_DATA__">window.__WIDGET_DATA__=${JSON.stringify({
    envVars: JSON.parse(envVarsNew),
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
    User,
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
  user: Partial<Omit<User, 'birthdate' | 'email_public'> & { email_public: string | boolean }>,
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
  const externalAccount = await prisma.externalAccount.findFirst({
    where: { sub: { in: sub, mode: insensitive ? 'insensitive' : undefined }, issuer },
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

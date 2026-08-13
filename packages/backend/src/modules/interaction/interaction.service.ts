import * as common from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Client, Provider } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import { BIND_UID_TTL, CLIENT_ID, DOMAIN, NODE_ENV } from '../../constants';
import * as enums from '../../enums';
import * as helpers from '../../helpers';
import { CustomLogger } from '../logger/logger.service';
import { OidcService } from '../oidc/oidc.service';
import { syncOrganizationGuestsMembershipForAuthorizedClient } from '../prisma/guests-group';
import { prisma } from '../prisma/prisma.client';
import { ProviderService } from '../providers';
import { MailCodeTypes } from '../providers/collection/email/email.dto';
import { IProvider, ProviderFactory } from '../providers/factory.service';
import { MarkNotificationsReadDto } from '../notifications/notifications.dto';
import { NotificationsService, TWidgetNotification } from '../notifications/notifications.service';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import { UserModel, UserRepository } from '../repository';
import {
  getLegacyUserExternalAccountEmails,
  getLegacyUserRecoveryEmail,
} from '../repository/user-search';
import {
  AuthenticationAfterAuthorizedPayload,
  AuthenticationBeforeByTypePayload,
  CallEventNames,
  CallEventsService,
} from '../call-events';
import * as settings from '../settings';
import { SettingsService } from '../settings/settings.service';
import { UsersContactsService } from '../users/users-contacts.service';
import { UsersService } from '../users/users.service';
import * as interactionDto from './interaction.dto';
import {
  getLoggedUsers,
  IValidation,
  renderWidget,
  saveLoggedUserSession,
} from './interaction.helpers';
import { ELocales, UserRoles } from '../../enums';
import {
  createLocalizedTextFallback,
  getDefaultLocale,
  TLocalizedTextValue,
  toLocalizedTextValue,
} from 'src/utils/localized-text';

type ClientRuleItem = {
  id: string;
  rule: {
    id: string;
    field_name: string;
    active: boolean;
    required: boolean;
  };
};

type ProfileRuleModel = Awaited<ReturnType<SettingsService['getAllRules']>>[number];
type ProfileFieldModel = Awaited<ReturnType<SettingsService['getProfileFields']>>[number];

type ClientWithRules = Client & {
  rules: ClientRuleItem[];
};

export interface IFinishAuthorization {
  req: Request;
  res: Response;
  user?: UserModel;
  client: ClientWithRules;
  uid: string;
  type: string;
  loginEmail?: string;
  provider?: Provider;
  renderWidgetParams?: any;
}

export interface IAuthByTypeParams {
  type: string;
  req: Request;
  res: Response;
  body: any;
  uid: string;
  client_id: string;
  client: ClientWithRules;
  providers: any[];
}

export interface IAuthResult {
  user?: UserModel;
  provider?: Provider;
  loginEmail?: string;
  password_required?: boolean;
  type: string;
  renderWidgetParams?: any;
  shouldUpdateSession?: boolean;
}

type TPendingAuthorization = {
  notifications: TWidgetNotification[];
  result: {
    login: {
      accountId: string;
      remember: boolean;
    };
  };
  user_id: string;
};

type TReplaceEmailAuthContext = {
  provider_id: string;
  type: string;
};

type TSecondFactorEnrollment = {
  provider_ids: string[];
  user_id: string;
};

@common.Injectable()
export class InteractionService {
  private static readonly REPLACE_EMAIL_AUTH_CONTEXT_KEY = 'replace_email_auth_context';

  private async toWidgetLocalizedText(value: unknown): Promise<TLocalizedTextValue> {
    return toLocalizedTextValue(value, this.i18nService);
  }

  private normalizeWidgetMessageCause(cause: unknown) {
    if (!cause) {
      return '';
    }

    if (cause instanceof Error) {
      return cause.message;
    }

    if (typeof cause === 'string') {
      return cause;
    }

    if (typeof cause === 'object') {
      return JSON.stringify(cause);
    }

    return String(cause);
  }

  private async getWidgetMessage(message: unknown, cause?: unknown): Promise<TLocalizedTextValue> {
    const defaultLocale = await getDefaultLocale();
    const localizedMessage = await this.toWidgetLocalizedText(message);
    const normalizedCause = this.normalizeWidgetMessageCause(cause);

    if (!normalizedCause) {
      return localizedMessage;
    }

    const entries = Object.entries(localizedMessage);
    if (!entries.length) {
      return createLocalizedTextFallback(normalizedCause, defaultLocale);
    }

    return entries.reduce<TLocalizedTextValue>((acc, [locale, localizedMessageValue]) => {
      acc[locale] = `${localizedMessageValue}: ${normalizedCause}`;
      return acc;
    }, {});
  }

  private async getWidgetFieldTitle(
    fieldName: string,
    fallbackTitle: unknown,
  ): Promise<TLocalizedTextValue> {
    const profileField = await prisma.profileField.findUnique({
      where: { key: fieldName },
      select: { title: true },
    });

    return this.toWidgetLocalizedText(profileField?.title ?? fallbackTitle);
  }

  private async getWidgetValidations(
    validations: Array<{
      active: boolean;
      title: unknown;
      error: unknown;
      regex: string;
      id: string;
      created_at: Date;
      updated_at: Date;
    }>,
  ): Promise<IValidation[]> {
    return Promise.all(
      validations
        .filter((validation) => validation.active)
        .map(async (validation) => ({
          ...validation,
          title: await this.toWidgetLocalizedText(validation.title),
          error: await this.toWidgetLocalizedText(validation.error),
        })),
    );
  }

  private normalizeTwoFactorSettings(
    value?: settings.TwoFactorAuthenticationDto | null,
  ): settings.TwoFactorAuthenticationDto {
    return {
      controlled_methods: Array.isArray(value?.controlled_methods)
        ? value.controlled_methods.filter((method): method is settings.AuthMethodTypes =>
            Object.values(settings.AuthMethodTypes).includes(method as settings.AuthMethodTypes),
          )
        : [],
      available_provider_ids: Array.isArray(value?.available_provider_ids)
        ? value.available_provider_ids
            .map((id) => (typeof id === 'string' ? id.trim() : ''))
            .filter(Boolean)
        : [],
    };
  }

  constructor(
    @common.Inject(common.forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly usersContactsService: UsersContactsService,
    private readonly logger: CustomLogger,
    private readonly oidcService: OidcService,
    private readonly providerFactory: ProviderFactory,
    private readonly providerService: ProviderService,
    private readonly settingsService: SettingsService,
    private readonly i18nService: I18nService,
    private readonly notificationsService: NotificationsService,
    private readonly userRepo: UserRepository,
    private readonly callEventsService: CallEventsService,
  ) {}

  mfa1 = new RedisAdapter(REDIS_PREFIXES.MFA1);
  mfa2 = new RedisAdapter(REDIS_PREFIXES.MFA2);
  bindData = new RedisAdapter(REDIS_PREFIXES.BindData);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  emailCodeData = new RedisAdapter(REDIS_PREFIXES.EmailCode);
  pendingAuthorization = new RedisAdapter(REDIS_PREFIXES.PendingAuthorization);

  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  loggedUsersTokens = new RedisAdapter(REDIS_PREFIXES.LoggedUserToken);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  twoFactorAuthenticationAdapter = new RedisAdapter(REDIS_PREFIXES.TwoFactorAuthentication);

  private async loadUser(userId: string | null | undefined) {
    if (!userId) {
      return null;
    }

    return this.userRepo.findById(String(userId));
  }

  private async requireUser(userId: string | null | undefined) {
    const user = await this.loadUser(userId);
    if (!user) {
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0003);
    }

    return user;
  }

  private isTrustedUser(user: UserModel | null | undefined) {
    return Boolean(
      user?.Role?.some(
        (role) => role.client_id === CLIENT_ID && role.role === UserRoles.TRUSTED_USER,
      ),
    );
  }

  private mapClientRule(profileField: {
    id: string;
    key: string;
    active: boolean;
    required: boolean;
  }): ClientRuleItem {
    return {
      id: profileField.id,
      rule: {
        id: profileField.id,
        field_name: profileField.key,
        active: profileField.active,
        required: profileField.required,
      },
    };
  }

  private requireProfileField(fields: ProfileFieldModel[], fieldName: string): ProfileFieldModel {
    const field = fields.find((item) => item.field === fieldName);
    if (!field) {
      throw new common.InternalServerErrorException(enums.Ei18nCodes.T3E0016, {
        cause: fieldName,
      });
    }

    return field;
  }

  private getWebAuthnAuthenticatorAttachment(provider: Provider): 'platform' | 'cross-platform' {
    return provider.params?.['authenticatorAttachment'] ? 'cross-platform' : 'platform';
  }

  private hasWebAuthnAccountForProvider(
    provider: Provider,
    externalAccounts: { issuer: string | null; type: string; rest_info: unknown }[],
  ): boolean {
    const expectedAttachment = this.getWebAuthnAuthenticatorAttachment(provider);

    return externalAccounts.some((account) => {
      if (account.type !== enums.EProviderTypes.WEBAUTHN || account.issuer !== DOMAIN) {
        return false;
      }

      if (!account.rest_info || typeof account.rest_info !== 'object') {
        return true;
      }

      const restInfo = account.rest_info as Record<string, unknown>;
      const providerId = restInfo.provider_id;
      if (providerId !== undefined) {
        return String(providerId) === provider.id;
      }

      const attachment = restInfo.authenticatorAttachment;
      if (attachment === 'platform' || attachment === 'cross-platform') {
        return attachment === expectedAttachment;
      }

      return true;
    });
  }

  private hasMtlsAccountForProvider(
    provider: Provider,
    externalAccounts: { issuer: string | null; type: string; rest_info: unknown }[],
  ): boolean {
    return externalAccounts.some((account) => {
      if (account.type !== enums.EProviderTypes.MTLS || account.issuer !== DOMAIN) {
        return false;
      }

      if (!account.rest_info || typeof account.rest_info !== 'object') {
        return true;
      }

      const restInfo = account.rest_info as Record<string, unknown>;
      const providerId = restInfo.provider_id;
      if (providerId !== undefined) {
        return String(providerId) === provider.id;
      }

      return true;
    });
  }

  private hasOtpAccountForProvider(
    provider: Provider,
    externalAccounts: { type: string; rest_info: unknown }[],
  ): boolean {
    return externalAccounts.some((account) => {
      if (account.type !== provider.type) {
        return false;
      }

      if (!account.rest_info || typeof account.rest_info !== 'object') {
        return true;
      }

      const providerId = (account.rest_info as Record<string, unknown>).provider_id;
      return providerId === undefined || String(providerId) === provider.id;
    });
  }

  private hasAccountForProvider(
    provider: Provider,
    externalAccounts: { issuer: string | null; type: string; rest_info: unknown }[],
  ): boolean {
    if (provider.type === enums.EProviderTypes.WEBAUTHN) {
      return this.hasWebAuthnAccountForProvider(provider, externalAccounts);
    }

    if (provider.type === enums.EProviderTypes.MTLS) {
      return this.hasMtlsAccountForProvider(provider, externalAccounts);
    }

    if (
      provider.type === enums.EProviderTypes.TOTP ||
      provider.type === enums.EProviderTypes.HOTP
    ) {
      return this.hasOtpAccountForProvider(provider, externalAccounts);
    }

    if (provider.type === enums.EProviderTypes.ETHEREUM) {
      return externalAccounts.some((account) => account.issuer === enums.EProviderTypes.ETHEREUM);
    }

    const issuer =
      provider.params && typeof provider.params === 'object'
        ? (provider.params as Record<string, unknown>).issuer
        : undefined;
    if (typeof issuer === 'string' && issuer) {
      return externalAccounts.some((account) => account.issuer === issuer);
    }

    return externalAccounts.some((account) => account.type === provider.type);
  }

  private isSameSecondFactorMethod(providerType: string, firstFactorType: string): boolean {
    if (providerType === firstFactorType) {
      return true;
    }

    return (
      (providerType === enums.EProviderTypes.EMAIL &&
        firstFactorType === enums.EProviderTypes.EMAIL_CUSTOM) ||
      (providerType === enums.EProviderTypes.EMAIL_CUSTOM &&
        firstFactorType === enums.EProviderTypes.EMAIL) ||
      (providerType === enums.EProviderTypes.PHONE &&
        firstFactorType === enums.EProviderTypes.KLOUD) ||
      (providerType === enums.EProviderTypes.KLOUD &&
        firstFactorType === enums.EProviderTypes.PHONE)
    );
  }

  private toWidgetProvider(provider: Provider) {
    return {
      avatar: provider.avatar,
      description: provider.description,
      id: provider.id,
      name: provider.name,
      type: provider.type,
      is_public: provider.is_public,
    };
  }

  private async getConfiguredSecondFactorProviders(
    providerIds: string[],
    firstFactorType: string,
  ): Promise<Provider[]> {
    if (!providerIds.length) {
      return [];
    }

    const providers = await prisma.provider.findMany({
      where: { id: { in: providerIds } },
    });
    const providersById = new Map(providers.map((provider) => [provider.id, provider]));

    return providerIds
      .filter((id, index, items) => items.indexOf(id) === index)
      .map((id) => providersById.get(id))
      .filter(
        (provider): provider is Provider =>
          provider !== undefined && !this.isSameSecondFactorMethod(provider.type, firstFactorType),
      );
  }

  private async renderSecondFactorSelection(
    params: IFinishAuthorization,
    userId: string,
    firstFactorType: string,
    providerIds: string[],
  ): Promise<boolean> {
    const configuredProviders = await this.getConfiguredSecondFactorProviders(
      providerIds,
      firstFactorType,
    );
    if (!configuredProviders.length) {
      return false;
    }

    const externalAccounts = await prisma.externalAccount.findMany({
      where: { user_id: userId },
      select: { issuer: true, type: true, rest_info: true },
    });
    const existingProviders = configuredProviders.filter((provider) =>
      this.hasAccountForProvider(provider, externalAccounts),
    );

    if (existingProviders.length) {
      await this.twoFactorAuthenticationAdapter.destroy(params.uid);
      params.res.clearCookie('required_accounts_info_uid');
      params.res.clearCookie('_req_ids');
      await renderWidget({
        authStage: 'second-factor-challenge',
        initialRoute: 'identifiers',
        providers: existingProviders.map((provider) => this.toWidgetProvider(provider)),
        uid: params.uid,
        res: params.res,
        client: params.client,
      });
      return true;
    }

    const enrollmentProviderIds = configuredProviders.map((provider) => provider.id);
    const requiredAccountsInfoUid = uuidv4();
    await Promise.all([
      this.requiredAccountsInfoAdapter.upsert(
        requiredAccountsInfoUid,
        { id: userId },
        BIND_UID_TTL,
      ),
      this.twoFactorAuthenticationAdapter.upsert(
        params.uid,
        {
          provider_ids: enrollmentProviderIds,
          user_id: userId,
        } satisfies TSecondFactorEnrollment,
        3600,
      ),
    ]);
    params.res.cookie('required_accounts_info_uid', requiredAccountsInfoUid, {
      httpOnly: true,
      secure: true,
    });
    params.res.cookie('_req_ids', enrollmentProviderIds, {
      httpOnly: true,
      secure: true,
    });

    await renderWidget({
      authStage: 'second-factor-enrollment',
      initialRoute: 'missing-identifiers',
      providers: configuredProviders.map((provider) => this.toWidgetProvider(provider)),
      uid: params.uid,
      res: params.res,
      client: params.client,
      user: params.user,
    });
    return true;
  }

  private async renderPendingStateBinding(params: IFinishAuthorization, bindAccounts: any[]) {
    const pendingProviderIds = bindAccounts
      .filter(
        (account) =>
          [
            enums.EProviderTypes.WEBAUTHN,
            enums.EProviderTypes.TOTP,
            enums.EProviderTypes.HOTP,
          ].includes(account?.type) && !account?.data?.registrationResponse,
      )
      .map((account) => String(account.provider_id))
      .filter((id, index, items) => !!id && items.indexOf(id) === index);

    if (!pendingProviderIds.length) {
      return false;
    }

    const uid = uuidv4();
    await this.requiredAccountsInfoAdapter.upsert(uid, { id: params.user.id }, BIND_UID_TTL);
    const userData = (await this.userData.find(params.uid)) || {};
    await this.userData.upsert(
      params.uid,
      {
        ...userData,
        id: userData.id || params.user.id,
      },
      3600,
    );
    params.res.cookie('required_accounts_info_uid', uid, {
      httpOnly: true,
      secure: true,
    });

    const providers = await prisma.provider.findMany({
      where: {
        id: { in: pendingProviderIds },
      },
      select: {
        avatar: true,
        description: true,
        id: true,
        name: true,
        type: true,
        is_public: true,
      },
    });

    if (!providers.length) {
      return false;
    }

    await renderWidget({
      client: params.client,
      initialRoute: 'missing-identifiers',
      res: params.res,
      uid: params.uid,
      user: params.user,
      providers,
    });

    return true;
  }

  private async getPendingAuthorization(uid: string): Promise<TPendingAuthorization> {
    const pendingAuthorization = await this.pendingAuthorization.find(uid);

    if (!pendingAuthorization) {
      throw new common.BadRequestException('Pending authorization not found');
    }

    return pendingAuthorization as TPendingAuthorization;
  }

  async getPendingNotifications(uid: string): Promise<TWidgetNotification[] | null> {
    const pendingAuthorization = await this.pendingAuthorization.find(uid);
    return pendingAuthorization?.notifications || null;
  }

  private getPendingNotificationIdsToMarkAsRead(
    pendingAuthorization: TPendingAuthorization,
    dto?: MarkNotificationsReadDto,
  ) {
    const availableNotificationIds = new Set(
      pendingAuthorization.notifications.map((notification) => notification.id),
    );

    return (dto?.notification_ids ?? []).filter((id) => availableNotificationIds.has(id));
  }

  private async finishPendingAuthorizationAfterNotifications(
    uid: string,
    req: Request,
    res: Response,
    dto?: MarkNotificationsReadDto,
  ) {
    const pendingAuthorization = await this.getPendingAuthorization(uid);
    const notificationIds = this.getPendingNotificationIdsToMarkAsRead(pendingAuthorization, dto);

    if (notificationIds.length) {
      await this.notificationsService.markAsRead(pendingAuthorization.user_id, notificationIds);
    }

    await this.pendingAuthorization.destroy(uid);
    return this.oidcService.interactionFinished(req, res, pendingAuthorization.result, uid, false);
  }

  async clearPendingAuthorization(uid: string) {
    await this.pendingAuthorization.destroy(uid);
  }

  async continueAfterNotifications(
    uid: string,
    req: Request,
    res: Response,
    dto?: MarkNotificationsReadDto,
  ) {
    return this.finishPendingAuthorizationAfterNotifications(uid, req, res, dto);
  }

  async getUserByPassword({
    identifier,
    password,
  }: {
    identifier: string;
    password: string;
  }): Promise<UserModel> {
    if (!password) throw new common.ForbiddenException(enums.Ei18nCodes.T3E0001);

    const user = await this.findUserByIdentifier({ identifier });
    let passwordVerified = false;

    if (user) passwordVerified = await bcrypt.compare(password, user.hashed_password);
    if (!passwordVerified) throw new common.ForbiddenException(enums.Ei18nCodes.T3E0001);

    return user;
  }

  async findUserByIdentifier({ identifier }: { identifier: string }): Promise<UserModel | null> {
    return this.userRepo.findByIdentifier({ identifier });
  }

  async getUserByIdentifier({ identifier }: { identifier: string }): Promise<UserModel> {
    const user = await this.findUserByIdentifier({ identifier });
    if (!user) throw new common.BadRequestException(enums.Ei18nCodes.T3E0003);

    return user;
  }

  /**
   * Saving user scopes.
   * When consent is granted to the application to access user data, the scopes are saved in the database.
   */
  async saveUserScopes(userId: string, clientId: string, scopes: string): Promise<void> {
    await prisma.scopes.upsert({
      where: { user_id_client_id: { user_id: userId, client_id: clientId } },
      update: { user_id: userId, client_id: clientId, scopes },
      create: { user_id: userId, client_id: clientId, scopes },
    });
  }

  async findUserScopes(accountId: string, client_id: string): Promise<string> {
    const data = await prisma.scopes.findUnique({
      where: { user_id_client_id: { user_id: accountId, client_id } },
    });

    return data?.scopes || '';
  }

  /**
   * Checks for the presence of the requested scopes.
   * If the requested scopes are missing, a widget is opened with a request to access the data.
   * Required for adding a record to the user scopes database.
   */
  async checkMissingScopes(req: Request, res: Response) {
    const interactionDetails = await this.oidcService.interactionDetails(req, res);
    const {
      jti: uid,
      prompt: { details },
      params,
    } = interactionDetails;

    const client = await this.getClient(params.client_id as string);

    // Generate a list of missing scopes to pass to the widget and request confirmation
    const missingScopes: string[] = [];
    const accountId = interactionDetails?.session?.accountId;
    if (
      accountId &&
      params.client_id !== CLIENT_ID &&
      params.scope &&
      typeof params.scope === 'string'
    ) {
      const requiredScopes = (params?.scope || '').trim().replace(/\s+/g, ' ').split(' ') || [];

      const userScopes = (await this.findUserScopes(accountId, params.client_id as string)) || '';
      for (const scope of requiredScopes) {
        if (!userScopes.includes(scope)) {
          missingScopes.push(scope);
        }
      }

      interactionDetails.prompt.details.missingBaseOIDCScope = missingScopes.join(',');
      if (missingScopes.length) {
        const organizationId = await helpers.getOrganizationId(params.client_id as string);
        const dynamicScopeGroups = await prisma.oidcScopeGroup.findMany({
          where: {
            organization_id: organizationId,
            name: { in: missingScopes },
          },
          select: {
            name: true,
            icon: true,
            title: true,
            description: true,
          },
        });
        interactionDetails.prompt.details.missingCustomOIDCScope = dynamicScopeGroups;
      }
    }

    if (!missingScopes.length) {
      return;
    }

    const { public_profile_claims_oauth: publicProfileClaims } =
      (await this.userService.getPrivateScopes(accountId)) || {};

    return {
      res,
      initialRoute: 'access',
      client,
      details,
      uid,
      publicProfileClaims,
    };
  }

  async getProvider(client_id: string, provider_id: string) {
    const relation = await prisma.provider_relations.findFirst({
      where: {
        client_id,
        provider_id,
      },
      include: { provider: true },
    });
    const provider = relation?.provider;
    if (!provider) throw new common.BadRequestException(enums.Ei18nCodes.T3E0030);
    return provider;
  }

  async getClient(client_id: string): Promise<ClientWithRules> {
    const client = await prisma.client.findFirst({
      where: { client_id: client_id },
      include: {
        required_profile_fields: {
          include: {
            profile_field: {
              select: {
                id: true,
                key: true,
                active: true,
                required: true,
              },
            },
          },
        },
      },
    });
    if (!client) throw new common.BadRequestException(enums.Ei18nCodes.T3E0071);

    return {
      ...client,
      rules: client.required_profile_fields.map((item) => this.mapClientRule(item.profile_field)),
    };
  }

  async getUserBySessionToken(
    token: string,
    loggedUsersTokens: RedisAdapter,
  ): Promise<UserModel | undefined> {
    const userId = await loggedUsersTokens.get<string>(token);
    if (!userId) throw new common.ForbiddenException(enums.Ei18nCodes.T3E0075);

    const user = await this.loadUser(userId);

    if (!user) throw new common.ForbiddenException(enums.Ei18nCodes.T3E0075);

    return user;
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    const { sessionToken } = (await this.loggedUsersInfo.get(sessionId)) || {};
    await this.loggedUsersInfo.destroy(sessionId);
    await this.loggedUsersTokens.destroy(sessionToken);
  }

  async isTwoFactorRequiredForAuthType(type: string) {
    const twoFactorSettings = this.normalizeTwoFactorSettings(
      await this.settingsService.getSettingsByName<settings.TwoFactorAuthenticationDto>(
        settings.ESettingsNames.two_factor_authentication,
      ),
    );
    let ok = false;
    switch (type.toUpperCase()) {
      case 'LOGIN':
      case enums.EProviderTypes.CREDENTIALS:
        ok = twoFactorSettings.controlled_methods.includes(settings.AuthMethodTypes.login);
        break;
      case enums.EProviderTypes.MTLS:
        ok = twoFactorSettings.controlled_methods.includes(settings.AuthMethodTypes.mtls);
        break;
      case enums.EProviderTypes.ETHEREUM:
      case enums.EProviderTypes.EMAIL:
      case enums.EProviderTypes.EMAIL_CUSTOM:
      case enums.EProviderTypes.KLOUD:
      case enums.EProviderTypes.PHONE:
      case enums.EProviderTypes.TOTP:
      case enums.EProviderTypes.HOTP:
        ok = twoFactorSettings.controlled_methods.includes(settings.AuthMethodTypes.otp);
        break;
      case enums.EProviderTypes.CUSTOM:
      case enums.EProviderTypes.GOOGLE:
      case enums.EProviderTypes.GITHUB:
        ok = twoFactorSettings.controlled_methods.includes(settings.AuthMethodTypes.oauth);
        break;
      case enums.EProviderTypes.WEBAUTHN:
        ok = twoFactorSettings.controlled_methods.includes(settings.AuthMethodTypes.webauthn);
        break;
      case 'SESSION':
        ok = twoFactorSettings.controlled_methods.includes(settings.AuthMethodTypes.session);
        break;
      case 'RELOAD':
        ok = true;
        break;
    }
    return ok;
  }

  async identityVerification(params: IFinishAuthorization) {
    const ok = await this.settingsService.getSettingsByName<boolean>(
      settings.ESettingsNames.prohibit_identifier_binding,
    );
    if (ok) throw new common.BadRequestException(enums.Ei18nCodes.T3E0067);

    if (params.provider) {
      let bindAccounts = await this.bindData.find(params.uid);
      bindAccounts = bindAccounts || [];
      if (
        !bindAccounts.some(
          (account) =>
            account?.type === params.provider.type &&
            String(account?.provider_id) === params.provider.id,
        )
      ) {
        bindAccounts.push({
          type: params.provider.type,
          provider_id: params.provider.id,
        });
        await this.bindData.upsert(params.uid, bindAccounts, 3600);
      }
    }

    const mfa1 = await this.mfa1.find(params.uid);
    if (!mfa1) {
      let providers = await prisma.provider.findMany({
        where: {
          client_id: CLIENT_ID,
          OR: [
            { is_public: true },
            {
              type: {
                in: [
                  enums.EProviderTypes.CREDENTIALS,
                  enums.EProviderTypes.EMAIL,
                  enums.EProviderTypes.PHONE,
                ],
              },
            },
          ],
        },
        select: {
          avatar: true,
          description: true,
          id: true,
          name: true,
          type: true,
          is_public: true,
        },
      });

      if (params.provider) {
        providers = providers.filter((provider) => {
          // Exclude the same type
          if (provider.type === params.provider.type) return false;

          // Exclude EMAIL_CUSTOM if provider is EMAIL, and vice versa
          if (
            (params.provider.type === enums.EProviderTypes.EMAIL &&
              provider.type === enums.EProviderTypes.EMAIL_CUSTOM) ||
            (params.provider.type === enums.EProviderTypes.EMAIL_CUSTOM &&
              provider.type === enums.EProviderTypes.EMAIL)
          ) {
            return false;
          }

          // Exclude KLOUD if provider is PHONE, and vice versa
          if (
            (params.provider.type === enums.EProviderTypes.PHONE &&
              provider.type === enums.EProviderTypes.KLOUD) ||
            (params.provider.type === enums.EProviderTypes.KLOUD &&
              provider.type === enums.EProviderTypes.PHONE)
          ) {
            return false;
          }

          return true;
        });
      }

      const bindAccounts = await this.bindData.find(params.uid);
      if (bindAccounts) {
        providers = providers.filter(
          (provider) =>
            !bindAccounts.some((account) => {
              // Exclude if provider_id matches
              if (account.provider_id === provider.id) return true;

              // Exclude if type matches
              if (account.type === provider.type) return true;

              // Exclude EMAIL_CUSTOM if account is EMAIL, and vice versa
              if (
                (account.type === enums.EProviderTypes.EMAIL &&
                  provider.type === enums.EProviderTypes.EMAIL_CUSTOM) ||
                (account.type === enums.EProviderTypes.EMAIL_CUSTOM &&
                  provider.type === enums.EProviderTypes.EMAIL)
              ) {
                return true;
              }

              // Exclude KLOUD if account is PHONE, and vice versa
              if (
                (account.type === enums.EProviderTypes.PHONE &&
                  provider.type === enums.EProviderTypes.KLOUD) ||
                (account.type === enums.EProviderTypes.KLOUD &&
                  provider.type === enums.EProviderTypes.PHONE)
              ) {
                return true;
              }

              return false;
            }),
        );
      }

      return renderWidget({
        initialRoute: 'identifiers',
        providers,
        uid: params.uid,
        res: params.res,
        client: params.client,
      });
    }

    const userData = await this.userData.find(params.uid);
    const user = mfa1.user_id ? await this.loadUser(mfa1.user_id) : userData;

    params.user = user;
    await this.finishAuthorization(params);
  }

  async finishAuthorization(params: IFinishAuthorization) {
    // ROOT
    if (params.client.client_id === CLIENT_ID && params.user?.id === '1') {
      if (NODE_ENV !== 'safe_mode') {
        throw new common.ForbiddenException(
          'ROOT user authorization is prohibited in non-safe mode',
        );
      }

      await this.logger.logEvent({
        ip_address: params.req.ip,
        device: params.req.headers['user-agent'],
        user_id: params.user.id,
        client_id: params.client.client_id,
        event: 'USER_LOGIN_SUCCESS',
        description: '',
        details: { type: params.type },
      });
      const result = { login: { accountId: params.user.id, remember: false } };
      return this.oidcService.interactionFinished(
        params.req,
        params.res,
        result,
        params.uid,
        false,
      );
    }

    if (NODE_ENV === 'safe_mode') {
      throw new common.ForbiddenException('Authorization is prohibited in safe mode');
    }

    if (!params.user) {
      const mfa_1 = await this.mfa1.find(params.uid);
      if (mfa_1?.user_id) {
        const twoFactorSettings = this.normalizeTwoFactorSettings(
          await this.settingsService.getSettingsByName<settings.TwoFactorAuthenticationDto>(
            settings.ESettingsNames.two_factor_authentication,
          ),
        );
        const mfa_2 = await this.mfa2.find(params.uid);
        if (
          !mfa_2 &&
          twoFactorSettings.available_provider_ids.length &&
          twoFactorSettings.controlled_methods.length &&
          (await this.isTwoFactorRequiredForAuthType(mfa_1.type)) &&
          (await this.renderSecondFactorSelection(
            params,
            mfa_1.user_id,
            mfa_1.type,
            twoFactorSettings.available_provider_ids,
          ))
        ) {
          return;
        }
      }

      let bindAccounts = await this.bindData.find(params.uid);
      bindAccounts = bindAccounts || [];
      if (
        params.provider &&
        !bindAccounts.some((account) => {
          return (
            account.type === params.provider.type &&
            String(account.provider_id) === params.provider.id
          );
        })
      ) {
        bindAccounts.push({
          type: params.provider.type,
          provider_id: params.provider.id,
        });
        await this.bindData.upsert(params.uid, bindAccounts, 3600);
      }

      const prohibit_identifier_binding = await this.settingsService.getSettingsByName<boolean>(
        settings.ESettingsNames.prohibit_identifier_binding,
      );
      const registration_policy =
        await this.settingsService.getSettingsByName<enums.RegistrationPolicyVariants>(
          settings.ESettingsNames.registration_policy,
        );
      if (params.renderWidgetParams?.initialRoute === 'steps') {
        if (registration_policy !== enums.RegistrationPolicyVariants.allowed) {
          throw new common.BadRequestException(enums.Ei18nCodes.T3E0074);
        }
        return this.steps({}, params.req, params.res);
      }
      if (
        registration_policy !== enums.RegistrationPolicyVariants.allowed &&
        !prohibit_identifier_binding
      ) {
        return this.identityVerification(params);
      }
      if (
        registration_policy === enums.RegistrationPolicyVariants.allowed &&
        prohibit_identifier_binding
      ) {
        return this.steps({}, params.req, params.res);
      }

      return renderWidget({
        initialRoute: 'bind',
        uid: params.uid,
        res: params.res,
        client: params.client,
        message:
          params.provider?.type === enums.EProviderTypes.WEBAUTHN
            ? await this.toWidgetLocalizedText(enums.Ei18nCodes.T3W0001)
            : undefined,
      });
    }

    await this.settingsService.canAuthorize(params.user.id, params.client);
    await syncOrganizationGuestsMembershipForAuthorizedClient(
      prisma,
      params.user.id,
      params.client.client_id,
    );

    if (
      params.type === enums.EProviderTypes.EMAIL ||
      params.type === enums.EProviderTypes.EMAIL_CUSTOM
    ) {
      const [emailField] = await this.settingsService.getProfileFields(
        settings.UserProfileFields.email,
        {
          clientId: params.client.client_id,
        },
      );
      const userData = (await this.userData.find(params.uid)) || {};
      const loginEmail =
        typeof params.loginEmail === 'string'
          ? params.loginEmail.trim().toLowerCase()
          : typeof userData.email === 'string'
          ? userData.email.trim().toLowerCase()
          : '';

      if (emailField?.validate_on_authorization && loginEmail) {
        try {
          await this.settingsService.prepareGeneralProfileFields(
            { email: loginEmail },
            params.user.id,
            UserRoles.OWNER,
            false,
            {
              scope: {
                clientId: params.client.client_id,
              },
            },
          );
        } catch (error) {
          const nextUserData = {
            id: userData.id || params.user.id,
            ...(params.provider
              ? {
                  [InteractionService.REPLACE_EMAIL_AUTH_CONTEXT_KEY]: {
                    provider_id: String(params.provider.id),
                    type: params.type,
                  } satisfies TReplaceEmailAuthContext,
                }
              : {}),
          };

          await this.userData.upsert(params.uid, nextUserData, 3600);

          return renderWidget({
            client: params.client,
            initialRoute: 'replace-email',
            res: params.res,
            uid: params.uid,
            user: nextUserData,
            field: {
              type: this.settingsService.getTypeDataOfField(emailField.field),
              title: await this.getWidgetFieldTitle(emailField.field, emailField.title),
              field_name: emailField.field,
              default_value: emailField.default || undefined,
              unique: emailField.unique ?? false,
              validations: await this.getWidgetValidations(emailField.validations),
            },
          });
        }
      }
    }

    const bindAccounts = await this.bindData.find(params.uid);
    if (bindAccounts && params.type !== 'registration') {
      const [bindingProviders, externalAccounts] = await Promise.all([
        prisma.provider.findMany({
          where: {
            id: {
              in: bindAccounts.map((account) => String(account.provider_id)),
            },
          },
        }),
        prisma.externalAccount.findMany({
          where: { user_id: params.user.id },
          select: { issuer: true, type: true, rest_info: true },
        }),
      ]);
      const existingBindingProvider = bindingProviders.find((provider) =>
        this.hasAccountForProvider(provider, externalAccounts),
      );
      if (existingBindingProvider) {
        await this.clearAuthRedis(params.uid);
        throw new common.BadRequestException(enums.Ei18nCodes.T3E0084, {
          cause: existingBindingProvider.type,
        });
      }
    }

    if (bindAccounts?.length && (await this.renderPendingStateBinding(params, bindAccounts))) {
      return;
    }

    const twoFactorSettings = this.normalizeTwoFactorSettings(
      await this.settingsService.getSettingsByName<settings.TwoFactorAuthenticationDto>(
        settings.ESettingsNames.two_factor_authentication,
      ),
    );

    const mfa_1 = await this.mfa1.find(params.uid);
    if (!mfa_1) {
      if (params.type.toUpperCase() !== 'SESSION' && params.type.toUpperCase() !== 'RELOAD') {
        if (!params.provider)
          throw new common.InternalServerErrorException(enums.Ei18nCodes.T3E0030);
        if (!bindAccounts || !bindAccounts.length) {
          await this.getProvider(params.client.client_id, params.provider.id.toString());
        } else {
          let providerFound = false;
          for (const account of bindAccounts) {
            try {
              await this.getProvider(params.client.client_id, String(account.provider_id));
              providerFound = true;
              params.type = account.type;
              break;
            } catch (e) {
              // ignore
            }
          }
          if (!providerFound) {
            return renderWidget({
              initialRoute: '',
              uid: params.uid,
              res: params.res,
              client: params.client,
            });
          }
        }
      }

      await this.mfa1.upsert(
        params.uid,
        {
          client_id: params.client.client_id,
          user_id: params.user.id,
          type: params.type,
        },
        3600,
      );

      if (
        twoFactorSettings.available_provider_ids.length &&
        twoFactorSettings.controlled_methods.length &&
        (await this.isTwoFactorRequiredForAuthType(params.type))
      ) {
        if (
          await this.renderSecondFactorSelection(
            params,
            params.user.id,
            params.type,
            twoFactorSettings.available_provider_ids,
          )
        ) {
          return;
        }
      }
      await this.mfa2.upsert(params.uid, true, 3600);
    }

    // Check MFA2
    const mfa_2 = await this.mfa2.find(params.uid);
    if (!mfa_2) {
      if (mfa_1.user_id !== params.user.id) {
        await this.clearAuthRedis(params.uid);
        throw new common.BadRequestException(enums.Ei18nCodes.T3E0085);
      } else if (
        mfa_1.type === params.type ||
        !params.provider ||
        !twoFactorSettings.available_provider_ids.includes(params.provider.id)
      ) {
        await this.mfa1.destroy(params.uid);
        return this.finishAuthorization(params);
      }

      await this.mfa2.upsert(params.uid, true, 3600);
    }

    if (params.user.deleted)
      return renderWidget({
        initialRoute: 'recover-account',
        uid: params.uid,
        login: params.user.login,
        res: params.res,
        client: params.client,
      });

    if (bindAccounts) {
      let i = 0;
      while (i < bindAccounts.length) {
        const account = bindAccounts[i];
        switch (account.type) {
          case enums.EProviderTypes.EMAIL_CUSTOM:
          case enums.EProviderTypes.EMAIL:
            const emailData = await this.userData.find(params.uid);
            if (emailData && emailData.email) {
              await this.usersContactsService.changeEmail(
                emailData.email,
                params.user.id,
                undefined,
                {
                  mode: 'auto',
                  scope: {
                    clientId: params.client.client_id,
                  },
                  providerContext: {
                    providerId: account.provider_id,
                    accountType: account.type,
                  },
                },
              );
              delete emailData.email;
              await this.userData.upsert(params.uid, emailData, 3600);
            }
            break;
          case enums.EProviderTypes.KLOUD:
          case enums.EProviderTypes.PHONE:
            const phoneData = await this.userData.find(params.uid);
            if (phoneData && phoneData.phone_number) {
              await this.usersContactsService.changePhone(
                phoneData.phone_number,
                params.user.id,
                undefined,
                {
                  mode: 'auto',
                  scope: {
                    clientId: params.client.client_id,
                  },
                  providerContext: {
                    providerId: account.provider_id,
                    accountType: account.type,
                  },
                },
              );
              delete phoneData.phone_number;
              await this.userData.upsert(params.uid, phoneData, 3600);
            }
            break;

          default:
            const provider = await prisma.provider.findUnique({
              where: { id: String(account.provider_id) },
            });
            await this.userService.bindAccount(params.user.id, provider, {
              ...account.data,
              issuer: provider.params['issuer'],
              provider_id: String(account.provider_id),
            });
        }
        bindAccounts.splice(i, 1);
        await this.bindData.upsert(params.uid, bindAccounts);
      }
    }

    params.user = await this.requireUser(params.user.id);

    if (params.user.password_change_required && !this.isTrustedUser(params.user)) {
      return renderWidget({
        initialRoute: 'change-password',
        uid: params.uid,
        res: params.res,
        client: params.client,
        login: params.user.login,
      });
    }

    const redirected = !!(await this.redirectToMissingAccounts(
      params.res,
      params.req,
      params.client,
      params.user,
      params.uid,
    ));
    if (redirected) return;

    const externalEmails = getLegacyUserExternalAccountEmails(params.user);

    if (params.client.authorize_only_employees && externalEmails.length) {
      const [clientRole, invitation] = await Promise.all([
        prisma.role.findUnique({
          where: {
            user_id_client_id: {
              user_id: params.user.id,
              client_id: params.client.client_id,
            },
          },
        }),
        prisma.clientInvitation.findFirst({
          where: {
            client_id: params.client.client_id,
            email: {
              in: externalEmails,
            },
          },
        }),
      ]);

      if (!clientRole && invitation) {
        await this.userService.setUserRoleInApp(params.user.id, params.client.client_id);
      }
    }

    if (externalEmails.length) {
      await prisma.clientInvitation.deleteMany({
        where: {
          client_id: params.client.client_id,
          email: {
            in: externalEmails,
          },
        },
      });
    }

    await saveLoggedUserSession(
      params.req,
      params.res,
      this.loggedUsersInfo,
      this.loggedUsersTokens,
      params.user,
    );

    const result = { login: { accountId: params.user.id, remember: false } };
    const unreadNotifications = await this.notificationsService.getUnreadForUser(
      params.user.id,
      params.client.client_id,
    );

    await this.callEventsService.call(CallEventNames.Authentication.afterAuthorized, {
      client: params.client,
      user: params.user,
      authType: params.type,
      ip: params.req.ip,
      userAgent: params.req.headers['user-agent'],
    } satisfies AuthenticationAfterAuthorizedPayload);

    await this.logger.logEvent({
      ip_address: params.req.ip,
      device: params.req.headers['user-agent'],
      user_id: params.user.id,
      client_id: params.client.client_id,
      event: 'USER_LOGIN_SUCCESS',
      description: '',
      details: { type: params.type },
    });

    await this.clearAuthRedis(params.uid);

    if (unreadNotifications.length) {
      await this.pendingAuthorization.upsert(
        params.uid,
        {
          notifications: unreadNotifications,
          result,
          user_id: params.user.id,
        } satisfies TPendingAuthorization,
        3600,
      );

      return renderWidget({
        initialRoute: 'notifications',
        uid: params.uid,
        res: params.res,
        client: params.client,
        notifications: unreadNotifications,
      });
    }

    await this.oidcService.interactionFinished(params.req, params.res, result, params.uid, false);
  }

  private async clearAuthRedis(uid: string) {
    await this.mfa1.destroy(uid);
    await this.mfa2.destroy(uid);
    await this.userData.destroy(uid);
    await this.bindData.destroy(uid);
    await this.twoFactorAuthenticationAdapter.destroy(uid);
  }

  private getReplaceEmailAuthContext(userData: unknown): TReplaceEmailAuthContext | null {
    if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
      return null;
    }

    const context = (userData as Record<string, unknown>)[
      InteractionService.REPLACE_EMAIL_AUTH_CONTEXT_KEY
    ];

    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return null;
    }

    const { provider_id, type } = context as Record<string, unknown>;
    if (typeof provider_id !== 'string' || !provider_id.trim()) {
      return null;
    }

    if (typeof type !== 'string' || !type.trim()) {
      return null;
    }

    return {
      provider_id,
      type,
    };
  }

  async recoverPassword(dto: any, req: Request, res: Response) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);
    const client = await this.getClient(client_id as string);

    const user = await this.findUserByIdentifier({ identifier: dto.identifier });
    if (!user) throw new common.BadRequestException(enums.Ei18nCodes.T3E0003);
    await this.settingsService.canAuthorize(user.id, null);

    const service = this.providerFactory.getProviderService(enums.EProviderTypes.EMAIL);
    const recoveryEmail = getLegacyUserRecoveryEmail(user);

    if (!recoveryEmail) throw new common.BadRequestException(enums.Ei18nCodes.T3E0057);

    if (dto.code || dto.password) {
      if (!dto.code) throw new common.BadRequestException(enums.Ei18nCodes.T3E0088);
      if (!dto.password) throw new common.BadRequestException(enums.Ei18nCodes.T3E0088);
      await this.userService.checkValidPassword(dto.password, req.headers['x-lang'] as string);
      await service.confirm(recoveryEmail, dto.code);
      await this.userService.changePassword(
        { password: dto.password },
        user.id,
        undefined,
        req.headers['x-lang'] as string,
      );
      return renderWidget({
        initialRoute: 'success',
        uid,
        res,
        client,
      });
    }

    const verificationResult = await service.verificationCode(
      {
        type: enums.EProviderTypes.EMAIL,
        email: recoveryEmail,
        uid,
        code_type: MailCodeTypes.recoverPassword,
        user_id: user.id,
      },
      req,
      res,
    );

    const field = await this.settingsService.getProfileFields('password');
    return renderWidget({
      initialRoute: 'recover-password',
      uid,
      res,
      login: dto.identifier,
      client,
      field: {
        type: this.settingsService.getTypeDataOfField(field[0].field),
        title: await this.getWidgetFieldTitle(field[0].field, field[0].title),
        field_name: field[0].field,
        default_value: field[0].default || undefined,
        validations: await this.getWidgetValidations(field[0].validations),
      },
      message: helpers.maskEmail(recoveryEmail),
      messageDetail:
        NODE_ENV === 'development' && verificationResult?.code
          ? `Dev recovery code: ${String(verificationResult.code)}`
          : undefined,
    });
  }

  async changePassword(dto: interactionDto.ChangePasswordDto, req: Request, res: Response) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);

    if (dto.new_password == dto.current_password)
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0100);

    const client = await this.getClient(client_id as string);
    const mfa_1 = await this.mfa1.find(uid);
    const userId = mfa_1?.user_id;

    if (!userId) {
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0015);
    }

    await this.userService.changePassword(
      {
        old_password: dto.current_password,
        password: dto.new_password,
      },
      userId,
      userId,
      req.headers['x-lang'] as string,
    );

    const user = await this.requireUser(userId);

    return this.finishAuthorization({
      req,
      res,
      user,
      client,
      uid,
      type: mfa_1?.type || enums.EProviderTypes.CREDENTIALS,
    });
  }

  async steps(dto: Record<string, any>, req: Request, res: Response) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);
    const client = await this.getClient(client_id as string);

    let userData: any = (await this.userData.find(uid)) || {};
    const isRegistration = !userData.id || userData.id === '0';
    const locale =
      typeof dto.locale === 'string' && Object.values(ELocales).includes(dto.locale as ELocales)
        ? (dto.locale as ELocales)
        : undefined;

    delete dto.locale;

    if (isRegistration) {
      const { registration_policy } = await this.settingsService.getSettings();
      if (registration_policy !== enums.RegistrationPolicyVariants.allowed)
        throw new common.ForbiddenException(enums.Ei18nCodes.T3E0074);

      if (client.hide_widget_create_account)
        throw new common.ForbiddenException(enums.Ei18nCodes.T3E0074);

      userData = { ...userData, id: '0' };

      if (locale) {
        userData = { ...userData, locale };
      }
    }

    if (!isRegistration) {
      const public_profile_consent = dto.public_profile_consent;
      delete dto.public_profile_consent;

      if (client.rules.length) {
        if (public_profile_consent) {
          client.rules.map((rule) => rule.rule.field_name);
          await this.userService.setPrivateScopes(
            {
              claim_privacy: enums.EClaimPrivacy.request,
              field: client.rules.map((rule) => rule.rule.field_name).join(' '),
            },
            userData.id,
          );
        }
      }
    }

    const profileFieldClientId = client.client_id;
    const allFields = (
      await this.settingsService.getProfileFields(undefined, { clientId: profileFieldClientId })
    ).filter((f) => f.field !== settings.UserProfileFields.sub);
    const replaceEmailAuthContext = !isRegistration
      ? this.getReplaceEmailAuthContext(userData)
      : null;

    if (replaceEmailAuthContext) {
      const emailField = allFields.find(
        (field) => field.field === settings.UserProfileFields.email,
      );
      const invalidKey = Object.keys(dto).find((key) => !['email', 'code'].includes(key));

      try {
        if (invalidKey) {
          throw new common.BadRequestException(enums.Ei18nCodes.T3E0094, {
            cause: invalidKey,
          });
        }

        if (!dto.email) {
          throw new common.BadRequestException(enums.Ei18nCodes.T3E0088);
        }

        const preparedEmail = await this.settingsService.prepareGeneralProfileFields(
          { email: dto.email },
          userData.id,
          UserRoles.OWNER,
          false,
          {
            scope: {
              clientId: client_id as string,
            },
          },
        );
        const nextEmail = String(preparedEmail.email).trim();
        const emailCodeData = await this.emailCodeData.find(nextEmail);
        const isEmailConfirmed = userData.email === nextEmail || emailCodeData?.status === true;
        if (emailCodeData?.status) {
          await this.emailCodeData.destroy(nextEmail);
        }

        if (!isEmailConfirmed) {
          throw new common.BadRequestException(enums.Ei18nCodes.T3E0070);
        }

        await this.userData.upsert(
          uid,
          {
            id: String(userData.id),
            [InteractionService.REPLACE_EMAIL_AUTH_CONTEXT_KEY]: replaceEmailAuthContext,
          },
          3600,
        );

        await this.usersContactsService.changeEmail(
          nextEmail,
          String(userData.id),
          UserRoles.OWNER,
          {
            scope: {
              clientId: client_id as string,
            },
            mode: 'primary',
            providerContext: {
              providerId: replaceEmailAuthContext.provider_id,
              accountType:
                replaceEmailAuthContext.type === enums.EProviderTypes.EMAIL_CUSTOM
                  ? enums.EProviderTypes.EMAIL_CUSTOM
                  : enums.EProviderTypes.EMAIL,
            },
          },
        );

        return this.finishAuthorization({
          req,
          res,
          user: await this.requireUser(String(userData.id)),
          client,
          uid,
          type: replaceEmailAuthContext.type,
          provider: await this.getProvider(client.client_id, replaceEmailAuthContext.provider_id),
        });
      } catch (error) {
        return renderWidget({
          client,
          initialRoute: 'replace-email',
          res,
          uid,
          user: {
            id: String(userData.id),
          },
          field: {
            type: this.settingsService.getTypeDataOfField(emailField.field),
            title: await this.getWidgetFieldTitle(emailField.field, emailField.title),
            field_name: emailField.field,
            default_value: emailField.default || undefined,
            unique: emailField.unique ?? false,
            validations: await this.getWidgetValidations(emailField.validations),
          },
          message: await this.getWidgetMessage(error['message'], error['cause']),
        });
      }
    }

    let keyError = '';
    try {
      for (const key of Object.keys(dto)) {
        keyError = key;
        const field = allFields.find((f) => f.field === key);
        if (!field) continue;
        if (!dto[key]) throw new common.BadRequestException(enums.Ei18nCodes.T3E0088);
        if (field.type === settings.ProfileFieldTypes.general) {
          if (key === 'phone_number') {
            dto.phone_number = helpers.preparePhoneNumber(dto.phone_number);
          }
          await this.settingsService.prepareGeneralProfileFields(
            { [key]: dto[key] },
            !isRegistration ? userData.id : undefined,
            undefined,
            false,
            {
              scope: {
                clientId: profileFieldClientId,
              },
            },
          );
          if (key === 'email') {
            const emailCodeData = await this.emailCodeData.find(dto.email);
            if (emailCodeData && emailCodeData.status) {
              userData = { ...userData, [key]: dto[key] };
              await this.emailCodeData.destroy(dto.email);
            }

            if (!userData?.email || userData.email !== dto.email)
              throw new common.BadRequestException(enums.Ei18nCodes.T3E0070);
          } else if (key === 'phone_number') {
            if (!userData?.phone_number || userData.phone_number !== dto.phone_number)
              throw new common.BadRequestException(enums.Ei18nCodes.T3E0069);
          }
        } else {
          await this.settingsService.prepareCustomFieldsToSave(
            { [key]: dto[key] },
            !isRegistration ? userData.id : undefined,
            undefined,
            false,
            { clientId: profileFieldClientId },
          );
        }

        userData = { ...userData, [key]: dto[key] };
      }
    } catch (error) {
      const field = this.requireProfileField(allFields, keyError);
      return renderWidget({
        client,
        initialRoute: 'steps',
        res,
        uid,
        user: userData,
        field: {
          type: this.settingsService.getTypeDataOfField(field.field),
          title: await this.getWidgetFieldTitle(field.field, field.title),
          field_name: field?.field,
          default_value: field?.default || undefined,
          unique: field?.unique ?? false,
          validations: await this.getWidgetValidations(field.validations),
        },
        message: await this.getWidgetMessage(error['message'], error['cause']),
      });
    }

    await this.userData.upsert(uid, userData, 3600);

    const { missingRequiredFields } = await this.checkRequiredFields(res, client, userData);
    if (missingRequiredFields.length) {
      const field = this.requireProfileField(allFields, missingRequiredFields[0].field_name);

      return renderWidget({
        client,
        initialRoute: 'steps',
        res,
        uid,
        user: userData,
        field: {
          type: this.settingsService.getTypeDataOfField(field.field),
          title: await this.getWidgetFieldTitle(field.field, field.title),
          field_name: field?.field,
          default_value: field?.default || undefined,
          unique: field?.unique ?? false,
          validations: await this.getWidgetValidations(field.validations),
        },
      });
    }

    if (isRegistration) {
      if (!userData.password) userData.password = '';
      delete userData.id;
    }

    const { id, ...data } = userData;
    const custom_fields = Object.keys(data).reduce((acc, field) => {
      if (
        allFields.find((f) => f.field === field && f.type === settings.ProfileFieldTypes.custom)
      ) {
        acc[field] = data[field];
        delete userData[field];
      }
      return acc;
    }, {});
    const general_fields = Object.keys(data).reduce<Record<string, unknown>>((acc, field) => {
      if (
        allFields.find((f) => f.field === field && f.type === settings.ProfileFieldTypes.general)
      ) {
        const type = this.settingsService.getTypeDataOfField(field);
        let value = data[field];
        switch (type) {
          case 'boolean':
            value = Boolean(data[field]);
            break;
          case 'number':
            value = Number(data[field]);
            break;
          case 'string':
            value = String(data[field]).trim();
            break;
          default:
            break;
        }
        acc[field] = value;
        delete userData[field];
      }
      return acc;
    }, {});

    await this.userData.upsert(
      uid,
      {
        ...userData,
        ...(id ? { id: String(id) } : {}),
      },
      3600,
    );
    const registrationLocale =
      typeof userData.locale === 'string' &&
      Object.values(ELocales).includes(userData.locale as ELocales)
        ? (userData.locale as ELocales)
        : undefined;
    const interactionOrganizationId =
      client.client_id !== CLIENT_ID
        ? await helpers.getOrganizationId(client.client_id)
        : CLIENT_ID;
    const targetOrganizationId =
      interactionOrganizationId === CLIENT_ID ? null : interactionOrganizationId;

    let user: UserModel | undefined;
    if (isRegistration) {
      if (client.authorize_only_employees) {
        if (!userData.email) throw new ForbiddenException(enums.Ei18nCodes.T3E0026);

        const invite = await prisma.clientInvitation.findFirst({
          where: {
            client_id: client.client_id,
            email: userData.email,
          },
        });

        if (!invite) throw new ForbiddenException(enums.Ei18nCodes.T3E0026);
      }

      user = await this.userService.create(
        {
          ...(general_fields as any),
          ...(general_fields.email ? { email_verified: true } : {}),
          ...(general_fields.phone_number ? { phone_number_verified: true } : {}),
          ...(registrationLocale ? { locale: registrationLocale } : {}),
          custom_fields: custom_fields as any,
        },
        { profileFieldScopeOrganizationId: targetOrganizationId },
      );
    } else {
      await this.userService.update(
        id,
        {
          ...general_fields,
          ...(general_fields.email ? { email_verified: true } : {}),
          ...(general_fields.phone_number ? { phone_number_verified: true } : {}),
          custom_fields: custom_fields as any,
        },
        enums.UserRoles.OWNER,
        undefined,
        targetOrganizationId,
      );
      user = await this.requireUser(String(id));
    }

    if (isRegistration) {
      await this.userData.upsert(
        uid,
        {
          ...userData,
          id: user.id,
        },
        3600,
      );
      await this.mfa1.upsert(
        uid,
        {
          client_id: client.client_id,
          user_id: user.id,
          type: 'registration',
        },
        3600,
      );
      await this.mfa2.upsert(uid, true, 3600);
    }

    await this.finishAuthorization({
      req,
      res,
      user,
      client,
      uid,
      type: isRegistration ? 'registration' : 'handleFillRequired',
    });
  }

  /**
   * Checks for the presence of required fields in the user object.
   * For the base application (CLIENT_ID) and organizations (parent_id = null), this is a standard check.
   * For other applications, it additionally checks the rules in client_rules and the public nature of the fields.
   */
  async checkRequiredFields(
    res: Response,
    client: ClientWithRules,
    user: any,
  ): Promise<{
    missingRequiredFields: ProfileRuleModel[];
    privateRequiredFields: ProfileRuleModel[];
  }> {
    let userData = user;
    const missingRequiredFields: ProfileRuleModel[] = [];
    const privateRequiredFields: ProfileRuleModel[] = [];
    const isCollectedUserData = !user.updated_at;
    const hasCollectedEmail =
      isCollectedUserData && Object.prototype.hasOwnProperty.call(user, 'email');
    const hasCollectedPhone =
      isCollectedUserData && Object.prototype.hasOwnProperty.call(user, 'phone_number');

    // If the user is an administrator and the client is a system application, skip the check
    if (user.id === '1' && client.client_id === CLIENT_ID)
      return { missingRequiredFields: [], privateRequiredFields: [] };

    // Get all rules
    const allRules = await this.settingsService.getAllRules(false, {
      clientId: client.client_id,
    });

    const ignoreRequiredFieldsForClients = await this.settingsService.getSettingsByName<boolean>(
      settings.ESettingsNames.ignore_required_fields_for_clients,
    );

    // Get basic rules
    const baseRules = allRules.filter((rule) => {
      return rule.active && rule.required;
    });

    // Get application rules
    const clientRules = client.rules.filter((rule) => rule.rule.active).map((rule) => rule.rule);

    // Determine the application type
    const isBaseApp = client.client_id === CLIENT_ID;
    const isOrganization = client.parent_id === null;
    const isSmallApp = !isBaseApp && !isOrganization;

    if (!user.updated_at && user.id && user.id !== '0') {
      const userProfile = await this.loadUser(user.id);
      userData = { ...userProfile, ...user };
    }

    // Get a list of fields
    const { hashed_password: password, ...restUser } = userData;

    // requiredFields must be generated in the order listed in allRules
    const requiredFieldNamesArr = [
      ...(ignoreRequiredFieldsForClients && isSmallApp ? [] : baseRules.map((r) => r.field_name)),
      ...clientRules.map((r) => r.field_name),
    ];
    let requiredFieldNames = requiredFieldNamesArr.filter(
      (name, idx) => requiredFieldNamesArr.indexOf(name) === idx,
    );

    const requiredFields = allRules.filter((rule) => requiredFieldNames.includes(rule.field_name));

    // Generate a list of field rules that must be filled
    for (const rule of requiredFields) {
      const generalFieldValue = { password, ...restUser }[rule.field_name];
      const customFieldValue = restUser.custom_fields?.[rule.field_name];

      const hasConfirmedEmail = restUser.email_verified === true || hasCollectedEmail;
      const hasConfirmedPhone = restUser.phone_number_verified === true || hasCollectedPhone;
      const isMissingEmail = rule.field_name === 'email' && (!restUser.email || !hasConfirmedEmail);
      const isMissingPhone =
        rule.field_name === 'phone_number' && (!restUser.phone_number || !hasConfirmedPhone);

      if (isMissingEmail || isMissingPhone || (!generalFieldValue && !customFieldValue)) {
        missingRequiredFields.push(allRules.find((r) => r.field_name === rule.field_name));
      }
    }

    if (isSmallApp && clientRules.length) {
      const publicFields = (user.public_profile_claims_oauth || 'id').split(' ');
      for (let index = 0; index < clientRules.length; index++) {
        const element = clientRules[index];
        if (!publicFields.includes(element.field_name)) {
          privateRequiredFields.push(allRules.find((r) => r.field_name === element.field_name));
        }
      }
    }

    // If there are missing required fields, set a cookie with a unique identifier
    if (missingRequiredFields.length || privateRequiredFields.length) {
      const uid = uuidv4();
      await this.requiredAccountsInfoAdapter.upsert(uid, { id: user.id }, BIND_UID_TTL);
      res.cookie('required_accounts_info_uid', uid, {
        httpOnly: true,
        secure: true,
      });
      return { missingRequiredFields, privateRequiredFields };
    }

    return { missingRequiredFields: [], privateRequiredFields: [] };
  }

  async redirectToMissingAccounts(
    res: Response,
    req: Request,
    client: ClientWithRules,
    user: UserModel,
    uid: string,
  ) {
    const { missingProviderIds } =
      (await this.checkOnMissingRequiredProviders(res, client, user)) || {};
    const { missingRequiredFields, privateRequiredFields } = await this.checkRequiredFields(
      res,
      client,
      user,
    );

    const allFields = await this.settingsService.getProfileFields(undefined, {
      clientId: client.client_id,
    });

    if (missingRequiredFields.length || privateRequiredFields.length) {
      let userData = (await this.userData.find(uid)) || {};
      userData = { ...userData, id: userData.id || user.id };
      await this.userData.upsert(uid, userData, 3600);

      if (missingRequiredFields.length) {
        const field = this.requireProfileField(allFields, missingRequiredFields[0].field_name);
        return renderWidget({
          client,
          initialRoute: 'steps',
          res,
          uid,
          user: userData,
          field: {
            type: this.settingsService.getTypeDataOfField(field.field),
            title: await this.getWidgetFieldTitle(field.field, field.title),
            field_name: field.field,
            default_value: field.default || undefined,
            unique: field.unique ?? false,
            validations: await this.getWidgetValidations(field.validations),
          },
        });
      }

      const prf = privateRequiredFields.map((rule) => rule);
      const fields = await Promise.all(
        prf.map(async (element) => {
          const field = this.requireProfileField(allFields, element.field_name);

          return this.getWidgetFieldTitle(field.field, field.title);
        }),
      );

      return renderWidget({
        client,
        initialRoute: 'publicity',
        res,
        uid,
        user: userData,
        privateRequiredFields: fields,
      });
    }

    if (missingProviderIds) {
      const providers = await prisma.provider.findMany({
        where: {
          id: { in: missingProviderIds.map((id) => String(id)) },
        },
        select: {
          avatar: true,
          description: true,
          id: true,
          name: true,
          type: true,
          is_public: true,
        },
      });
      return renderWidget({
        client,
        initialRoute: 'missing-identifiers',
        res,
        uid,
        user,
        providers,
      });
    }
    return false;
  }

  async checkOnMissingRequiredProviders(res: Response, client: ClientWithRules, user: UserModel) {
    if (user.id === '1' && client.client_id === CLIENT_ID) return;

    if (client.required_providers_ids?.length) {
      // Remove empty values
      client.required_providers_ids = client.required_providers_ids.filter((id) => !!id);
      if (!client.required_providers_ids.length) return;

      const externalAccounts = await prisma.externalAccount.findMany({
        where: { user_id: user.id },
        select: { issuer: true, type: true, rest_info: true },
      });

      const providers = await prisma.provider.findMany({
        where: { id: { in: client.required_providers_ids.map((id) => String(id)) } },
      });

      const missingRequiredProvidersIds = providers.reduce((acc: string[], item) => {
        if (item.type === enums.EProviderTypes.PHONE) {
          return acc;
        }

        if (
          item.type === enums.EProviderTypes.EMAIL ||
          item.type === enums.EProviderTypes.CREDENTIALS
        ) {
          return acc;
        }

        if (!this.hasAccountForProvider(item, externalAccounts)) {
          acc.push(`${item.id}`);
        }

        return acc;
      }, []);
      if (missingRequiredProvidersIds?.length) {
        const uid = uuidv4();
        await this.requiredAccountsInfoAdapter.upsert(uid, { id: user.id }, BIND_UID_TTL);
        res.cookie('required_accounts_info_uid', uid, {
          httpOnly: true,
          secure: true,
        });
        res.cookie('_req_ids', missingRequiredProvidersIds, {
          httpOnly: true,
          secure: true,
        });
        return {
          missingProviderIds: missingRequiredProvidersIds,
        };
      }
    }
  }

  async getUserByAccessToken(accessToken: string): Promise<UserModel> {
    const { active, user_id } = await this.oidcService.tokenIntrospection(accessToken);

    if (!active) throw new common.BadRequestException(enums.Ei18nCodes.T3E0068);

    return this.requireUser(user_id);
  }

  /**
   * General authorization method
   */
  async authByType(params: IAuthByTypeParams): Promise<any> {
    let authResult: IAuthResult;

    await this.callEventsService.call(CallEventNames.Authentication.beforeByType, {
      params,
    } satisfies AuthenticationBeforeByTypePayload);

    switch (params.type) {
      case 'session':
        authResult = await this.prepareSessionAuth(params);
        break;

      case 'CREDENTIALS':
      case 'login':
        try {
          authResult = await this.prepareCredentialsAuth(params);
        } catch (error) {
          const providerId = this.extractProviderId(params.body, params.req);
          const initialRoute =
            params.type === enums.EProviderTypes.CREDENTIALS
              ? providerId
                ? `credentials/${providerId}`
                : 'credentials'
              : 'password';
          const locale = await this.settingsService.getSettingsByName<{ default_language: string }>(
            settings.ESettingsNames.i18n,
          );
          const providers = await this.providerService.getList(
            { only_active: true },
            params.client.client_id,
            UserRoles.NONE,
          );
          const loggedUsers = JSON.stringify(
            await getLoggedUsers(params.req, params.res, this.loggedUsersInfo),
          );
          return renderWidget({
            res: params.res,
            client: params.client,
            uid: params.uid,
            initialRoute,
            loggedUsers,
            providers: [...providers.big, ...providers.small],
            username: params.body?.identifier || params.body?.login || '',
            messageDetail: this.i18nService.translate(this.extractAuthErrorMessage(error), {
              lang: locale?.default_language ?? 'ru',
            }),
          });
        }
        break;

      default:
        try {
          authResult = await this.prepareProviderAuth(params);
        } catch (error) {
          const errorMessage = this.extractAuthErrorMessage(error);

          if (errorMessage !== enums.Ei18nCodes.T3E0038) {
            throw error;
          }

          const providerId = this.extractProviderId(params.body, params.req);
          const provider = providerId
            ? await prisma.provider.findFirst({
                where: {
                  id: providerId,
                  type: {
                    in: [enums.EProviderTypes.TOTP, enums.EProviderTypes.HOTP],
                  },
                },
              })
            : null;

          if (!provider) {
            throw error;
          }

          const isOtpSetup = params.body?.otp_setup === true || params.body?.otp_setup === 'true';
          const firstFactor = isOtpSetup ? null : await this.mfa1.find(params.uid);
          const authStage = isOtpSetup
            ? 'second-factor-enrollment'
            : firstFactor?.user_id
            ? 'second-factor-challenge'
            : undefined;

          const locale = await this.settingsService.getSettingsByName<{
            default_language: string;
          }>(settings.ESettingsNames.i18n);
          const localizedError = this.i18nService.translate(errorMessage, {
            lang: locale?.default_language ?? 'ru',
          }) as string;

          return renderWidget({
            res: params.res,
            client: params.client,
            uid: params.uid,
            initialRoute: `${provider.type.toLowerCase()}/${provider.id}`,
            authStage,
            providers: [this.toWidgetProvider(provider)],
            username: authStage ? undefined : params.body?.identifier || '',
            formErrors: {
              code: localizedError,
            },
          });
        }
        break;
    }

    if (
      authResult.renderWidgetParams &&
      authResult.renderWidgetParams.initialRoute === 'steps' &&
      !authResult.user
    ) {
      return this.finishAuthorization({
        req: params.req,
        res: params.res,
        user: authResult.user,
        client: params.client,
        uid: params.uid,
        type: authResult.type,
        provider: authResult.provider,
        loginEmail: authResult.loginEmail,
        renderWidgetParams: authResult.renderWidgetParams,
      });
    }

    if (authResult.renderWidgetParams) {
      return renderWidget({
        res: params.res,
        client: params.client,
        uid: params.uid,
        ...authResult.renderWidgetParams,
      });
    }

    return this.finishAuthorization({
      req: params.req,
      res: params.res,
      user: authResult.user,
      client: params.client,
      uid: params.uid,
      type: authResult.type,
      provider: authResult.provider,
      loginEmail: authResult.loginEmail,
    });
  }

  /**
   * Authorization by session
   */
  async prepareSessionAuth(params: IAuthByTypeParams): Promise<IAuthResult> {
    const { req } = params;

    const token =
      typeof req.query.token === 'string'
        ? req.query.token
        : typeof params.body?.token === 'string'
        ? params.body.token
        : undefined;
    if (!token || typeof token !== 'string') {
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0015);
    }

    const user = await this.getUserBySessionToken(token, this.loggedUsersTokens);

    return {
      user,
      type: 'session',
      shouldUpdateSession: true,
    };
  }

  async prepareCredentialsAuth(params: IAuthByTypeParams): Promise<IAuthResult> {
    const { body, providers } = params;

    const provider = providers.find((p) => p.provider.type === enums.EProviderTypes.CREDENTIALS);
    if (!provider) {
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0030);
    }

    helpers.validateDto(body, interactionDto.InteractionLoginDto);
    const user = await this.getUserByPassword(body);
    return {
      user,
      type: enums.EProviderTypes.CREDENTIALS,
      provider: provider.provider,
    };
  }

  async prepareProviderAuth(params: IAuthByTypeParams): Promise<IAuthResult> {
    const { type, req, res, body, uid, providers } = params;

    let provider_id = this.extractProviderId(body, req);

    if (type.toLowerCase() === 'email') {
      const emailProvider = providers.find(
        (p) => p.provider.type.toLowerCase() === type.toLowerCase(),
      );
      provider_id = emailProvider?.provider_id;
      Object.assign(body, {
        code: body?.code || req.query.code,
        email: body?.email || req.query.email,
      });

      const emailCodeData = await this.emailCodeData.find(body.email);
      if (emailCodeData && emailCodeData.status) {
        Object.assign(body, { code: emailCodeData.code });
        //   await this.emailCodeData.destroy(body.email);
      }
    }

    if (type.toUpperCase() === 'MTLS') {
      Object.assign(body, {
        state: req.query.state,
        error: req.query.error,
      });
    }

    if (!provider_id) {
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0030);
    }

    const provider = await prisma.provider.findUnique({ where: { id: String(provider_id) } });
    if (!provider) {
      throw new common.BadRequestException(enums.Ei18nCodes.T3E0030);
    }

    const providerService = this.providerFactory.getProviderService(provider.type);

    const { user, renderWidgetParams, loginEmail } = await providerService.onAuth(
      body,
      uid,
      provider,
      req,
      res,
    );
    const resolvedUser = user ? await this.requireUser(user.id) : undefined;

    if (renderWidgetParams) {
      return {
        user: resolvedUser,
        provider,
        type: providerService.type,
        loginEmail,
        renderWidgetParams,
      };
    }

    return {
      user: resolvedUser,
      provider,
      type: providerService.type,
      loginEmail,
      password_required: provider.password_required,
    };
  }

  async validateProviderAccess(
    provider_id: string,
    providers: any[],
    isTwoFactor: boolean,
  ): Promise<void> {
    if (!isTwoFactor) {
      const providerRelation = providers.find((p) => p.provider.id === provider_id);
      if (!providerRelation?.provider) {
        throw new common.BadRequestException(enums.Ei18nCodes.T3E0030);
      }
    }
  }

  private extractProviderId(body: any, req: Request): string | undefined {
    return body?.provider_id
      ? String(body.provider_id)
      : typeof req.query.provider_id === 'string'
      ? req.query.provider_id
      : undefined;
  }

  private extractAuthErrorMessage(error: unknown): string {
    if (error instanceof common.HttpException) {
      const response = error.getResponse() as {
        text?: string;
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(response?.message)) {
        return response.message[0] || error.message;
      }

      const message = response?.text || response?.message || response?.error || error.message;
      const cause = (error as Error & { cause?: unknown }).cause;

      if (message === enums.Ei18nCodes.T3E0093 && typeof cause === 'string' && cause.trim()) {
        return cause;
      }

      return message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error ?? '');
  }
}

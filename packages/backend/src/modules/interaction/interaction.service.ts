import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client, ClientRule, Provider, Rule, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { isEmail } from 'class-validator';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import { BIND_UID_TTL, CLIENT_ID } from '../../constants';
import {
  EClaimPrivacy,
  Ei18nCodes,
  EProviderTypes,
  RegistrationPolicyVariants,
  UserRoles,
} from '../../enums';
import {
  getIdentifierType,
  maskEmail,
  prepareIdentifier,
  preparePhoneNumber,
  validateDto,
} from '../../helpers';
import { CustomLogger } from '../logger/logger.service';
import { OidcService } from '../oidc/oidc.service';
import { prisma } from '../prisma/prisma.client';
import { MailCodeTypes } from '../providers/collection/email/email.dto';
import { IProvider, ProviderFactory } from '../providers/factory.service';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import {
  AuthMethodTypes,
  ESettingsNames,
  listProfileFields,
  ProfileFieldTypes,
  TwoFactorAuthenticationDto,
  UserProfileFields,
} from '../settings';
import { SettingsService } from '../settings/settings.service';
import { UsersService } from '../users/users.service';
import * as interactionDto from './interaction.dto';
import { renderWidget, saveLoggedUserSession } from './interaction.helpers';

// Extended Client type with client_rules
type ClientWithRules = Client & {
  rules?: (ClientRule & {
    rule: Rule;
  })[];
};

export interface IFinishAuthorization {
  req: Request;
  res: Response;
  user?: User;
  client: ClientWithRules;
  uid: string;
  type: string;
  provider?: Provider;
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
  user?: User;
  provider?: Provider;
  password_required?: boolean;
  type: string;
  renderWidgetParams?: any;
  shouldUpdateSession?: boolean;
}

@Injectable()
export class InteractionService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly logger: CustomLogger,
    private readonly oidcService: OidcService,
    private readonly providerFactory: ProviderFactory,
    private readonly settingsService: SettingsService,
    private readonly i18nService: I18nService,
  ) {}

  mfa1 = new RedisAdapter(REDIS_PREFIXES.MFA1);
  mfa2 = new RedisAdapter(REDIS_PREFIXES.MFA2);
  bindData = new RedisAdapter(REDIS_PREFIXES.BindData);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  emailCodeData = new RedisAdapter(REDIS_PREFIXES.EmailCode);

  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  loggedUsersTokens = new RedisAdapter(REDIS_PREFIXES.LoggedUserToken);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  twoFactorAuthenticationAdapter = new RedisAdapter(REDIS_PREFIXES.TwoFactorAuthentication);

  async getUserByPassword({
    identifier,
    password,
  }: {
    identifier: string;
    password: string;
  }): Promise<User> {
    if (!password) throw new ForbiddenException(Ei18nCodes.T3E0001);

    const identifierType = getIdentifierType(identifier);
    const preparedIdentifier = prepareIdentifier(identifier, identifierType);
    let passwordVerified: boolean;

    const users = await prisma.user.findMany({
      where: {
        [identifierType]:
          typeof preparedIdentifier === 'number'
            ? preparedIdentifier
            : { equals: preparedIdentifier },
      },
    });
    if (users.length > 1) throw new BadRequestException(Ei18nCodes.T3E0032);
    const user = users[0];

    if (user) passwordVerified = await bcrypt.compare(password, user.hashed_password);
    if (!passwordVerified) throw new ForbiddenException(Ei18nCodes.T3E0001);

    return user;
  }

  async findUserByIdentifier({ identifier }: { identifier: string }): Promise<User | null> {
    const identifierType = getIdentifierType(identifier);
    const preparedIdentifier = prepareIdentifier(identifier, identifierType);

    const users = await prisma.user.findMany({
      where: {
        [identifierType]:
          typeof preparedIdentifier === 'number'
            ? preparedIdentifier
            : { equals: preparedIdentifier },
      },
    });
    if (users.length > 1) throw new BadRequestException(Ei18nCodes.T3E0032);
    if (!users.length) return null;
    const user = users[0];

    return user;
  }

  async getUserByIdentifier({ identifier }: { identifier: string }): Promise<User> {
    const user = await this.findUserByIdentifier({ identifier });
    if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);

    return user;
  }

  /**
   * Saving user scopes.
   * When consent is granted to the application to access user data, the scopes are saved in the database.
   */
  async saveUserScopes(userId: string, clientId: string, scopes: string): Promise<void> {
    const user_id = parseInt(userId, 10);

    await prisma.scopes.upsert({
      where: { user_id_client_id: { user_id, client_id: clientId } },
      update: { user_id, client_id: clientId, scopes },
      create: { user_id, client_id: clientId, scopes },
    });
  }

  async findUserScopes(accountId: string, client_id: string): Promise<string> {
    const data = await prisma.scopes.findUnique({
      where: { user_id_client_id: { user_id: parseInt(accountId, 10), client_id } },
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

      interactionDetails.prompt.details.missingOIDCScope = missingScopes.join(',');
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
    const { provider } = await prisma.provider_relations.findFirst({
      where: {
        client_id,
        provider_id: parseInt(provider_id, 10),
      },
      include: { provider: true },
    });
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);
    return provider;
  }

  async getClient(client_id: string): Promise<ClientWithRules> {
    const client = await prisma.client.findFirst({
      where: { client_id: client_id },
      include: {
        rules: {
          include: {
            rule: true,
          },
        },
      },
    });
    if (!client) throw new BadRequestException(Ei18nCodes.T3E0071);

    return client;
  }

  async getUserBySessionToken(
    token: string,
    loggedUsersTokens: RedisAdapter,
  ): Promise<User | undefined> {
    const userId = await loggedUsersTokens.get<string>(token);
    if (!userId) throw new ForbiddenException(Ei18nCodes.T3E0075);

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!user) throw new ForbiddenException(Ei18nCodes.T3E0075);

    return user;
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    const { sessionToken } = (await this.loggedUsersInfo.get(sessionId)) || {};
    await this.loggedUsersInfo.destroy(sessionId);
    await this.loggedUsersTokens.destroy(sessionToken);
  }

  async isTwoFactorRequiredForAuthType(type: string) {
    const twoFactorSettings =
      await this.settingsService.getSettingsByName<TwoFactorAuthenticationDto>(
        ESettingsNames.two_factor_authentication,
      );
    let ok = false;
    switch (type.toUpperCase()) {
      case 'LOGIN':
      case EProviderTypes.CREDENTIALS:
        ok = twoFactorSettings.controlled_methods.includes(AuthMethodTypes.login);
        break;
      case EProviderTypes.ETHEREUM:
      case EProviderTypes.EMAIL:
      case EProviderTypes.KLOUD:
      case EProviderTypes.PHONE:
      case EProviderTypes.TOTP:
        ok = twoFactorSettings.controlled_methods.includes(AuthMethodTypes.otp);
        break;
      case EProviderTypes.CUSTOM:
      case EProviderTypes.GOOGLE:
        ok = twoFactorSettings.controlled_methods.includes(AuthMethodTypes.oauth);
        break;
      case EProviderTypes.WEBAUTHN:
        ok = twoFactorSettings.controlled_methods.includes(AuthMethodTypes.webauthn);
        break;
      case EProviderTypes.MTLS:
        ok = twoFactorSettings.controlled_methods.includes(AuthMethodTypes.mtls);
        break;
      case 'SESSION':
        ok = twoFactorSettings.controlled_methods.includes(AuthMethodTypes.session);
        break;
      case 'RELOAD':
        ok = true;
        break;
    }
    return ok;
  }

  async identityVerification(params: IFinishAuthorization) {
    const ok = await this.settingsService.getSettingsByName<boolean>(
      ESettingsNames.prohibit_identifier_binding,
    );
    if (ok) throw new BadRequestException(Ei18nCodes.T3E0067);

    if (params.provider) {
      let bindAccounts = await this.bindData.find(params.uid);
      bindAccounts = bindAccounts || [];
      bindAccounts.push({
        type: params.provider.type,
        provider_id: params.provider.id,
      });
      await this.bindData.upsert(params.uid, bindAccounts, 3600);
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
                in: [EProviderTypes.CREDENTIALS, EProviderTypes.EMAIL, EProviderTypes.PHONE],
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
            (params.provider.type === EProviderTypes.EMAIL &&
              provider.type === EProviderTypes.EMAIL_CUSTOM) ||
            (params.provider.type === EProviderTypes.EMAIL_CUSTOM &&
              provider.type === EProviderTypes.EMAIL)
          ) {
            return false;
          }

          // Exclude KLOUD if provider is PHONE, and vice versa
          if (
            (params.provider.type === EProviderTypes.PHONE &&
              provider.type === EProviderTypes.KLOUD) ||
            (params.provider.type === EProviderTypes.KLOUD &&
              provider.type === EProviderTypes.PHONE)
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
                (account.type === EProviderTypes.EMAIL &&
                  provider.type === EProviderTypes.EMAIL_CUSTOM) ||
                (account.type === EProviderTypes.EMAIL_CUSTOM &&
                  provider.type === EProviderTypes.EMAIL)
              ) {
                return true;
              }

              // Exclude KLOUD if account is PHONE, and vice versa
              if (
                (account.type === EProviderTypes.PHONE && provider.type === EProviderTypes.KLOUD) ||
                (account.type === EProviderTypes.KLOUD && provider.type === EProviderTypes.PHONE)
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
    const user = mfa1.user_id
      ? await prisma.user.findUnique({ where: { id: mfa1.user_id } })
      : userData;

    params.user = user;
    await this.finishAuthorization(params);
  }

  async finishAuthorization(params: IFinishAuthorization) {
    // ROOT
    if (params.client.client_id === CLIENT_ID && params.user?.id === 1) {
      await this.logger.logEvent({
        ip_address: params.req.ip,
        device: params.req.headers['user-agent'],
        user_id: params.user.id.toString(),
        client_id: params.client.client_id,
        event: 'USER_LOGIN_SUCCESS',
        description: '',
        details: { type: params.type },
      });
      const result = { login: { accountId: params.user.id.toString(), remember: false } };
      return this.oidcService.interactionFinished(
        params.req,
        params.res,
        result,
        params.uid,
        false,
      );
    }

    if (!params.user) {
      let bindAccounts = await this.bindData.find(params.uid);
      bindAccounts = bindAccounts || [];
      bindAccounts.push({
        type: params.provider.type,
        provider_id: params.provider.id,
      });
      await this.bindData.upsert(params.uid, bindAccounts, 3600);

      const prohibit_identifier_binding = await this.settingsService.getSettingsByName<boolean>(
        ESettingsNames.prohibit_identifier_binding,
      );
      const registration_policy =
        await this.settingsService.getSettingsByName<RegistrationPolicyVariants>(
          ESettingsNames.registration_policy,
        );
      if (
        registration_policy !== RegistrationPolicyVariants.allowed &&
        !prohibit_identifier_binding
      ) {
        return this.identityVerification(params);
      }
      if (
        registration_policy === RegistrationPolicyVariants.allowed &&
        prohibit_identifier_binding
      ) {
        return this.steps({}, params.req, params.res);
      }

      return renderWidget({
        initialRoute: 'bind',
        uid: params.uid,
        res: params.res,
        client: params.client,
      });
    }

    await this.settingsService.canAuthorize(params.user.id, params.client);

    const bindAccounts = await this.bindData.find(params.uid);
    if (bindAccounts && params.type !== 'registration') {
      const isHasIdentifier = await prisma.externalAccount.findFirst({
        where: {
          type: {
            in: bindAccounts.map((account) => {
              if (account.type === EProviderTypes.EMAIL_CUSTOM) return EProviderTypes.EMAIL;
              if (account.type === EProviderTypes.KLOUD) return EProviderTypes.PHONE;
              return account.type;
            }),
          },
          user_id: params.user.id,
        },
      });
      if (isHasIdentifier) {
        await this.clearAuthRedis(params.uid);
        throw new BadRequestException(Ei18nCodes.T3E0084, { cause: isHasIdentifier.type });
      }
    }

    const twoFactorSettings =
      await this.settingsService.getSettingsByName<TwoFactorAuthenticationDto>(
        ESettingsNames.two_factor_authentication,
      );

    const mfa_1 = await this.mfa1.find(params.uid);
    if (!mfa_1) {
      if (params.type.toUpperCase() !== 'SESSION' && params.type.toUpperCase() !== 'RELOAD') {
        if (!params.provider) throw new InternalServerErrorException(Ei18nCodes.T3E0030);
        if (!bindAccounts || !bindAccounts.length) {
          await this.getProvider(params.client.client_id, params.provider.id.toString());
        } else {
          let providerFound = false;
          for (const account of bindAccounts) {
            try {
              await this.getProvider(params.client.client_id, account.provider_id.toString());
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
        const available_provider_ids = params.provider
          ? twoFactorSettings.available_provider_ids.filter((id) => id !== params.provider.id)
          : twoFactorSettings.available_provider_ids;

        if (available_provider_ids.length) {
          let providers = await prisma.provider.findMany({
            where: { id: { in: available_provider_ids } },
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
                (params.provider.type === EProviderTypes.EMAIL &&
                  provider.type === EProviderTypes.EMAIL_CUSTOM) ||
                (params.provider.type === EProviderTypes.EMAIL_CUSTOM &&
                  provider.type === EProviderTypes.EMAIL)
              ) {
                return false;
              }

              // Exclude KLOUD if provider is PHONE, and vice versa
              if (
                (params.provider.type === EProviderTypes.PHONE &&
                  provider.type === EProviderTypes.KLOUD) ||
                (params.provider.type === EProviderTypes.KLOUD &&
                  provider.type === EProviderTypes.PHONE)
              ) {
                return false;
              }

              return true;
            });
          }

          return renderWidget({
            initialRoute: 'identifiers',
            providers,
            uid: params.uid,
            res: params.res,
            client: params.client,
          });
        }
      }
      await this.mfa2.upsert(params.uid, true, 3600);
    }

    // Check MFA2
    const mfa_2 = await this.mfa2.find(params.uid);
    if (!mfa_2) {
      if (mfa_1.user_id !== params.user.id) {
        await this.clearAuthRedis(params.uid);
        throw new BadRequestException(Ei18nCodes.T3E0085);
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
          case EProviderTypes.EMAIL_CUSTOM:
          case EProviderTypes.EMAIL:
            const emailData = await this.userData.find(params.uid);
            if (emailData && emailData.email) {
              await this.userService.changeEmail(emailData.email, params.user.id.toString());
              delete emailData.email;
              await this.userData.upsert(params.uid, emailData, 3600);
            }
            break;
          case EProviderTypes.KLOUD:
          case EProviderTypes.PHONE:
            const phoneData = await this.userData.find(params.uid);
            if (phoneData && phoneData.phone_number) {
              await this.userService.changePhone(phoneData.phone_number, params.user.id.toString());
              delete phoneData.phone_number;
              await this.userData.upsert(params.uid, phoneData, 3600);
            }
            break;

          default:
            const provider = await prisma.provider.findUnique({
              where: { id: account.provider_id },
            });
            await this.userService.bindAccount(params.user.id.toString(), provider.type, {
              ...account.data,
              issuer: provider.params['issuer'],
            });
        }
        bindAccounts.splice(i, 1);
        await this.bindData.upsert(params.uid, bindAccounts);
      }
    }

    params.user = await prisma.user.findUnique({
      where: { id: params.user.id },
    });

    const redirected = !!(await this.redirectToMissingAccounts(
      params.res,
      params.req,
      params.client,
      params.user,
      params.uid,
    ));
    if (redirected) return;

    if (params.user.email) {
      await prisma.clientInvitation.deleteMany({
        where: { client_id: params.client.client_id, email: params.user.email },
      });
    }

    await saveLoggedUserSession(
      params.req,
      params.res,
      this.loggedUsersInfo,
      this.loggedUsersTokens,
      params.user,
    );

    const result = { login: { accountId: params.user.id.toString(), remember: false } };

    await this.logger.logEvent({
      ip_address: params.req.ip,
      device: params.req.headers['user-agent'],
      user_id: params.user.id.toString(),
      client_id: params.client.client_id,
      event: 'USER_LOGIN_SUCCESS',
      description: '',
      details: { type: params.type },
    });

    await this.clearAuthRedis(params.uid);
    await this.oidcService.interactionFinished(params.req, params.res, result, params.uid, false);
  }

  private async clearAuthRedis(uid: string) {
    await this.mfa1.destroy(uid);
    await this.mfa2.destroy(uid);
    await this.userData.destroy(uid);
    await this.bindData.destroy(uid);
  }

  async recoverPassword(dto: any, req: Request, res: Response) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);
    const client = await this.getClient(client_id as string);

    let user = await this.findUserByIdentifier({ identifier: dto.identifier });
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }
    await this.settingsService.canAuthorize(user.id, null);

    const service = this.providerFactory.getProviderService(EProviderTypes.EMAIL);
    if (!user.email) throw new BadRequestException(Ei18nCodes.T3E0057);

    if (dto.code || dto.password) {
      if (!dto.code) throw new BadRequestException(Ei18nCodes.T3E0088);
      if (!dto.password) throw new BadRequestException(Ei18nCodes.T3E0088);
      await this.userService.checkValidPassword(dto.password);
      await service.confirm(user.email, dto.code);
      await this.userService.changePassword({ password: dto.password }, user.id.toString(), '0');
      return renderWidget({
        initialRoute: 'success',
        uid,
        res,
        client,
      });
    }

    await service.verificationCode(
      {
        type: EProviderTypes.EMAIL,
        email: user.email,
        uid,
        code_type: MailCodeTypes.recoverPassword,
        user_id: user.id.toString(),
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
        title: field[0].title,
        field_name: field[0].field,
        default_value: field[0].default || undefined,
        validations: field[0].validations.filter((v) => v.active),
      },
      message: maskEmail(user.email),
    });
  }

  async steps(dto: Record<string, any>, req: Request, res: Response) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);
    const client = await this.getClient(client_id as string);

    let userData = (await this.userData.find(uid)) || {};
    const isRegistration = !userData.id || userData.id === 0;

    if (isRegistration) {
      const { registration_policy } = await this.settingsService.getSettings();
      if (registration_policy !== RegistrationPolicyVariants.allowed)
        throw new ForbiddenException(Ei18nCodes.T3E0074);

      userData = { ...userData, id: 0 };
    }

    if (!isRegistration) {
      const public_profile_consent = dto.public_profile_consent;
      delete dto.public_profile_consent;

      if (client.rules.length) {
        if (public_profile_consent) {
          client.rules.map((rule) => rule.rule.field_name);
          await this.userService.setPrivateScopes(
            {
              claim_privacy: EClaimPrivacy.request,
              field: client.rules.map((rule) => rule.rule.field_name).join(' '),
            },
            userData.id,
          );
        }
      }
    }

    const allFields = (await this.settingsService.getProfileFields()).filter(
      (f) => f.field !== UserProfileFields.sub,
    );
    let keyError = '';
    try {
      for (const key of Object.keys(dto)) {
        keyError = key;
        const field = allFields.find((f) => f.field === key);
        if (!field) continue;
        if (!dto[key]) throw new BadRequestException(Ei18nCodes.T3E0088);
        if (field.type === ProfileFieldTypes.general) {
          if (key === 'phone_number') {
            dto.phone_number = preparePhoneNumber(dto.phone_number);
          }
          await this.settingsService.prepareGeneralProfileFields(
            { [key]: dto[key] },
            !isRegistration ? userData.id : undefined,
          );
          if (key === 'email') {
            const emailCodeData = await this.emailCodeData.find(dto.email);
            if (emailCodeData && emailCodeData.status) {
              userData = { ...userData, [key]: dto[key] };
              await this.emailCodeData.destroy(dto.email);
            }

            if (!userData?.email || userData.email !== dto.email)
              throw new BadRequestException(Ei18nCodes.T3E0070);
          } else if (key === 'phone_number') {
            if (!userData?.phone_number || userData.phone_number !== dto.phone_number)
              throw new BadRequestException(Ei18nCodes.T3E0069);
          }
        } else {
          await this.settingsService.prepareCustomFieldsToSave(
            { [key]: dto[key] },
            !isRegistration ? userData.id : undefined,
          );
        }

        userData = { ...userData, [key]: dto[key] };
      }
    } catch (error) {
      const field = allFields.find((f) => f.field === keyError);
      const locale = await this.settingsService.getSettingsByName<{ default_language: string }>(
        ESettingsNames.i18n,
      );
      return renderWidget({
        client,
        initialRoute: 'steps',
        res,
        uid,
        user: userData,
        field: {
          type: this.settingsService.getTypeDataOfField(field.field),
          title: field?.title,
          field_name: field?.field,
          default_value: field?.default || undefined,
          validations: field.validations.filter((v) => v.active),
        },
        message:
          this.i18nService.translate(error['message'], {
            lang: locale.default_language,
          }) + (error['cause'] ? ': ' + error['cause'] : '') || '',
      });
    }

    await this.userData.upsert(uid, userData, 3600);

    const { missingRequiredFields } = await this.checkRequiredFields(res, client, userData);
    if (missingRequiredFields.length) {
      const field = allFields.find((f) => f.field === missingRequiredFields[0].field_name);

      return renderWidget({
        client,
        initialRoute: 'steps',
        res,
        uid,
        user: userData,
        field: {
          type: this.settingsService.getTypeDataOfField(field.field),
          title: field?.title,
          field_name: field?.field,
          default_value: field?.default || undefined,
          validations: field.validations.filter((v) => v.active),
        },
      });
    }

    if (isRegistration) {
      if (!userData.password) userData.password = '';
      delete userData.id;
    }

    const { id, ...data } = userData;
    const custom_fields = Object.keys(data).reduce((acc, field) => {
      if (allFields.find((f) => f.field === field && f.type === ProfileFieldTypes.custom)) {
        acc[field] = data[field];
        delete userData[field];
      }
      return acc;
    }, {});
    const general_fields = Object.keys(data).reduce((acc, field) => {
      if (allFields.find((f) => f.field === field && f.type === ProfileFieldTypes.general)) {
        const type = this.settingsService.getTypeDataOfField(field);
        let value = data[field];
        switch (type) {
          case 'boolean':
            value = Boolean(data[field]);
            break;
          case 'number':
            value = Number(data[field]);
            break;
          default:
            break;
        }
        acc[field] = value;
        delete userData[field];
      }
      return acc;
    }, {});

    await this.userData.upsert(uid, { userData }, 3600);

    let user: User | undefined;
    if (isRegistration) {
      user = await this.userService.create({
        ...(general_fields as any),
        custom_fields: custom_fields as any,
        createByOwner: true,
      });
    } else {
      await this.userService.update(
        id,
        { ...general_fields, custom_fields: custom_fields as any },
        UserRoles.OWNER,
      );
      user = await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });
    }

    if (isRegistration) {
      await this.mfa1.upsert(uid, true, 3600);
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
    user: User,
  ): Promise<{ missingRequiredFields: Rule[]; privateRequiredFields: Rule[] }> {
    let userData = user;
    const missingRequiredFields = [];
    const privateRequiredFields = [];

    // If the user is an administrator and the client is a system application, skip the check
    if (user.id === 1 && client.client_id === CLIENT_ID)
      return { missingRequiredFields: [], privateRequiredFields: [] };

    // Get all rules
    const allRules = await this.settingsService.getAllRules();

    const ignoreRequiredFieldsForClients = await this.settingsService.getSettingsByName<boolean>(
      ESettingsNames.ignore_required_fields_for_clients,
    );

    // Get basic rules
    const baseRules = allRules.filter((rule) => {
      return rule.target === 'USER' && rule.active && rule.required;
    });

    // Get application rules
    const clientRules = client.rules
      .filter((rule) => rule.rule.target === 'USER' && rule.rule.active)
      .map((rule) => rule.rule);

    // Determine the application type
    const isBaseApp = client.client_id === CLIENT_ID;
    const isOrganization = client.parent_id === null;
    const isSmallApp = !isBaseApp && !isOrganization;

    if (!user.updated_at && user.id && user.id !== 0) {
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
      });
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
      if (
        !{ password, ...restUser }[rule.field_name] &&
        !restUser.custom_fields?.[rule.field_name]
      ) {
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
    user: User,
    uid: string,
  ) {
    const { missingProviderIds } =
      (await this.checkOnMissingRequiredProviders(res, client, user)) || {};
    const { missingRequiredFields, privateRequiredFields } = await this.checkRequiredFields(
      res,
      client,
      user,
    );

    const allFields = await this.settingsService.getProfileFields();
    if (missingRequiredFields.length || privateRequiredFields.length) {
      let userData = (await this.userData.find(uid)) || {};
      userData = { ...userData, id: userData.id || user.id };
      await this.userData.upsert(uid, userData, 3600);

      if (missingRequiredFields.length) {
        const field = allFields.find(
          (field) => field.field === missingRequiredFields[0].field_name,
        );
        return renderWidget({
          client,
          initialRoute: 'steps',
          res,
          uid,
          user: userData,
          field: {
            type: this.settingsService.getTypeDataOfField(field.field),
            title: field.title,
            field_name: field.field,
            default_value: field.default || undefined,
            validations: field.validations.filter((v) => v.active),
          },
        });
      }

      const prf = privateRequiredFields.map((rule) => rule);
      const fields: string[] = [];

      const locale = await this.settingsService.getSettingsByName<{ default_language: string }>(
        ESettingsNames.i18n,
      );
      for (const element of prf) {
        const field = allFields.find((field) => field.field === element.field_name);
        const general = listProfileFields.find((f) => f.field === field.field);
        if (general) {
          fields.push(this.i18nService.translate(general.title, { lang: locale.default_language }));
        } else {
          fields.push(this.i18nService.translate(field.title, { lang: locale.default_language }));
        }
      }

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
          id: { in: missingProviderIds.map((id) => parseInt(id, 10)) },
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

  async checkOnMissingRequiredProviders(res: Response, client: ClientWithRules, user: User) {
    if (user.id === 1 && client.client_id === CLIENT_ID) return;

    if (client.required_providers_ids?.length) {
      // Remove empty values
      client.required_providers_ids = client.required_providers_ids.filter(
        (id) => !!id && !Number.isNaN(parseInt(id)),
      );
      if (!client.required_providers_ids.length) return;

      const externalAccounts = await prisma.externalAccount.findMany({
        where: { user_id: user.id },
        select: { issuer: true, type: true },
      });

      const providers = await prisma.provider.findMany({
        where: { id: { in: client.required_providers_ids.map((id) => parseInt(id), 10) } },
      });

      const externalAccountIssuers = externalAccounts.map((item) => {
        return item.issuer;
      });

      const missingRequiredProvidersIds = providers
        .filter((provider) => provider.type !== EProviderTypes.PHONE)
        .reduce((acc: string[], item) => {
          if (item.type === EProviderTypes.KLOUD) {
            !externalAccountIssuers.includes(item.params['issuer']) && acc.push(`${item.id}`);
          } else if (item.type === EProviderTypes.ETHEREUM)
            !externalAccountIssuers.includes(EProviderTypes.ETHEREUM) && acc.push(`${item.id}`);
          else if (item.type !== EProviderTypes.EMAIL && item.type !== EProviderTypes.CREDENTIALS) {
            !externalAccountIssuers.includes(item.params['issuer']) && acc.push(`${item.id}`);
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

  async getUserByAccessToken(accessToken: string): Promise<User> {
    const { active, user_id } = await this.oidcService.tokenIntrospection(accessToken);

    if (!active) throw new BadRequestException(Ei18nCodes.T3E0068);

    return prisma.user.findUnique({
      where: { id: parseInt(user_id, 10) },
    });
  }

  /**
   * General authorization method
   */
  async authByType(params: IAuthByTypeParams): Promise<any> {
    let authResult: IAuthResult;

    switch (params.type) {
      case 'session':
        authResult = await this.prepareSessionAuth(params);
        break;

      case 'CREDENTIALS':
      case 'login':
        authResult = await this.prepareCredentialsAuth(params);
        break;

      default:
        authResult = await this.prepareProviderAuth(params);
        break;
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
    });
  }

  /**
   * Authorization by session
   */
  async prepareSessionAuth(params: IAuthByTypeParams): Promise<IAuthResult> {
    const { req } = params;

    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      throw new BadRequestException(Ei18nCodes.T3E0015);
    }

    const user = await this.getUserBySessionToken(token, this.loggedUsersTokens);

    return {
      user,
      type: 'session',
      shouldUpdateSession: true,
    };
  }

  async prepareCredentialsAuth(params: IAuthByTypeParams): Promise<IAuthResult> {
    const { body, req, res, providers } = params;

    const provider = providers.find((p) => p.provider.type === EProviderTypes.CREDENTIALS);
    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    validateDto(body, interactionDto.InteractionLoginDto);
    let user = await this.getUserByIdentifier(body);

    user = await this.getUserByPassword(body);
    return {
      user,
      type: EProviderTypes.CREDENTIALS,
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

    if (type === 'MTLS') {
      Object.assign(body, {
        state: req.query.state,
        error: req.query.error,
      });
    }

    if (!provider_id) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const provider = await prisma.provider.findUnique({ where: { id: provider_id } });
    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const providerService = this.providerFactory.getProviderService(provider.type);
    const { user, renderWidgetParams } = await providerService.onAuth(
      body,
      uid,
      provider,
      req,
      res,
    );

    if (renderWidgetParams) {
      return {
        user,
        provider,
        type: providerService.type,
        renderWidgetParams,
      };
    }

    return {
      user,
      provider,
      type: providerService.type,
      password_required: provider.password_required,
    };
  }

  async validateProviderAccess(
    provider_id: number,
    providers: any[],
    isTwoFactor: boolean,
  ): Promise<void> {
    if (!isTwoFactor) {
      const providerRelation = providers.find((p) => p.provider.id === provider_id);
      if (!providerRelation?.provider) {
        throw new BadRequestException(Ei18nCodes.T3E0030);
      }
    }
  }

  private extractProviderId(body: any, req: Request): number | undefined {
    return body?.provider_id
      ? parseInt(body.provider_id)
      : typeof req.query.provider_id === 'string'
      ? parseInt(req.query.provider_id)
      : undefined;
  }
}

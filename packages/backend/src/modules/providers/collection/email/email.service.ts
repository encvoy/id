import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { Client, EmailTemplates, Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import * as mustache from 'mustache';
import nodemailer from 'nodemailer';
import { USER_ID_KEY } from 'src/decorators/userId.decorator';
import { prisma } from 'src/modules/prisma/prisma.client';
import { ESettingsNames, UserProfileFields } from 'src/modules/settings';
import { getDefaultLocale, resolveLocalizedText } from 'src/utils/localized-text';
import * as constants from '../../../../constants';
import { Ei18nCodes, ELocales, EProviderTypes, IdentifierType } from '../../../../enums';
import { generateRandomDigits, maskEmail } from '../../../../helpers';
import { TParams, TPrompt } from '../../../oidc/oidc.types';
import { REDIS_PREFIXES, RedisAdapter } from '../../../redis/redis.adapter';
import {
  buildLegacyIdentifierWhere,
  legacyUserInclude,
  toLegacyUser,
} from '../../../repository/user-compat';
import {
  getLegacyUserPrimaryExternalAccountEmail,
  legacyUserEmailExternalAccountTypes,
} from '../../../repository/user-search';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { ProviderMethod } from '../../providers.decorators';
import {
  CreateEmailProviderDto,
  InteractionEmailDto,
  MailCodeTypes,
  UpdateEmailProviderDto,
  VerificationSendCodeEmailDTO,
  VerificationStatusEmailDTO,
  UpdateEmailTemplateDto,
} from './email.dto';
import { DEFAULT_EMAIL_TEMPLATES, getDefaultEmailTemplate } from './email.template.defaults';
import {
  getVariant2EmailTemplatePreset,
  getVariant3EmailTemplatePreset,
} from './email.template.presets';
import { NotificationAction, TEmailParams, TEmailProvider } from './email.types';

const templateDir = `${__dirname}/templates`;

export const PROVIDER_TYPE_EMAIL = 'EMAIL';

type TEmailProviderResolutionParams = Pick<
  VerificationSendCodeEmailDTO,
  'client_id' | 'provider_id' | 'uid' | 'user_id'
> & {
  requestUserId?: string | null;
};

type TEmailProviderClientContext = {
  primaryClientId: string;
  clientIds: string[];
};

type TEmailVerificationState = {
  user_id?: string;
  code: string;
  counter: number;
  status?: boolean;
  provider_id?: string;
  provider_type?: EProviderTypes.EMAIL | EProviderTypes.EMAIL_CUSTOM;
  provider_public?: number;
};

type TEmailContactVerificationContext = {
  providerId?: string;
  accountType?: EProviderTypes.EMAIL | EProviderTypes.EMAIL_CUSTOM;
  providerPublic?: number;
};

const getLocalizedTextValue = (value: unknown, locale: ELocales): string => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  const localizedText = value as Record<string, string>;

  if (localizedText[locale]) return localizedText[locale];

  const shortLocale = locale.split('-')[0];
  const matchedValue = Object.entries(localizedText).find(
    ([key, localizedValue]) =>
      localizedValue && (key === shortLocale || key.startsWith(`${shortLocale}-`)),
  )?.[1];

  if (matchedValue) return matchedValue;

  return (
    localizedText[ELocales.ru] ||
    Object.values(localizedText).find((localizedValue) => localizedValue.trim().length) ||
    ''
  );
};

const DEFAULT_EMAIL_ACCENT = '#4C6AD4';

const toObjectRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string') {
    try {
      return toObjectRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return null;
};

@Injectable()
export class EmailService extends ProviderBase {
  defaultUrlAvatar: string = 'public/default/email.svg';
  type = PROVIDER_TYPE_EMAIL;

  emailCode = new RedisAdapter(REDIS_PREFIXES.EmailCode);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  uid = new RedisAdapter(REDIS_PREFIXES.uid);

  protected partialsCache: Record<string, string> = {};

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }
  onActivate(): Promise<void> {
    return;
  }
  onBindAccount(userId: string, params: any) {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  @ProviderMethod(InteractionEmailDto)
  async onAuth(params: InteractionEmailDto, uid: string) {
    const data = await this.userData.find(uid);
    const isConfirmedInInteraction = data?.email === params.email;
    if (!isConfirmedInInteraction) {
      await this.confirm(params.email, params.code);
    }
    const where = {
      externalAccounts: {
        some: {
          sub: params.email,
          type: {
            in: [...legacyUserEmailExternalAccountTypes],
          },
        },
      },
    } satisfies Prisma.UserWhereInput;
    const count = await prisma.user.count({ where });
    if (count > 1) throw new BadRequestException(Ei18nCodes.T3E0019);

    const user = await prisma.user.findFirst({
      where,
      include: legacyUserInclude,
    });

    const userData = (await this.userData.find(uid)) || {};
    if (!user) {
      userData.email = params.email;
    } else {
      delete userData.email;
    }
    await this.userData.upsert(uid, userData, 3600);

    return { user: toLegacyUser(user) as any, loginEmail: params.email };
  }

  @ProviderMethod(CreateEmailProviderDto)
  async onCreate(
    params: CreateEmailProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    const uniqueProvider = await prisma.provider.findFirst({
      where: {
        client_id,
        type: this.type,
      },
    });

    if (uniqueProvider) {
      throw new BadRequestException(Ei18nCodes.T3E0036);
    }
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateEmailProviderDto)
  async onUpdate(
    params: UpdateEmailProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  protected getFromAddress(params: TEmailProvider['params']) {
    const alias = params.alias?.trim();
    if (!alias) {
      return params.root_mail;
    }
    const escapedAlias = alias.replace(/"/g, '\\"');
    return escapedAlias;
  }

  protected createTransporter(params: TEmailProvider['params']) {
    const { root_mail, mail_hostname, mail_port, mail_password } = params;
    return nodemailer.createTransport({
      host: mail_hostname,
      port: parseInt(mail_port, 10),
      secure: parseInt(mail_port, 10) === 465,
      auth: {
        user: root_mail,
        pass: mail_password,
      },
    });
  }

  protected async sendMessage(
    email: string | string[],
    providerParams: TEmailProvider['params'],
    params: { subject: string; html?: string; text?: string },
  ) {
    const { root_mail } = providerParams;
    const transporter = this.createTransporter(providerParams);
    const mailOptions = {
      from: this.getFromAddress(providerParams),
      to: Array.isArray(email) && email.length > 1 ? root_mail : email,
      bcc: Array.isArray(email) && email.length > 1 ? email : undefined,
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    await transporter.sendMail(mailOptions);
    console.info(
      'Message sent: %s',
      Array.isArray(email) ? email.map(maskEmail).join(', ') : maskEmail(email),
    );
  }

  async sendMail(email: string | string[], params: TEmailParams, provider?: TEmailProvider) {
    if (!provider) {
      provider = await this.findEmailProvider({
        user_id: params.user_id,
        client_id: params.branding_client_id,
      });
    }
    if (!provider) return;

    const client = await this.resolveTemplateClient(provider, params.branding_client_id);

    const i18n = await this.settingsService.getSettingsByName<{ default_language: ELocales }>(
      ESettingsNames.i18n,
    );
    const { template, subject } = await this.getTemplate(
      provider,
      params,
      client,
      i18n.default_language,
    );
    if (!template) {
      return;
    }

    try {
      await this.sendMessage(email, provider.params, {
        subject,
        html: template,
      });
    } catch (error) {
      throw new InternalServerErrorException('sendMail error: ' + (error as Error).message);
    }
  }

  async sendTestEmail(params: TEmailProvider['params']) {
    try {
      await this.sendMessage(params.root_mail, params, {
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
      });
    } catch (error) {
      throw new InternalServerErrorException('sendMail error: ' + (error as Error).message);
    }
  }

  /**
   * Retrieving email parts.
   * After the first read, it is cached.
   */
  protected async getPartialsTemplate() {
    if (!Object.keys(this.partialsCache).length) {
      const partialKeys = await fs.promises.readdir(`${templateDir}/@partials`);
      for (let i = 0; i < partialKeys.length; i += 1) {
        const partialKey = 'partial'.concat(partialKeys[i].replace('.mustache', ''));
        this.partialsCache[partialKey] = await fs.promises.readFile(
          `${templateDir}/@partials/${partialKeys[i]}`,
          {
            encoding: 'utf8',
          },
        );
      }
    }

    return this.partialsCache;
  }

  protected isFullHtmlTemplate(content: string) {
    return /<!doctype|<html[\s>]|<body[\s>]/i.test(content);
  }

  protected async buildLegacyTemplateHtml(content: string) {
    const partials = await this.getPartialsTemplate();

    return [
      partials.partialHeadMail,
      partials.partialStartMail,
      partials.partialHeader,
      partials.partialContent.replace('<%>msg%>', content),
      partials.partialFooter,
      partials.partialEndMail,
    ]
      .filter(Boolean)
      .join('\n');
  }

  protected async getLegacyTemplateSource() {
    const legacyTemplates = await prisma.emailTemplates.findMany({
      where: { provider_id: null },
      orderBy: [{ locale: 'asc' }, { action: 'asc' }],
    });

    if (legacyTemplates.length) {
      return legacyTemplates.map((template) => ({
        locale: template.locale as ELocales,
        action: template.action as NotificationAction,
        title: template.title,
        subject: template.subject,
        content: template.content,
      }));
    }

    return DEFAULT_EMAIL_TEMPLATES;
  }

  protected async normalizeTemplateContent(
    template: Pick<EmailTemplates, 'content' | 'provider_id'>,
  ) {
    if (template.provider_id || this.isFullHtmlTemplate(template.content)) {
      return template.content;
    }

    return this.buildLegacyTemplateHtml(template.content);
  }

  protected async getTemplateView(
    providerParams: TEmailProvider['params'],
    params: TEmailParams,
    client: Client,
    locale: ELocales,
  ) {
    const safeParams = { ...params };
    if (safeParams.app_name) {
      safeParams.app_name = getLocalizedTextValue(safeParams.app_name, locale);
    }

    let user_data = {};
    if (safeParams.user_id) {
      const user = await prisma.user.findUnique({
        where: {
          id: safeParams.user_id,
        },
        include: legacyUserInclude,
      });
      const legacyUser = toLegacyUser(user);
      if (!legacyUser) {
        console.warn('User not found: ', safeParams.user_id);
        return;
      }
      delete safeParams.user_id;

      const custom_fields = legacyUser.custom_fields || {};
      const {
        custom_fields: _customFields,
        hashed_password: _hashedPassword,
        ...safeUser
      } = legacyUser as any;

      user_data = {
        ...safeUser,
        ...(typeof custom_fields === 'object' && custom_fields !== null ? custom_fields : {}),
      };
    }

    const backendUrl = new URL(constants.DOMAIN);
    const dashboardUrl = client.domain || constants.DOMAIN;
    const dashboardLinkName = this.getDashboardLinkName(dashboardUrl);
    const avatarPath = client.avatar
      ? client.avatar.startsWith('/')
        ? client.avatar.slice(1)
        : client.avatar
      : 'public/default/logo.png';
    const logoUrl = new URL(avatarPath, backendUrl).toString();
    const [copyrightSettings, themeLightSettings] = await Promise.all([
      this.settingsService.getSettingsByName<Record<string, string>>(ESettingsNames.copyright),
      this.settingsService.getSettingsByName(ESettingsNames.theme_light),
    ]);
    const footerContactText = providerParams.alias?.trim() || providerParams.root_mail;
    const footerContactHref = `mailto:${providerParams.root_mail}`;

    return {
      templateView: {
        accent: this.getEmailAccentColor(themeLightSettings),
        link_name: dashboardLinkName,
        footer_contact_text: footerContactText,
        footer_contact_href: footerContactHref,
        copyright: getLocalizedTextValue(copyrightSettings, locale),
        dashboard_url: dashboardUrl,
        logo_url: logoUrl,
        project_name: getLocalizedTextValue(client.name, locale),
        ...safeParams,
        ...user_data,
      },
      subjectView: {
        link_name: dashboardLinkName,
        project_name: getLocalizedTextValue(client.name, locale),
        ...safeParams,
        ...user_data,
      },
    };
  }

  private getEmailAccentColor(themeLightSettings: unknown) {
    const themeLight = toObjectRecord(themeLightSettings);
    const primary = toObjectRecord(themeLight?.primary);
    const accent = primary?.main;

    return typeof accent === 'string' && accent.trim() ? accent.trim() : DEFAULT_EMAIL_ACCENT;
  }

  protected async getEmailTemplate(
    providerId: string | undefined,
    action: NotificationAction,
    locale: ELocales,
  ) {
    if (providerId) {
      await this.ensureProviderEmailTemplates(providerId);

      const providerTemplate = await prisma.emailTemplates.findFirst({
        where: { provider_id: providerId, action, locale },
      });
      if (providerTemplate) {
        return providerTemplate;
      }
    }

    return prisma.emailTemplates.findFirst({
      where: { provider_id: null, action, locale },
    });
  }

  async ensureProviderEmailTemplates(providerId: string) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, type: true },
    });

    if (
      !provider ||
      ![EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM].includes(provider.type as EProviderTypes)
    ) {
      return;
    }

    const sourceTemplates = await this.getLegacyTemplateSource();
    if (!sourceTemplates.length) {
      return;
    }

    const existingTemplates = await prisma.emailTemplates.findMany({
      where: { provider_id: providerId },
      select: { action: true, locale: true },
    });
    const existingKeys = new Set(
      existingTemplates.map(({ action, locale }) => `${action}:${locale}`),
    );

    const data: Prisma.EmailTemplatesCreateManyInput[] = [];
    for (const template of sourceTemplates) {
      const key = `${template.action}:${template.locale}`;
      if (existingKeys.has(key)) continue;

      data.push({
        provider_id: providerId,
        locale: template.locale,
        action: template.action,
        title: template.title,
        subject: template.subject,
        content: this.isFullHtmlTemplate(template.content)
          ? template.content
          : await this.buildLegacyTemplateHtml(template.content),
      });
    }

    if (data.length) {
      await prisma.emailTemplates.createMany({
        data,
        skipDuplicates: true,
      });
    }
  }

  protected async getProviderEmailScope(clientId: string, providerId: string) {
    const provider = await prisma.provider.findFirst({
      where: {
        id: providerId,
        OR: [{ client_id: clientId }, { providerRelations: { some: { client_id: clientId } } }],
        type: {
          in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM],
        },
      },
    });

    if (!provider) {
      throw new InternalServerErrorException('Email provider for templates not found');
    }

    return provider as TEmailProvider;
  }

  protected async getVariant1EmailTemplatePreset(action: NotificationAction, locale: ELocales) {
    const template = getDefaultEmailTemplate(locale, action);

    if (!template) {
      throw new InternalServerErrorException('Default email template preset not found');
    }

    if (this.isFullHtmlTemplate(template.content)) {
      return template.content;
    }

    return this.buildLegacyTemplateHtml(template.content);
  }

  protected getPreviewTemplateParams(action: NotificationAction, client: Client) {
    const dashboardUrl = client.domain || constants.DOMAIN;
    const normalizedDashboardUrl = dashboardUrl.replace(/\/$/, '');
    const previewBase = {
      given_name: 'Alex',
      family_name: 'Johnson',
      login: 'alex@example.com',
      password: 'Passw0rd!23',
      code: '123456',
      expires_date: '23:59 31.12.2026',
      timezone: '+3',
      app_name: getLocalizedTextValue(client.name, ELocales.ru),
      reference: `${normalizedDashboardUrl}/preview`,
    };

    switch (action) {
      case NotificationAction.account_create:
        return {
          action,
          ...previewBase,
        };
      case NotificationAction.confirmation_code:
        return {
          action,
          ...previewBase,
        };
      case NotificationAction.confirmation_link:
        return {
          action,
          ...previewBase,
          reference: `${normalizedDashboardUrl}/confirm-email`,
        };
      case NotificationAction.password_change:
        return {
          action,
          ...previewBase,
        };
      case NotificationAction.password_recover:
        return {
          action,
          ...previewBase,
        };
      case NotificationAction.invite:
        return {
          action,
          ...previewBase,
          reference: `${normalizedDashboardUrl}/invitations`,
        };
      default:
        return {
          action,
          ...previewBase,
        };
    }
  }

  /**
   * Retrieving a finished email template.
   */
  protected async getTemplate(
    provider: TEmailProvider,
    params: TEmailParams,
    client: Client,
    locale: ELocales,
  ) {
    const template = await this.getEmailTemplate(provider.id, params.action, locale);
    if (!template) {
      console.warn('Email template not found: ', params.action);
      return;
    }

    const view = await this.getTemplateView(provider.params, params, client, locale);
    if (!view) {
      return;
    }

    const renderedText = mustache.render(
      await this.normalizeTemplateContent(template),
      view.templateView,
    );
    const subject = mustache.render(template.subject, view.subjectView);

    return { template: renderedText, subject };
  }

  protected async resolveTemplateClient(
    provider?: TEmailProvider,
    brandingClientId?: string,
  ): Promise<Client> {
    const clientId = brandingClientId || provider?.client_id || constants.CLIENT_ID;

    const client =
      (await prisma.client.findUnique({
        where: { client_id: clientId },
      })) ||
      (await prisma.client.findUnique({
        where: { client_id: constants.CLIENT_ID },
      }));

    if (!client) {
      throw new InternalServerErrorException('Client for email template not found');
    }

    return client;
  }

  protected getDashboardLinkName(url: string): string {
    try {
      return new URL(url).host;
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  }

  async sendCodeByType(
    {
      user_id,
      uid,
      client_id,
      provider_id,
      email,
      resend,
      code_type,
      app_name,
      timezone_offset,
      branding_client_id,
      noReference,
    }: VerificationSendCodeEmailDTO & {
      noReference?: boolean;
      branding_client_id?: string;
    },
    provider?: TEmailProvider,
  ) {
    if (!provider) {
      provider = await this.findEmailProvider({
        client_id,
        provider_id,
        uid,
        user_id,
      });
    }
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);

    const rule = await this.settingsService.getUserRuleByFieldName(UserProfileFields.email);
    if (code_type === MailCodeTypes.confirmEmail && rule.unique) {
      const externalAccountOwner = await prisma.externalAccount.findFirst({
        where: { sub: email, type: { in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM] } },
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (externalAccountOwner && user_id) {
        if (externalAccountOwner && externalAccountOwner.user.id !== user_id) {
          throw new BadRequestException(Ei18nCodes.T3E0064);
        }
        throw new BadRequestException(Ei18nCodes.T3E0065);
      }
    }

    if (resend) await this.emailCode.destroy(email);

    const mailCodeTtlSec = parseInt(provider.params.mail_code_ttl_sec, 10);

    const code = await generateRandomDigits();

    const now = new Date();
    const expires = new Date(now.getTime() + 1000 * mailCodeTtlSec);

    const timezoneOffsetParsed = timezone_offset || 0;
    const timezone = (timezoneOffsetParsed <= 0 ? '+' : '-') + Math.abs(timezoneOffsetParsed);

    const expiresUTC = new Date(
      expires.getTime() +
        expires.getTimezoneOffset() * 60000 -
        60 * 60 * 1000 * timezoneOffsetParsed,
    );
    // format as HH:MM dd.mm.yyyy (preserve time, change date to dd.mm.yyyy)
    const hours = String(expiresUTC.getHours()).padStart(2, '0');
    const minutes = String(expiresUTC.getMinutes()).padStart(2, '0');
    const day = String(expiresUTC.getDate()).padStart(2, '0');
    const month = String(expiresUTC.getMonth() + 1).padStart(2, '0');
    const year = String(expiresUTC.getFullYear());
    const expires_date = `${hours}:${minutes} ${day}.${month}.${year}`;

    if (code_type === MailCodeTypes.recoverPassword) {
      await this.sendMail(
        email,
        {
          action: NotificationAction.password_recover,
          app_name,
          code,
          expires_date,
          timezone,
          user_id,
          branding_client_id: branding_client_id || provider?.client_id,
        },
        provider as TEmailProvider,
      );
    } else if (noReference) {
      await this.sendMail(
        email,
        {
          action: NotificationAction.confirmation_code,
          app_name,
          code,
          expires_date,
          timezone,
          user_id,
          branding_client_id: branding_client_id || provider?.client_id,
        },
        provider as TEmailProvider,
      );
    } else {
      const reference =
        constants.DOMAIN + '/api/v1/verification/confirm?email=' + email + '&code=' + code;
      await this.sendMail(
        email,
        {
          action: NotificationAction.confirmation_link,
          app_name,
          code,
          expires_date,
          reference,
          timezone,
          user_id,
          branding_client_id: branding_client_id || provider?.client_id,
        },
        provider as TEmailProvider,
      );
    }

    await this.emailCode.upsert(
      email,
      {
        user_id,
        code,
        counter: 0,
        provider_id: provider.id,
        provider_type: provider.type as EProviderTypes.EMAIL | EProviderTypes.EMAIL_CUSTOM,
        provider_public: provider.default_public,
      } satisfies TEmailVerificationState,
      mailCodeTtlSec,
    );

    return { code, expires };
  }

  async confirm(email: string, code: string) {
    await this.confirmWithContext(email, code);
  }

  async confirmWithContext(
    email: string,
    code: string,
  ): Promise<TEmailContactVerificationContext | undefined> {
    const { key, data } = await this.getEmailVerificationState(email);
    await this.checkCode(email, code);
    await this.emailCode.destroy(key);
    return this.extractContactVerificationContext(data);
  }

  async confirmStatus(email: string, code: string) {
    await this.checkCode(email, code);
    const data = await this.emailCode.find(email);
    await this.emailCode.upsert(email, { ...data, status: true });
  }

  async getStatus(email: string) {
    const data = await this.emailCode.find(email);
    return { status: data?.status || false };
  }

  /**
   * Checking for a user's existence by email.
   */
  @ProviderMethod(VerificationStatusEmailDTO)
  public async verificationStatus(params: VerificationStatusEmailDTO) {
    const rule = await this.settingsService.getUserRuleByFieldName(UserProfileFields.email);
    const isExist = await this.settingsService.isEmailTaken(params.email);

    return { isExist, uniqueRule: rule.unique };
  }

  public async checkCode(email: string, code: string) {
    const { key, data } = await this.getEmailVerificationState(email);
    if (!data) throw new BadRequestException(Ei18nCodes.T3E0098);

    if (data.counter > 5) {
      await this.emailCode.destroy(key);
      throw new BadRequestException(Ei18nCodes.T3E0054);
    }

    if (data.code !== code && !data.status) {
      await this.emailCode.upsert(key, { ...data, counter: data.counter + 1 });
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }
  }

  /** Return the effective Redis key for an email code when the input is a login. */
  private async resolveEmailVerificationKey(email: string) {
    let ids = email;
    if (!ids.includes('@')) {
      const user = await prisma.user.findFirst({
        where: buildLegacyIdentifierWhere(ids, IdentifierType.Login),
        include: legacyUserInclude,
      });
      const legacyUser = toLegacyUser(user);
      if (!legacyUser) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }
      const externalEmail = getLegacyUserPrimaryExternalAccountEmail(legacyUser);
      if (!externalEmail) {
        throw new BadRequestException(Ei18nCodes.T3E0057);
      }
      ids = externalEmail;
    }

    return ids;
  }

  /** Read the stored verification context for provider provenance in the contact service. */
  private async getEmailVerificationState(email: string) {
    const key = await this.resolveEmailVerificationKey(email);
    const data = (await this.emailCode.find(key)) as TEmailVerificationState | undefined;

    return { key, data };
  }

  /** Convert a verification-storage payload into provider context for the contact flow. */
  private extractContactVerificationContext(
    data?: TEmailVerificationState | null,
  ): TEmailContactVerificationContext | undefined {
    if (!data) {
      return undefined;
    }

    return {
      providerId: data.provider_id,
      accountType: data.provider_type,
      providerPublic: data.provider_public,
    };
  }

  public async findEmailProvider(
    params: TEmailProviderResolutionParams = {},
  ): Promise<TEmailProvider | null> {
    const { clientIds } = await this.resolveEmailClientContext(params);

    for (const clientId of clientIds) {
      const scopedProvider = await this.findEmailProviderForClient(clientId, params.provider_id);
      if (scopedProvider) {
        return scopedProvider;
      }
    }

    if (params.provider_id) {
      const provider = await prisma.provider.findFirst({
        where: {
          id: params.provider_id,
          type: { in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM] },
        },
      });

      if (provider) {
        return provider as TEmailProvider;
      }
    }

    return null;
  }

  async getProviderEmailTemplates(clientId: string, providerId: string, locale?: ELocales) {
    const provider = await this.getProviderEmailScope(clientId, providerId);
    return this.getTemplatesByProviderId(provider.id, locale);
  }

  async getProviderEmailTemplatePresets(
    clientId: string,
    providerId: string,
    action: NotificationAction,
    locale?: ELocales,
  ) {
    await this.getProviderEmailScope(clientId, providerId);

    const i18n = await this.settingsService.getSettingsByName<{ default_language: ELocales }>(
      ESettingsNames.i18n,
    );
    const targetLocale = locale || i18n.default_language;

    return {
      variant_1: await this.getVariant1EmailTemplatePreset(action, targetLocale),
      variant_2: getVariant2EmailTemplatePreset(targetLocale, action),
      variant_3: getVariant3EmailTemplatePreset(targetLocale, action),
    };
  }

  async previewProviderEmailTemplate(
    clientId: string,
    providerId: string,
    action: NotificationAction,
    content: string,
    locale?: ELocales,
  ) {
    const provider = await this.getProviderEmailScope(clientId, providerId);
    const client = await this.resolveTemplateClient(provider);
    const i18n = await this.settingsService.getSettingsByName<{ default_language: ELocales }>(
      ESettingsNames.i18n,
    );
    const targetLocale = locale || i18n.default_language;
    const previewParams = this.getPreviewTemplateParams(action, client);
    const view = await this.getTemplateView(
      provider.params,
      previewParams as TEmailParams,
      client,
      targetLocale,
    );

    if (!view) {
      return { html: '', subject: '' };
    }

    const normalizedContent = this.isFullHtmlTemplate(content)
      ? content
      : await this.buildLegacyTemplateHtml(content);

    return {
      html: mustache.render(normalizedContent, view.templateView),
      subject: '',
    };
  }

  protected async getTemplatesByProviderId(providerId: string, locale?: ELocales) {
    await this.ensureProviderEmailTemplates(providerId);

    return prisma.emailTemplates.findMany({
      where: {
        provider_id: providerId,
        ...(locale ? { locale } : {}),
      },
      orderBy: [{ locale: 'asc' }, { action: 'asc' }],
    });
  }

  async updateProviderEmailTemplate(
    clientId: string,
    providerId: string,
    action: NotificationAction,
    params: UpdateEmailTemplateDto,
    locale?: ELocales,
  ) {
    const provider = await this.getProviderEmailScope(clientId, providerId);
    return this.updateTemplateByProviderId(provider.id, action, params, locale);
  }

  protected async updateTemplateByProviderId(
    providerId: string,
    action: NotificationAction,
    params: UpdateEmailTemplateDto,
    locale?: ELocales,
  ) {
    await this.ensureProviderEmailTemplates(providerId);

    const i18n = await this.settingsService.getSettingsByName<{ default_language: ELocales }>(
      ESettingsNames.i18n,
    );
    const targetLocale = locale || params.locale || i18n.default_language;
    const { locale: _locale, ...body } = params as any;

    return prisma.emailTemplates.upsert({
      where: {
        provider_id_action_locale: {
          provider_id: providerId,
          action,
          locale: targetLocale,
        },
      },
      create: {
        provider_id: providerId,
        action,
        locale: targetLocale,
        title: body.title || action,
        subject: body.subject || '',
        content: body.content || '',
      },
      update: body,
    });
  }

  @ProviderMethod(VerificationSendCodeEmailDTO)
  async verificationCode(params: VerificationSendCodeEmailDTO, req: Request, res: Response) {
    params.email = params.email.trim();
    if (!params.email.includes('@')) {
      const user = await prisma.user.findFirst({
        where: buildLegacyIdentifierWhere(params.email, IdentifierType.Login),
        include: legacyUserInclude,
      });
      const legacyUser = toLegacyUser(user);
      if (!legacyUser) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }
      const externalEmail = getLegacyUserPrimaryExternalAccountEmail(legacyUser);
      if (!externalEmail) {
        throw new BadRequestException(Ei18nCodes.T3E0057);
      }
      params.email = externalEmail;
      params.user_id = legacyUser.id;
    }

    const emailExternalAccount = await prisma.externalAccount.findFirst({
      where: {
        sub: params.email,
        type: {
          in: [...legacyUserEmailExternalAccountTypes],
        },
      },
      select: { id: true },
    });

    if (!emailExternalAccount) {
      const rules = await this.settingsService.getRulesValidations(UserProfileFields.email, true);
      const defaultLocale = await getDefaultLocale();

      for (const validation of rules) {
        if (!new RegExp(validation.regex).test(params.email)) {
          throw new BadRequestException(
            resolveLocalizedText(validation.error, defaultLocale, defaultLocale),
          );
        }
      }
    }

    const provider = await this.resolveEmailProvider(params, req);
    if (!provider) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    const { primaryClientId } = await this.resolveEmailClientContext({
      client_id: params.client_id,
      uid: params.uid,
      user_id: params.user_id,
      requestUserId: typeof req[USER_ID_KEY] === 'string' ? req[USER_ID_KEY] : null,
    });

    const client =
      (await prisma.client.findUnique({
        where: { client_id: primaryClientId },
        select: { name: true },
      })) ||
      (await prisma.client.findUnique({
        where: { client_id: constants.CLIENT_ID },
        select: { name: true },
      }));
    const defaultLocale = await getDefaultLocale();
    const app_name = resolveLocalizedText(client?.name, defaultLocale, defaultLocale);

    const result = await this.sendCodeByType(
      {
        ...params,
        app_name,
        branding_client_id: primaryClientId,
        noReference: params.code_type === MailCodeTypes.recoverPassword,
      },
      provider,
    );

    if (constants.NODE_ENV === 'development') {
      return {
        success: true,
        code: result.code,
        expires: result.expires,
      };
    }

    return;
  }

  private async resolveEmailProvider(
    params: VerificationSendCodeEmailDTO,
    req: Request,
  ): Promise<TEmailProvider | null> {
    return this.findEmailProvider({
      client_id: params.client_id,
      provider_id: params.provider_id,
      uid: params.uid,
      user_id: params.user_id,
      requestUserId: typeof req[USER_ID_KEY] === 'string' ? req[USER_ID_KEY] : null,
    });
  }

  private async resolveEmailClientContext(
    params: TEmailProviderResolutionParams,
  ): Promise<TEmailProviderClientContext> {
    if (params.client_id) {
      return {
        primaryClientId: params.client_id,
        clientIds: await this.buildEmailClientResolutionChain(params.client_id),
      };
    }

    if (params.uid) {
      const session = await this.uid.get<{
        iat: number;
        exp: number;
        returnTo: string;
        prompt: TPrompt;
        params: TParams;
        kind: string;
        jti: string;
      }>(params.uid);
      const sessionClientId = session?.params?.client_id;
      if (sessionClientId) {
        return {
          primaryClientId: sessionClientId,
          clientIds: await this.buildEmailClientResolutionChain(sessionClientId),
        };
      }
    }

    const userId = params.requestUserId || params.user_id;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { org_id: true },
      });
      const orgClientId = user?.org_id || constants.CLIENT_ID;

      return {
        primaryClientId: orgClientId,
        clientIds: this.normalizeEmailClientIds([orgClientId, constants.CLIENT_ID]),
      };
    }

    return {
      primaryClientId: constants.CLIENT_ID,
      clientIds: [constants.CLIENT_ID],
    };
  }

  private async buildEmailClientResolutionChain(clientId: string): Promise<string[]> {
    const client = await prisma.client.findUnique({
      where: { client_id: clientId },
      select: { parent_id: true },
    });

    return this.normalizeEmailClientIds([
      clientId,
      client?.parent_id || null,
      clientId === constants.CLIENT_ID ? null : constants.CLIENT_ID,
    ]);
  }

  private normalizeEmailClientIds(clientIds: Array<string | null | undefined>): string[] {
    return [...new Set(clientIds.filter((value): value is string => Boolean(value)))];
  }

  private async findEmailProviderForClient(
    clientId: string,
    providerId?: string,
  ): Promise<TEmailProvider | null> {
    const directProviders = await prisma.provider.findMany({
      where: {
        type: { in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM] },
        client_id: clientId,
        ...(providerId ? { id: providerId } : {}),
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    const directProvider = this.selectEmailProvider(
      directProviders as TEmailProvider[],
      !providerId,
    );
    if (directProvider) {
      return directProvider;
    }

    const relationProviders = await prisma.provider_relations.findMany({
      where: {
        client_id: clientId,
        ...(providerId ? { provider_id: providerId } : {}),
        provider: {
          type: { in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM] },
        },
      },
      include: {
        provider: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    const relationProvider = this.selectEmailProvider(
      relationProviders.map((relation) => relation.provider as TEmailProvider),
      !providerId,
    );
    if (relationProvider) {
      return relationProvider;
    }

    const publicProviders = await prisma.provider.findMany({
      where: {
        type: { in: [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM] },
        is_public: true,
        client_id: clientId,
        ...(providerId ? { id: providerId } : {}),
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return this.selectEmailProvider(publicProviders as TEmailProvider[], !providerId);
  }

  private selectEmailProvider(
    providers: TEmailProvider[],
    preferValidConfig: boolean,
  ): TEmailProvider | null {
    if (!providers.length) {
      return null;
    }

    if (!preferValidConfig) {
      return providers[0];
    }

    return providers.find((provider) => this.hasValidEmailProviderConfig(provider)) || providers[0];
  }

  private hasValidEmailProviderConfig(provider: TEmailProvider): boolean {
    const params = provider?.params;
    if (!params || typeof params !== 'object') {
      return false;
    }

    const rootMail = typeof params.root_mail === 'string' ? params.root_mail.trim() : '';
    const mailHostname =
      typeof params.mail_hostname === 'string' ? params.mail_hostname.trim() : '';
    const mailPassword =
      typeof params.mail_password === 'string' ? params.mail_password.trim() : '';
    const mailPort = Number(params.mail_port);
    const mailCodeTtlSec = Number(params.mail_code_ttl_sec);

    return Boolean(
      rootMail &&
        mailHostname &&
        mailPassword &&
        Number.isFinite(mailPort) &&
        mailPort > 0 &&
        Number.isFinite(mailCodeTtlSec) &&
        mailCodeTtlSec > 0,
    );
  }
}

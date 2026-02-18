import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { Client, Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import * as mustache from 'mustache';
import nodemailer from 'nodemailer';
import { prisma } from 'src/modules/prisma/prisma.client';
import { ESettingsNames, UserProfileFields } from 'src/modules/settings';
import * as constants from '../../../../constants';
import { Ei18nCodes, ELocales, EProviderTypes } from '../../../../enums';
import { generateRandomDigits, getMonthByNumber, maskEmail } from '../../../../helpers';
import { TParams, TPrompt } from '../../../oidc/oidc.types';
import { REDIS_PREFIXES, RedisAdapter } from '../../../redis/redis.adapter';
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
} from './email.dto';
import { NotificationAction, TEmailParams, TEmailProvider } from './email.types';

const customTags: mustache.OpeningAndClosingTags = ['<%', '%>'];
const templateDir = `${__dirname}/templates`;

export const PROVIDER_TYPE_EMAIL = 'EMAIL';

@Injectable()
export class EmailService extends ProviderBase {
  defaultUrlAvatar: string = 'public/default/email.svg';
  type = PROVIDER_TYPE_EMAIL;

  emailCode = new RedisAdapter(REDIS_PREFIXES.EmailCode);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  uid = new RedisAdapter(REDIS_PREFIXES.uid);

  protected partialsCache: Record<string, string> = {};
  protected baseTemplate: string | null = null;

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
    if (data?.email !== params.email) {
      await this.confirm(params.email, params.code);
    }
    const user = await prisma.user.findMany({
      where: {
        email: params.email,
      },
    });
    if (user.length > 1) throw new BadRequestException(Ei18nCodes.T3E0019);

    if (!user.length) {
      let userData = (await this.userData.find(uid)) || {};
      userData.email = params.email;
      await this.userData.upsert(uid, userData, 3600);
    }
    return { user: user[0] };
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

  async sendMail(email: string | string[], params: TEmailParams, provider?: TEmailProvider) {
    if (!provider) provider = await this.findEmailProvider();
    if (!provider) return;

    const client = await prisma.client.findUnique({
      where: {
        client_id: constants.CLIENT_ID,
      },
    });

    const { root_mail, mail_hostname, mail_port, mail_password } = provider.params;
    const i18n = await this.settingsService.getSettingsByName<{ default_language: ELocales }>(
      ESettingsNames.i18n,
    );
    const { template, subject } = await this.getTemplate(
      root_mail,
      params,
      client,
      i18n.default_language,
    );
    if (!template) {
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: mail_hostname,
        port: parseInt(mail_port, 10),
        secure: parseInt(mail_port, 10) === 465 ? true : false, // true for 465, false for other ports
        auth: {
          user: root_mail,
          pass: mail_password,
        },
      });

      const mailOptions = {
        from: `"${root_mail}" <${root_mail}>`,
        to: Array.isArray(email) && email.length > 1 ? root_mail : email,
        bcc: Array.isArray(email) && email.length > 1 ? email : undefined,
        subject,
        html: template,
      };

      await transporter.sendMail(mailOptions);
      console.info(
        'Message sent: %s',
        Array.isArray(email) ? email.map(maskEmail).join(', ') : maskEmail(email),
      );
    } catch (error) {
      if (!constants.EMAIL_PROVIDER_2) {
        throw new InternalServerErrorException('sendMail error: ' + (error as Error).message);
      }
      console.error('sendMail error: ', (error as Error).message);

      const mailOptions_2 = {
        from: `"${constants.EMAIL_PROVIDER_2.root_mail}" <${constants.EMAIL_PROVIDER_2.root_mail}>`,
        to: email,
        subject,
        html: template,
      };

      try {
        const transporter_2 = nodemailer.createTransport({
          host: constants.EMAIL_PROVIDER_2.hostname,
          port: constants.EMAIL_PROVIDER_2.port,
          secure: constants.EMAIL_PROVIDER_2.port === 465 ? true : false,
          auth: {
            user: constants.EMAIL_PROVIDER_2.root_mail,
            pass: constants.EMAIL_PROVIDER_2.password,
          },
        });
        await transporter_2.sendMail(mailOptions_2);
        console.info(
          'Message sent reserve: %s',
          Array.isArray(email) ? email.map(maskEmail).join(', ') : maskEmail(email),
        );
      } catch (error) {
        throw new InternalServerErrorException('sendMail_2 error: ' + (error as Error).message);
      }
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

  /**
   * Retrieving a basic email template.
   * After the first read, it is cached.
   */
  protected async getBaseTemplate(): Promise<string> {
    if (!this.baseTemplate) {
      this.baseTemplate = await fs.promises.readFile(`${templateDir}/base.mustache`, {
        encoding: 'utf8',
      });
    }

    return this.baseTemplate;
  }

  /**
   * Retrieving a finished email template.
   */
  protected async getTemplate(
    root_mail: string,
    params: TEmailParams,
    client: Client,
    locale: ELocales,
  ) {
    const template = await this.settingsService.getEmailTemplate(params.action, locale);
    if (!template) {
      console.warn('Email template not found: ', params.action);
      return;
    }

    let renderedText = mustache.render(
      await this.getBaseTemplate(),
      {},
      {
        ...(await this.getPartialsTemplate()),
        msg: template.content,
      },
      customTags,
    );

    let user_data = {};
    if (params.user_id) {
      const user = await prisma.user.findUnique({
        where: {
          id: parseInt(params.user_id, 10),
        },
      });
      if (!user) {
        console.warn('User not found: ', params.user_id);
        return;
      }
      delete params.user_id;

      const custom_fields = user.custom_fields || {};
      delete user.custom_fields;
      delete user.hashed_password;

      user_data = {
        ...user,
        ...(typeof custom_fields === 'object' && custom_fields !== null ? custom_fields : {}),
      };
    }

    const backendUrl = new URL(constants.DOMAIN);
    const avatarPath =
      client.avatar && client.avatar.startsWith('/') ? client.avatar.slice(1) : client.avatar;
    const logoUrl = new URL(avatarPath, backendUrl).toString();

    renderedText = mustache.render(renderedText, {
      accent: constants.CUSTOM_STYLES?.['palette']?.['white']?.['accent'] || '#15c',
      link_name: constants.DOMAIN.replace('https://', ''),
      root_mail,
      copyright: constants.COPYRIGHT ? constants.COPYRIGHT['ru'] : '',
      dashboard_url: constants.DOMAIN,
      logo_url: logoUrl,
      project_name: client.name,
      ...params,
      ...user_data,
    });

    const subject = mustache.render(template.subject, {
      link_name: constants.DOMAIN.replace('https://', ''),
      project_name: client.name,
      ...params,
      ...user_data,
    });

    return { template: renderedText, subject };
  }

  async sendCodeByType(
    {
      user_id,
      email,
      resend,
      code_type,
      app_name,
      timezone_offset,
      noReference,
    }: VerificationSendCodeEmailDTO & { noReference?: boolean },
    provider?: TEmailProvider,
  ) {
    if (!provider) provider = await this.findEmailProvider();
    if (!provider) throw new BadRequestException(Ei18nCodes.T3E0030);

    const rule = await this.settingsService.getUserRuleByFieldName(UserProfileFields.email);
    if (code_type === MailCodeTypes.confirmEmail && rule.unique) {
      const externalAccountOwner = await prisma.externalAccount.findFirst({
        where: { sub: email, type: EProviderTypes.EMAIL },
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (externalAccountOwner && user_id) {
        if (externalAccountOwner && externalAccountOwner.user.id !== parseInt(user_id, 10)) {
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
    const expires_date = `${String(expiresUTC.getHours()).padStart(2, '0')}:${String(
      expiresUTC.getMinutes(),
    ).padStart(2, '0')} ${expiresUTC.getDate()} ${getMonthByNumber(
      expiresUTC.getMonth(),
    )} ${expires.getFullYear()}`;

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
        },
        provider as TEmailProvider,
      );
    }

    await this.emailCode.upsert(email, { user_id, code, counter: 0 }, mailCodeTtlSec);

    return { code, expires };
  }

  async confirm(email: string, code: string) {
    await this.checkCode(email, code);
    await this.emailCode.destroy(email);
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
    const users = await prisma.user.findMany({
      where: { email: params.email },
      select: {
        id: true,
      },
    });

    const rule = await this.settingsService.getUserRuleByFieldName(UserProfileFields.email);
    return { isExist: !!users.length, uniqueRule: rule.unique };
  }

  public async checkCode(email: string, code: string) {
    let ids = email;
    if (!ids.includes('@')) {
      const user = await prisma.user.findFirst({
        where: { login: ids },
      });
      if (!user) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }
      if (!user.email) {
        throw new BadRequestException(Ei18nCodes.T3E0057);
      }
      ids = user.email;
    }

    const data = await this.emailCode.find(ids);
    if (!data) throw new BadRequestException(Ei18nCodes.T3E0098);

    if (data.counter > 5) {
      await this.emailCode.destroy(ids);
      throw new BadRequestException(Ei18nCodes.T3E0054);
    }

    if (data.code !== code && !data.status) {
      await this.emailCode.upsert(ids, { ...data, counter: data.counter + 1 });
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }
  }

  public async findEmailProvider(): Promise<TEmailProvider | null> {
    const emailProvider = (await prisma.provider.findFirst({
      where: {
        type: EProviderTypes.EMAIL,
      },
    })) as TEmailProvider;

    if (!emailProvider) return null;

    return emailProvider;
  }

  @ProviderMethod(VerificationSendCodeEmailDTO)
  async verificationCode(params: VerificationSendCodeEmailDTO, req: Request, res: Response) {
    let client_id = constants.CLIENT_ID;
    const session = await this.uid.get<{
      iat: number;
      exp: number;
      returnTo: string;
      prompt: TPrompt;
      params: TParams;
      kind: string;
      jti: string;
    }>(params.uid);
    if (session) client_id = session.params.client_id;

    params.email = params.email.trim();
    if (!params.email.includes('@')) {
      const user = await prisma.user.findFirst({
        where: { login: params.email },
      });
      if (!user) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }
      if (!user.email) {
        throw new BadRequestException(Ei18nCodes.T3E0057);
      }
      params.email = user.email;
      params.user_id = user.id.toString();
    }

    const { name: app_name } = await prisma.client.findUnique({ where: { client_id } });

    await this.sendCodeByType({
      ...params,
      app_name,
      noReference: params.code_type === MailCodeTypes.recoverPassword,
    });

    return;
  }
}

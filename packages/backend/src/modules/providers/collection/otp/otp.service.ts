import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Provider, User } from '@prisma/client';
import { Request, Response } from 'express';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { Ei18nCodes } from 'src/enums';
import { generateRandomDigits } from '../../../../helpers';
import { prisma } from '../../../prisma/prisma.client';
import { REDIS_PREFIXES, RedisAdapter } from '../../../redis/redis.adapter';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { ProviderMethod } from '../../providers.decorators';
import {
  ConfirmTOTPSetupDto,
  CreateTOTPProviderDto,
  DisableTOTPDto,
  RegenerateBackupCodesDto,
  SetupTOTPDto,
  TOTPStatusDto,
  UpdateTOTPProviderDto,
  VerifyTOTPDto,
} from './otp.dto';

export const PROVIDER_TYPE_TOTP = 'TOTP';
export const PROVIDER_TYPE_HOTP = 'HOTP';

export interface IOTPSetupResponse {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  digits: number;
  algorithm: string;
  period?: number;
  counter?: number;
}

@Injectable()
export class OtpService extends ProviderBase {
  defaultUrlAvatar: string = 'public/default/totp.svg';
  type = PROVIDER_TYPE_TOTP;

  authCode = new RedisAdapter(REDIS_PREFIXES.Totp);

  @ProviderMethod(CreateTOTPProviderDto)
  async onCreate(
    params: CreateTOTPProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    params.params = {
      // issuer_name: 'IDTrustedNode',
      window_size: 2,
      code_length: 6,
      time_step: 30,
      ...params.params,
    };
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateTOTPProviderDto)
  async onUpdate(
    params: UpdateTOTPProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  async generateTOTPSetup(
    userId: string,
    appName: string = 'IDTrustedNode',
    params?: { digits?: number; period?: number; counter?: number; algorithm?: string },
  ): Promise<IOTPSetupResponse> {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);

    const digits = params?.digits || 6;
    const period = params?.period || 30;
    const algorithm = (params?.algorithm?.toLowerCase() || 'sha1') as 'sha1' | 'sha256' | 'sha512';

    const secret = speakeasy.generateSecret({
      name: user.email || user.phone_number || `User ${userId}`,
      issuer: appName,
      length: 32,
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: user.email || user.phone_number || `User ${userId}`,
      issuer: appName,
      encoding: 'ascii',
      algorithm,
      digits,
      period,
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    await this.authCode.upsert(
      `totp_setup_${userId}`,
      { secret: secret.base32, userId, digits, period, algorithm },
      300,
    );

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      digits,
      period,
      algorithm,
    };
  }

  async confirmTOTPSetup(userId: string, token: string) {
    const setupData = await this.authCode.get(`totp_setup_${userId}`);
    if (!setupData) {
      throw new BadRequestException(Ei18nCodes.T3E0075);
    }

    const { secret, digits, period, algorithm } = setupData;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
      digits: digits || 6,
      step: period || 30,
      algorithm: algorithm || 'sha1',
    });

    if (!verified) {
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }

    const backupCodes = this.generateBackupCodes();

    const existingAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: parseInt(userId),
        type: this.type,
      },
    });

    const accountData = {
      user_id: parseInt(userId),
      sub: `${this.type.toLowerCase()}_${userId}`,
      type: this.type as any,
      label: `${this.type} Authenticator`,
      rest_info: {
        secret,
        digits: digits || 6,
        period: period || 30,
        algorithm: algorithm || 'sha1',
        backup_codes: backupCodes,
        enabled: true,
      },
    };

    if (existingAccount) {
      await prisma.externalAccount.update({
        where: { id: existingAccount.id },
        data: accountData,
      });
    } else {
      await prisma.externalAccount.create({ data: accountData });
    }

    await this.authCode.destroy(`totp_setup_${userId}`);

    return { backupCodes };
  }

  async verifyTOTP(identifier: string, token: string): Promise<User> {
    const user = await this.settingsService.getUserByIdentifier(identifier);

    const otpAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: user.user.id,
        type: this.type as any,
      },
    });

    if (!otpAccount || !otpAccount.rest_info) {
      throw new BadRequestException(Ei18nCodes.T3E0087);
    }

    const otpInfo = otpAccount.rest_info as any;
    if (!otpInfo.enabled) {
      throw new BadRequestException(Ei18nCodes.T3E0000);
    }

    const totpValid = this.verifyOTPToken(
      token,
      otpInfo.secret,
      otpInfo.digits || 6,
      otpInfo.period || 30,
      otpInfo.algorithm || 'sha1',
    );

    if (totpValid) return user.user;

    const backupCodes = otpInfo.backup_codes || [];
    const codeIndex = backupCodes.indexOf(token);

    if (codeIndex !== -1) {
      backupCodes.splice(codeIndex, 1);
      otpInfo.backup_codes = backupCodes;
      await prisma.externalAccount.update({
        where: { id: otpAccount.id },
        data: { rest_info: otpInfo },
      });
      return user.user;
    }

    throw new BadRequestException(Ei18nCodes.T3E0038);
  }

  protected verifyOTPToken(
    token: string,
    secret: string,
    digits: number,
    periodOrCounter: number,
    algorithm: string,
  ): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
      digits,
      step: periodOrCounter,
      algorithm: algorithm as any,
    });
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(generateRandomDigits(8));
    }
    return codes;
  }

  async disableTOTP(userId: string, token: string) {
    await this.verifyTOTP(userId, token);

    await prisma.externalAccount.deleteMany({
      where: {
        user_id: parseInt(userId),
        type: this.type as any,
      },
    });

    return { success: true };
  }

  // @ProviderMethod(VerifyTOTPDto)
  async onAuth(
    params: VerifyTOTPDto,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse> {
    const user = await this.verifyTOTP(params.identifier, params.code);
    return { user };
  }

  @ProviderMethod(SetupTOTPDto)
  async setupTOTP(params: SetupTOTPDto, req: Request, res: Response) {
    const userId = (req['user'] as any)?.id?.toString() || (req.query.userId as string);
    return this.generateTOTPSetup(userId, params.appName);
  }

  @ProviderMethod(ConfirmTOTPSetupDto)
  async confirmSetup(params: ConfirmTOTPSetupDto, req: Request, res: Response) {
    const userId = (req['user'] as any)?.id?.toString() || (req.query.userId as string);
    return this.confirmTOTPSetup(userId, params.token);
  }

  @ProviderMethod(VerifyTOTPDto)
  async verify(params: VerifyTOTPDto, req: Request, res: Response) {
    return this.verifyTOTP(params.identifier, params.code);
  }

  @ProviderMethod(DisableTOTPDto)
  async disable(params: DisableTOTPDto, req: Request, res: Response) {
    const userId = (req['user'] as any)?.id?.toString() || (req.query.userId as string);
    return this.disableTOTP(userId, params.token);
  }

  @ProviderMethod(RegenerateBackupCodesDto)
  async regenerateBackups(params: RegenerateBackupCodesDto, req: Request, res: Response) {
    const userId = (req['user'] as any)?.id?.toString() || (req.query.userId as string);
    return this.regenerateBackupCodes(userId, params.token);
  }

  @ProviderMethod(TOTPStatusDto)
  async status(params: TOTPStatusDto, req: Request, res: Response) {
    return this.getTOTPStatus(params.userId);
  }

  async getTOTPStatus(userId: string): Promise<{ enabled: boolean; hasBackupCodes: boolean }> {
    const otpAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: parseInt(userId),
        type: this.type as any,
      },
    });

    if (!otpAccount || !otpAccount.rest_info) {
      return { enabled: false, hasBackupCodes: false };
    }

    const otpInfo = otpAccount.rest_info as any;

    return {
      enabled: !!otpInfo.enabled,
      hasBackupCodes: !!(otpInfo.backup_codes && otpInfo.backup_codes.length > 0),
    };
  }

  async regenerateBackupCodes(userId: string, token: string) {
    await this.verifyTOTP(userId, token);

    const otpAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: parseInt(userId),
        type: this.type as any,
      },
    });

    if (!otpAccount) {
      throw new BadRequestException(`${this.type} не настроен`);
    }

    const backupCodes = this.generateBackupCodes();
    const otpInfo = (otpAccount.rest_info as any) || {};
    otpInfo.backup_codes = backupCodes;

    await prisma.externalAccount.update({
      where: { id: otpAccount.id },
      data: { rest_info: otpInfo },
    });

    return { backupCodes };
  }

  onBindAccount(userId: string, params: any) {
    return this.confirmTOTPSetup(userId, params.token);
  }

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  onActivate(): Promise<void> {
    return Promise.resolve();
  }
}

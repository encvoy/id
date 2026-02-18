import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { prisma } from '../../../prisma/prisma.client';
import { BadRequestException } from '@nestjs/common';
import { PROVIDER_TYPE_HOTP, OtpService, IOTPSetupResponse } from './otp.service';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class HotpService extends OtpService {
  defaultUrlAvatar: string = 'public/default/hotp.svg';
  type = PROVIDER_TYPE_HOTP;

  async generateTOTPSetup(
    userId: string,
    appName: string = 'IDTrustedNode',
    params?: { digits?: number; counter?: number; period?: number; algorithm?: string },
  ): Promise<IOTPSetupResponse> {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);

    const digits = params?.digits || 6;
    const counter = params?.counter || 0;
    const algorithm = (params?.algorithm?.toLowerCase() || 'sha1') as 'sha1' | 'sha256' | 'sha512';

    const secret = speakeasy.generateSecret({
      name: user.email || user.phone_number || `User ${userId}`,
      issuer: appName,
      length: 32,
    });

    const otpauthUrl = `otpauth://hotp/${encodeURIComponent(appName)}:${encodeURIComponent(
      user.email || user.phone_number || `User ${userId}`,
    )}?secret=${secret.base32}&issuer=${encodeURIComponent(
      appName,
    )}&algorithm=${algorithm.toUpperCase()}&digits=${digits}&counter=${counter}`;

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    await this.authCode.upsert(
      `totp_setup_${userId}`,
      { secret: secret.base32, userId, digits, counter, algorithm },
      300,
    );

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      digits,
      counter,
      algorithm,
    };
  }

  async confirmTOTPSetup(userId: string, token: string) {
    const setupData = await this.authCode.get(`totp_setup_${userId}`);
    if (!setupData) {
      throw new BadRequestException(Ei18nCodes.T3E0075);
    }

    const { secret, digits, counter, algorithm } = JSON.parse(setupData);

    const verified = speakeasy.hotp.verify({
      secret,
      encoding: 'base32',
      token,
      counter: counter || 0,
      window: 10,
      digits: digits || 6,
      algorithm: algorithm || 'sha1',
    });

    if (!verified) {
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }

    const backupCodes = this['generateBackupCodes']();

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
        counter: counter || 0,
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

  protected verifyOTPToken(
    token: string,
    secret: string,
    digits: number,
    counter: number,
    algorithm: string,
  ): boolean {
    return speakeasy.hotp.verify({
      secret,
      encoding: 'base32',
      token,
      counter,
      window: 10,
      digits,
      algorithm: algorithm as any,
    });
  }

  async verifyTOTP(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const otpAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: parseInt(userId),
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

    const hotpValid = this.verifyOTPToken(
      token,
      otpInfo.secret,
      otpInfo.digits || 6,
      otpInfo.counter || 0,
      otpInfo.algorithm || 'sha1',
    );

    if (hotpValid) {
      otpInfo.counter = (otpInfo.counter || 0) + 1;
      await prisma.externalAccount.update({
        where: { id: otpAccount.id },
        data: { rest_info: otpInfo },
      });
      return user;
    }

    const backupCodes = otpInfo.backup_codes || [];
    const codeIndex = backupCodes.indexOf(token);

    if (codeIndex !== -1) {
      backupCodes.splice(codeIndex, 1);
      otpInfo.backup_codes = backupCodes;
      await prisma.externalAccount.update({
        where: { id: otpAccount.id },
        data: { rest_info: otpInfo },
      });
      return user;
    }

    throw new BadRequestException(Ei18nCodes.T3E0038);
  }
}

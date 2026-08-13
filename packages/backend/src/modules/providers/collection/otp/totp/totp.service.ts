import { Injectable } from '@nestjs/common';
import { Prisma, Provider } from '@prisma/client';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { LegacyUserModel } from 'src/modules/repository/user-compat';
import { ProviderMethod } from '../../../providers.decorators';
import { BaseOtpService } from '../common/base-otp.service';
import {
  OtpAccountRestInfo,
  OtpProviderSetupParams,
  OtpSetupData,
  OtpSetupResponseData,
  OtpVerificationResult,
  PROVIDER_TYPE_TOTP,
} from '../common/otp.types';
import * as dto from './totp.dto';

@Injectable()
export class TotpService extends BaseOtpService {
  defaultUrlAvatar = 'public/default/totp.svg';
  type = PROVIDER_TYPE_TOTP;

  @ProviderMethod(dto.CreateTOTPProviderDto)
  async onCreate(
    params: dto.CreateTOTPProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    params.params = {
      digits: 6,
      period: 30,
      algorithm: 'SHA1',
      ...params.params,
    };

    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(dto.UpdateTOTPProviderDto)
  async onUpdate(
    params: dto.UpdateTOTPProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  protected mapProviderSetupParams(
    params?: Record<string, unknown>,
  ): OtpProviderSetupParams | undefined {
    if (!params) {
      return undefined;
    }

    return {
      digits: this.parseOptionalNumber(params['digits'] ?? params['code_length']),
      period: this.parseOptionalNumber(params['period'] ?? params['time_step']),
      algorithm: this.parseOptionalAlgorithm(params['algorithm']),
    };
  }

  protected async createSetup(
    user: LegacyUserModel,
    issuer: string,
    params?: OtpProviderSetupParams,
  ): Promise<{ setupData: OtpSetupData; response: OtpSetupResponseData }> {
    const digits = params?.digits || 6;
    const period = params?.period || 30;
    const algorithm = this.normalizeAlgorithm(params?.algorithm);
    const secret = speakeasy.generateSecret({
      name: this.buildUserLabel(user),
      issuer,
      length: 32,
    });
    const setupData: OtpSetupData = {
      secret: secret.base32,
      digits,
      period,
      algorithm,
    };

    return {
      setupData,
      response: await this.buildSetupResponse(user, issuer, setupData),
    };
  }

  protected async buildSetupResponse(
    user: LegacyUserModel,
    issuer: string,
    setupData: OtpSetupData,
  ): Promise<OtpSetupResponseData> {
    const digits = setupData.digits || 6;
    const period = setupData.period || 30;
    const algorithm = this.normalizeAlgorithm(setupData.algorithm);
    const otpauthUrl = speakeasy.otpauthURL({
      secret: setupData.secret,
      label: this.buildUserLabel(user),
      issuer,
      encoding: 'base32',
      algorithm,
      digits,
      period,
    });

    return {
      secret: setupData.secret,
      qrCode: await QRCode.toDataURL(otpauthUrl),
      manualEntryKey: setupData.secret,
      digits,
      period,
      algorithm,
    };
  }

  protected prepareVerifiedSetupData(
    token: string,
    setupData: OtpSetupData,
  ): OtpSetupData | null {
    const verified = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token,
      window: 2,
      digits: setupData.digits || 6,
      step: setupData.period || 30,
      algorithm: this.normalizeAlgorithm(setupData.algorithm) as any,
    });

    return verified ? setupData : null;
  }

  protected verifyAccountToken(
    otpInfo: OtpAccountRestInfo,
    token: string,
  ): OtpVerificationResult | null {
    const isValid = speakeasy.totp.verify({
      secret: otpInfo.secret,
      encoding: 'base32',
      token,
      window: 2,
      digits: otpInfo.digits || 6,
      step: otpInfo.period || 30,
      algorithm: this.normalizeAlgorithm(otpInfo.algorithm) as any,
    });

    if (!isValid) {
      return null;
    }

    return { restInfo: otpInfo };
  }
}

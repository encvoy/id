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
  PROVIDER_TYPE_HOTP,
} from '../common/otp.types';
import * as dto from './hotp.dto';

@Injectable()
export class HotpService extends BaseOtpService {
  defaultUrlAvatar = 'public/default/hotp.svg';
  type = PROVIDER_TYPE_HOTP;
  private readonly verificationWindow = 10;

  @ProviderMethod(dto.CreateHOTPProviderDto)
  async onCreate(
    params: dto.CreateHOTPProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    params.params = {
      digits: 6,
      counter: 0,
      algorithm: 'SHA1',
      ...params.params,
    };

    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(dto.UpdateHOTPProviderDto)
  async onUpdate(
    params: dto.UpdateHOTPProviderDto,
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
      digits: this.parseOptionalNumber(params['digits']),
      counter: this.parseOptionalNumber(params['counter']),
      algorithm: this.parseOptionalAlgorithm(params['algorithm']),
    };
  }

  protected async createSetup(
    user: LegacyUserModel,
    issuer: string,
    params?: OtpProviderSetupParams,
  ): Promise<{ setupData: OtpSetupData; response: OtpSetupResponseData }> {
    const digits = params?.digits || 6;
    const counter = params?.counter ?? 0;
    const algorithm = this.normalizeAlgorithm(params?.algorithm);
    const secret = speakeasy.generateSecret({
      name: this.buildUserLabel(user),
      issuer,
      length: 32,
    });
    const setupData: OtpSetupData = {
      secret: secret.base32,
      digits,
      counter,
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
    const counter = setupData.counter ?? 0;
    const algorithm = this.normalizeAlgorithm(setupData.algorithm);
    const otpauthUrl = `otpauth://hotp/${encodeURIComponent(issuer)}:${encodeURIComponent(
      this.buildUserLabel(user),
    )}?secret=${setupData.secret}&issuer=${encodeURIComponent(
      issuer,
    )}&algorithm=${algorithm.toUpperCase()}&digits=${digits}&counter=${counter}`;

    return {
      secret: setupData.secret,
      qrCode: await QRCode.toDataURL(otpauthUrl),
      manualEntryKey: setupData.secret,
      digits,
      counter,
      algorithm,
    };
  }

  protected prepareVerifiedSetupData(
    token: string,
    setupData: OtpSetupData,
  ): OtpSetupData | null {
    const delta = this.getVerificationDelta(
      token,
      setupData.secret,
      setupData.digits || 6,
      setupData.counter ?? 0,
      this.normalizeAlgorithm(setupData.algorithm),
    );

    if (delta === null) {
      return null;
    }

    return {
      ...setupData,
      counter: this.getNextCounter(setupData.counter ?? 0, delta),
    };
  }

  protected verifyAccountToken(
    otpInfo: OtpAccountRestInfo,
    token: string,
  ): OtpVerificationResult | null {
    const delta = this.getVerificationDelta(
      token,
      otpInfo.secret,
      otpInfo.digits || 6,
      otpInfo.counter ?? 0,
      this.normalizeAlgorithm(otpInfo.algorithm),
    );

    if (delta === null) {
      return null;
    }

    return {
      restInfo: {
        ...otpInfo,
        counter: this.getNextCounter(otpInfo.counter ?? 0, delta),
      },
      shouldPersist: true,
    };
  }

  private getNextCounter(counter: number, delta: number): number {
    return counter + delta + 1;
  }

  private getVerificationDelta(
    token: string,
    secret: string,
    digits: number,
    counter: number,
    algorithm: string,
    window = this.verificationWindow,
  ): number | null {
    const result = speakeasy.hotp.verifyDelta({
      secret,
      encoding: 'base32',
      token,
      counter,
      window,
      digits,
      algorithm: this.normalizeAlgorithm(algorithm) as any,
    });

    return typeof result?.delta === 'number' ? result.delta : null;
  }
}

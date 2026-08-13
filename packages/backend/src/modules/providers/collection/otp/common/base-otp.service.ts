import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExternalAccount, Provider } from '@prisma/client';
import { randomInt } from 'crypto';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CLIENT_ID, DOMAIN } from 'src/constants';
import { Ei18nCodes } from 'src/enums';
import { UsersService } from 'src/modules/users/users.service';
import { resolveLocalizedText } from '../../../../../utils/localized-text';
import { prisma } from '../../../../prisma/prisma.client';
import { REDIS_PREFIXES, RedisAdapter } from '../../../../redis/redis.adapter';
import { LegacyUserModel, legacyUserInclude, toLegacyUser } from '../../../../repository/user-compat';
import { IAuthResponse } from '../../../factory.service';
import { ProviderBase } from '../../../provider.base';
import { ProviderMethod } from '../../../providers.decorators';
import * as dto from './otp.dto';
import {
  IOtpSetupResponse,
  OtpAccountRestInfo,
  OtpBindAccountParams,
  OtpBindAccountPayload,
  OtpInteractionAuthParams,
  OtpProviderSetupParams,
  OtpSetupData,
  OtpSetupRecord,
  OtpSetupResponseData,
  OtpVerificationResult,
  OTP_ALGORITHMS,
  TOtpAlgorithm,
} from './otp.types';

type TOtpSetupContext = {
  requiredAccountsInfoUid?: string;
  requiredProviderIds?: unknown;
  interactionId?: string;
};

const OTP_SETUP_TTL_SECONDS = 5 * 60;

export abstract class BaseOtpService extends ProviderBase {
  otpRegistration = new RedisAdapter(REDIS_PREFIXES.Totp);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  bindData = new RedisAdapter(REDIS_PREFIXES.BindData);
  mfa1 = new RedisAdapter(REDIS_PREFIXES.MFA1);
  mfa2 = new RedisAdapter(REDIS_PREFIXES.MFA2);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  twoFactorAuthentication = new RedisAdapter(REDIS_PREFIXES.TwoFactorAuthentication);

  get userService() {
    return this.moduleRef.get(UsersService, { strict: false });
  }

  protected abstract mapProviderSetupParams(
    params?: Record<string, unknown>,
  ): OtpProviderSetupParams | undefined;

  protected abstract createSetup(
    user: LegacyUserModel,
    issuer: string,
    params?: OtpProviderSetupParams,
  ): Promise<{ setupData: OtpSetupData; response: OtpSetupResponseData }>;

  protected abstract buildSetupResponse(
    user: LegacyUserModel,
    issuer: string,
    setupData: OtpSetupData,
  ): Promise<OtpSetupResponseData>;

  protected abstract prepareVerifiedSetupData(
    token: string,
    setupData: OtpSetupData,
  ): OtpSetupData | null;

  protected abstract verifyAccountToken(
    otpInfo: OtpAccountRestInfo,
    token: string,
  ): Promise<OtpVerificationResult | null> | OtpVerificationResult | null;

  async generateSetup(
    userId: string | null | undefined,
    providerId: string,
    options?: TOtpSetupContext,
  ): Promise<IOtpSetupResponse> {
    const normalizedProviderId = this.parseProviderId(providerId);
    const resolvedUserId = await this.resolveRegistrationUserId(
      userId,
      options?.requiredAccountsInfoUid,
      options?.interactionId,
    );
    if (!userId && options?.interactionId) {
      await this.assertInteractionProviderAllowed(
        normalizedProviderId,
        options.interactionId,
        options.requiredProviderIds,
        resolvedUserId,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: resolvedUserId },
      include: legacyUserInclude,
    });
    const legacyUser = toLegacyUser(user);

    if (!legacyUser) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const client = await prisma.client.findFirst({ where: { client_id: CLIENT_ID } });
    const issuer = resolveLocalizedText(client?.name, 'ru', 'ru') || 'ID';
    const existingSetup = await this.getReusableSetupRecord(
      resolvedUserId,
      normalizedProviderId,
      options?.interactionId,
    );
    if (existingSetup) {
      return {
        ...(await this.buildSetupResponse(legacyUser, issuer, existingSetup.record.setupData)),
        state: existingSetup.state,
      };
    }

    const { setupData, response } = await this.createSetup(
      legacyUser,
      issuer,
      await this.resolveProviderSetupParams(normalizedProviderId),
    );
    const state = uuidv4();
    const setupRecord: OtpSetupRecord = {
      userId: resolvedUserId,
      providerId: normalizedProviderId,
      providerType: this.type,
      interactionId: options?.interactionId,
      setupData,
    };

    await this.persistSetupRecord(state, setupRecord);

    return {
      ...response,
      state,
    };
  }

  async verifyUserOtp(
    identifier: string,
    token: string,
    providerId?: string,
  ): Promise<LegacyUserModel> {
    const { user } = await this.settingsService.getUserByIdentifier(identifier);
    return this.verifyOtpForUser(user, token, providerId);
  }

  async disableUserOtp(userId: string, token: string) {
    await this.verifyOtpByUserId(userId, token);

    await prisma.externalAccount.deleteMany({
      where: {
        user_id: userId,
        type: this.type as any,
      },
    });

    return { success: true };
  }

  async getUserOtpStatus(userId: string): Promise<{ enabled: boolean; hasBackupCodes: boolean }> {
    const otpAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: userId,
        type: this.type as any,
      },
    });

    if (!otpAccount || !otpAccount.rest_info) {
      return { enabled: false, hasBackupCodes: false };
    }

    const otpInfo = otpAccount.rest_info as OtpAccountRestInfo;

    return {
      enabled: !!otpInfo.enabled,
      hasBackupCodes: !!(otpInfo.backup_codes && otpInfo.backup_codes.length > 0),
    };
  }

  async regenerateUserBackupCodes(userId: string, token: string) {
    await this.verifyOtpByUserId(userId, token);

    const otpAccount = await prisma.externalAccount.findFirst({
      where: {
        user_id: userId,
        type: this.type as any,
      },
    });

    if (!otpAccount) {
      throw new BadRequestException(`${this.type} is not configured`);
    }

    const backupCodes = await this.generateBackupCodes();
    const otpInfo = (otpAccount.rest_info as OtpAccountRestInfo) || ({} as OtpAccountRestInfo);
    otpInfo.backup_codes = backupCodes;

    await prisma.externalAccount.update({
      where: { id: otpAccount.id },
      data: { rest_info: otpInfo },
    });

    return { backupCodes };
  }

  async onAuth(
    params: OtpInteractionAuthParams,
    uid: string,
    provider: Provider,
    req: Request,
    res: Response,
  ): Promise<IAuthResponse> {
    if (params.otp_setup === true || params.otp_setup === 'true') {
      const state = typeof params.state === 'string' ? params.state.trim() : '';
      if (!state) {
        throw new BadRequestException(Ei18nCodes.T3E0034);
      }

      const storedUserId = await this.resolveBindUserId(state, provider.id, uid);
      await this.assertInteractionProviderAllowed(
        provider.id,
        uid,
        req.cookies?._req_ids,
        storedUserId,
      );
      await this.userService.bindAccount(storedUserId, provider, {
        token: params.code || '',
        state,
        provider_id: provider.id,
        interaction_id: uid,
      } satisfies OtpBindAccountParams);
      await this.completeInteractionBinding(uid, provider, res);

      return {
        user: await prisma.user.findUnique({
          where: { id: storedUserId },
        }),
      };
    }

    if (params.otp_not_available === true || params.otp_not_available === 'true') {
      return { user: undefined };
    }

    const firstFactor = await this.mfa1.find(uid);
    if (firstFactor?.user_id) {
      const user = toLegacyUser(
        await prisma.user.findUnique({
          where: { id: String(firstFactor.user_id) },
          include: legacyUserInclude,
        }),
      );
      if (!user) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }

      const otpAccount = await this.getOtpAccountByUserId(user.id, provider.id);
      if (!otpAccount) {
        return { user: undefined };
      }
      if (!params.code) {
        throw new BadRequestException(Ei18nCodes.T3E0038);
      }

      return { user: await this.verifyOtpForUser(user, params.code, provider.id) };
    }

    if (!params.identifier) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const { user } = await this.settingsService.getUserByIdentifier(params.identifier);
    const otpAccount = await this.getOtpAccountByUserId(user.id, provider.id);
    if (!otpAccount) {
      return { user: undefined };
    }

    if (!params.code) {
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }

    const verifiedUser = await this.verifyOtpForUser(user, params.code, provider.id);
    return { user: verifiedUser };
  }

  @ProviderMethod(dto.VerifyOtpDto)
  async verify(params: dto.VerifyOtpDto, req: Request, res: Response) {
    return this.verifyUserOtp(params.identifier, params.code);
  }

  @ProviderMethod(dto.DisableOtpDto)
  async disable(params: dto.DisableOtpDto, req: Request, res: Response) {
    return this.disableUserOtp(this.extractUserId(req), params.token);
  }

  @ProviderMethod(dto.RegenerateBackupCodesDto)
  async regenerateBackups(params: dto.RegenerateBackupCodesDto, req: Request, res: Response) {
    return this.regenerateUserBackupCodes(this.extractUserId(req), params.token);
  }

  @ProviderMethod(dto.OtpStatusDto)
  async status(params: dto.OtpStatusDto, req: Request, res: Response) {
    return this.getUserOtpStatus(params.userId);
  }

  async onBindAccount(params: OtpBindAccountParams, userId: string) {
    return this.prepareBindAccountPayload(userId, params);
  }

  syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  onActivate(provider: Provider): Promise<void> {
    return Promise.resolve();
  }

  protected extractUserId(req: Request): string {
    return (req['user'] as any)?.id?.toString() || (req.query.userId as string);
  }

  protected async resolveProviderSetupParams(
    providerId: string,
  ): Promise<OtpProviderSetupParams | undefined> {
    const provider = await prisma.provider.findUnique({
      where: { id: this.parseProviderId(providerId) },
      select: { type: true, params: true },
    });

    if (!provider || provider.type !== this.type) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    return this.mapProviderSetupParams(provider.params as Record<string, unknown> | undefined);
  }

  protected parseProviderId(providerId: string): string {
    const normalized = providerId?.trim();

    if (!normalized) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    return normalized;
  }

  protected parseOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  protected parseOptionalAlgorithm(value: unknown): TOtpAlgorithm | undefined {
    if (typeof value !== 'string' || !value.trim()) {
      return undefined;
    }

    const normalized = value.toLowerCase();

    if (!OTP_ALGORITHMS.includes(normalized as TOtpAlgorithm)) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    return normalized as TOtpAlgorithm;
  }

  protected buildUserLabel(user: LegacyUserModel): string {
    return user.login || user.email || user.phone_number || `User ${user.id}`;
  }

  protected buildAccountRestInfo(
    providerId: string,
    setupData: OtpSetupData,
    backupCodes: string[],
  ): OtpAccountRestInfo {
    const restInfo: OtpAccountRestInfo = {
      secret: setupData.secret,
      digits: setupData.digits || 6,
      algorithm: this.normalizeAlgorithm(setupData.algorithm),
      backup_codes: backupCodes,
      enabled: true,
      provider_id: providerId,
    };

    if (typeof setupData.period === 'number') {
      restInfo.period = setupData.period;
    }

    if (typeof setupData.counter === 'number') {
      restInfo.counter = setupData.counter;
    }

    return restInfo;
  }

  protected createBindAccountPayload(
    userId: string,
    providerId: string,
    setupData: OtpSetupData,
    backupCodes: string[],
  ): OtpBindAccountPayload {
    return {
      sub: `${this.type.toLowerCase()}_${providerId}_${userId}`,
      issuer: DOMAIN,
      type: this.type as any,
      label: `${this.type} Authenticator`,
      rest_info: this.buildAccountRestInfo(providerId, setupData, backupCodes),
    };
  }

  protected async prepareBindAccountPayload(
    userId: string,
    params: OtpBindAccountParams,
  ): Promise<OtpBindAccountPayload> {
    const token = typeof params?.token === 'string' ? params.token.trim() : '';
    const state = typeof params?.state === 'string' ? params.state.trim() : '';
    if (!params || !token) {
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }

    const normalizedParams: OtpBindAccountParams = {
      token,
      state,
      provider_id: this.parseProviderId(params.provider_id),
      interaction_id: params.interaction_id,
    };
    const setupRecord = await this.getSetupRecord(normalizedParams, userId);
    if (!this.prepareVerifiedSetupData(token, setupRecord.setupData)) {
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }

    const consumedRecord = await this.otpRegistration.take<OtpSetupRecord>(state);
    const validatedRecord = this.validateSetupRecord(consumedRecord, normalizedParams, userId);
    const verifiedSetupData = this.prepareVerifiedSetupData(
      token,
      validatedRecord.setupData,
    );
    if (!verifiedSetupData) {
      throw new BadRequestException(Ei18nCodes.T3E0038);
    }

    await this.clearSetupIndex(state, validatedRecord);

    return this.createBindAccountPayload(
      userId,
      validatedRecord.providerId,
      verifiedSetupData,
      await this.generateBackupCodes(),
    );
  }

  protected async generateBackupCodes(): Promise<string[]> {
    return Array.from({ length: 10 }, () =>
      randomInt(0, 100_000_000).toString().padStart(8, '0'),
    );
  }

  protected normalizeAlgorithm(algorithm?: string): TOtpAlgorithm {
    const normalized = algorithm?.toLowerCase();

    if (normalized && OTP_ALGORITHMS.includes(normalized as TOtpAlgorithm)) {
      return normalized as TOtpAlgorithm;
    }

    return 'sha1';
  }

  protected async getOtpAccountByUserId(
    userId: string,
    providerId?: string,
  ): Promise<ExternalAccount | null> {
    const accounts = await prisma.externalAccount.findMany({
      where: {
        user_id: userId,
        type: this.type as any,
      },
    });

    if (!providerId) {
      return accounts[0] || null;
    }

    return (
      accounts.find((account) => {
        const restInfo = account.rest_info as OtpAccountRestInfo | null;
        return restInfo?.provider_id === providerId;
      }) ||
      accounts.find((account) => {
        const restInfo = account.rest_info as OtpAccountRestInfo | null;
        return !restInfo?.provider_id;
      }) ||
      null
    );
  }

  private async resolveRegistrationUserId(
    userId?: string | null,
    requiredAccountsInfoUid?: string,
    interactionId?: string,
  ): Promise<string> {
    if (userId) {
      return userId;
    }

    if (requiredAccountsInfoUid) {
      const { id } = (await this.requiredAccountsInfoAdapter.get(requiredAccountsInfoUid)) || {};
      if (id) {
        return String(id);
      }
    }

    if (interactionId) {
      const mfa1 = await this.mfa1.find(interactionId);
      if (mfa1?.user_id) {
        return String(mfa1.user_id);
      }

      const userData = await this.userData.find(interactionId);
      if (userData?.id) {
        return String(userData.id);
      }
    }

    throw new ForbiddenException(Ei18nCodes.T3E0026);
  }

  private async assertInteractionProviderAllowed(
    providerId: string,
    interactionId: string,
    requiredProviderIds: unknown,
    userId: string,
  ): Promise<void> {
    const bindAccounts = (await this.bindData.find(interactionId)) || [];
    const isPendingBinding = bindAccounts.some(
      (account) => String(account?.provider_id) === providerId,
    );
    if (isPendingBinding) {
      return;
    }

    const secondFactorEnrollment = await this.twoFactorAuthentication.find(interactionId);
    if (
      secondFactorEnrollment?.user_id === userId &&
      Array.isArray(secondFactorEnrollment.provider_ids) &&
      secondFactorEnrollment.provider_ids.map(String).includes(providerId)
    ) {
      return;
    }

    const requiredIds = this.normalizeProviderIds(requiredProviderIds);
    const [mfa1, mfa2] = await Promise.all([
      this.mfa1.find(interactionId),
      this.mfa2.find(interactionId),
    ]);
    if ((mfa1 && !mfa2) || !requiredIds.includes(providerId)) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }
  }

  private normalizeProviderIds(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value !== 'string' || !value) {
      return [];
    }

    try {
      const parsed = value.startsWith('j:') ? JSON.parse(value.slice(2)) : JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  private async resolveBindUserId(
    state: string,
    providerId: string,
    interactionId: string,
  ): Promise<string> {
    const record = await this.getSetupRecord({
      state,
      provider_id: providerId,
      interaction_id: interactionId,
    });

    return record.userId;
  }

  private getSetupIndexKey(
    userId: string,
    providerId: string,
    interactionId?: string,
  ): string {
    return `${interactionId || 'profile'}:${userId}:${providerId}`;
  }

  private async getReusableSetupRecord(
    userId: string,
    providerId: string,
    interactionId?: string,
  ): Promise<{ state: string; record: OtpSetupRecord } | null> {
    const indexKey = this.getSetupIndexKey(userId, providerId, interactionId);
    const state = await this.otpRegistration.get<string>(indexKey);
    if (!state) {
      return null;
    }

    const record = await this.otpRegistration.get<OtpSetupRecord>(state);
    if (
      !record ||
      record.userId !== userId ||
      record.providerId !== providerId ||
      record.providerType !== this.type ||
      record.interactionId !== interactionId ||
      typeof record.setupData?.secret !== 'string'
    ) {
      await this.otpRegistration.destroy(state);
      await this.otpRegistration.destroy(indexKey);
      return null;
    }

    await this.otpRegistration.upsert(state, record, OTP_SETUP_TTL_SECONDS);
    await this.otpRegistration.upsert(indexKey, state, OTP_SETUP_TTL_SECONDS);
    return { state, record };
  }

  private async persistSetupRecord(state: string, record: OtpSetupRecord): Promise<void> {
    const indexKey = this.getSetupIndexKey(
      record.userId,
      record.providerId,
      record.interactionId,
    );
    const previousState = await this.otpRegistration.get<string>(indexKey);
    if (previousState && previousState !== state) {
      await this.otpRegistration.destroy(previousState);
    }

    await this.otpRegistration.upsert(state, record, OTP_SETUP_TTL_SECONDS);
    await this.otpRegistration.upsert(indexKey, state, OTP_SETUP_TTL_SECONDS);
  }

  private async getSetupRecord(
    params: Pick<OtpBindAccountParams, 'state' | 'provider_id' | 'interaction_id'>,
    userId?: string,
  ): Promise<OtpSetupRecord> {
    const state = typeof params?.state === 'string' ? params.state.trim() : '';
    if (!state) {
      throw new BadRequestException(Ei18nCodes.T3E0034);
    }

    const record = await this.otpRegistration.get<OtpSetupRecord>(state);
    const validatedRecord = this.validateSetupRecord(record, params, userId);
    const indexedState = await this.otpRegistration.get<string>(
      this.getSetupIndexKey(
        validatedRecord.userId,
        validatedRecord.providerId,
        validatedRecord.interactionId,
      ),
    );
    if (indexedState !== state) {
      throw new BadRequestException(Ei18nCodes.T3E0034);
    }

    return validatedRecord;
  }

  private validateSetupRecord(
    record: OtpSetupRecord | null | undefined,
    params: Pick<OtpBindAccountParams, 'provider_id' | 'interaction_id'>,
    userId?: string,
  ): OtpSetupRecord {
    if (!record) {
      throw new BadRequestException(Ei18nCodes.T3E0034);
    }

    if (record.providerType !== this.type) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    if (userId && record.userId !== userId) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const providerId = this.parseProviderId(params.provider_id);
    if (record.providerId !== providerId) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    if (record.interactionId && record.interactionId !== params.interaction_id) {
      throw new BadRequestException(Ei18nCodes.T3E0039);
    }

    return record;
  }

  private async clearSetupIndex(state: string, record: OtpSetupRecord): Promise<void> {
    const indexKey = this.getSetupIndexKey(
      record.userId,
      record.providerId,
      record.interactionId,
    );
    const indexedState = await this.otpRegistration.get<string>(indexKey);
    if (indexedState === state) {
      await this.otpRegistration.destroy(indexKey);
    }
  }

  private async completeInteractionBinding(
    interactionId: string,
    provider: Provider,
    res: Response,
  ): Promise<void> {
    const bindAccounts = (await this.bindData.find(interactionId)) || [];
    const pendingAccounts = bindAccounts.filter(
      (account) =>
        !(
          account?.type === this.type &&
          String(account?.provider_id) === provider.id
        ),
    );

    if (pendingAccounts.length) {
      await this.bindData.upsert(interactionId, pendingAccounts, 3600);
    } else {
      await this.bindData.destroy(interactionId);
    }

    await this.twoFactorAuthentication.destroy(interactionId);
    res.clearCookie('required_accounts_info_uid');
    res.clearCookie('_req_ids');
  }

  protected async verifyOtpByUserId(userId: string, token: string): Promise<LegacyUserModel> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: legacyUserInclude,
    });
    const legacyUser = toLegacyUser(user);

    if (!legacyUser) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    return this.verifyOtpForUser(legacyUser, token);
  }

  protected async verifyOtpForUser(
    user: LegacyUserModel,
    token: string,
    providerId?: string,
  ): Promise<LegacyUserModel> {
    const otpAccount = await this.getOtpAccountByUserId(user.id, providerId);

    if (!otpAccount || !otpAccount.rest_info) {
      throw new BadRequestException(Ei18nCodes.T3E0087);
    }

    const otpInfo = otpAccount.rest_info as OtpAccountRestInfo;
    if (!otpInfo.enabled) {
      throw new BadRequestException(Ei18nCodes.T3E0000);
    }

    const verificationResult = await this.verifyAccountToken(otpInfo, token);

    if (verificationResult) {
      const shouldBindLegacyAccount = Boolean(providerId && !otpInfo.provider_id);
      const restInfo = shouldBindLegacyAccount
        ? { ...verificationResult.restInfo, provider_id: providerId }
        : verificationResult.restInfo;

      if (verificationResult.shouldPersist || shouldBindLegacyAccount) {
        await prisma.externalAccount.update({
          where: { id: otpAccount.id },
          data: { rest_info: restInfo },
        });
      }

      return user;
    }

    if (providerId && !otpInfo.provider_id) {
      otpInfo.provider_id = providerId;
    }
    if (await this.consumeBackupCode(otpAccount.id, otpInfo, token)) {
      return user;
    }

    throw new BadRequestException(Ei18nCodes.T3E0038);
  }

  protected async consumeBackupCode(
    accountId: string,
    otpInfo: OtpAccountRestInfo,
    token: string,
  ): Promise<boolean> {
    const backupCodes = otpInfo.backup_codes || [];
    const codeIndex = backupCodes.indexOf(token);

    if (codeIndex === -1) {
      return false;
    }

    backupCodes.splice(codeIndex, 1);
    otpInfo.backup_codes = backupCodes;

    await prisma.externalAccount.update({
      where: { id: accountId },
      data: { rest_info: otpInfo },
    });

    return true;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ExternalAccount, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { I18nContext } from 'nestjs-i18n';
import { CLIENT_ID } from 'src/constants';
import { getDefaultLocale, resolveLocalizedText } from 'src/utils/localized-text';
import { EClaimPrivacy, Ei18nCodes, EProviderTypes, UserRoles } from '../../enums';
import * as helpers from '../../helpers';
import { prisma } from '../prisma';
import { syncGuestsMembershipForUser } from '../prisma/guests-group';
import { RoleRepository, UserModel, UserRepository } from '../repository';
import {
  deleteLegacyUserProfileValues,
  upsertLegacyUserProfileValues,
} from '../repository/user-profile-write';
import { SettingsService } from '../settings';
import { canManageTargetUser } from './user-access';
import * as userDto from './users.dto';

export type TContactType = EProviderTypes.EMAIL | EProviderTypes.PHONE;
export type TContactRowType =
  | EProviderTypes.EMAIL
  | EProviderTypes.EMAIL_CUSTOM
  | EProviderTypes.PHONE
  | EProviderTypes.KLOUD;
export type TProfileFieldScopeOptions = {
  clientId?: string;
  organizationId?: string | null;
};
export type TContactProviderContext = {
  providerId?: string;
  accountType?: TContactRowType;
  providerPublic?: number;
};
export type TContactPublicitySource =
  | 'profile-field'
  | 'provider'
  | 'provider-or-private'
  | 'explicit'
  | 'private';
export type TContactPublicityOptions = {
  primarySource?: TContactPublicitySource;
  secondarySource?: TContactPublicitySource;
  promotedPrimarySource?: TContactPublicitySource;
  explicitPublicLevel?: number;
  requireProviderPublicForSecondary?: boolean;
  syncPrimaryToExternalAccounts?: boolean;
  restoreDemotedFromProvider?: boolean;
};
export type TContactReplacementOptions = {
  strategy?: 'first-external-account';
  promote?: boolean;
};
export type TContactMutationOptions = {
  scope?: TProfileFieldScopeOptions;
  confirmed?: boolean;
  mode?: 'primary' | 'secondary' | 'auto';
  providerContext?: TContactProviderContext;
  publicity?: TContactPublicityOptions;
  replacement?: TContactReplacementOptions;
  replacementStrategy?: 'first-external-account';
  preserveDemotedPublic?: boolean;
  promoteWhenPrimaryMissing?: boolean;
};

type TAdminProfileContactsUpdateOptions = {
  email?: TContactMutationOptions;
  phone?: TContactMutationOptions;
};

type TResolvedContactProviderContext = {
  providerId?: string;
  accountType: TContactRowType;
  providerPublic?: number;
};

type TResolvedContactPublicityOptions = {
  primarySource: TContactPublicitySource;
  secondarySource: TContactPublicitySource;
  promotedPrimarySource: TContactPublicitySource;
  explicitPublicLevel?: number;
  requireProviderPublicForSecondary: boolean;
  syncPrimaryToExternalAccounts: boolean;
  restoreDemotedFromProvider: boolean;
};

type TResolvedContactReplacementOptions = {
  strategy: 'first-external-account';
  promote: boolean;
};

type TResolvedContactMutationOptions = {
  scope?: TProfileFieldScopeOptions;
  confirmed: boolean;
  mode: 'primary' | 'secondary' | 'auto';
  providerContext?: TContactProviderContext;
  publicity: TResolvedContactPublicityOptions;
  replacement: TResolvedContactReplacementOptions;
  promoteWhenPrimaryMissing: boolean;
  required?: boolean;
};

const toObjectRecord = (
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
};

@Injectable()
export class UsersContactsService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly userRepo: UserRepository,
    private readonly settingsService: SettingsService,
  ) {}

  /** Reject contact changes from the admin profile when the role lacks permission. */
  assertAdminProfileContactMutationAllowed(
    role: UserRoles | undefined,
    payload: Pick<userDto.UpdateUserDTO, 'email' | 'phone_number'>,
  ) {
    if (this.isContactManagedByAdminRole(role)) {
      return;
    }

    if (payload.email) {
      throw new BadRequestException(Ei18nCodes.T3E0081);
    }

    if (payload.phone_number) {
      throw new BadRequestException(Ei18nCodes.T3E0004);
    }
  }

  /** Create or reuse a verified contact and promote it to primary when needed. */
  async createConfirmedContactTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string | null | undefined,
    options?: TContactMutationOptions,
  ) {
    const normalizedValue = this.normalizeContactValue(type, value);
    if (!normalizedValue) {
      return;
    }

    const resolvedOptions = this.resolveContactMutationOptions({
      ...options,
      confirmed: true,
    });
    const resolvedMode = await this.resolveContactMutationModeTx(
      tx,
      userId,
      type,
      normalizedValue,
      resolvedOptions,
    );
    const providerContext = await this.resolveProviderContext(
      type,
      resolvedOptions.providerContext,
    );
    const publicSource =
      resolvedMode === 'primary'
        ? resolvedOptions.publicity.primarySource
        : resolvedOptions.publicity.secondarySource;
    const publicLevel = await this.resolveContactPublicLevelTx(
      tx,
      userId,
      type,
      publicSource,
      providerContext,
      resolvedOptions,
    );
    this.assertContactPublicLevelResolved(
      publicSource,
      publicLevel,
      resolvedMode === 'secondary' &&
        publicSource === 'provider' &&
        resolvedOptions.publicity.requireProviderPublicForSecondary,
    );

    await this.createOrReuseConfirmedContactAccountTx(tx, userId, type, normalizedValue, {
      mode: resolvedMode,
      providerContext,
      publicLevel,
    });

    if (resolvedMode === 'primary') {
      await this.applyPrimaryContactTx(tx, userId, type, normalizedValue, {
        scope: resolvedOptions.scope,
        publicLevel,
        publicity: resolvedOptions.publicity,
      });
    }
  }

  /** Update the primary email and phone within the shared profile transaction. */
  async applyAdminProfileContactsUpdateTx(
    tx: Prisma.TransactionClient,
    user: UserModel,
    payload: {
      email?: string | null;
      phone_number?: string | null;
      email_verified?: boolean;
      phone_number_verified?: boolean;
    },
    options?: TAdminProfileContactsUpdateOptions,
  ) {
    const { email, phone_number, email_verified = false, phone_number_verified = false } = payload;

    if (email !== undefined) {
      const rule = await this.getContactFieldRule(EProviderTypes.EMAIL, options?.email?.scope);
      await this.applyContactMutationTx(
        tx,
        user.id,
        EProviderTypes.EMAIL,
        email,
        this.resolveContactMutationOptions({
          ...options?.email,
          confirmed: email_verified,
          mode: options?.email?.mode ?? 'primary',
          required: rule.required,
        }),
      );
    }

    if (phone_number !== undefined) {
      const rule = await this.getContactFieldRule(EProviderTypes.PHONE, options?.phone?.scope);
      await this.applyContactMutationTx(
        tx,
        user.id,
        EProviderTypes.PHONE,
        phone_number,
        this.resolveContactMutationOptions({
          ...options?.phone,
          confirmed: phone_number_verified,
          mode: options?.phone?.mode ?? 'primary',
          required: rule.required,
        }),
      );
    }
  }

  /** Delete a contact account and promote its replacement when needed. */
  async deleteContactExternalAccountTx(
    tx: Prisma.TransactionClient,
    user: UserModel,
    account: ExternalAccount,
    role?: UserRoles,
    options?: TContactMutationOptions,
  ) {
    if (!this.isContactAccountType(account.type)) {
      return false;
    }

    const contactType = this.getContactTypeByAccountType(account.type);
    if (!contactType) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const resolvedOptions = this.resolveContactMutationOptions(options);

    if (role === UserRoles.TRUSTED_USER) {
      const primaryValue = await this.resolveCurrentPrimaryContactValueTx(tx, user.id, contactType);
      const accountValue = this.normalizeContactValue(contactType, account.sub);

      if (primaryValue && primaryValue === accountValue) {
        throw new BadRequestException(Ei18nCodes.T3E0067);
      }

      await tx.externalAccount.delete({
        where: { id: account.id },
      });
      await syncGuestsMembershipForUser(tx, user.id, CLIENT_ID);
      return true;
    }

    const { rule } = await this.ensureContactMutationAllowed(
      contactType,
      user.id,
      role,
      resolvedOptions.scope,
    );

    await this.deleteContactTx(tx, user.id, contactType, account, {
      ...resolvedOptions,
      required: rule.required,
    });
    await syncGuestsMembershipForUser(tx, user.id, CLIENT_ID);

    return true;
  }

  /** Verify an email and add it as a secondary or primary contact. */
  async changeEmail(
    email: string | null,
    user_id: string | UserModel,
    role?: UserRoles,
    options?: TContactMutationOptions,
  ) {
    const rules = await this.settingsService.getRulesValidations('email', true, options?.scope);
    const defaultLocale = await getDefaultLocale();
    const targetLocale = I18nContext.current()?.lang || defaultLocale;

    if (email) {
      for (const rule of rules) {
        const regex = new RegExp(rule.regex);
        if (!regex.test(email)) {
          throw new BadRequestException(
            resolveLocalizedText(rule.error, targetLocale, defaultLocale),
          );
        }
      }
    }

    await this.changeContact(EProviderTypes.EMAIL, email, user_id, role, options);
  }

  /** Verify a phone number and add it as a secondary or primary contact. */
  async changePhone(
    phone: string | null,
    user_id: string | UserModel,
    role?: UserRoles,
    options?: TContactMutationOptions,
  ) {
    const rules = await this.settingsService.getRulesValidations(
      'phone_number',
      true,
      options?.scope,
    );
    const defaultLocale = await getDefaultLocale();
    const targetLocale = I18nContext.current()?.lang || defaultLocale;

    if (phone) {
      for (const rule of rules) {
        const regex = new RegExp(rule.regex);
        if (!regex.test(phone)) {
          throw new BadRequestException(
            resolveLocalizedText(rule.error, targetLocale, defaultLocale),
          );
        }
      }
    }

    await this.changeContact(EProviderTypes.PHONE, phone, user_id, role, options);
  }

  /** Verify the current profile contact from the admin view and synchronize its account. */
  async confirmContact(
    userId: string,
    contactType: userDto.UserContactField,
    role?: UserRoles,
    actorUserId?: string,
  ) {
    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, userId);
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const effectiveRole = role ? role : await this.roleRepo.findRoleInApp(userId, CLIENT_ID);
    if (!this.isContactManagedByAdminRole(effectiveRole)) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    const type =
      contactType === userDto.UserContactField.email ? EProviderTypes.EMAIL : EProviderTypes.PHONE;
    const value = await this.resolveCurrentPrimaryContactValueTx(prisma, user.id, type);
    const scope = user.org_id ? { clientId: user.org_id } : undefined;

    if (!value) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    await prisma.$transaction(async (tx) => {
      await this.createConfirmedContactTx(tx, user.id, type, value, {
        mode: 'primary',
        scope,
      });
    });

    return this.userRepo.findById(userId);
  }

  /** Make an existing verified contact primary and copy the profile field visibility. */
  async setPrimaryContact(user_id: string | UserModel, contactId: string, role?: UserRoles) {
    const user = typeof user_id === 'string' ? await this.userRepo.findById(user_id) : user_id;
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }
    const scope = user.org_id ? { clientId: user.org_id } : undefined;

    await prisma.$transaction(async (tx) => {
      const account = await tx.externalAccount.findFirst({
        where: {
          id: contactId,
          user_id: user.id,
        },
      });

      if (!account) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }

      const type = this.getContactTypeByAccountType(account.type);
      if (!type) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }

      await this.ensureContactMutationAllowed(type, user.id, role, scope);

      const nextPrimaryValue = this.normalizeContactValue(type, account.sub);
      if (!nextPrimaryValue) {
        throw new BadRequestException(Ei18nCodes.T3E0003);
      }

      await this.applyPrimaryContactTx(tx, user.id, type, nextPrimaryValue, {
        scope,
      });
    });

    return this.userRepo.findById(user.id);
  }

  /** Check whether a role can manage contacts in administrative flows. */
  private isContactManagedByAdminRole(role?: UserRoles) {
    return role === UserRoles.OWNER || role === UserRoles.EDITOR;
  }

  /** Ensure the actor can manage the target user before changing contacts. */
  private async assertCanManageTargetUser(actorUserId: string, targetUserId: string) {
    const hasAccess = await canManageTargetUser(actorUserId, targetUserId, this.roleRepo);

    if (!hasAccess) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }
  }

  /** Convert a logical contact type to its legacy profile-field key. */
  private getContactFieldName(type: TContactType): 'email' | 'phone_number' {
    return type === EProviderTypes.EMAIL ? 'email' : 'phone_number';
  }

  /** Return valid account types for a logical email or phone contact. */
  private getContactAcceptedAccountTypes(type: TContactType): TContactRowType[] {
    return type === EProviderTypes.EMAIL
      ? [EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM]
      : [EProviderTypes.PHONE, EProviderTypes.KLOUD];
  }

  /** Return the base account type when contact provenance is not explicit. */
  private getDefaultContactAccountType(type: TContactType): TContactRowType {
    return type === EProviderTypes.EMAIL ? EProviderTypes.EMAIL : EProviderTypes.PHONE;
  }

  /** Determine whether an external account belongs to the contact subsystem. */
  private isContactAccountType(type: string): type is TContactRowType {
    return [
      EProviderTypes.EMAIL,
      EProviderTypes.EMAIL_CUSTOM,
      EProviderTypes.PHONE,
      EProviderTypes.KLOUD,
    ].includes(type as TContactRowType);
  }

  /** Convert a provider-specific account type to a logical email or phone type. */
  private getContactTypeByAccountType(type: string): TContactType | null {
    if ([EProviderTypes.EMAIL, EProviderTypes.EMAIL_CUSTOM].includes(type as EProviderTypes)) {
      return EProviderTypes.EMAIL;
    }

    if ([EProviderTypes.PHONE, EProviderTypes.KLOUD].includes(type as EProviderTypes)) {
      return EProviderTypes.PHONE;
    }

    return null;
  }

  /** Normalize a contact value for uniqueness checks, lookup, and storage. */
  private normalizeContactValue(type: TContactType, value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return type === EProviderTypes.EMAIL
      ? trimmed.toLowerCase()
      : helpers.preparePhoneNumber(trimmed);
  }

  /** Build derived external-account fields for verified email contacts. */
  private buildContactExternalAccountData(type: TContactType, value: string) {
    if (type === EProviderTypes.EMAIL) {
      return {
        hashed_email: helpers.createSha256Hash(value),
        hashed_email_md5: crypto.createHash('md5').update(value).digest('hex'),
      };
    }

    return {};
  }

  /** Apply contact-flow defaults so behavior does not depend on scattered branches. */
  private resolveContactMutationOptions(
    options?: TContactMutationOptions & {
      required?: boolean;
    },
  ): TResolvedContactMutationOptions {
    const publicity = options?.publicity;

    return {
      scope: options?.scope,
      confirmed: options?.confirmed ?? true,
      mode: options?.mode ?? 'auto',
      providerContext: options?.providerContext,
      publicity: {
        primarySource: publicity?.primarySource ?? 'profile-field',
        secondarySource: publicity?.secondarySource ?? 'provider',
        promotedPrimarySource: publicity?.promotedPrimarySource ?? 'profile-field',
        explicitPublicLevel: publicity?.explicitPublicLevel,
        requireProviderPublicForSecondary: publicity?.requireProviderPublicForSecondary ?? true,
        syncPrimaryToExternalAccounts: publicity?.syncPrimaryToExternalAccounts ?? true,
        restoreDemotedFromProvider:
          publicity?.restoreDemotedFromProvider ?? options?.preserveDemotedPublic === false,
      },
      replacement: {
        strategy:
          options?.replacement?.strategy ??
          options?.replacementStrategy ??
          'first-external-account',
        promote: options?.replacement?.promote ?? true,
      },
      promoteWhenPrimaryMissing: options?.promoteWhenPrimaryMissing ?? true,
      required: options?.required,
    };
  }

  /** Convert a profile-field claim policy to a numeric visibility level. */
  private claimPrivacyToPublicLevel(mode?: EClaimPrivacy) {
    switch (mode) {
      case EClaimPrivacy.public:
        return 2;
      case EClaimPrivacy.request:
        return 1;
      case EClaimPrivacy.private:
      default:
        return 0;
    }
  }

  /** Resolve the final mode while ensuring the first contact becomes primary. */
  private async resolveContactMutationModeTx(
    tx: Prisma.TransactionClient | typeof prisma,
    userId: string,
    type: TContactType,
    value: string,
    options: Pick<TResolvedContactMutationOptions, 'mode' | 'promoteWhenPrimaryMissing'>,
  ): Promise<'primary' | 'secondary'> {
    const currentPrimaryValue = await this.resolveCurrentPrimaryContactValueTx(tx, userId, type);
    const hasPrimaryContact = Boolean(currentPrimaryValue);

    if (currentPrimaryValue === value) {
      return 'primary';
    }

    if (!hasPrimaryContact && options.promoteWhenPrimaryMissing) {
      return 'primary';
    }

    if (options.mode === 'primary') {
      return 'primary';
    }

    if (options.mode === 'secondary') {
      return 'secondary';
    }

    return hasPrimaryContact ? 'secondary' : 'primary';
  }

  /** Read the primary contact from profile values instead of stale in-memory user data. */
  private async resolveCurrentPrimaryContactValueTx(
    tx: Prisma.TransactionClient | typeof prisma,
    userId: string,
    type: TContactType,
  ) {
    const fieldName = this.getContactFieldName(type);
    const profileValue = await tx.userProfileValue.findFirst({
      where: {
        user_id: userId,
        profile_field: {
          key: fieldName,
        },
      },
      select: {
        value: true,
      },
    });

    return this.normalizeContactValue(
      type,
      typeof profileValue?.value === 'string' ? profileValue.value : null,
    );
  }

  /** Read effective profile-field visibility to synchronize it with the primary contact. */
  private async resolveProfileFieldPublicLevel(
    tx: Prisma.TransactionClient | typeof prisma,
    userId: string,
    type: TContactType,
    scope?: TProfileFieldScopeOptions,
  ) {
    const fieldName = this.getContactFieldName(type);
    const profileValue = await tx.userProfileValue.findFirst({
      where: {
        user_id: userId,
        profile_field: {
          key: fieldName,
        },
      },
      select: {
        value: true,
        public: true,
        profile_field: {
          select: {
            default_public: true,
          },
        },
      },
    });

    const normalizedProfileValue = this.normalizeContactValue(
      type,
      typeof profileValue?.value === 'string' ? profileValue.value : null,
    );

    if (normalizedProfileValue) {
      return profileValue.public ?? profileValue.profile_field.default_public ?? undefined;
    }

    const scopedProfileField = (await this.settingsService.getProfileFields(fieldName, scope))[0];

    return this.claimPrivacyToPublicLevel(scopedProfileField?.claim);
  }

  /** Read stored provider visibility from rest_info for exceptional rollback flows. */
  private getProviderPublicFromRestInfo(restInfo: Prisma.JsonValue | null | undefined) {
    const record = toObjectRecord(restInfo);
    const providerPublic = Number(record?.provider_public);

    return Number.isFinite(providerPublic) ? providerPublic : undefined;
  }

  /** Build contact provenance without losing provider visibility or type after verification. */
  private buildContactExternalAccountRestInfo(
    currentRestInfo: Prisma.JsonValue | null | undefined,
    providerContext?: TResolvedContactProviderContext,
  ) {
    const nextRestInfo = {
      ...(toObjectRecord(currentRestInfo) || {}),
      ...(providerContext?.providerId ? { provider_id: providerContext.providerId } : {}),
      ...(providerContext?.accountType ? { provider_type: providerContext.accountType } : {}),
      ...(providerContext?.providerPublic !== undefined
        ? { provider_public: providerContext.providerPublic }
        : {}),
    };

    return Object.keys(nextRestInfo).length ? nextRestInfo : undefined;
  }

  /** Refine a generic account type when the contact provider is known. */
  private shouldUpgradeContactAccountType(
    type: TContactType,
    currentType: TContactRowType,
    nextType: TContactRowType,
  ) {
    return currentType === this.getDefaultContactAccountType(type) && nextType !== currentType;
  }

  /** Normalize provider context and load provider type and default visibility when needed. */
  private async resolveProviderContext(
    type: TContactType,
    providerContext?: TContactProviderContext,
  ): Promise<TResolvedContactProviderContext | undefined> {
    if (!providerContext) {
      return undefined;
    }

    let providerType = providerContext.accountType;
    let providerPublic = providerContext.providerPublic;

    if (providerContext.providerId) {
      const provider = await prisma.provider.findUnique({
        where: {
          id: providerContext.providerId,
        },
        select: {
          id: true,
          type: true,
          default_public: true,
        },
      });

      if (!provider || !this.isContactAccountType(provider.type)) {
        throw new BadRequestException(Ei18nCodes.T3E0030);
      }

      providerType = providerType ?? provider.type;
      providerPublic = providerPublic ?? provider.default_public;
    }

    const accountType = providerType ?? this.getDefaultContactAccountType(type);
    if (!this.getContactAcceptedAccountTypes(type).includes(accountType)) {
      throw new BadRequestException(Ei18nCodes.T3E0030);
    }

    return {
      providerId: providerContext.providerId,
      accountType,
      providerPublic,
    };
  }

  private assertContactPublicLevelResolved(
    source: TContactPublicitySource,
    publicLevel: number | undefined,
    required: boolean,
  ) {
    if (!required || publicLevel !== undefined) {
      return;
    }

    throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
      cause: `${source} public level is required for contact mutation`,
    });
  }

  private async resolveContactPublicLevelTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    source: TContactPublicitySource,
    providerContext: TResolvedContactProviderContext | undefined,
    options: Pick<TResolvedContactMutationOptions, 'scope' | 'publicity'>,
  ) {
    let publicLevel: number | undefined;

    switch (source) {
      case 'profile-field':
        publicLevel = await this.resolveProfileFieldPublicLevel(tx, userId, type, options.scope);
        break;
      case 'provider':
        publicLevel = providerContext?.providerPublic;
        break;
      case 'provider-or-private':
        publicLevel = providerContext?.providerPublic ?? 0;
        break;
      case 'explicit':
        publicLevel = options.publicity.explicitPublicLevel;
        break;
      case 'private':
        publicLevel = 0;
        break;
    }

    this.assertContactPublicLevelResolved(source, publicLevel, source === 'explicit');

    return publicLevel;
  }

  private resolveProviderContextFromAccount(
    account: ExternalAccount,
  ): TResolvedContactProviderContext | undefined {
    if (!this.isContactAccountType(account.type)) {
      return undefined;
    }

    const restInfo = toObjectRecord(account.rest_info);
    const providerId =
      account.last_active_provider_id ??
      (typeof restInfo?.provider_id === 'string' ? restInfo.provider_id : undefined);

    return {
      providerId: providerId ?? undefined,
      accountType: account.type,
      providerPublic:
        this.getProviderPublicFromRestInfo(account.rest_info) ?? account.public ?? undefined,
    };
  }

  /** Create or update a verified contact account with provider-aware type and visibility. */
  private async createOrReuseConfirmedContactAccountTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string,
    options: {
      mode: 'primary' | 'secondary';
      providerContext?: TResolvedContactProviderContext;
      publicLevel?: number;
    },
  ) {
    await this.ensureVerifiedContactIsAvailable(tx, type, value, userId);

    const resolvedProviderContext = options.providerContext;
    const existingContactAccount = await this.findExistingUserContactRow(tx, userId, type, value);

    if (existingContactAccount) {
      const nextType =
        resolvedProviderContext &&
        this.shouldUpgradeContactAccountType(
          type,
          existingContactAccount.type as TContactRowType,
          resolvedProviderContext.accountType,
        )
          ? resolvedProviderContext.accountType
          : undefined;
      const nextRestInfo = this.buildContactExternalAccountRestInfo(
        existingContactAccount.rest_info,
        resolvedProviderContext,
      );
      const shouldUpdateRestInfo =
        JSON.stringify(nextRestInfo || null) !==
        JSON.stringify(existingContactAccount.rest_info || null);
      const shouldUpdatePublic =
        options.publicLevel !== undefined && existingContactAccount.public !== options.publicLevel;

      if (
        nextType ||
        resolvedProviderContext?.providerId ||
        shouldUpdateRestInfo ||
        shouldUpdatePublic
      ) {
        return tx.externalAccount.update({
          where: {
            id: existingContactAccount.id,
          },
          data: {
            ...(nextType ? { type: nextType } : {}),
            ...(resolvedProviderContext?.providerId
              ? { last_active_provider_id: resolvedProviderContext.providerId }
              : {}),
            ...(shouldUpdateRestInfo ? { rest_info: nextRestInfo } : {}),
            ...(shouldUpdatePublic ? { public: options.publicLevel } : {}),
          },
        });
      }

      return existingContactAccount;
    }

    return tx.externalAccount.create({
      data: {
        user_id: userId,
        sub: value,
        type: resolvedProviderContext?.accountType ?? this.getDefaultContactAccountType(type),
        public: options.publicLevel ?? resolvedProviderContext?.providerPublic ?? 0,
        ...(resolvedProviderContext?.providerId
          ? { last_active_provider_id: resolvedProviderContext.providerId }
          : {}),
        ...(this.buildContactExternalAccountRestInfo(undefined, resolvedProviderContext)
          ? {
              rest_info: this.buildContactExternalAccountRestInfo(
                undefined,
                resolvedProviderContext,
              ),
            }
          : {}),
        ...this.buildContactExternalAccountData(type, value),
      },
    });
  }

  private async applyPrimaryContactTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string,
    options?: Pick<TResolvedContactMutationOptions, 'scope'> & {
      publicLevel?: number;
      publicity?: Pick<
        TResolvedContactPublicityOptions,
        'restoreDemotedFromProvider' | 'syncPrimaryToExternalAccounts'
      >;
    },
  ) {
    const currentPrimaryValue = await this.resolveCurrentPrimaryContactValueTx(tx, userId, type);
    const profilePublicLevel =
      options?.publicLevel ??
      (await this.resolveProfileFieldPublicLevel(tx, userId, type, options?.scope));

    if (
      currentPrimaryValue &&
      currentPrimaryValue !== value &&
      options?.publicity?.restoreDemotedFromProvider
    ) {
      await this.restoreDemotedPrimaryPublicTx(tx, userId, type, currentPrimaryValue);
    }

    await this.upsertPrimaryContactValue(tx, userId, type, value, profilePublicLevel);
    if (options?.publicity?.syncPrimaryToExternalAccounts === false) {
      return;
    }

    await this.syncPrimaryContactPublicLevelToExternalAccount(
      tx,
      userId,
      type,
      value,
      profilePublicLevel,
    );
  }

  /** Restore provider visibility for a former primary contact in exceptional flows. */
  private async restoreDemotedPrimaryPublicTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string,
  ) {
    const accounts = await tx.externalAccount.findMany({
      where: {
        user_id: userId,
        sub: value,
        type: {
          in: this.getContactAcceptedAccountTypes(type),
        },
      },
      select: {
        id: true,
        public: true,
        rest_info: true,
      },
    });

    for (const account of accounts) {
      const providerPublic = this.getProviderPublicFromRestInfo(account.rest_info);
      if (providerPublic === undefined || providerPublic === account.public) {
        continue;
      }

      await tx.externalAccount.update({
        where: {
          id: account.id,
        },
        data: {
          public: providerPublic,
        },
      });
    }
  }

  /** Synchronize profile-field visibility to every account for the current primary contact. */
  private async syncPrimaryContactPublicLevelToExternalAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string,
    publicLevel?: number,
  ) {
    if (publicLevel === undefined) {
      return;
    }

    await tx.externalAccount.updateMany({
      where: {
        user_id: userId,
        sub: value,
        type: {
          in: this.getContactAcceptedAccountTypes(type),
        },
      },
      data: {
        public: publicLevel,
      },
    });
  }

  /** Store the primary contact in legacy profile values or clear the field when needed. */
  private async upsertPrimaryContactValue(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string | null,
    publicLevel?: number,
  ) {
    const fieldName = this.getContactFieldName(type);

    if (value === null) {
      await deleteLegacyUserProfileValues(tx, userId, [fieldName]);
      return;
    }

    await upsertLegacyUserProfileValues(
      tx,
      userId,
      { [fieldName]: value },
      publicLevel === undefined ? undefined : { [fieldName]: publicLevel },
    );
  }

  /** Find the user's earliest account record for a normalized contact. */
  private async findExistingUserContactRow(
    tx: Prisma.TransactionClient | typeof prisma,
    userId: string,
    type: TContactType,
    value: string,
  ) {
    return tx.externalAccount.findFirst({
      where: {
        user_id: userId,
        sub: value,
        type: {
          in: this.getContactAcceptedAccountTypes(type),
        },
      },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });
  }

  /** Load the scoped profile rule for a contact. */
  private async getContactFieldRule(type: TContactType, scope?: TProfileFieldScopeOptions) {
    const fieldName = this.getContactFieldName(type);
    const rule = (await this.settingsService.getProfileFields(fieldName, scope))[0];

    if (!rule) {
      throw new BadRequestException(Ei18nCodes.T3E0016);
    }

    return rule;
  }

  /** Enforce editability and TRUSTED_USER restrictions for contact management. */
  private async ensureContactMutationAllowed(
    type: TContactType,
    userId: string,
    role?: UserRoles,
    scope?: TProfileFieldScopeOptions,
  ) {
    const effectiveRole = role ? role : await this.roleRepo.findRoleInApp(userId, CLIENT_ID);

    if (effectiveRole === UserRoles.TRUSTED_USER) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    const rule = await this.getContactFieldRule(type, scope);
    if (!this.isContactManagedByAdminRole(effectiveRole) && !rule.editable) {
      throw new BadRequestException(Ei18nCodes.T3E0017);
    }

    return { rule };
  }

  /** Delete one contact account and promote a replacement when the primary is removed. */
  private async deleteContactTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    account: ExternalAccount,
    options?: Pick<
      TResolvedContactMutationOptions,
      'required' | 'replacement' | 'publicity' | 'scope'
    >,
  ) {
    const primaryValue = await this.resolveCurrentPrimaryContactValueTx(tx, userId, type);
    const accountValue = this.normalizeContactValue(type, account.sub);
    const isPrimary = primaryValue && accountValue ? primaryValue === accountValue : false;

    await tx.externalAccount.delete({
      where: { id: account.id },
    });

    if (!isPrimary) {
      return;
    }

    const hasSamePrimaryValue = await this.hasContactRowWithValueTx(tx, userId, type, accountValue);
    if (hasSamePrimaryValue) {
      return;
    }

    if (options?.replacement?.promote === false) {
      await this.clearPrimaryContactAfterDeleteTx(tx, userId, type, options);
      return;
    }

    const replacement = await this.findReplacementContactTx(
      tx,
      userId,
      type,
      options?.replacement?.strategy ?? 'first-external-account',
    );

    if (!replacement) {
      await this.clearPrimaryContactAfterDeleteTx(tx, userId, type, options);
      return;
    }

    await this.promoteReplacementContactTx(tx, userId, type, replacement, options);
  }

  private async clearPrimaryContactAfterDeleteTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    options?: Pick<TResolvedContactMutationOptions, 'required'>,
  ) {
    if (options?.required) {
      throw new BadRequestException(Ei18nCodes.T3E0093, {
        cause: `${this.getContactFieldName(type)} is required`,
      });
    }

    await this.upsertPrimaryContactValue(tx, userId, type, null);
  }

  private async hasContactRowWithValueTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string,
  ) {
    const account = await this.findExistingUserContactRow(tx, userId, type, value);

    return Boolean(account);
  }

  /** Delete all accounts for the current primary contact and restore the next primary. */
  private async deleteContactAccountsByValueAndRestorePrimary(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string | null | undefined,
    options?: Pick<
      TResolvedContactMutationOptions,
      'required' | 'replacement' | 'publicity' | 'scope'
    >,
  ) {
    const normalizedValue = this.normalizeContactValue(type, value);
    if (!normalizedValue) {
      return;
    }

    await tx.externalAccount.deleteMany({
      where: {
        user_id: userId,
        sub: normalizedValue,
        type: {
          in: this.getContactAcceptedAccountTypes(type),
        },
      },
    });

    if (options?.replacement?.promote === false) {
      await this.clearPrimaryContactAfterDeleteTx(tx, userId, type, options);
      return;
    }

    const replacement = await this.findReplacementContactTx(
      tx,
      userId,
      type,
      options?.replacement?.strategy ?? 'first-external-account',
    );

    if (!replacement) {
      await this.clearPrimaryContactAfterDeleteTx(tx, userId, type, options);
      return;
    }

    await this.promoteReplacementContactTx(tx, userId, type, replacement, options);
  }

  /** Select the replacement deterministically by external-account creation time and ID. */
  private async findReplacementContactTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    strategy: 'first-external-account',
  ) {
    switch (strategy) {
      case 'first-external-account':
      default:
        return tx.externalAccount.findFirst({
          where: {
            user_id: userId,
            type: {
              in: this.getContactAcceptedAccountTypes(type),
            },
          },
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
        });
    }
  }

  private async promoteReplacementContactTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    account: ExternalAccount,
    options?: Pick<TResolvedContactMutationOptions, 'publicity' | 'scope'>,
  ) {
    const nextPrimaryValue = this.normalizeContactValue(type, account.sub);
    if (!nextPrimaryValue) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const providerContext = this.resolveProviderContextFromAccount(account);
    const publicLevel = await this.resolveContactPublicLevelTx(
      tx,
      userId,
      type,
      options?.publicity?.promotedPrimarySource ?? 'profile-field',
      providerContext,
      {
        scope: options?.scope,
        publicity: options?.publicity ?? this.resolveContactMutationOptions().publicity,
      },
    );

    await this.applyPrimaryContactTx(tx, userId, type, nextPrimaryValue, {
      scope: options?.scope,
      publicLevel,
      publicity: options?.publicity,
    });
  }

  /** Ensure a verified contact is not already assigned to another user. */
  private async ensureVerifiedContactIsAvailable(
    tx: Prisma.TransactionClient | typeof prisma,
    type: TContactType,
    value: string,
    userId: string,
  ) {
    const existingAccount = await tx.externalAccount.findFirst({
      where: {
        sub: value,
        type: {
          in: this.getContactAcceptedAccountTypes(type),
        },
        user_id: {
          not: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingAccount) {
      throw new BadRequestException(
        type === EProviderTypes.EMAIL ? Ei18nCodes.T3E0065 : Ei18nCodes.T3E0102,
      );
    }
  }

  /** Run a shared primary, secondary, or delete contact flow without public-method duplication. */
  private async applyContactMutationTx(
    tx: Prisma.TransactionClient,
    userId: string,
    type: TContactType,
    value: string | null | undefined,
    options: TResolvedContactMutationOptions,
  ) {
    const normalizedValue = this.normalizeContactValue(type, value);

    if (normalizedValue === undefined) {
      return;
    }

    if (normalizedValue === null) {
      const currentPrimaryValue = await this.resolveCurrentPrimaryContactValueTx(tx, userId, type);
      await this.deleteContactAccountsByValueAndRestorePrimary(
        tx,
        userId,
        type,
        currentPrimaryValue,
        {
          required: options.required,
          replacement: options.replacement,
          publicity: options.publicity,
          scope: options.scope,
        },
      );
      return;
    }

    const resolvedMode = await this.resolveContactMutationModeTx(
      tx,
      userId,
      type,
      normalizedValue,
      options,
    );
    const providerContext = await this.resolveProviderContext(type, options.providerContext);
    const publicSource =
      resolvedMode === 'primary'
        ? options.publicity.primarySource
        : options.publicity.secondarySource;
    const publicLevel = await this.resolveContactPublicLevelTx(
      tx,
      userId,
      type,
      publicSource,
      providerContext,
      options,
    );
    this.assertContactPublicLevelResolved(
      publicSource,
      publicLevel,
      resolvedMode === 'secondary' &&
        publicSource === 'provider' &&
        options.publicity.requireProviderPublicForSecondary,
    );

    if (!options.confirmed) {
      if (resolvedMode === 'secondary') {
        throw new InternalServerErrorException(Ei18nCodes.T3E0078, {
          cause: 'Unconfirmed secondary contact updates are not supported',
        });
      }

      await this.upsertPrimaryContactValue(tx, userId, type, normalizedValue, publicLevel);
      return;
    }

    await this.createOrReuseConfirmedContactAccountTx(tx, userId, type, normalizedValue, {
      mode: resolvedMode,
      providerContext,
      publicLevel,
    });

    if (resolvedMode === 'primary') {
      await this.applyPrimaryContactTx(tx, userId, type, normalizedValue, {
        scope: options.scope,
        publicLevel,
        publicity: options.publicity,
      });
    }
  }

  /** Apply a user contact change with editability, uniqueness, and TRUSTED_USER restrictions. */
  private async changeContact(
    type: TContactType,
    value: string | null,
    user_id: string | UserModel,
    role?: UserRoles,
    options?: TContactMutationOptions,
  ) {
    const user = typeof user_id === 'string' ? await this.userRepo.findById(user_id) : user_id;
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const effectiveRole = role ? role : await this.roleRepo.findRoleInApp(user.id, CLIENT_ID);
    const rule = await this.getContactFieldRule(type, options?.scope);
    const normalizedValue = this.normalizeContactValue(type, value);

    if (effectiveRole !== UserRoles.OWNER && !rule.editable) {
      throw new BadRequestException(Ei18nCodes.T3E0017);
    }

    if (effectiveRole === UserRoles.TRUSTED_USER && normalizedValue === null) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    await prisma.$transaction(async (tx) => {
      await this.applyContactMutationTx(
        tx,
        user.id,
        type,
        normalizedValue,
        this.resolveContactMutationOptions({
          ...options,
          confirmed: options?.confirmed ?? true,
          required: rule.required,
        }),
      );
    });
  }
}

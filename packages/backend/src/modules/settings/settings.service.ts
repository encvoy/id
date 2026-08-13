import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client, Prisma, User } from '@prisma/client';
import fetch from 'node-fetch';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CLIENT_ID, DOMAIN } from 'src/constants';
import { getInternalRequestHeaders } from 'src/internal-request';
import { getDefaultLocale, resolveLocalizedText } from 'src/utils/localized-text';
import * as enums from '../../enums';
import { SortDirection } from '../../enums';
import { getIdentifierType, getOrganizationId, prepareIdentifier } from '../../helpers';
import { hasApplicationAccessForUser } from '../groups/groups.access';
import { prepareOrganizationGuestsMembershipForClientAuthorization } from '../prisma/guests-group';
import { prisma } from '../prisma';
import { SettingsModel, UserModel, UserRepository } from '../repository';
import { clearLegacyProfileFieldCache } from '../repository/user-profile-write';
import { getLegacyUserExternalAccountEmails } from '../repository/user-search';
import { RedisAdapter } from '../redis';
import { UpdateUserDTO } from '../users/users.dto';
import { getClientAuthorizationContext } from '../auth/client-authorization';
import * as dto from './settings.dto';

const listUnChangeableUserFields = [dto.UserProfileFields.sub, 'name'];
const generalProfileFieldKeys = new Set(dto.listProfileFields.map((field) => field.field));

type RuleValidationModel = Prisma.RuleValidationGetPayload<Record<string, never>>;
type ProfileFieldRuleRecord = Prisma.ProfileFieldGetPayload<{
  include: {
    validations: {
      include: {
        rule_validation: true;
      };
    };
  };
}>;

type LegacyRuleModel = {
  id: string;
  field_name: string;
  organization_id?: string | null;
  title: string | dto.TLocalizedTextDto;
  default?: string;
  required: boolean;
  unique: boolean;
  validate_on_authorization: boolean;
  active: boolean;
  editable: boolean;
  validations: RuleValidationModel[];
};

type TPreparedGeneralProfileFields = UpdateUserDTO & {
  password?: string;
};

type TProfileFieldScopeOptions = {
  clientId?: string;
  organizationId?: string | null;
};

type SettingsCacheItem = Prisma.SettingsGetPayload<{
  select: {
    name: true;
    public: true;
    value: true;
  };
}>;

const SETTINGS_CACHE_KEY = 'list';

function jsonValueToOptionalString(value: Prisma.JsonValue | null | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

@Injectable()
export class SettingsService {
  private readonly settingsCache = new RedisAdapter('SettingsCache');

  constructor(
    private readonly userRepo: UserRepository,
    private readonly i18nService: I18nService<Record<string, string>>,
  ) {}

  private async getEmailOwners(excludedUserId?: string) {
    const externalAccounts = await prisma.externalAccount.findMany({
      where: {
        type: {
          in: [enums.EProviderTypes.EMAIL, enums.EProviderTypes.EMAIL_CUSTOM],
        },
        ...(excludedUserId
          ? {
              user_id: {
                not: excludedUserId,
              },
            }
          : {}),
      },
      select: {
        user_id: true,
        sub: true,
      },
    });

    return externalAccounts
      .map((item) => ({
        user_id: item.user_id,
        email: item.sub,
      }))
      .filter((item): item is { user_id: string; email: string } => Boolean(item.email));
  }

  public async isEmailTaken(email: string, userId?: string | number): Promise<boolean> {
    if (!email) {
      return false;
    }
    const owners = await this.getEmailOwners(userId ? String(userId) : undefined);
    return owners.some((item) => item.email === email);
  }

  private async findDuplicateEmailsAcrossUsers(): Promise<string[]> {
    const owners = await this.getEmailOwners();
    const usersByEmail = new Map<string, Set<string>>();

    for (const owner of owners) {
      if (!usersByEmail.has(owner.email)) {
        usersByEmail.set(owner.email, new Set());
      }

      usersByEmail.get(owner.email)?.add(owner.user_id);
    }

    return [...usersByEmail.entries()]
      .filter(([, userIds]) => userIds.size > 1)
      .map(([email]) => email);
  }

  private normalizeTwoFactorAuthenticationSettings(
    value?: dto.TwoFactorAuthenticationDto | null,
  ): dto.TwoFactorAuthenticationDto {
    const controlledMethods = Array.isArray(value?.controlled_methods)
      ? value.controlled_methods.filter((method): method is dto.AuthMethodTypes =>
          Object.values(dto.AuthMethodTypes).includes(method as dto.AuthMethodTypes),
        )
      : [];

    const availableProviderIds = Array.isArray(value?.available_provider_ids)
      ? value.available_provider_ids
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean)
      : [];

    return {
      controlled_methods: controlledMethods,
      available_provider_ids: Array.from(new Set(availableProviderIds)),
    };
  }

  private async validateTwoFactorAuthenticationSettings(
    value: dto.TwoFactorAuthenticationDto,
  ): Promise<void> {
    if (!value.available_provider_ids.length) {
      return;
    }

    const providers = await prisma.provider.findMany({
      where: {
        id: {
          in: value.available_provider_ids,
        },
      },
      select: {
        id: true,
      },
    });

    const existingProviderIds = new Set(providers.map((provider) => provider.id));
    const missingProviderIds = value.available_provider_ids.filter(
      (providerId) => !existingProviderIds.has(providerId),
    );

    if (missingProviderIds.length) {
      throw new BadRequestException(
        `Two-factor authentication providers were not found: ${missingProviderIds.join(', ')}`,
      );
    }
  }

  private claimPrivacyToPublicLevel(mode: enums.EClaimPrivacy) {
    switch (mode) {
      case enums.EClaimPrivacy.public:
        return 2;
      case enums.EClaimPrivacy.request:
        return 1;
      case enums.EClaimPrivacy.private:
      default:
        return 0;
    }
  }

  private publicLevelToClaimPrivacy(level?: number | null) {
    if ((level ?? 0) >= 2) {
      return enums.EClaimPrivacy.public;
    }

    if ((level ?? 0) >= 1) {
      return enums.EClaimPrivacy.request;
    }

    return enums.EClaimPrivacy.private;
  }

  private normalizeLegacyClaimKeys(value: string | undefined, allowedKeys: Set<string>) {
    return Array.from(
      new Set(
        `${value || ''}`
          .trim()
          .split(/\s+/)
          .filter((key) => Boolean(key) && allowedKeys.has(key)),
      ),
    );
  }

  private async getProfileFieldDefaultPublicEntries(options?: TProfileFieldScopeOptions) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    return prisma.profileField.findMany({
      where: {
        ...this.getProfileFieldScopeWhere(organizationId),
        key: {
          not: dto.UserProfileFields.password,
        },
      },
      select: {
        id: true,
        key: true,
        default_public: true,
      },
    });
  }

  private async getProfileFieldScopeKeys(options?: TProfileFieldScopeOptions) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const profileFields = await prisma.profileField.findMany({
      where: {
        ...this.getProfileFieldScopeWhere(organizationId),
        key: {
          not: dto.UserProfileFields.password,
        },
      },
      select: {
        key: true,
      },
    });

    return new Set(profileFields.map((field) => field.key));
  }

  private buildLegacyDefaultPublicClaims(
    profileFields: Array<{ key: string; default_public: number }>,
  ) {
    const sortedFields = [...profileFields].sort((left, right) =>
      left.key.localeCompare(right.key),
    );

    return {
      default_public_profile_claims_oauth: sortedFields
        .filter((field) => field.default_public >= 1)
        .map((field) => field.key)
        .join(' '),
      default_public_profile_claims_gravatar: sortedFields
        .filter((field) => field.default_public >= 2)
        .map((field) => field.key)
        .join(' '),
    };
  }

  private async getLegacyDefaultPublicClaims() {
    return this.buildLegacyDefaultPublicClaims(await this.getProfileFieldDefaultPublicEntries());
  }

  private async syncDefaultPublicClaimsFromLegacySettings(
    params: Pick<
      dto.EditSettingsDto,
      | dto.ESettingsNames.default_public_profile_claims_oauth
      | dto.ESettingsNames.default_public_profile_claims_gravatar
    >,
  ) {
    if (
      params.default_public_profile_claims_oauth === undefined &&
      params.default_public_profile_claims_gravatar === undefined
    ) {
      return;
    }

    const profileFields = await this.getProfileFieldDefaultPublicEntries();
    const allowedKeys = new Set(profileFields.map((field) => field.key));
    const currentClaims = this.buildLegacyDefaultPublicClaims(profileFields);

    const nextOauth = new Set(
      this.normalizeLegacyClaimKeys(
        params.default_public_profile_claims_oauth ??
          currentClaims.default_public_profile_claims_oauth,
        allowedKeys,
      ),
    );
    const nextGravatar = new Set(
      this.normalizeLegacyClaimKeys(
        params.default_public_profile_claims_gravatar ??
          currentClaims.default_public_profile_claims_gravatar,
        allowedKeys,
      ),
    );

    for (const key of nextGravatar) {
      nextOauth.add(key);
    }

    const updates = profileFields
      .map((field) => {
        const defaultPublic = nextGravatar.has(field.key) ? 2 : nextOauth.has(field.key) ? 1 : 0;
        if (field.default_public === defaultPublic) {
          return null;
        }

        return {
          id: field.id,
          default_public: defaultPublic,
        };
      })
      .filter(Boolean) as Array<{ id: string; default_public: number }>;

    if (!updates.length) {
      return;
    }

    await prisma.$transaction(
      updates.map((field) =>
        prisma.profileField.update({
          where: { id: field.id },
          data: {
            default_public: field.default_public,
          },
        }),
      ),
    );
  }

  private async resolveProfileFieldScopeOrganizationId(options?: TProfileFieldScopeOptions) {
    if (!options) {
      return undefined;
    }

    if (options.organizationId === null) {
      return null;
    }

    const scopeClientId = options.organizationId ?? options.clientId;
    if (!scopeClientId) {
      return undefined;
    }

    return getOrganizationId(scopeClientId);
  }

  private async resolveRuleValidationScopeOrganizationId(options?: TProfileFieldScopeOptions) {
    if (!options) {
      return undefined;
    }

    if (options.organizationId === null) {
      return null;
    }

    const scopeClientId = options.organizationId ?? options.clientId;
    if (!scopeClientId) {
      return undefined;
    }

    const organizationId = await getOrganizationId(scopeClientId);
    return organizationId === CLIENT_ID ? null : organizationId;
  }

  private getProfileFieldScopeWhere(
    organizationId: string | null | undefined,
  ): Prisma.ProfileFieldWhereInput {
    if (organizationId === undefined) {
      return {};
    }

    if (organizationId === null || organizationId === CLIENT_ID) {
      return {
        OR: [{ organization_id: null }, { organization_id: CLIENT_ID }],
      };
    }

    return {
      OR: [
        { organization_id: null },
        { organization_id: CLIENT_ID },
        { organization_id: organizationId },
      ],
    };
  }

  private getOwnedProfileFieldScopeWhere(
    organizationId: string | null | undefined,
  ): Prisma.ProfileFieldWhereInput {
    if (organizationId === undefined) {
      return {};
    }

    return { organization_id: organizationId ?? CLIENT_ID };
  }

  private getRuleValidationScopeWhere(
    organizationId: string | null | undefined,
  ): Prisma.RuleValidationWhereInput {
    if (organizationId === undefined) {
      return {};
    }

    if (organizationId === null || organizationId === CLIENT_ID) {
      return {
        OR: [{ organization_id: null }, { organization_id: CLIENT_ID }],
      };
    }

    return {
      OR: [
        { organization_id: null },
        { organization_id: CLIENT_ID },
        { organization_id: organizationId },
      ],
    };
  }

  private async getScopedRuleValidation(
    id: string,
    options?: TProfileFieldScopeOptions,
    select?: Prisma.RuleValidationSelect,
  ) {
    const organizationId = await this.resolveRuleValidationScopeOrganizationId(options);

    return prisma.ruleValidation.findFirst({
      where: {
        id,
        ...this.getRuleValidationScopeWhere(organizationId),
      },
      ...(select ? { select } : {}),
    });
  }

  private async ensureRuleValidationExists(
    id: string,
    options?: TProfileFieldScopeOptions,
    select?: Prisma.RuleValidationSelect,
  ) {
    const ruleValidation = await this.getScopedRuleValidation(id, options, select);

    if (!ruleValidation) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0016);
    }

    return ruleValidation;
  }

  private async ensureRuleValidationTitleAvailable(
    title: dto.TLocalizedTextDto | undefined,
    options?: TProfileFieldScopeOptions,
    excludedId?: string,
  ) {
    if (!title) {
      return title;
    }

    const organizationId = await this.resolveRuleValidationScopeOrganizationId(options);
    const existingRule = await prisma.ruleValidation.findFirst({
      where: {
        title: {
          equals: title as Prisma.InputJsonValue,
        },
        ...this.getRuleValidationScopeWhere(organizationId),
        ...(excludedId
          ? {
              id: {
                not: excludedId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingRule) {
      throw new BadRequestException('Validation rule title already exists in this scope');
    }

    return title;
  }

  private async resolveProfileFieldOwnerOrganizationId(
    params: Pick<dto.CreateProfileFieldDto, 'client_id' | 'organization_id'>,
  ) {
    const scopeClientId = params.organization_id ?? params.client_id;
    if (!scopeClientId) {
      return CLIENT_ID;
    }

    return getOrganizationId(scopeClientId);
  }

  private async notifyDynamicScopesChanged(organizationId?: string | null) {
    try {
      await fetch(`${DOMAIN}/oidc/update-dynamic-scopes`, {
        method: 'POST',
        headers: await getInternalRequestHeaders(),
        body: JSON.stringify({ organization_id: organizationId ?? CLIENT_ID }),
      });
    } catch (error) {
      console.warn('Failed to request dynamic OIDC scope refresh', error);
    }
  }

  private mapProfileFieldToRule(
    field: ProfileFieldRuleRecord,
    title?: string | dto.TLocalizedTextDto,
  ): LegacyRuleModel {
    return {
      id: field.id,
      field_name: field.key,
      organization_id: field.organization_id,
      title: title || (field.title as string | dto.TLocalizedTextDto),
      default: jsonValueToOptionalString(field.default_value),
      required: field.required,
      unique: field.unique,
      validate_on_authorization: field.validate_on_authorization,
      active: field.active,
      editable: field.editable,
      validations: field.validations.map((validation) => validation.rule_validation),
    };
  }

  /**
   * Returns service settings
   */
  public async getList(): Promise<SettingsCacheItem[]> {
    return prisma.settings.findMany({
      select: {
        name: true,
        public: true,
        value: true,
      },
    });
  }

  private async getCachedSettingsList(forceRefresh = false): Promise<SettingsCacheItem[]> {
    if (!forceRefresh) {
      try {
        const cached = await this.settingsCache.get<SettingsCacheItem[]>(SETTINGS_CACHE_KEY);
        if (Array.isArray(cached)) {
          return cached;
        }
      } catch (error) {
        console.warn('Failed to read settings cache from Redis:', error);
      }
    }

    const freshSettings = await this.getList();

    try {
      await this.settingsCache.upsert(SETTINGS_CACHE_KEY, freshSettings);
    } catch (error) {
      console.warn('Failed to write settings cache to Redis:', error);
    }

    return freshSettings;
  }

  private async resetSettingsCache(): Promise<void> {
    try {
      await this.settingsCache.destroy(SETTINGS_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to invalidate settings cache in Redis:', error);
    }
  }

  /**
   * Checks whether the user can log in
   */
  async isAuthorizeOnlyAdminsEnabled(): Promise<boolean> {
    return this.getSettingsByName<boolean>(dto.ESettingsNames.authorize_only_admins);
  }

  async canAuthorize(user: string | UserModel, client?: Client) {
    // If the user is an administrator, then skip
    //TODO: fix the hardcoded admin check
    const userId = typeof user === 'object' ? user.id : String(user);
    if (userId === '1') {
      return;
    }

    const userObj = typeof user === 'object' ? user : await this.userRepo.findById(userId);

    // Check for user existence
    if (!userObj) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0003);
    }

    // Check for user blocking
    if (userObj.blocked) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0024);
    }

    const [authorize_only_admins, authorizationContext] = await Promise.all([
      this.isAuthorizeOnlyAdminsEnabled(),
      getClientAuthorizationContext(userId, client),
    ]);
    const role = authorizationContext.mainRole;
    const clientRole = client ? authorizationContext.clientRole : null;

    if (authorizationContext.isMainRoleBlocked) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0024);
    }

    // If the setting is enabled, only main application admins can access
    if (
      authorize_only_admins &&
      (!role || (role.role !== enums.UserRoles.EDITOR && role.role !== enums.UserRoles.OWNER))
    )
      throw new BadRequestException(enums.Ei18nCodes.T3E0026);

    if (client && authorizationContext.isClientAccessBlocked) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0024);
    }

    if (client && client.authorize_only_admins) {
      if (
        !clientRole ||
        (clientRole.role !== enums.UserRoles.EDITOR && clientRole.role !== enums.UserRoles.OWNER)
      ) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0026);
      }
    }

    if (client) {
      await prepareOrganizationGuestsMembershipForClientAuthorization(
        prisma,
        userId,
        client.client_id,
      );

      if (client.authorize_only_employees) {
        if (clientRole) {
          return;
        }

        if (!client.parent_id) {
          throw new ForbiddenException(enums.Ei18nCodes.T3E0026);
        }

        const externalEmails = getLegacyUserExternalAccountEmails(userObj);
        const [hasApplicationAccess, invitation] = await Promise.all([
          hasApplicationAccessForUser(prisma, client.parent_id, client.client_id, userId),
          externalEmails.length
            ? prisma.clientInvitation.findFirst({
                where: {
                  client_id: client.client_id,
                  email: {
                    in: externalEmails,
                  },
                },
                select: {
                  id: true,
                },
              })
            : Promise.resolve(null),
        ]);

        if (!hasApplicationAccess && !invitation) {
          throw new ForbiddenException(enums.Ei18nCodes.T3E0026);
        }
      }
    }

    return;
  }

  public getTypeDataOfField(field_name: string): string {
    let type = 'string';
    switch (field_name) {
      case dto.UserProfileFields.email:
        type = 'email';
        break;
      case dto.UserProfileFields.phone_number:
        type = 'phone';
        break;
      case dto.UserProfileFields.birthdate:
        type = 'date';
        break;
      case dto.UserProfileFields.data_processing_agreement:
        type = 'boolean';
        break;
      case dto.UserProfileFields.picture:
        type = 'image';
        break;
      default:
        break;
    }
    return type;
  }

  /**
   * Gets a user by ID
   */
  public async getUserByIdentifier(
    identifier: string,
    checkIds = false,
    validateOnAuthorization?: boolean,
  ) {
    const identifierType = getIdentifierType(identifier);

    if (checkIds) {
      const allowed_login_fields = (
        await this.getSettingsByName(dto.ESettingsNames.allowed_login_fields)
      ).split(' ');

      // Check for a valid identifier
      if (!allowed_login_fields.includes(identifierType)) {
        throw new ForbiddenException(enums.Ei18nCodes.T3E0073);
      }
    }
    const user = await this.userRepo.findByIdentifier({ identifier });

    if (!user) {
      throw new ForbiddenException(enums.Ei18nCodes.T3E0003);
    }

    if (
      validateOnAuthorization &&
      (identifierType === enums.IdentifierType.Email ||
        identifierType === enums.IdentifierType.PhoneNumber)
    ) {
      const contactLoginFieldName = identifierType;
      const [field] = await this.getProfileFields(contactLoginFieldName);

      if (field?.validate_on_authorization) {
        await this.prepareGeneralProfileFields(
          {
            [contactLoginFieldName]: String(prepareIdentifier(identifier, identifierType)),
          },
          user.id,
          enums.UserRoles.OWNER,
          false,
        );
      }
    }

    return { user, identifierType };
  }

  /**
   * Update settings
   */
  public async updateSettings(...data: Prisma.SettingsUpdateInput[]) {
    const updatePromises = data.map((setting) => {
      const { name, ...data } = setting;
      return prisma.settings.update({
        where: { name: name as string },
        data,
      });
    });

    const result = await Promise.all(updatePromises);
    await this.resetSettingsCache();
    return result;
  }

  /**
   * Returns service settings
   */
  async getSettings(role?: enums.UserRoles): Promise<Record<string, unknown>> {
    const cachedSettings = await this.getCachedSettingsList();
    const settings = this.convertToOldVersion(
      ...cachedSettings.filter((s) => {
        if (role === enums.UserRoles.OWNER || role === enums.UserRoles.EDITOR) {
          return true;
        }

        return s.public;
      }),
    );

    return {
      ...settings,
      ...(await this.getLegacyDefaultPublicClaims()),
    };
  }

  /**
   * Returns a service setting
   */
  async getSettingsByName<T = string>(name: string, forceRefresh = false) {
    if (
      name === dto.ESettingsNames.default_public_profile_claims_oauth ||
      name === dto.ESettingsNames.default_public_profile_claims_gravatar
    ) {
      const claims = await this.getLegacyDefaultPublicClaims();
      return claims[name] as T;
    }

    const cachedSettings = await this.getCachedSettingsList(forceRefresh);
    const value = cachedSettings.find((s) => s.name === name)?.value;

    if (name === dto.ESettingsNames.two_factor_authentication) {
      return this.normalizeTwoFactorAuthenticationSettings(
        value as unknown as dto.TwoFactorAuthenticationDto | null | undefined,
      ) as T;
    }

    if (name === dto.ESettingsNames.i18n) {
      const defaultLanguage =
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        'default_language' in value &&
        typeof value.default_language === 'string'
          ? value.default_language
          : await getDefaultLocale();

      return {
        ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
        default_language: defaultLanguage,
      } as T;
    }

    return value as T;
  }

  private convertToOldVersion(
    ...values: Pick<SettingsModel, 'name' | 'value'>[]
  ): Record<string, unknown> {
    return values.reduce((acc, item) => {
      acc[item.name] = item.value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  /**
   * Change Trusted settings
   */
  async changeSettings(params: dto.EditSettingsDto) {
    if (params.two_factor_authentication) {
      params.two_factor_authentication = this.normalizeTwoFactorAuthenticationSettings(
        params.two_factor_authentication,
      );
      await this.validateTwoFactorAuthenticationSettings(params.two_factor_authentication);
    }

    await this.checkLoginFields(params.allowed_login_fields);

    if (params.data_processing_agreement) {
      const agreementField = await prisma.profileField.findUnique({
        where: { key: dto.UserProfileFields.data_processing_agreement },
        select: { id: true },
      });

      if (agreementField) {
        await prisma.userProfileValue.updateMany({
          where: { profile_field_id: agreementField.id },
          data: { value: false },
        });
      }
    }

    await this.syncDefaultPublicClaimsFromLegacySettings(params);

    // Convert settings
    const settings = Object.entries(params)
      .filter(
        ([name]) =>
          name !== dto.ESettingsNames.default_public_profile_claims_oauth &&
          name !== dto.ESettingsNames.default_public_profile_claims_gravatar,
      )
      .map(([name, value]) => ({
        name: name as dto.ESettingsNames,
        value,
      }));

    // Update settings
    if (settings.length) {
      await this.updateSettings(...settings);
      return;
    }

    await this.resetSettingsCache();
  }

  async deleteLoginField(field: string) {
    const loginIdsStr = await this.getSettingsByName<string>(
      dto.ESettingsNames.allowed_login_fields,
    );
    const loginFields = `${loginIdsStr}`.split(' ');

    if (!loginFields.includes(field)) {
      return;
    }

    loginFields.splice(loginFields.indexOf(field), 1);

    // Check for remaining filled-in identifiers for the administrator
    const admin = await this.userRepo.findById('1');

    const check = loginFields.find((field) => admin?.[field]);
    if (!check) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0040);
    }

    await this.changeSettings({
      allowed_login_fields: loginFields.join(' '),
    });
  }

  async addLoginField(field: string) {
    const loginIdsStr = await this.getSettingsByName<string>(
      dto.ESettingsNames.allowed_login_fields,
    );
    const loginFields = `${loginIdsStr}`.split(' ');

    if (loginFields.includes(field)) {
      return;
    }

    loginFields.push(field);

    await this.changeSettings({
      allowed_login_fields: loginFields.join(' '),
    });
  }

  /**
   * Generate a list of profile fields. Add rules and settings.
   */
  private async prepareProfileFields(
    values: dto.ProfileField[],
    options?: TProfileFieldScopeOptions,
  ) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const [rules, loginIdsStr, profileFieldDefaults] = await Promise.all([
      this.getAllRules(true, options),
      this.getSettingsByName<string>(dto.ESettingsNames.allowed_login_fields),
      prisma.profileField.findMany({
        where: this.getProfileFieldScopeWhere(organizationId),
        select: {
          key: true,
          organization_id: true,
          default_public: true,
        },
      }),
    ]);
    const defaultPublicByKey = profileFieldDefaults.reduce<Record<string, number>>((acc, field) => {
      acc[field.key] = field.default_public;
      return acc;
    }, {});
    const listLoginFields = `${loginIdsStr}`.split(' ');

    return values.map((field) => {
      const rule = rules.find((r) => r.field_name === field.field);

      if (!rule) {
        throw new InternalServerErrorException(enums.Ei18nCodes.T3E0016, { cause: field.field });
      }

      const claim = this.publicLevelToClaimPrivacy(defaultPublicByKey[field.field]);

      return {
        type: field.type,
        field: field.field,
        id: field.type === dto.ProfileFieldTypes.custom ? field.id : undefined,
        title: field.title,
        organization_id:
          field.type === dto.ProfileFieldTypes.custom ? field.organization_id : undefined,
        default: rule.default || undefined,
        required: rule.required,
        unique: rule.unique,
        validate_on_authorization: rule.validate_on_authorization,
        active: rule.active,
        editable: rule.editable,
        mapping_vcard:
          field.type === dto.ProfileFieldTypes.custom ? field.mapping_vcard : undefined,
        claim,
        allowed_as_login: listLoginFields.includes(field.field),
        validations: rule.validations,
      };
    });
  }

  /**
   * Getting a full list of profile fields
   */
  async getProfileFields(name?: string, options?: TProfileFieldScopeOptions) {
    const result: dto.ProfileField[] = [];

    const generalFields = await this.getGeneralFields();
    result.push(...generalFields);

    const customFields = await this.getCustomFields(options);
    const customFieldsDto: dto.CustomProfileField[] = customFields.map((field) => ({
      id: field.id,
      type: dto.ProfileFieldTypes.custom,
      field: field.field,
      organization_id: field.organization_id,
      title: field.title as string | dto.TLocalizedTextDto,
      mapping_vcard: field.mapping_vcard,
    }));
    result.push(...customFieldsDto);

    return this.prepareProfileFields(
      name ? [result.find((field) => field.field === name)].filter(Boolean) : result,
      options,
    );
  }

  /**
   * Getting primary profile fields
   */
  private async getGeneralFields(): Promise<dto.GeneralProfileField[]> {
    const locale = await this.getSettingsByName<{ default_language: string }>(
      dto.ESettingsNames.i18n,
    );
    const list = dto.listProfileFields.map((field) => ({
      ...field,
      title: this.i18nService.t(field.title as string, {
        lang: locale?.default_language ?? 'ru',
      }),
    }));

    return list;
  }

  //#region Profile Fields
  private async backfillProfileFieldDefault(
    transaction: Prisma.TransactionClient,
    profileField: { id: string; default_public: number },
    defaultValue: string,
    organizationId: string | null | undefined,
  ) {
    const users = await transaction.user.findMany({
      where:
        organizationId && organizationId !== CLIENT_ID
          ? {
              OR: [{ org_id: organizationId }, { roles: { some: { client_id: organizationId } } }],
            }
          : {},
      select: { id: true },
    });

    await transaction.userProfileValue.createMany({
      data: users.map((user) => ({
        user_id: user.id,
        profile_field_id: profileField.id,
        value: defaultValue,
        public: profileField.default_public,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Adding an additional profile field
   */
  async addProfileField(params: dto.CreateProfileFieldDto) {
    const organizationId = await this.resolveProfileFieldOwnerOrganizationId(params);
    await prisma.$transaction(async (prisma) => {
      // Create an additional field
      // Check for a match with the main fields
      if (
        dto.listProfileFields.find((field) => field.field === params.field) ||
        params.field === 'password' ||
        params.field === 'name'
      ) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0041);
      }

      if (params.required && !params.editable) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0043);
      }

      if (params.validate_on_authorization && !params.editable) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0043);
      }

      if (params.required && !params.active) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0044);
      }

      // Parameter checks
      if (params.default && params.unique) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0045);
      }

      const existingField = await prisma.profileField.findFirst({
        where: {
          ...this.getOwnedProfileFieldScopeWhere(organizationId),
          OR: [{ key: params.field }, { title: { equals: params.title as Prisma.InputJsonValue } }],
        },
      });
      if (existingField) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0042);
      }

      const profileField = await prisma.profileField.create({
        data: {
          key: params.field,
          organization_id: organizationId,
          title: params.title as Prisma.InputJsonValue,
          value_type: 'STRING',
          mapping_vcard: params.mapping_vcard,
          editable: params.editable,
          active: params.active,
          required: params.required,
          unique: params.unique,
          validate_on_authorization: params.validate_on_authorization,
          default_value: params.default ?? null,
          default_public: this.claimPrivacyToPublicLevel(params.claim),
        },
      });

      clearLegacyProfileFieldCache([params.field]);

      // Add a field value to users if default is specified
      if (params.default) {
        await this.backfillProfileFieldDefault(
          prisma,
          profileField,
          params.default,
          organizationId,
        );
      }
    });

    await this.notifyDynamicScopesChanged(organizationId);
  }

  /**
   * Updating profile field settings
   */
  public async updateProfileField(field_name: string, params: dto.UpdateProfileFieldDto) {
    const scopeOrganizationId = await this.resolveProfileFieldScopeOrganizationId({
      clientId: params.client_id,
      organizationId: params.organization_id,
    });
    // Check for the presence of the field through a rule, since for each Fields must have a rule
    const rule = await this.getUserRuleByFieldName(field_name, {
      organizationId: scopeOrganizationId,
    });
    if (!rule) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0046);
    }

    if (field_name === 'name')
      throw new BadRequestException(enums.Ei18nCodes.T3E0067, { cause: field_name });
    if (params.field === 'name')
      throw new BadRequestException(enums.Ei18nCodes.T3E0088, { cause: params.field });

    if (
      dto.listProfileFields.find((field) => field.field === field_name) &&
      (params.field || params.title)
    ) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0047);
    }

    if ((params.required ?? rule.required) && !(params.active ?? rule.active)) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0048);
    }

    if (dto.listProfileFields.find((field) => field.field === params.field)) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0049);
    }

    if (
      await prisma.profileField.findFirst({
        where: {
          ...this.getOwnedProfileFieldScopeWhere(scopeOrganizationId),
          OR: [
            { key: params.field },
            ...(params.title !== undefined
              ? [{ title: { equals: params.title as Prisma.InputJsonValue } }]
              : []),
          ],
          NOT: { key: field_name },
        },
      })
    ) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0050);
    }

    // Primary fields cannot have their uniqueness changed
    if (
      (params.unique === false || params.unique === true) &&
      field_name !== dto.UserProfileFields.email
    ) {
      const generalFields = (await this.getProfileFields()).find(
        (field) => field.field === field_name && field.type === dto.ProfileFieldTypes.general,
      );
      if (generalFields) throw new BadRequestException(enums.Ei18nCodes.T3E0067);
    }

    // Check if uniqueness can be enabled for a field
    if (params.unique === true) {
      if (field_name === dto.UserProfileFields.email) {
        const duplicates = await this.findDuplicateEmailsAcrossUsers();
        if (duplicates.length > 0) {
          throw new BadRequestException(enums.Ei18nCodes.T3E0089, {
            cause: duplicates.join(', '),
          });
        }
      } else if (!(await this.checkUniqueField(field_name, rule.organization_id ?? null)))
        throw new BadRequestException(enums.Ei18nCodes.T3E0089);
    }

    if ((params.required ?? rule.required) && !(params.editable ?? rule.editable)) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0043);
    }

    if (
      (params.validate_on_authorization ?? rule.validate_on_authorization) &&
      !(params.editable ?? rule.editable)
    ) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0043);
    }

    const loginIdsStr = await this.getSettingsByName<string>(
      dto.ESettingsNames.allowed_login_fields,
    );

    if (params.required === false && params.allowed_as_login === undefined) {
      if (loginIdsStr.includes(field_name)) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0091);
      }
    }

    if (params.unique === false && params.allowed_as_login === undefined) {
      if (loginIdsStr.includes(field_name)) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0090);
      }
    }

    if ((rule.unique === true || params.unique === true) && (rule.default || params.default)) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0045);
    }

    if (params.required && field_name === 'picture') {
      throw new BadRequestException(enums.Ei18nCodes.T3E0051);
    }

    // Fields from listUnChangeableUserFields are always unchangeable and non-editable
    if (listUnChangeableUserFields.includes(field_name as dto.UserProfileFields)) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0067, { cause: field_name });
    }

    // Fields from the primary profile are always active
    if (
      params.active === false &&
      dto.listProfileFields.find((field) => field.field === field_name)
    ) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0092);
    }

    if (params.allowed_as_login !== undefined) {
      if (params.allowed_as_login) {
        if ((!rule.required && !params.required) || params.required === false) {
          throw new BadRequestException(enums.Ei18nCodes.T3E0091);
        }
        await this.addLoginField(field_name);
      } else {
        await this.deleteLoginField(field_name);
      }
    }

    await prisma.$transaction(async (prisma) => {
      const profileField = await prisma.profileField.update({
        where: { id: rule.id },
        data: {
          key: params.field,
          title: params.title as Prisma.InputJsonValue,
          editable: params.editable,
          required: params.required,
          unique: params.unique,
          validate_on_authorization: params.validate_on_authorization,
          default_value: params.default,
          active: params.active,
          default_public:
            params.claim === undefined ? undefined : this.claimPrivacyToPublicLevel(params.claim),
        },
      });

      const effectiveDefault = params.default === undefined ? rule.default : params.default;
      if (effectiveDefault) {
        await this.backfillProfileFieldDefault(
          prisma,
          profileField,
          effectiveDefault,
          rule.organization_id,
        );
      }
    });

    clearLegacyProfileFieldCache(
      [field_name, params.field].filter((key): key is string => Boolean(key)),
    );
    await this.notifyDynamicScopesChanged(rule.organization_id ?? null);
  }

  /**
   * Removing an additional profile field
   */
  public async deleteProfileField(field_name: string, options?: TProfileFieldScopeOptions) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    let deletedOrganizationId: string | null | undefined;
    await prisma.$transaction(async (prisma) => {
      const field = await prisma.profileField.findFirst({
        where: {
          key: field_name,
          ...this.getOwnedProfileFieldScopeWhere(organizationId),
        },
      });
      if (!field) {
        return;
      }
      deletedOrganizationId = field.organization_id;

      await prisma.profileField.delete({
        where: { id: field.id },
      });
    });

    clearLegacyProfileFieldCache([field_name]);
    await this.notifyDynamicScopesChanged(deletedOrganizationId ?? null);
  }

  async prepareGeneralProfileFields(
    body: TPreparedGeneralProfileFields,
    user_id?: string | number,
    role?: enums.UserRoles,
    ignoreErrors = false,
    options?: {
      skipValidationsForFields?: string[];
      scope?: TProfileFieldScopeOptions;
    },
  ): Promise<TPreparedGeneralProfileFields> {
    const defaultLocale = await getDefaultLocale();
    const generalFields = (await this.getProfileFields(undefined, options?.scope)).filter(
      (field) =>
        field.type === dto.ProfileFieldTypes.general && field.field !== dto.UserProfileFields.sub,
    );
    const skipValidationsForFields = new Set(options?.skipValidationsForFields || []);

    const currentUserId = user_id ? String(user_id) : undefined;
    const user = currentUserId
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;

    // Loop through all body fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bodyEntries = Object.entries(body).filter(([_, value]) => value !== undefined);
    for (const [key] of bodyEntries) {
      // Check if a field exists in general fields
      const field = generalFields.find((f) => f.field === key);
      if (!field) {
        if (ignoreErrors) {
          delete body[key];
          continue;
        }
        throw new BadRequestException(enums.Ei18nCodes.T3E0094, { cause: key });
      }

      // Check if a field is active
      if (!field.active) {
        if (ignoreErrors) {
          delete body[key];
          continue;
        }
        throw new BadRequestException(enums.Ei18nCodes.T3E0026);
      }

      // Check if a value exists
      if (body[key] === undefined && !user) {
        // If no value is passed If there's no user, we use the default.
        body[key] = field.default || undefined;
      }

      // If the field isn't editable, we check the role.
      if (!field.editable && role !== enums.UserRoles.OWNER) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0026);
      }

      // If the field is email, we convert it to lowercase.
      if (key === dto.UserProfileFields.email && typeof body[key] === 'string') {
        body[key] = body[key].trim().toLowerCase();
      }

      // Check validations.
      if (
        !skipValidationsForFields.has(key) &&
        body[key] !== undefined &&
        body[key] !== '' &&
        body[key] !== null
      ) {
        const targetLocale = I18nContext.current()?.lang || defaultLocale;
        const errors: string[] = [];
        field.validations.forEach((validation) => {
          if (validation.active) {
            const regex = new RegExp(validation.regex);
            if (!regex.test(`${body[key]}`)) {
              errors.push(resolveLocalizedText(validation.error, targetLocale, defaultLocale));
            }
          }
        });
        if (errors.length) {
          if (ignoreErrors) {
            delete body[key];
            continue;
          }
          throw new BadRequestException(enums.Ei18nCodes.T3E0093, {
            cause: `${key}: ${errors.join(', ')}`,
          });
        }
      }

      // Check for uniqueness.
      if (field.unique && body[key] !== undefined && body[key] !== '' && body[key] !== null) {
        const ok =
          key === dto.UserProfileFields.email
            ? await this.isEmailTaken(String(body[key]), currentUserId)
            : await prisma.userProfileValue.findFirst({
                where: {
                  profile_field: {
                    key,
                  },
                  value: {
                    equals: body[key] as Prisma.InputJsonValue,
                  },
                  ...(currentUserId
                    ? {
                        user_id: {
                          not: currentUserId,
                        },
                      }
                    : {}),
                },
              });

        if (ok) {
          if (ignoreErrors) {
            delete body[key];
            continue;
          }
          throw new BadRequestException(enums.Ei18nCodes.T3E0095, {
            cause: resolveLocalizedText(
              field.title,
              I18nContext.current()?.lang || defaultLocale,
              defaultLocale,
            ),
          });
        }
      }
    }

    return body;
  }
  //#region

  //#region Custom Fields
  /**
   * Getting a list of additional custom fields
   */
  async getCustomFields(options?: TProfileFieldScopeOptions) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const defaultLocale = await getDefaultLocale();
    const fields = await prisma.profileField.findMany({
      where: {
        ...this.getProfileFieldScopeWhere(organizationId),
        key: {
          notIn: Array.from(generalProfileFieldKeys),
        },
      },
    });

    return fields
      .map((field) => ({
        id: field.id,
        field: field.key,
        organization_id: field.organization_id,
        title: field.title as string | dto.TLocalizedTextDto,
        mapping_vcard: field.mapping_vcard,
      }))
      .sort((a, b) =>
        resolveLocalizedText(a.title, defaultLocale, defaultLocale).localeCompare(
          resolveLocalizedText(b.title, defaultLocale, defaultLocale),
        ),
      );
  }
  //#endregion

  //#region Rules
  /**
   * Getting a list of profile editing rules
   */
  public async getAllRules(widthSub: boolean = false, options?: TProfileFieldScopeOptions) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const rules = await prisma.profileField.findMany({
      where: this.getProfileFieldScopeWhere(organizationId),
      include: {
        validations: {
          include: {
            rule_validation: true,
          },
        },
      },
    });

    const cf = await this.getCustomFields(options);
    const gf = await this.getGeneralFields();

    // Transform the data structure to extract the validations themselves.
    const rulesWithValidations = rules.map((rule) =>
      this.mapProfileFieldToRule(
        rule,
        cf.find((f) => f.field === rule.key)?.title ||
          gf.find((f) => f.field === rule.key)?.title ||
          (rule.title as string | dto.TLocalizedTextDto),
      ),
    );

    // Return the rules in the order they need to be filled.
    const order = {
      given_name: 2,
      family_name: 3,
      birthdate: 4,
      login: 5,
      password: 6,
      email: 7,
      phone_number: 8,
      nickname: 9,
      data_processing_agreement: 10,
    };

    const sortedRules = rulesWithValidations.sort((a, b) => {
      const orderA = order[a.field_name] || 999; // Undefined fields at the end.
      const orderB = order[b.field_name] || 999;
      return orderA - orderB;
    });

    if (!widthSub) {
      return sortedRules.filter((rule) => rule.field_name !== dto.UserProfileFields.sub);
    }

    return sortedRules;
  }

  /**
   * Getting a rule for editing a profile by field name
   */
  public async getUserRuleByFieldName(fieldName: string, options?: TProfileFieldScopeOptions) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const field = await prisma.profileField.findFirst({
      where: {
        key: fieldName,
        ...this.getProfileFieldScopeWhere(organizationId),
      },
      include: {
        validations: {
          include: {
            rule_validation: true,
          },
        },
      },
    });

    return field ? this.mapProfileFieldToRule(field) : null;
  }

  /**
   * Checking for unique values ​​for a field
   * Returns true if all values ​​for the fieldName field are unique for all users
   */
  private async checkUniqueField(
    fieldName: string,
    organizationId?: string | null,
  ): Promise<boolean> {
    try {
      const values = await prisma.userProfileValue.findMany({
        where: {
          profile_field: {
            key: fieldName,
            ...(organizationId === undefined ? {} : { organization_id: organizationId }),
          },
        },
        select: {
          value: true,
        },
      });

      const seen = new Set<string>();
      for (const item of values) {
        if (item.value === null) {
          continue;
        }

        const serializedValue = JSON.stringify(item.value);
        if (seen.has(serializedValue)) {
          return false;
        }

        seen.add(serializedValue);
      }

      return true;
    } catch (error) {
      console.error('Error checking unique field:', error);
      throw new InternalServerErrorException('Failed to check unique field');
    }
  }

  /**
   * Checking for the uniqueness of the value for custom_field for all users
   * Returns true if the value for the fieldName field is unique
   */
  private async checkUniqueValue(
    fieldName: string,
    value: string | number | boolean,
    userId?: string | User,
    organizationId?: string | null,
  ): Promise<boolean> {
    const currentUserId = userId ? (typeof userId === 'string' ? userId : userId.id) : undefined;
    const existingValue = await prisma.userProfileValue.findFirst({
      where: {
        profile_field: {
          key: fieldName,
          ...(organizationId === undefined ? {} : { organization_id: organizationId }),
        },
        value: {
          equals: value as Prisma.InputJsonValue,
        },
        ...(currentUserId
          ? {
              user_id: {
                not: currentUserId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    return !existingValue;
  }
  //#endregion

  /**
   * Preparing custom fields for saving
   */
  async prepareCustomFieldsToSave(
    customFields: { [key: string]: string | boolean | number },
    user_id?: string | number,
    role?: enums.UserRoles,
    ignoreErrors = false,
    options?: TProfileFieldScopeOptions,
  ): Promise<{ [key: string]: string | boolean | number }> {
    const defaultLocale = await getDefaultLocale();
    const customFieldsToSave = customFields || {};
    const currentUserId = user_id ? String(user_id) : undefined;
    const user = currentUserId
      ? await prisma.user.findUnique({ where: { id: currentUserId } })
      : null;
    const resolvedOrganizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const organizationId =
      resolvedOrganizationId === undefined ? user?.org_id ?? null : resolvedOrganizationId;
    const scopedOptions = { organizationId };
    const customFieldsWithDisabled = (await this.getProfileFields(undefined, scopedOptions)).filter(
      (f) => f.type === dto.ProfileFieldTypes.custom,
    );
    const customFieldsDef = (await this.getProfileFields(undefined, scopedOptions)).filter(
      (f) => f.type === dto.ProfileFieldTypes.custom && f.active,
    );

    // Loop through all custom_fields.
    const customFieldsEntries = Object.entries(customFieldsToSave);

    // If there's no user, we add the default fields.
    const defaultFields: string[] = [];
    if (!user) {
      const keys = customFieldsEntries.map((e) => e[0]);
      const def = customFieldsDef
        .filter((e) => e.default && !e.unique && !keys.includes(e.field))
        .map((e) => {
          return { field: e.field, value: e.default };
        });
      for (const element of def) {
        defaultFields.push(element.field);
        customFieldsEntries.push([element.field, element.value]);
        customFieldsToSave[element.field] = element.value;
      }
    }

    for (const [key, value] of customFieldsEntries) {
      // Check if the field exists in custom fields.
      const field = customFieldsDef.find((f) => f.field === key);
      if (!field) {
        const fieldDisabled = customFieldsWithDisabled.find((f) => f.field === key);
        if (ignoreErrors || (fieldDisabled && !fieldDisabled.active)) {
          // Ignore the error, delete it, and continue.
          delete customFieldsToSave[key];
          continue;
        }
        throw new BadRequestException(enums.Ei18nCodes.T3E0094, { cause: key });
      }

      // If the field is not editable, check the role
      if (
        !field.editable &&
        role !== enums.UserRoles.OWNER &&
        !defaultFields.includes(field.field)
      ) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0067, {
          cause: resolveLocalizedText(
            field.title,
            I18nContext.current()?.lang || defaultLocale,
            defaultLocale,
          ),
        });
      }

      // Check validations
      if (value !== undefined && value !== '' && value !== null) {
        const targetLocale = I18nContext.current()?.lang || defaultLocale;
        const errors: string[] = [];
        field.validations.forEach((validation) => {
          if (validation.active) {
            const regex = new RegExp(validation.regex);
            if (!regex.test(`${value}`)) {
              errors.push(resolveLocalizedText(validation.error, targetLocale, defaultLocale));
            }
          }
        });
        if (errors.length) {
          if (ignoreErrors) {
            // Ignore the error, delete, and continue
            delete customFieldsToSave[key];
            continue;
          }
          throw new BadRequestException(enums.Ei18nCodes.T3E0093, {
            cause: `${resolveLocalizedText(
              field.title,
              I18nContext.current()?.lang || defaultLocale,
              defaultLocale,
            )}: ${errors.join(', ')}`,
          });
        }
      }

      // If the value contains binary data, convert it to a string
      if (
        typeof value === 'object' ||
        (typeof value === 'string' && /[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(value))
      ) {
        customFieldsToSave[key] = JSON.stringify(value);
      }

      // Check for uniqueness
      if (field.unique && value !== undefined && value !== '' && value !== null) {
        if (
          !(await this.checkUniqueValue(
            key,
            value,
            currentUserId || user,
            field.organization_id ?? null,
          ))
        ) {
          if (ignoreErrors) {
            // Ignore the error, delete, and continue
            delete customFieldsToSave[key];
            continue;
          }
          throw new BadRequestException(enums.Ei18nCodes.T3E0095, {
            cause: resolveLocalizedText(
              field.title,
              I18nContext.current()?.lang || defaultLocale,
              defaultLocale,
            ),
          });
        }
      }
    }

    return customFieldsToSave;
  }

  public async checkLoginFields(value: string) {
    if (value === undefined) {
      return;
    }

    // Remove extra spaces from the beginning and end of the value
    value = value.trim();
    if (value === '') {
      throw new BadRequestException(enums.Ei18nCodes.T3E0027);
    }

    // Get a list of profile fields
    const fields = ['login', 'email', 'phone_number'];

    const loginFields = value.split(' ');
    for (const field of loginFields) {
      if (!fields.includes(field)) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0028);
      }
    }
  }

  public async checkScopes(value?: string, options?: TProfileFieldScopeOptions) {
    if (value === undefined) {
      return value;
    }

    const fields = await this.getProfileFieldScopeKeys(options);

    return Array.from(
      new Set(
        value
          .trim()
          .split(/\s+/)
          .filter((scope) => scope && fields.has(scope)),
      ),
    ).join(' ');
  }

  /**
   * Adding a validation to a rule
   */
  public async addRuleValidationToRule(
    field_name: string,
    validationId: string,
    options?: TProfileFieldScopeOptions,
  ) {
    // Validation cannot be assigned to the birthday, picture, and fields
    if (
      [
        dto.UserProfileFields.birthdate,
        dto.UserProfileFields.picture,
        dto.UserProfileFields.data_processing_agreement,
      ].includes(field_name as dto.UserProfileFields)
    )
      throw new BadRequestException(enums.Ei18nCodes.T3E0026);

    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const field = await prisma.profileField.findFirst({
      where: {
        key: field_name,
        ...this.getProfileFieldScopeWhere(organizationId),
      },
    });
    if (!field) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0016);
    }

    await this.ensureRuleValidationExists(validationId, options, {
      id: true,
    });

    await prisma.profileFieldValidation.create({
      data: {
        profile_field_id: field.id,
        rule_validation_id: validationId,
      },
    });
  }

  /**
   * Removing a validation from a rule
   */
  public async deleteRuleValidationFromRule(
    field_name: string,
    validationId: string,
    options?: TProfileFieldScopeOptions,
  ) {
    const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
    const field = await prisma.profileField.findFirst({
      where: {
        key: field_name,
        ...this.getProfileFieldScopeWhere(organizationId),
      },
    });
    if (!field) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0016);
    }

    await this.ensureRuleValidationExists(validationId, options, {
      id: true,
    });

    await prisma.profileFieldValidation.delete({
      where: {
        profile_field_id_rule_validation_id: {
          profile_field_id: field.id,
          rule_validation_id: validationId,
        },
      },
    });
  }

  /**
   * Getting a list of validations
   */
  public async getRulesValidations(
    field_name?: string,
    onlyActive = false,
    options?: TProfileFieldScopeOptions,
  ) {
    const ruleValidationOrganizationId = await this.resolveRuleValidationScopeOrganizationId(
      options,
    );

    if (field_name) {
      const organizationId = await this.resolveProfileFieldScopeOrganizationId(options);
      const field = await prisma.profileField.findFirst({
        where: {
          key: field_name,
          ...this.getProfileFieldScopeWhere(organizationId),
        },
        select: {
          id: true,
        },
      });

      if (!field) {
        return [];
      }

      return prisma.ruleValidation.findMany({
        where: {
          ...this.getRuleValidationScopeWhere(ruleValidationOrganizationId),
          profile_fields: {
            some: {
              profile_field_id: field.id,
            },
          },
          ...(onlyActive ? { active: true } : {}),
        },
        orderBy: { id: SortDirection.DESC },
      });
    }

    return prisma.ruleValidation.findMany({
      where: this.getRuleValidationScopeWhere(ruleValidationOrganizationId),
      orderBy: { id: SortDirection.DESC },
    });
  }

  /**
   * Creating a validation
   */
  public async addRuleValidation(
    data: dto.CreateRuleValidationDto,
    options?: TProfileFieldScopeOptions,
  ) {
    const organizationId = await this.resolveRuleValidationScopeOrganizationId(options);
    const title = await this.ensureRuleValidationTitleAvailable(data.title, options);

    return prisma.ruleValidation.create({
      data: {
        ...data,
        title: (title ?? data.title) as Prisma.InputJsonValue,
        error: data.error as Prisma.InputJsonValue,
        organization_id: organizationId,
      },
    });
  }

  /**
   * Updating a validation
   */
  public async updateRuleValidation(
    id: string,
    data: dto.UpdateRuleValidationDto,
    options?: TProfileFieldScopeOptions,
  ) {
    await this.ensureRuleValidationExists(id, options, { id: true });

    const title = await this.ensureRuleValidationTitleAvailable(data.title, options, id);

    return prisma.ruleValidation.update({
      where: { id },
      data: {
        ...data,
        ...(title !== undefined ? { title: title as Prisma.InputJsonValue } : {}),
        ...(data.error !== undefined ? { error: data.error as Prisma.InputJsonValue } : {}),
      },
    });
  }

  /**
   * Removing a validation
   */
  public async deleteRuleValidation(id: string, options?: TProfileFieldScopeOptions) {
    await this.ensureRuleValidationExists(id, options, { id: true });

    return prisma.ruleValidation.delete({
      where: { id },
    });
  }

  //#region Client types
  /**
   * Getting a list of customer types
   */
  public async getClientTypes() {
    return prisma.clientType.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Adding a customer type
   */
  public async addClientType(data: dto.CreateClientTypeDto) {
    return prisma.clientType.create({
      data: {
        name: data.name as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Updating a customer type
   */
  public async updateClientType(id: string, data: dto.CreateClientTypeDto) {
    return prisma.clientType.update({
      where: { id },
      data: {
        name: data.name as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Removing a customer type
   */
  public async deleteClientType(id: string) {
    await prisma.clientType.deleteMany({
      where: { id },
    });
  }
  //#endregion
}

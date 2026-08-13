import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalAccount, Prisma, Provider, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { I18nContext } from 'nestjs-i18n';
import { getDefaultLocale, resolveLocalizedText } from 'src/utils/localized-text';
import { NicknameGenerator } from 'src/utils/nickname-generator';
import { v4 as uuidv4 } from 'uuid';
import { CLIENT_ID, DOMAIN } from '../../constants';
import {
  Actions,
  EClaimPrivacy,
  Ei18nCodes,
  ELocales,
  EProviderTypes,
  IdentifierType,
  UserRoles,
} from '../../enums';
import * as helpers from '../../helpers';
import { InteractionRegDto } from '../interaction/interaction.dto';
import { findUserAndExternalAccount } from '../interaction/interaction.helpers';
import { ClientService } from '../clients/clients.service';
import { CustomLogger } from '../logger';
import { prisma } from '../prisma';
import {
  syncGuestsMembershipForUser,
  syncOrganizationGuestsMembershipForUser,
} from '../prisma/guests-group';
import { ProviderFactory } from '../providers';
import { REDIS_PREFIXES, RedisAdapter } from '../redis';
import { upsertLegacyUserProfileValues } from '../repository/user-profile-write';
import { RoleRepository, UserModel, UserRepository } from '../repository';
import { getLegacyUserSearchEmails, matchesLegacyUserEmailSearch } from '../repository/user-search';
import { legacyUserInclude, toLegacyUser, withLegacyUserBlocked } from '../repository/user-compat';
import { ESettingsNames, SettingsService } from '../settings';
import { UsersContactsService } from './users-contacts.service';
import { toPublicLegacyUser } from './user-visibility';
import {
  buildManagedUserAccessContext,
  canManageTargetUser,
  canManageTargetUserByContext,
  TManagedUserAccessContext,
} from './user-access';
import * as userDto from './users.dto';

const NEVER_DELETE_USER_DEADLINE_ISO = '9999-12-31T23:59:59.999Z';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersContactsService: UsersContactsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  get providerFactory() {
    return this.moduleRef.get(ProviderFactory, { strict: false });
  }
  // User roles repository
  get roleRepo() {
    return this.moduleRef.get(RoleRepository, { strict: false });
  }
  // User settings service
  get settingsService() {
    return this.moduleRef.get(SettingsService, { strict: false });
  }
  get redis() {
    return this.moduleRef.get(RedisAdapter, { strict: false });
  }
  get userRepo() {
    return this.moduleRef.get(UserRepository, { strict: false });
  }

  get logger() {
    return this.moduleRef.get(CustomLogger, { strict: false });
  }
  get clientService() {
    return this.moduleRef.get(ClientService, { strict: false });
  }

  addPhoneAdapter = new RedisAdapter(REDIS_PREFIXES.PhoneAddCode);

  private async buildAutocompleteAccessContext(actorUserId?: string | null) {
    if (!actorUserId) {
      return null;
    }

    return buildManagedUserAccessContext(actorUserId);
  }

  private canManageAutocompleteUser(
    legacyUser: UserModel,
    accessContext?: TManagedUserAccessContext | null,
  ) {
    return (
      !accessContext ||
      canManageTargetUserByContext(accessContext, legacyUser.id, legacyUser.org_id)
    );
  }

  private getAutocompleteExternalEmails(legacyUser: UserModel) {
    const primaryEmail = legacyUser.email?.trim().toLowerCase();

    return getLegacyUserSearchEmails(legacyUser).filter((email) => email !== primaryEmail);
  }

  private serializeAutocompleteUser(
    legacyUser: UserModel | null,
    accessContext?: TManagedUserAccessContext | null,
  ) {
    if (!legacyUser) {
      return null;
    }

    const canManageUser = this.canManageAutocompleteUser(legacyUser, accessContext);

    if (!canManageUser) {
      const publicUser = toPublicLegacyUser(legacyUser);

      return {
        id: publicUser.id,
        login: publicUser.login,
        email: publicUser.email,
        nickname: publicUser.nickname,
        given_name: publicUser.given_name,
        family_name: publicUser.family_name,
        picture: publicUser.picture,
      };
    }

    const externalEmails = this.getAutocompleteExternalEmails(legacyUser);

    return {
      id: legacyUser.id,
      folder_id: legacyUser.folder_id,
      login: legacyUser.login,
      email: legacyUser.email,
      nickname: legacyUser.nickname,
      given_name: legacyUser.given_name,
      family_name: legacyUser.family_name,
      picture: legacyUser.picture,
      blocked: legacyUser.blocked,
      ...(externalEmails.length ? { external_emails: externalEmails } : {}),
    };
  }

  private matchesAutocompleteSearch(
    legacyUser: UserModel | null,
    serializedUser: {
      id?: string;
      login?: string | null;
      email?: string | null;
      nickname?: string | null;
      given_name?: string | null;
      family_name?: string | null;
    } | null,
    accessContext?: TManagedUserAccessContext | null,
    search?: string,
  ) {
    if (!search) {
      return true;
    }

    if (!serializedUser) {
      return false;
    }

    const normalizedSearch = search.trim().toLowerCase();
    const matchesVisibleFields = [
      serializedUser.id,
      serializedUser.login,
      serializedUser.email,
      serializedUser.nickname,
      serializedUser.given_name,
      serializedUser.family_name,
    ].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(normalizedSearch),
    );

    if (matchesVisibleFields) {
      return true;
    }

    if (!legacyUser) {
      return false;
    }

    return (
      this.canManageAutocompleteUser(legacyUser, accessContext) &&
      matchesLegacyUserEmailSearch(legacyUser, normalizedSearch)
    );
  }

  private sortAutocompleteUsers(
    users: Array<{
      id: string;
      [key: string]: unknown;
    }>,
    sortBy?: string,
    sortDirection: Prisma.SortOrder = 'asc',
  ) {
    const direction = sortDirection === 'desc' ? -1 : 1;
    const field = sortBy || 'login';

    return [...users].sort((left, right) => {
      const leftValue = String(left?.[field] || '');
      const rightValue = String(right?.[field] || '');
      const result = leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' });

      if (result !== 0) {
        return result * direction;
      }

      return String(left.id).localeCompare(String(right.id));
    });
  }

  private async getClientAutocompleteUsersByIds(
    client_id: string,
    userIds: string[],
    accessContext?: TManagedUserAccessContext | null,
  ) {
    const roles = await prisma.role.findMany({
      where: {
        client_id,
        user_id: {
          in: userIds,
        },
        user: {
          deleted: null,
          roles: {
            none: {
              client_id: CLIENT_ID,
              role: UserRoles.OWNER,
            },
          },
        },
      },
      include: {
        user: {
          include: legacyUserInclude,
        },
      },
    });

    const usersById = new Map(
      roles.map((role) => [
        role.user_id,
        this.serializeAutocompleteUser(
          withLegacyUserBlocked(toLegacyUser(role.user), client_id),
          accessContext,
        ),
      ]),
    );
    const users = userIds
      .map((userId) => usersById.get(userId) || null)
      .filter((user): user is NonNullable<typeof user> => Boolean(user));

    return {
      users,
      totalCount: users.length,
    };
  }

  private async getClientAutocompleteRoleUsers(client_id: string) {
    const roles = await prisma.role.findMany({
      where: {
        client_id,
        user: {
          deleted: null,
          roles: {
            none: {
              client_id: CLIENT_ID,
              role: UserRoles.OWNER,
            },
          },
        },
      },
      include: {
        user: {
          include: legacyUserInclude,
        },
      },
    });

    return roles
      .map((role) => withLegacyUserBlocked(toLegacyUser(role.user), client_id))
      .filter((user): user is NonNullable<typeof user> => Boolean(user));
  }

  async getClientAutocompleteUsers(
    client_id: string,
    params: userDto.ListUsersAutocompleteDto,
    actorUserId?: string,
  ) {
    const { user_ids, limit, offset, search, sortBy, sortDirection } = params;
    const accessContext = await this.buildAutocompleteAccessContext(actorUserId);

    if (user_ids?.length) {
      return this.getClientAutocompleteUsersByIds(client_id, user_ids, accessContext);
    }

    const roleUsers = await this.getClientAutocompleteRoleUsers(client_id);
    const serializedUsers = roleUsers
      .map((legacyUser) => {
        const serializedUser = this.serializeAutocompleteUser(legacyUser, accessContext);
        return { legacyUser, serializedUser };
      })
      .filter(({ legacyUser, serializedUser }) =>
        this.matchesAutocompleteSearch(legacyUser, serializedUser, accessContext, search),
      )
      .map(({ serializedUser }) => serializedUser)
      .filter((user): user is NonNullable<typeof user> => Boolean(user));
    const sortedUsers = this.sortAutocompleteUsers(
      serializedUsers,
      sortBy,
      (sortDirection || 'asc') as Prisma.SortOrder,
    );
    const normalizedOffset = offset || 0;
    const normalizedLimit = limit === undefined ? undefined : normalizedOffset + limit;

    return {
      users: sortedUsers.slice(normalizedOffset, normalizedLimit),
      totalCount: serializedUsers.length,
    };
  }

  private async assertCanManageTargetUser(actorUserId: string, targetUserId: string) {
    const hasAccess = await canManageTargetUser(actorUserId, targetUserId, this.roleRepo);

    if (!hasAccess) {
      throw new ForbiddenException(Ei18nCodes.T3E0026);
    }
  }

  private isCertificateProviderType(type: string) {
    return type === EProviderTypes.MTLS;
  }

  private getProviderIdFromRestInfo(restInfo: Prisma.JsonValue | null | undefined) {
    if (!restInfo || typeof restInfo !== 'object' || Array.isArray(restInfo)) {
      return undefined;
    }

    const providerId = Number((restInfo as Record<string, unknown>).provider_id);
    return Number.isNaN(providerId) ? undefined : providerId;
  }

  private async findExistingExternalAccountForBinding(
    userId: string,
    providerData: Provider,
    externalAccountParams: { issuer: string; sub: string; rest_info?: Prisma.JsonValue },
  ) {
    if (!this.isCertificateProviderType(providerData.type)) {
      return findUserAndExternalAccount(
        externalAccountParams.issuer,
        false,
        externalAccountParams.sub,
      );
    }

    const candidateAccounts = await prisma.externalAccount.findMany({
      where: {
        issuer: externalAccountParams.issuer,
        sub: externalAccountParams.sub,
        type: {
          in: [EProviderTypes.MTLS],
        },
      },
      select: {
        user_id: true,
        id: true,
        user: true,
        avatar: true,
        label: true,
        profile_link: true,
        type: true,
        rest_info: true,
      },
    });

    const requestedProviderId = this.getProviderIdFromRestInfo(externalAccountParams.rest_info);
    const exactMatch = candidateAccounts.find((account) => {
      if (account.type !== providerData.type) {
        return false;
      }

      const existingProviderId = this.getProviderIdFromRestInfo(account.rest_info);
      if (requestedProviderId === undefined || existingProviderId === undefined) {
        return true;
      }

      return existingProviderId === requestedProviderId;
    });

    if (exactMatch) {
      return exactMatch;
    }

    return candidateAccounts.find((account) => account.user_id !== userId);
  }

  public async getById(id: string) {
    return this.userRepo.findById(id);
  }

  async create(
    {
      org_id,
      ignoreFieldErrors = false,
      folder_id,
      ...createUserDTO
    }: (userDto.CreateUserDTO | InteractionRegDto) & {
      password?: string;
      ignoreFieldErrors?: boolean;
      org_id?: string | null;
      folder_id?: string;
    },
    options?: {
      profileFieldScopeOrganizationId?: string | null;
    },
  ): Promise<UserModel> {
    const {
      email_verified = false,
      phone_number_verified = false,
      password_change_required = false,
      locale,
      ...profileCreateDto
    } = createUserDTO as (userDto.CreateUserDTO | InteractionRegDto) & {
      email_verified?: boolean;
      phone_number_verified?: boolean;
      password_change_required?: boolean;
      locale?: ELocales | null;
    };
    const normalizedLocale =
      locale && Object.values(ELocales).includes(locale as ELocales)
        ? (locale as ELocales)
        : undefined;
    if (!profileCreateDto.login) {
      profileCreateDto.login = uuidv4();
    }

    const effectiveProfileFieldOrganizationId =
      options?.profileFieldScopeOrganizationId === undefined
        ? org_id ?? null
        : options.profileFieldScopeOrganizationId;

    let customFieldsToSave: { [key: string]: string | boolean | number } =
      profileCreateDto.custom_fields
        ? typeof profileCreateDto.custom_fields === 'string'
          ? JSON.parse(profileCreateDto.custom_fields)
          : profileCreateDto.custom_fields
        : undefined;

    customFieldsToSave = await this.settingsService.prepareCustomFieldsToSave(
      customFieldsToSave,
      undefined,
      UserRoles.OWNER,
      ignoreFieldErrors,
      { organizationId: effectiveProfileFieldOrganizationId },
    );
    delete profileCreateDto.custom_fields;

    const bodySave = await this.settingsService.prepareGeneralProfileFields(
      profileCreateDto,
      undefined,
      UserRoles.OWNER,
      ignoreFieldErrors,
      {
        skipValidationsForFields: ['password'],
        scope: {
          organizationId: effectiveProfileFieldOrganizationId,
        },
      },
    );
    const { password, ...generalFieldsToSave } = bodySave as userDto.UpdateUserDTO & {
      password?: string;
    };
    const normalizedPassword = password === '' ? undefined : password;

    let nickname = generalFieldsToSave.nickname;
    if (!nickname) {
      nickname = NicknameGenerator.generateNickname(
        generalFieldsToSave.given_name,
        generalFieldsToSave.family_name,
      );
    }

    const folder = await prisma.folder.findFirst({
      where: {
        client_id: org_id ?? CLIENT_ID,
        id: folder_id,
      },
    });

    if (!folder) {
      throw new NotFoundException('Directory folder not found for organization');
    }

    const profileValuesToSave: Record<string, unknown> = {
      login: generalFieldsToSave.login,
      birthdate: generalFieldsToSave.birthdate || new Date().toISOString(),
      family_name: generalFieldsToSave.family_name,
      given_name: generalFieldsToSave.given_name,
      nickname,
      data_processing_agreement: generalFieldsToSave.data_processing_agreement,
      ...(generalFieldsToSave.email ? { email: generalFieldsToSave.email } : {}),
      ...(generalFieldsToSave.phone_number
        ? { phone_number: generalFieldsToSave.phone_number }
        : {}),
      ...(helpers.isEmpty(customFieldsToSave) ? {} : customFieldsToSave),
    };

    let user: User;
    await prisma.$transaction(async (tx) => {
      user = await tx.user.create({
        data: {
          hashed_password: normalizedPassword ? await bcrypt.hash(normalizedPassword, 10) : '',
          password_updated_at: new Date(),
          password_change_required: normalizedPassword ? password_change_required : false,
          ...(normalizedLocale ? { locale: normalizedLocale } : {}),
          org_id: org_id ?? null,
          folder_id: folder.id,
          scopes: {
            create: {
              scopes: '',
              client_id: CLIENT_ID,
            },
          },
          roles: {
            create: {
              role: UserRoles.USER,
              client_id: CLIENT_ID,
            },
          },
        },
      });

      await upsertLegacyUserProfileValues(tx, user.id, profileValuesToSave);

      if (generalFieldsToSave.email && email_verified) {
        await this.usersContactsService.createConfirmedContactTx(
          tx,
          user.id,
          EProviderTypes.EMAIL,
          generalFieldsToSave.email,
          {
            mode: 'primary',
            ...(org_id ? { scope: { clientId: org_id } } : {}),
          },
        );
      }

      if (generalFieldsToSave.phone_number && phone_number_verified) {
        await this.usersContactsService.createConfirmedContactTx(
          tx,
          user.id,
          EProviderTypes.PHONE,
          generalFieldsToSave.phone_number,
          {
            mode: 'primary',
            ...(org_id ? { scope: { clientId: org_id } } : {}),
          },
        );
      }

      if (org_id && org_id !== CLIENT_ID) {
        await tx.role.create({
          data: {
            user_id: user.id,
            role: UserRoles.USER,
            client_id: org_id,
          },
        });
      }

      await syncGuestsMembershipForUser(tx, user.id, CLIENT_ID);

      if (org_id && org_id !== CLIENT_ID) {
        await syncOrganizationGuestsMembershipForUser(tx, user.id, org_id);
      }
    });

    const createdUser = await this.userRepo.findById(user.id);
    if (!createdUser) {
      throw new NotFoundException(Ei18nCodes.T3E0003);
    }

    return createdUser;
  }

  async checkIsLoginExist(login: string) {
    return !!(await prisma.userProfileValue.findFirst({
      where: {
        profile_field: {
          key: 'login',
        },
        value: {
          equals: login,
        },
      },
      select: {
        id: true,
      },
    }));
  }

  async getAvailableLogins(givenName?: string, familyName?: string) {
    const generatedLogins = NicknameGenerator.generateMultipleLogins(givenName, familyName);

    // Let's check which logins are already taken.
    const loginObjects = (await prisma.$queryRaw`
      WITH existing_logins AS (
        SELECT upv.value #>> '{}' AS login
        FROM "UserProfileValue" upv
        JOIN "ProfileField" pf ON pf.id = upv.profile_field_id
        WHERE pf.key = 'login'
          AND upv.value #>> '{}' IN (${Prisma.join(generatedLogins)})
      )
      SELECT login FROM (
        SELECT unnest(ARRAY[${Prisma.join(generatedLogins)}]) AS login
      ) AS all_logins
      WHERE login NOT IN (SELECT login FROM existing_logins)
      LIMIT 7
    `) as { login: string }[];

    return loginObjects.map((loginObject) => loginObject.login);
  }

  async checkUniqueFieldAvailability(
    field_name: string,
    value: string,
    userId?: string,
    options?: { clientId?: string; organizationId?: string | null },
  ) {
    const explicitOrganizationId =
      options?.organizationId ??
      (options?.clientId ? await helpers.getOrganizationId(options.clientId) : undefined);
    const user =
      userId && explicitOrganizationId === undefined
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { org_id: true },
          })
        : null;
    const organizationId =
      explicitOrganizationId === undefined ? user?.org_id ?? null : explicitOrganizationId;
    return !(await prisma.userProfileValue.findFirst({
      where: {
        profile_field: {
          key: field_name,
          organization_id: organizationId,
        },
        value: {
          equals: value,
        },
        ...(userId
          ? {
              user_id: {
                not: userId,
              },
            }
          : {}),
      },
    }));
  }

  async checkFieldAvailability(
    field_name: string,
    value: string,
    userId?: string,
    options?: { clientId?: string; organizationId?: string | null },
  ) {
    const rule = await this.settingsService.getUserRuleByFieldName(field_name, options);

    if (!rule) {
      throw new BadRequestException(Ei18nCodes.T3E0094, { cause: field_name });
    }

    const normalizedValue = value?.trim?.() ?? value;
    const validation_errors: string[] = [];
    const defaultLocale = await getDefaultLocale();
    const targetLocale = I18nContext.current()?.lang || defaultLocale;

    if (normalizedValue !== undefined && normalizedValue !== '' && normalizedValue !== null) {
      rule.validations.forEach((validation) => {
        if (!validation.active) {
          return;
        }

        try {
          const regex = new RegExp(validation.regex);
          if (!regex.test(`${normalizedValue}`)) {
            validation_errors.push(
              resolveLocalizedText(validation.error, targetLocale, defaultLocale),
            );
          }
        } catch (error) {
          console.error('Invalid validation regex:', validation.regex, error);
        }
      });
    }

    return {
      available: rule.unique
        ? await this.checkUniqueFieldAvailability(field_name, normalizedValue, userId, options)
        : true,
      validation_errors,
    };
  }

  /**
   * Update user profile
   */
  async update(
    userId: string,
    body: userDto.UpdateUserDTO & {
      email_verified?: boolean;
      phone_number_verified?: boolean;
    },
    role?: UserRoles,
    actorUserId?: string,
    scopeOrganizationId?: string | null,
  ) {
    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, userId);
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);
    const passwordChangeRequired = body.password_change_required;

    role = role ? role : await this.roleRepo.findRoleInApp(userId, CLIENT_ID);
    if (role === UserRoles.TRUSTED_USER) throw new BadRequestException(Ei18nCodes.T3E0067);

    this.usersContactsService.assertAdminProfileContactMutationAllowed(role, body);

    const { email_verified = false, phone_number_verified = false, ...profileUpdateDto } = body;
    body = profileUpdateDto;

    let customFieldsToSave: { [key: string]: string | boolean | number } = body.custom_fields
      ? typeof body.custom_fields === 'string'
        ? JSON.parse(body.custom_fields)
        : body.custom_fields
      : undefined;

    if (customFieldsToSave)
      customFieldsToSave = await this.settingsService.prepareCustomFieldsToSave(
        customFieldsToSave,
        userId,
        role,
        false,
        {
          organizationId:
            scopeOrganizationId === undefined ? user.org_id ?? null : scopeOrganizationId,
        },
      );
    delete body.custom_fields;

    delete body.password_change_required;
    body = await this.settingsService.prepareGeneralProfileFields(body, userId, role, false, {
      scope: {
        organizationId:
          scopeOrganizationId === undefined ? user.org_id ?? null : scopeOrganizationId,
      },
    });

    const contactScope = {
      organizationId: scopeOrganizationId === undefined ? user.org_id ?? null : scopeOrganizationId,
    };

    await prisma.$transaction(async (tx) => {
      await this.usersContactsService.applyAdminProfileContactsUpdateTx(
        tx,
        user,
        {
          email: body.email,
          phone_number: body.phone_number,
          email_verified,
          phone_number_verified,
        },
        {
          email: {
            mode: 'primary',
            scope: contactScope,
          },
          phone: {
            mode: 'primary',
            scope: contactScope,
          },
        },
      );
      delete body.email;
      delete body.phone_number;

      const userUpdateData: Prisma.UserUpdateInput = {};
      const profileValuesToSave: Record<string, unknown> = {
        ...(customFieldsToSave || {}),
      };

      if (body['password']) {
        userUpdateData.hashed_password = await bcrypt.hash(body['password'], 10);
        userUpdateData.password_updated_at = new Date();
        delete body['password'];
      }

      if (passwordChangeRequired !== undefined) {
        userUpdateData.password_change_required = passwordChangeRequired;
      }

      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined) {
          profileValuesToSave[key] = value;
        }
      }

      if (Object.keys(userUpdateData).length) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      if (Object.keys(profileValuesToSave).length) {
        await upsertLegacyUserProfileValues(tx, userId, profileValuesToSave);
      }
    });

    return this.getById(userId);
  }

  async updateAvatar(
    userId: string,
    body: userDto.UpdateUserAvatarDTO,
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

    role = role ? role : await this.roleRepo.findRoleInApp(userId, CLIENT_ID);
    if (role === UserRoles.TRUSTED_USER) {
      throw new BadRequestException(Ei18nCodes.T3E0067);
    }

    if (body.picture === undefined) {
      return;
    }

    if (user.picture !== body.picture) {
      await helpers.deleteImageFromLocalPath(user.picture);
    }

    await upsertLegacyUserProfileValues(prisma, userId, {
      picture: body.picture,
    });
  }

  async bindAccount(user_id: string, provider: Provider | string, body: any) {
    const providerData =
      typeof provider === 'string'
        ? await prisma.provider.findUnique({
            where: { id: provider },
          })
        : provider;

    const providerService = this.providerFactory.getProviderService(providerData.type);
    const externalAccountParams = await providerService.onBindAccount(body, user_id);

    const existingExternalAccount = await this.findExistingExternalAccountForBinding(
      user_id,
      providerData,
      externalAccountParams,
    );

    if (existingExternalAccount && 'id' in existingExternalAccount) {
      const { user } = existingExternalAccount;
      if (user.id.toString() === user_id) {
        throw new BadRequestException(Ei18nCodes.T3E0005);
      }

      throw new BadRequestException(Ei18nCodes.T3E0006);
    }

    if (!externalAccountParams['avatar'] && providerData.avatar) {
      externalAccountParams['avatar'] = await helpers.duplicateProviderAvatarForExternalAccount(
        providerData.avatar,
      );
    }

    await prisma.externalAccount.create({
      data: {
        user_id,
        public: providerData.default_public,
        ...externalAccountParams,
      },
    });
  }

  async deleteExternalAccount(
    targetUserId: string,
    targetAccountId: string,
    userId: string,
    role?: UserRoles,
  ) {
    await this.assertCanManageTargetUser(userId, targetUserId);

    const account = await prisma.externalAccount.findUnique({
      where: { id: targetAccountId },
    });
    if (!account) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const { user_id, avatar } = account;

    if (user_id !== targetUserId) {
      throw new ForbiddenException(Ei18nCodes.T3E0067);
    }

    const user = await this.userRepo.findById(user_id);
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    if (user.picture !== avatar) {
      await helpers.deleteImageFromLocalPath(avatar);
    }

    const actorRole = role ?? (await this.roleRepo.findRoleInApp(userId, CLIENT_ID));

    await prisma.$transaction(async (tx) => {
      const contactDeletionHandled = await this.usersContactsService.deleteContactExternalAccountTx(
        tx,
        user,
        account,
        actorRole,
        user.org_id
          ? {
              scope: {
                clientId: user.org_id,
              },
            }
          : undefined,
      );

      if (contactDeletionHandled) {
        return;
      }

      await tx.externalAccount.delete({
        where: { id: targetAccountId },
      });
      await syncGuestsMembershipForUser(tx, user.id, CLIENT_ID);
    });
  }

  private normalizeDeletedUserRetentionDays(value: unknown) {
    const parsedValue = Number(value);

    if (Number.isInteger(parsedValue) && parsedValue >= -1) {
      return parsedValue;
    }

    throw new InternalServerErrorException('Invalid value for delete_profile_after_days setting');
  }

  private async getDeletedUserRetentionDays() {
    return this.normalizeDeletedUserRetentionDays(
      await this.settingsService.getSettingsByName<number>(
        ESettingsNames.delete_profile_after_days,
      ),
    );
  }

  private async isDeletedUserRestoreProhibited() {
    return Boolean(
      await this.settingsService.getSettingsByName<boolean>(
        ESettingsNames.prohibit_restore_deleted_users,
      ),
    );
  }

  private buildDeletedUserDeadline(retentionDays: number, baseDate = new Date()) {
    if (retentionDays === -1) {
      return new Date(NEVER_DELETE_USER_DEADLINE_ISO);
    }

    const deadline = new Date(baseDate);
    deadline.setDate(deadline.getDate() + retentionDays);
    return deadline;
  }

  private buildDeleteResult(params: {
    retentionDays: number;
    restoreAllowed: boolean;
    deletedAt?: Date | null;
  }) {
    const { retentionDays, restoreAllowed, deletedAt = null } = params;

    if (retentionDays === 0) {
      return {
        mode: 'deleted' as const,
        retention_days: 0,
        restore_allowed: false,
        deleted_at: deletedAt?.toISOString() || new Date().toISOString(),
        tokens_revoked: true,
        sessions_revoked: true,
      };
    }

    if (retentionDays === -1) {
      return {
        mode: 'archived' as const,
        retention_days: -1,
        restore_allowed: restoreAllowed,
        deleted_at: deletedAt?.toISOString() || null,
        tokens_revoked: true,
        sessions_revoked: true,
      };
    }

    return {
      mode: 'scheduled' as const,
      retention_days: retentionDays,
      restore_allowed: restoreAllowed,
      deleted_at: deletedAt?.toISOString() || null,
      tokens_revoked: true,
      sessions_revoked: true,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDeletedUsers() {
    const deleteProfileAfterDays = await this.getDeletedUserRetentionDays();
    if (deleteProfileAfterDays === -1) {
      return;
    }

    const deletedUsers = await prisma.user.findMany({
      where: {
        deleted:
          deleteProfileAfterDays === 0
            ? {
                not: null,
              }
            : {
                not: null,
                lt: new Date(),
              },
      },
      select: {
        id: true,
      },
    });

    if (!deletedUsers.length) {
      return;
    }

    await this.deleteHard(...deletedUsers.map((u) => u.id));
  }

  /**
   * Instantly delete a user
   */
  async deleteHard(...id: string[]) {
    const usersImgs = (
      await prisma.user.findMany({
        where: { id: { in: id } },
        include: legacyUserInclude,
      })
    )
      .map((user) => toLegacyUser(user))
      .filter((user): user is UserModel => Boolean(user));

    const clientsImgs = await prisma.client.findMany({
      where: {
        roles: {
          some: {
            user_id: { in: id },
            role: UserRoles.OWNER,
          },
        },
      },
      select: {
        avatar: true,
        cover: true,
        providers: {
          select: {
            avatar: true,
          },
        },
      },
    });

    const allImgs = [
      ...usersImgs.map((u) => u.picture),
      ...usersImgs.flatMap((u) => u.ExternalAccount?.map((ea) => ea.avatar)),
      ...clientsImgs.map((c) => c.avatar),
      ...clientsImgs.map((c) => c.cover),
      ...clientsImgs.flatMap((c) => c.providers?.map((p) => p.avatar)),
    ];

    await prisma.client.deleteMany({
      where: {
        roles: {
          some: {
            user_id: { in: id },
            role: UserRoles.OWNER,
          },
        },
      },
    });

    await this.clientService?.getWhiteList(true);

    await prisma.user.deleteMany({
      where: {
        id: { in: id },
      },
    });

    await helpers.deleteImageFromLocalPath(...allImgs);

    await this.logger.logEvent({
      ip_address: DOMAIN,
      device: 'BACKEND',
      user_id: id.toString(),
      client_id: CLIENT_ID,
      event: Actions.USER_DELETED_DB,
      description: '',
      details: {},
    });
  }

  /**
   * Delete a user
   */
  async delete(u_id: string, user_id: string, role: UserRoles, password?: string) {
    if (u_id !== user_id) {
      await this.assertCanManageTargetUser(u_id, user_id);
    }

    if (u_id === user_id) {
      if (!password) throw new BadRequestException(Ei18nCodes.T3E0007);

      await this.checkPassword(user_id, password);
    }

    const id = user_id;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          where: {
            client_id: CLIENT_ID,
          },
        },
      },
    });

    if (!user) return;

    if (user.roles[0]?.role === UserRoles.OWNER) throw new BadRequestException(Ei18nCodes.T3E0008);

    const clients = await prisma.role.findMany({
      where: {
        user_id: id,
        role: UserRoles.OWNER,
        client: {
          parent_id: { not: null },
        },
      },
      include: {
        client: true,
      },
    });

    if (clients.length) {
      const defaultLocale = await getDefaultLocale();
      throw new BadRequestException(Ei18nCodes.T3E0080, {
        cause: clients
          .map((c) => resolveLocalizedText(c.client.name, defaultLocale, defaultLocale))
          .join(', '),
      });
    }

    const deleteProfileAfterDays = await this.getDeletedUserRetentionDays();
    const restoreAllowed = !(await this.isDeletedUserRestoreProhibited());
    const shouldDeleteImmediately =
      role === UserRoles.OWNER || role === UserRoles.EDITOR || deleteProfileAfterDays === 0;

    // Administrators and zero-retention mode delete instantly
    if (shouldDeleteImmediately) {
      await this.redis.revokeAllTokensByUserId(id);
      await this.deleteHard(id);

      return this.buildDeleteResult({
        retentionDays: 0,
        restoreAllowed: false,
        deletedAt: new Date(),
      });
    }

    // Set deletion date
    const futureDate = this.buildDeletedUserDeadline(deleteProfileAfterDays);

    await prisma.user.update({
      where: { id: user_id },
      data: {
        deleted: futureDate,
      },
    });

    await this.redis.revokeAllTokensByUserId(id);

    return this.buildDeleteResult({
      retentionDays: deleteProfileAfterDays,
      restoreAllowed,
      deletedAt: futureDate,
    });
  }

  /**
   * Mark a user for deletion without hard delete
   */
  async markForDeletion(u_id: string, user_id: string, _role: UserRoles) {
    if (u_id !== user_id) {
      await this.assertCanManageTargetUser(u_id, user_id);
    }

    const id = user_id;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          where: {
            client_id: CLIENT_ID,
          },
        },
      },
    });

    if (!user) return null;

    if (user.roles[0]?.role === UserRoles.OWNER) {
      throw new BadRequestException(Ei18nCodes.T3E0008);
    }

    const clients = await prisma.role.findMany({
      where: {
        user_id: id,
        role: UserRoles.OWNER,
        client: {
          parent_id: { not: null },
        },
      },
      include: {
        client: true,
      },
    });

    if (clients.length) {
      const defaultLocale = await getDefaultLocale();
      throw new BadRequestException(Ei18nCodes.T3E0080, {
        cause: clients
          .map((c) => resolveLocalizedText(c.client.name, defaultLocale, defaultLocale))
          .join(', '),
      });
    }

    const deleteProfileAfterDays = await this.getDeletedUserRetentionDays();
    const futureDate = this.buildDeletedUserDeadline(deleteProfileAfterDays);

    await prisma.user.update({
      where: { id: user_id },
      data: {
        deleted: futureDate,
      },
    });

    await this.redis.revokeAllTokensByUserId(id);

    return futureDate;
  }

  /**
   * Restore a user with verification of user identifier and password
   * @param identifier
   * @param password
   */
  public async restoreProfile(identifier: string, password?: string, actorUserId?: string) {
    let user;

    if (actorUserId) {
      user = await prisma.user.findUnique({
        where: { id: identifier },
      });

      if (!user) {
        throw new ForbiddenException(Ei18nCodes.T3E0003);
      }
    } else {
      ({ user } = await this.settingsService.getUserByIdentifier(identifier, true));
    }

    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, user.id);
    }

    if (password && !(await bcrypt.compare(password, user.hashed_password))) {
      throw new ForbiddenException(Ei18nCodes.T3E0072);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        deleted: null,
      },
    });

    return this.userRepo.findById(user.id);
  }
  /**
   * Block a user
   */
  async block(user_id: string, actorUserId?: string) {
    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, user_id);
    }

    await prisma.role.update({
      where: {
        user_id_client_id: {
          user_id,
          client_id: CLIENT_ID,
        },
      },
      data: { blocked: true },
    });
  }

  /**
   * Unblock a user
   */
  async unblock(user_id: string, actorUserId?: string) {
    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, user_id);
    }

    await prisma.role.update({
      where: {
        user_id_client_id: {
          user_id,
          client_id: CLIENT_ID,
        },
      },
      data: { blocked: false },
    });
  }

  /**
   * Get all user roles in applications
   */
  async getRoles(user_id: string) {
    return prisma.role.findMany({
      where: {
        user_id: user_id,
        client_id: { not: CLIENT_ID },
      },
      select: {
        role: true,
        client: {
          select: {
            name: true,
            client_id: true,
            parent_id: true,
          },
        },
      },
    });
  }

  /**
   * Updating user role in the application
   */
  async setUserRoleInApp(user_id: string, client_id: string) {
    const globalRole = await prisma.role.findUnique({
      where: { user_id_client_id: { user_id: user_id, client_id: CLIENT_ID } },
    });

    await prisma.role.upsert({
      where: { user_id_client_id: { user_id: user_id, client_id } },
      update: {},
      create: {
        user_id: user_id,
        client_id,
        role: UserRoles.USER,
      },
    });
  }

  async getExternalAccounts(user_id: string): Promise<ExternalAccount[]> {
    return prisma.externalAccount.findMany({
      where: { user_id: user_id },
    });
  }

  /**
   * Retrieving public external accounts
   * If a role is specified, only accounts accessible to that role are returned.
   * If not specified, only public accounts are returned.
   */
  async getPublicExternalAccounts(
    user_id: string | UserModel,
    role?: UserRoles,
    actorUserId?: string,
    viewerClientId?: string,
  ) {
    // If user_id is a string, find user by id
    const user = typeof user_id === 'string' ? await this.userRepo.findById(user_id) : user_id;

    // If user not found, throw error
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const canManageAllAccounts =
      actorUserId !== undefined
        ? await canManageTargetUser(actorUserId, user.id, this.roleRepo)
        : false;
    const viewerClientRole =
      actorUserId && viewerClientId
        ? await this.roleRepo.findRoleInApp(actorUserId, viewerClientId)
        : undefined;
    const canViewRequestedPublicAccounts =
      viewerClientRole === UserRoles.OWNER || viewerClientRole === UserRoles.EDITOR;

    const externalAccounts = await prisma.externalAccount.findMany({
      where: {
        user_id: user.id,
        public: canManageAllAccounts
          ? undefined
          : canViewRequestedPublicAccounts
          ? { in: [1, 2] }
          : 2,
      },
      select: {
        id: true,
        sub: true,
        issuer: true,
        type: true,
        label: true,
        avatar: true,
        profile_link: true,
        public: true,
      },
    });

    return externalAccounts;
  }

  /**
   * Check the password for compliance with the rules
   * @param password Password to check
   */
  public async checkValidPassword(password: string, locale?: string) {
    const rules = await this.settingsService.getRulesValidations('password', true);
    const defaultLocale = await getDefaultLocale();
    const targetLocale = locale || I18nContext.current()?.lang || defaultLocale;
    for (const rule of rules) {
      const regex = new RegExp(rule.regex);
      if (!regex.test(password)) {
        throw new BadRequestException(
          resolveLocalizedText(rule.error, targetLocale, defaultLocale),
        );
      }
    }
  }

  async checkPassword(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!(await bcrypt.compare(password, user.hashed_password))) {
      throw new ForbiddenException(Ei18nCodes.T3E0072);
    }
  }

  /**
   * Changing user password
   */
  async changePassword(
    { password, old_password }: userDto.UpdatePassDTO,
    user_id: string,
    u_id?: string,
    locale?: string,
  ) {
    if (!user_id) throw new BadRequestException(Ei18nCodes.T3E0003);

    const hasActorUserId = Boolean(u_id);
    const isSelfPasswordChange = hasActorUserId && u_id === user_id;
    const isRecoveryPasswordChange = !hasActorUserId;

    if (hasActorUserId && !isSelfPasswordChange) {
      await this.assertCanManageTargetUser(u_id, user_id);
    }

    if (isSelfPasswordChange) {
      if (!old_password) throw new BadRequestException(Ei18nCodes.T3E0014);
      await this.checkPassword(user_id, old_password);
    }

    if (isRecoveryPasswordChange || isSelfPasswordChange) {
      await this.checkValidPassword(password, locale);
    }

    return prisma.user.update({
      where: { id: user_id },
      data: {
        hashed_password: await bcrypt.hash(password, 10),
        password_updated_at: new Date(),
        password_change_required: false,
      },
    });
  }

  async updateAccount(
    user_id: string,
    id: string,
    params: userDto.UpdateExternalAccountDTO,
    actorUserId?: string,
  ) {
    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, user_id);
    }

    const account = await prisma.externalAccount.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
      },
    });

    if (!account || account.user_id !== user_id) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    let data: Prisma.ExternalAccountUpdateInput = {};

    if (params.claim_privacy) {
      switch (params.claim_privacy) {
        case EClaimPrivacy.private:
          data.public = 0;
          break;
        case EClaimPrivacy.request:
          data.public = 1;
          break;
        case EClaimPrivacy.public:
          data.public = 2;
          break;
        default:
          break;
      }
    }

    await prisma.externalAccount.update({ where: { user_id: user_id, id }, data });
  }

  async setPrivateScopes(
    { claim_privacy, field }: userDto.SetPrivateScopesDTO,
    userId: string,
    actorUserId?: string,
  ) {
    if (actorUserId) {
      await this.assertCanManageTargetUser(actorUserId, userId);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { org_id: true },
    });
    // Check if field exists in profile list
    const normalizedFields = await this.settingsService.checkScopes(field, {
      organizationId: user?.org_id ?? null,
    });
    const fieldKeys = normalizedFields?.split(' ').filter(Boolean) || [];
    if (!fieldKeys.length) {
      return;
    }

    const profileFields = await prisma.profileField.findMany({
      where: {
        key: {
          in: fieldKeys,
        },
        OR:
          user?.org_id && user.org_id !== CLIENT_ID
            ? [
                { organization_id: null },
                { organization_id: CLIENT_ID },
                { organization_id: user.org_id },
              ]
            : [{ organization_id: null }, { organization_id: CLIENT_ID }],
      },
      select: {
        id: true,
      },
    });

    const publicValue =
      claim_privacy === EClaimPrivacy.public ? 2 : claim_privacy === EClaimPrivacy.request ? 1 : 0;

    await prisma.userProfileValue.updateMany({
      where: {
        user_id: userId,
        profile_field_id: {
          in: profileFields.map((field) => field.id),
        },
      },
      data: {
        public: publicValue,
      },
    });
  }

  async getPrivateScopes(user_id: string) {
    const user = await this.userRepo.findById(user_id);
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const scopesItem = await prisma.scopes.findUnique({
      where: {
        user_id_client_id: {
          user_id,
          client_id: CLIENT_ID,
        },
      },
      select: {
        scopes: true,
      },
    });

    return {
      public_profile_claims_oauth: user.public_profile_claims_oauth,
      public_profile_claims_gravatar: user.public_profile_claims_gravatar,
      scopes: scopesItem?.scopes || '',
    };
  }

  async changeUserPasswordByMail(email: string, password: string, locale?: string) {
    const user = await this.userRepo.findByIdentifier({
      identifier: email,
      identifierType: email.includes('@') ? IdentifierType.Email : IdentifierType.Login,
    });
    if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);

    await this.checkValidPassword(password, locale);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashed_password: await bcrypt.hash(password, 10),
        password_updated_at: new Date(),
      },
    });
  }

  //#region Public Profile
  /**
   * Return public profile information
   * @param user_id
   */
  async getPublicProfileByIdentifier(identifier: string) {
    if (!identifier) {
      throw new BadRequestException(Ei18nCodes.T3E0021);
    }

    const { user } = await this.settingsService.getUserByIdentifier(identifier);
    return this.generatePublicProfileInfo(user);
  }

  /**
   * Return public profile information
   * @param user_id
   */
  async getPublicProfileById(user_id: string) {
    const user = await this.userRepo.findById(user_id);
    return this.generatePublicProfileInfo(user);
  }

  async generatePublicProfileInfo(user: UserModel | null) {
    this.checkActiveUser(user);

    // Get external accounts
    const externalAccounts = await this.getPublicExternalAccounts(user.id);

    // Get scopes
    const claims = user.public_profile_claims_gravatar.split(' ') || [];

    // Form public fields according to scopes
    const userPub = claims.reduce<Partial<UserModel>>(
      (acc, item) => {
        // Skip 'id'
        if (item === 'id') return acc;
        if (item === 'email' && !user.email_verified) return acc;
        if (item === 'phone_number' && !user.phone_number_verified) return acc;
        // Add all other fields
        else if (user[item] && !user.profile_privacy) acc[item] = user[item];
        return acc;
      },
      {
        sub: user.sub,
        ExternalAccount: [],
      },
    );

    // Add custom_fields
    if (user.custom_fields && !user.profile_privacy) {
      const visibleSystemCustomFields = await prisma.profileField.findMany({
        where: {
          organization_id: CLIENT_ID,
        },
        select: {
          key: true,
        },
      });
      const visibleSystemCustomFieldKeys = new Set(
        visibleSystemCustomFields.map((field) => field.key),
      );

      userPub.custom_fields = claims.reduce((acc, item) => {
        if (visibleSystemCustomFieldKeys.has(item) && user.custom_fields[item]) {
          acc[item] = user.custom_fields[item];
        }
        return acc;
      }, {});
    }

    if (
      userPub.picture &&
      !userPub.picture.startsWith('http://') &&
      !userPub.picture.startsWith('https://')
    ) {
      userPub.picture = `${DOMAIN}/${userPub.picture}`;
    }

    if (!user.profile_privacy) userPub.ExternalAccount = externalAccounts as ExternalAccount[];

    return userPub;
  }

  /**
   * Obtaining a user's vCard
   */
  async getVCard(email: string) {
    const profile = await this.getPublicProfileByIdentifier(email);

    // Get all emails from ExternalAccount
    const emails: string[] =
      profile.ExternalAccount?.filter((account) => account.type === EProviderTypes.EMAIL).map(
        (account) => account.sub,
      ) || [];

    // Add an email from a profile if it is not in the ExternalAccount
    if (profile.email && !emails.includes(profile.email)) {
      emails.push(profile.email);
    }

    // Get all phones from ExternalAccount
    const phones: string[] =
      profile.ExternalAccount?.filter((account) => account.type === EProviderTypes.KLOUD).map(
        (account) => account.sub,
      ) || [];

    // Add a phone number from a profile if it is not in the ExternalAccount
    if (profile.phone_number && !phones.includes(profile.phone_number)) {
      phones.push(profile.phone_number);
    }

    // Generating vCard strings for phones and emails
    const phoneStrings = phones.map((phone) => `TEL:+${phone}`);
    const emailStrings = emails.map((email) => `EMAIL:${email}`);

    // Forming custom fields
    const customFieldsStrings: string[] = [];
    if (profile.custom_fields) {
      const customFields = await this.settingsService.getCustomFields();
      for (const [key, value] of Object.entries(profile.custom_fields)) {
        const field = customFields.find((field) => field.field === key);
        if (field && field.mapping_vcard) {
          customFieldsStrings.push(`${field.mapping_vcard}:${value}`);
        }
      }
    }

    // Forming a vCard
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.family_name || ''} ${profile.given_name || ''}`,
      `N:${profile.family_name || ''};${profile.given_name || ''};;;`,
      profile.birthdate ? `BDAY:${this.formatBirthdate(profile.birthdate)}` : '',
      profile.picture ? `PHOTO:${profile.picture}` : '',
      ...phoneStrings,
      ...emailStrings,
      ...customFieldsStrings,
      profile.nickname ? `NICKNAME:${profile.nickname}` : '',
      `UID:${profile.sub}`,
      `REV:${profile.updated_at ? profile.updated_at.toISOString() : new Date().toISOString()}`,
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Returns the date in YYYYMMDD format
   */
  private formatBirthdate(birthdate: Date | string) {
    const date = birthdate instanceof Date ? birthdate : new Date(birthdate);
    const year = date.getFullYear();
    // getMonth() returns a month from 0 to 11, so we add 1
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }
  //#endregion

  //#region Settings
  /**
   * Getting user settings
   */
  public async getSettings(user_id: string): Promise<userDto.SettingsDTO> {
    const user = await this.userRepo.findById(user_id);
    this.checkActiveUser(user);

    return {
      locale: user.locale as userDto.SettingsDTO['locale'],
      profile_privacy: user.profile_privacy,
    };
  }

  /**
   * Setting user preferences
   */
  public async setSettings(user_id: string, settings: userDto.SettingsDTO): Promise<void> {
    const user = await this.userRepo.findById(user_id);
    this.checkActiveUser(user);

    const data: Prisma.UserUpdateInput = {};

    // Updating profile privacy settings
    if (settings.profile_privacy !== undefined) {
      if (settings.profile_privacy !== user.profile_privacy) {
        data.profile_privacy = settings.profile_privacy;
      }
    }

    if (settings.locale !== undefined && settings.locale !== user.locale) {
      data.locale = settings.locale;
    }

    // Updating settings if there are changes
    if (Object.keys(data).length) {
      await prisma.user.update({
        where: { id: user.id },
        data,
      });
    }
  }
  //#endregion

  /**
   * Checking user activity
   */
  private checkActiveUser(user: UserModel | null) {
    // Checking for user existence
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    // Checking for deleted user
    if (user.deleted) {
      throw new BadRequestException(Ei18nCodes.T3E0023);
    }

    // Checking for blocked user
    if (user.blocked) {
      throw new BadRequestException(Ei18nCodes.T3E0024);
    }
  }

  /**
   * Adding a client to favorites
   */
  public async addFavoriteClients(user_id: string, client_id: string) {
    await prisma.favoriteClients.upsert({
      where: {
        user_id_client_id: { user_id: user_id, client_id },
        client: { catalog: true },
      },
      update: {},
      create: { user_id: user_id, client_id },
    });
  }

  /**
   * Removing an application from favorites
   */
  public async deleteFavoriteClients(user_id: string, client_id: string) {
    await prisma.favoriteClients.deleteMany({
      where: {
        user_id: user_id,
        client_id,
      },
    });
  }
}

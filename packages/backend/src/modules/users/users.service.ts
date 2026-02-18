import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExternalAccount, Prisma, User } from '@prisma/client';
import { JsonObject } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { app } from 'src/main';
import { NicknameGenerator } from 'src/utils/nickname-generator';
import { v4 as uuidv4 } from 'uuid';
import { CLIENT_ID, DELETE_PROFILE_AFTER_DAYS, DOMAIN } from '../../constants';
import {
  Actions,
  EClaimPrivacy,
  Ei18nCodes,
  EProviderTypes,
  RegistrationPolicyVariants,
  UserRoles,
} from '../../enums';
import * as helpers from '../../helpers';
import { InteractionRegDto } from '../interaction/interaction.dto';
import { findUserAndExternalAccount } from '../interaction/interaction.helpers';
import { CustomLogger } from '../logger';
import { OidcService } from '../oidc';
import { prisma } from '../prisma';
import { ProviderFactory } from '../providers';
import { REDIS_PREFIXES, RedisAdapter } from '../redis';
import { RoleRepository, UserModel, UserRepository } from '../repository';
import { SettingsService } from '../settings';
import * as userDto from './users.dto';

@Injectable()
export class UsersService {
  get providerFactory() {
    return app.get(ProviderFactory, { strict: false });
  }
  // User roles repository
  get roleRepo() {
    return app.get(RoleRepository, { strict: false });
  }
  // User settings service
  get settingsService() {
    return app.get(SettingsService, { strict: false });
  }
  get oidc() {
    return app.get(OidcService, { strict: false });
  }
  get userRepo() {
    return app.get(UserRepository, { strict: false });
  }

  get logger() {
    return app.get(CustomLogger, { strict: false });
  }

  addPhoneAdapter = new RedisAdapter(REDIS_PREFIXES.PhoneAddCode);

  public async getById(id: string) {
    return prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,

        email: true,
        email_public: true,
        email_verified: true,

        phone_number: true,
        phone_number_verified: true,

        nickname: true,
        login: true,
        family_name: true,
        given_name: true,

        birthdate: true,
        password_updated_at: true,
        password_change_required: true,
        picture: true,
        custom_fields: true,

        public_profile_claims_oauth: true,
        public_profile_claims_gravatar: true,
        profile_privacy: true,

        deleted: true,
        ExternalAccount: {
          select: {
            id: true,
            sub: true,
            label: true,
            rest_info: true,
            type: true,
            issuer: true,
            avatar: true,
            profile_link: true,
            public: true,
          },
        },
        Role: {
          where: { client_id: CLIENT_ID },
          select: {
            role: true,
            client_id: true,
          },
        },

        locale: true,
      },
    });
  }

  async create({
    createByOwner,
    org_id,
    password,
    ignoreFieldErrors = false,
    ...createUserDTO
  }: (userDto.CreateUserDTO | InteractionRegDto) & {
    createByOwner?: boolean;
    password: string;
    ignoreFieldErrors?: boolean;
    org_id?: string;
  }): Promise<User> {
    const {
      registration_policy,
      default_public_profile_claims_oauth,
      default_public_profile_claims_gravatar,
    } = await this.settingsService.getSettings();
    if (!createUserDTO.login) {
      createUserDTO.login = uuidv4();
    }

    if (registration_policy !== RegistrationPolicyVariants.allowed && !createByOwner)
      throw new ForbiddenException(Ei18nCodes.T3E0026);

    if (!createByOwner) await this.checkValidPassword(password);

    let customFieldsToSave: { [key: string]: string | boolean | number } =
      createUserDTO.custom_fields
        ? typeof createUserDTO.custom_fields === 'string'
          ? JSON.parse(createUserDTO.custom_fields)
          : createUserDTO.custom_fields
        : undefined;

    customFieldsToSave = await this.settingsService.prepareCustomFieldsToSave(
      customFieldsToSave,
      undefined,
      createByOwner ? UserRoles.OWNER : UserRoles.USER,
      ignoreFieldErrors,
    );
    delete createUserDTO.custom_fields;

    const bodySave = await this.settingsService.prepareGeneralProfileFields(
      createUserDTO,
      undefined,
      createByOwner ? UserRoles.OWNER : UserRoles.USER,
      ignoreFieldErrors,
    );

    const userFieldsCreatedByOwner = createByOwner
      ? {
          email_verified: bodySave.email ? true : undefined,
          email: bodySave.email,
          phone_number_verified: bodySave.phone_number ? true : undefined,
          phone_number: bodySave.phone_number,
        }
      : {};

    if ((bodySave.email || bodySave.phone_number) && !createByOwner) {
      throw new BadRequestException(Ei18nCodes.T3E0067, { cause: 'email, phone_number' });
    }

    let nickname = bodySave.nickname;
    if (!nickname) {
      nickname = NicknameGenerator.generateNickname(bodySave.given_name, bodySave.family_name);
    }

    let user: User;
    await prisma.$transaction(async () => {
      user = await prisma.user.create({
        data: {
          birthdate: bodySave.birthdate || new Date().toISOString(),
          nickname,
          family_name: bodySave.family_name,
          given_name: bodySave.given_name,
          hashed_password: password ? await bcrypt.hash(password, 10) : '',
          password_updated_at: new Date(),
          login: bodySave.login,
          data_processing_agreement: bodySave.data_processing_agreement,
          public_profile_claims_oauth: 'id ' + default_public_profile_claims_oauth,
          public_profile_claims_gravatar: default_public_profile_claims_gravatar.toString(),
          custom_fields: helpers.isEmpty(customFieldsToSave) ? Prisma.DbNull : customFieldsToSave,
          Scopes: {
            create: {
              scopes: '',
              client_id: CLIENT_ID,
            },
          },
          Role: {
            create: {
              role: UserRoles.USER,
              client_id: CLIENT_ID,
            },
          },
          ...userFieldsCreatedByOwner,
        },
      });

      if (org_id && org_id !== CLIENT_ID) {
        await prisma.role.create({
          data: {
            user_id: user.id,
            role: UserRoles.USER,
            client_id: org_id,
          },
        });
      }

      if (bodySave.email) {
        await this.changeEmail(bodySave.email, user, createByOwner ? UserRoles.OWNER : undefined);
      }
      if (bodySave.phone_number) {
        await this.changePhone(
          bodySave.phone_number,
          user,
          createByOwner ? UserRoles.OWNER : undefined,
        );
      }
    });

    return user;
  }

  async checkIsLoginExist(login: string) {
    return !!(await prisma.user.findUnique({
      where: { login },
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
        SELECT login FROM "User" WHERE login IN (${Prisma.join(generatedLogins)})
      )
      SELECT login FROM (
        SELECT unnest(ARRAY[${Prisma.join(generatedLogins)}]) AS login
      ) AS all_logins
      WHERE login NOT IN (SELECT login FROM existing_logins)
      LIMIT 7
    `) as { login: string }[];

    return loginObjects.map((loginObject) => loginObject.login);
  }

  async checkUniqueFieldAvailability(field_name: string, value: string) {
    return !(await prisma.user.findFirst({
      where: {
        custom_fields: {
          path: [field_name],
          equals: value,
        },
      },
    }));
  }

  /**
   * Update user profile
   */
  async update(userId: string, body: userDto.UpdateUserDTO, role?: UserRoles) {
    const id = parseInt(userId, 10);
    const user = await this.userRepo.findById(id);
    if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);

    role = role ? role : await this.roleRepo.findRoleInApp(userId, CLIENT_ID);
    if (role !== UserRoles.OWNER && role !== UserRoles.EDITOR) {
      if (body.email) throw new BadRequestException(Ei18nCodes.T3E0081);
      if (body.phone_number) throw new BadRequestException(Ei18nCodes.T3E0004);
    }

    let customFieldsToSave: { [key: string]: string | boolean | number } = body.custom_fields
      ? typeof body.custom_fields === 'string'
        ? JSON.parse(body.custom_fields)
        : body.custom_fields
      : undefined;

    if (customFieldsToSave)
      customFieldsToSave = await this.settingsService.prepareCustomFieldsToSave(
        customFieldsToSave,
        id,
        role,
      );
    delete body.custom_fields;

    body = await this.settingsService.prepareGeneralProfileFields(body, id, role);

    await prisma.$transaction(async () => {
      if (body.email || body.email === '' || body.email === null) {
        await this.changeEmail(body.email, user, role);
        delete body.email;
      }
      if (body.phone_number || body.phone_number === '' || body.phone_number === null) {
        await this.changePhone(body.phone_number, user, role);
        delete body.phone_number;
      }

      // Get current custom_fields values
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { custom_fields: true },
      });

      const updatedCustomFields = {
        ...(currentUser.custom_fields as JsonObject),
        ...customFieldsToSave,
      };

      if (body['password']) {
        body['hashed_password'] = await bcrypt.hash(body['password'], 10);
        body['password_updated_at'] = new Date();
        delete body['password'];
      }

      await prisma.user.update({
        where: { id },
        data: {
          ...body,
          custom_fields: customFieldsToSave ? updatedCustomFields : undefined,
        },
      });
    });
  }

  async updateAvatar(userId: string, body: userDto.UpdateUserAvatarDTO, role?: UserRoles) {
    const id = parseInt(userId, 10);
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    role = role ? role : await this.roleRepo.findRoleInApp(userId, CLIENT_ID);
    if (user.picture !== body.picture) {
      await helpers.deleteImageFromLocalPath(user.picture);
    }

    await prisma.user.update({
      where: { id },
      data: {
        picture: body.picture,
      },
    });
  }

  async bindAccount(user_id: string, type: string, body: any) {
    const providerService = this.providerFactory.getProviderService(type);
    const externalAccountParams = await providerService.onBindAccount(body, user_id);

    const { user, ...externalAccount } = await findUserAndExternalAccount(
      externalAccountParams.issuer,
      false,
      externalAccountParams.sub,
    );
    if (!helpers.isEmpty(externalAccount)) {
      if (user.id.toString() === user_id) {
        throw new BadRequestException(Ei18nCodes.T3E0005);
      }

      throw new BadRequestException(Ei18nCodes.T3E0006);
    }

    let publicLvl: number = 0;
    if (body['provider_id']) {
      const provider = await prisma.provider.findFirst({
        where: { id: parseInt(body['provider_id'], 10) },
      });
      publicLvl = provider.default_public;
    }

    const id = parseInt(user_id, 10);
    await prisma.user.update({
      where: { id },
      select: {
        ExternalAccount: {
          select: {
            id: true,
          },
          orderBy: {
            id: 'desc',
          },
          take: 1,
        },
      },
      data: {
        ExternalAccount: {
          create: {
            public: publicLvl,
            ...externalAccountParams,
          },
        },
      },
    });
  }

  async deleteExternalAccount(targetUserId: number, targetAccountId: number, userId: string) {
    const { user_id, sub, avatar, type } = await prisma.externalAccount.findUnique({
      where: { id: targetAccountId },
    });

    if (user_id !== targetUserId) {
      const roleInAdminApp = await this.roleRepo.findRoleInApp(targetUserId.toString(), CLIENT_ID);
      if (roleInAdminApp !== UserRoles.OWNER) throw new ForbiddenException(Ei18nCodes.T3E0067);
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });

    if (user.picture !== avatar) {
      await helpers.deleteImageFromLocalPath(avatar);
    }

    await prisma.user.update({
      where: { id: user_id },
      data: {
        phone_number: user.phone_number !== sub ? user.phone_number : null,
        phone_number_verified: user.phone_number !== sub ? user.phone_number_verified : false,
        email: user.email !== sub ? user.email : null,
        email_verified: user.email !== sub ? user.email_verified : false,
        ExternalAccount: {
          delete: { id: targetAccountId },
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDeletedUsers() {
    const deletedUsers = await prisma.user.findMany({
      where: {
        deleted: {
          not: null,
          lt: new Date(),
        },
      },
    });

    await this.deleteHard(...deletedUsers.map((u) => u.id));
  }

  /**
   * Instantly delete a user
   */
  async deleteHard(...id: number[]) {
    const usersImgs = await prisma.user.findMany({
      where: { id: { in: id } },
      select: {
        picture: true,
        ExternalAccount: {
          select: {
            avatar: true,
          },
        },
      },
    });

    const clientsImgs = await prisma.client.findMany({
      where: {
        Role: {
          some: {
            user_id: { in: id },
            role: UserRoles.OWNER,
          },
        },
      },
      select: {
        avatar: true,
        cover: true,
        Provider: {
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
      ...clientsImgs.flatMap((c) => c.Provider?.map((p) => p.avatar)),
    ];

    await prisma.client.deleteMany({
      where: {
        Role: {
          some: {
            user_id: { in: id },
            role: UserRoles.OWNER,
          },
        },
      },
    });

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
  async delete(u_id: string, user_id: string, token: string, role: UserRoles, password?: string) {
    if (u_id === user_id) {
      if (!password) throw new BadRequestException(Ei18nCodes.T3E0007);

      await this.checkPassword(user_id, password);
    }

    const id = parseInt(user_id, 10);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        Role: {
          where: {
            client_id: CLIENT_ID,
          },
        },
      },
    });

    if (!user) return;

    if (user.Role[0].role === UserRoles.OWNER) throw new BadRequestException(Ei18nCodes.T3E0008);

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
      throw new BadRequestException(Ei18nCodes.T3E0080, {
        cause: clients.map((c) => c.client.name).join(', '),
      });
    }

    // Administrators delete instantly
    if (role === UserRoles.OWNER || role === UserRoles.EDITOR) {
      return this.deleteHard(id);
    }

    // Set deletion date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + DELETE_PROFILE_AFTER_DAYS);

    await prisma.user.update({
      where: { id: parseInt(user_id, 10) },
      data: {
        deleted: futureDate,
      },
    });

    // Revoke token
    await this.oidc.tokenRevocation(token);
  }

  /**
   * Restore a user with verification of user identifier and password
   * @param identifier
   * @param password
   */
  public async restoreProfile(identifier: string, password?: string) {
    const { user } = await this.settingsService.getUserByIdentifier(identifier, true);

    if (password && !(await bcrypt.compare(password, user.hashed_password))) {
      throw new ForbiddenException(Ei18nCodes.T3E0072);
    }

    const updUser = await prisma.user.update({
      where: { id: parseInt(user.id.toString(), 10) },
      data: {
        deleted: null,
      },
    });

    return updUser;
  }
  /**
   * Block a user
   */
  async block(user_id: string) {
    const id = parseInt(user_id, 10);

    await prisma.user.update({
      where: { id },
      data: { blocked: true },
    });
  }

  /**
   * Unblock a user
   */
  async unblock(user_id: string) {
    const id = parseInt(user_id, 10);

    await prisma.user.updateMany({
      where: { id },
      data: { blocked: false },
    });
  }

  /**
   * Get all user roles in applications
   */
  async getRoles(user_id: string) {
    return prisma.role.findMany({
      where: {
        user_id: parseInt(user_id, 10),
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
      where: { user_id_client_id: { user_id: parseInt(user_id, 10), client_id: CLIENT_ID } },
    });

    await prisma.role.upsert({
      where: { user_id_client_id: { user_id: parseInt(user_id, 10), client_id } },
      update: {},
      create: {
        user_id: parseInt(user_id, 10),
        client_id,
        role: UserRoles.USER,
      },
    });
  }

  async getExternalAccounts(user_id: string): Promise<ExternalAccount[]> {
    return prisma.externalAccount.findMany({
      where: { user_id: parseInt(user_id, 10) },
    });
  }

  /**
   * Retrieving public external accounts
   * If a role is specified, only accounts accessible to that role are returned.
   * If not specified, only public accounts are returned.
   */
  async getPublicExternalAccounts(user_id: string | UserModel, role?: UserRoles) {
    // If user_id is a string, find user by id
    const user =
      typeof user_id === 'string' ? await this.userRepo.findById(parseInt(user_id, 10)) : user_id;

    // If user not found, throw error
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }

    const externalAccounts = await prisma.externalAccount.findMany({
      where: {
        user_id: user.id,
        public:
          role === UserRoles.EDITOR || role === UserRoles.OWNER
            ? undefined
            : role === UserRoles.ADMIN
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
  public async checkValidPassword(password: string) {
    const rules = await this.settingsService.getRulesValidations('password');
    for (const rule of rules) {
      const regex = new RegExp(rule.regex);
      if (!regex.test(password)) {
        throw new BadRequestException(rule.error);
      }
    }
  }

  async checkPassword(userId: number | string, password: string) {
    const id = typeof userId === 'string' ? parseInt(userId) : userId;

    const user = await prisma.user.findUnique({ where: { id } });

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
    u_id: string,
  ) {
    if (u_id === user_id) {
      if (!old_password) throw new BadRequestException(Ei18nCodes.T3E0014);

      await this.checkPassword(user_id, old_password);
      await this.checkValidPassword(password);
    }

    return prisma.user.update({
      where: { id: parseInt(user_id, 10) },
      data: {
        hashed_password: await bcrypt.hash(password, 10),
        password_updated_at: new Date(),
        password_change_required: false,
      },
    });
  }

  async updateAccount(user_id: string, id: number, params: userDto.UpdateExternalAccountDTO) {
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

    await prisma.externalAccount.update({ where: { user_id: parseInt(user_id), id }, data });
  }

  async setPrivateScopes({ claim_privacy, field }: userDto.SetPrivateScopesDTO, userId: string) {
    // Check if field exists in profile list
    await this.settingsService.checkScopes(field);

    const id = parseInt(userId, 10);

    const {
      public_profile_claims_oauth: currentPublicClaimsOauth,
      public_profile_claims_gravatar: currentPublicClaimsGravatar,
    } = await prisma.user.findUnique({
      where: { id },
    });

    const result = {
      public_profile_claims_oauth: currentPublicClaimsOauth.trim() || '',
      public_profile_claims_gravatar: currentPublicClaimsGravatar.trim() || '',
    };

    switch (claim_privacy) {
      case EClaimPrivacy.public:
        if (field) {
          field.split(' ').forEach((claim) => {
            if (!helpers.hasClaim(currentPublicClaimsOauth, claim)) {
              result.public_profile_claims_oauth += ' ' + claim;
            }
            if (!helpers.hasClaim(currentPublicClaimsGravatar, claim)) {
              result.public_profile_claims_gravatar += ' ' + claim;
            }
          });
        }
        break;
      case EClaimPrivacy.request:
        if (field) {
          field.split(' ').forEach((claim) => {
            if (helpers.hasClaim(currentPublicClaimsGravatar, claim))
              result.public_profile_claims_gravatar = helpers.deleteClaim(
                result.public_profile_claims_gravatar,
                claim,
              );
            if (!helpers.hasClaim(currentPublicClaimsOauth, claim)) {
              result.public_profile_claims_oauth += ' ' + claim;
            }
          });
        }
        break;
      case EClaimPrivacy.private:
        if (field) {
          field.split(' ').forEach((claim) => {
            if (helpers.hasClaim(currentPublicClaimsOauth, claim))
              result.public_profile_claims_oauth = helpers.deleteClaim(
                result.public_profile_claims_oauth,
                claim,
              );
            if (helpers.hasClaim(currentPublicClaimsGravatar, claim))
              result.public_profile_claims_gravatar = helpers.deleteClaim(
                result.public_profile_claims_gravatar,
                claim,
              );
          });
        }
        break;
      default:
        break;
    }

    await prisma.user.update({
      where: { id },
      data: { ...result },
    });
  }

  async getPrivateScopes(user_id: string) {
    const {
      Scopes: [{ scopes }],
      ...user
    } = await prisma.user.findUnique({
      where: {
        id: parseInt(user_id, 10),
      },
      select: {
        public_profile_claims_oauth: true,
        public_profile_claims_gravatar: true,
        Scopes: {
          where: {
            client_id: CLIENT_ID,
          },
          select: {
            scopes: true,
          },
        },
      },
    });

    return { ...user, scopes };
  }

  /**
   * Adding/Changing/Removing user email with removal of verification code.
   */
  async changeEmail(email: string, user_id: string | User, role?: UserRoles) {
    const rules = await this.settingsService.getRulesValidations('email');
    for (const rule of rules) {
      const regex = new RegExp(rule.regex);
      if (!regex.test(email)) {
        throw new BadRequestException(rule.error);
      }
    }
    await this.changePhoneOrEmail(EProviderTypes.EMAIL, email, user_id, role);
  }

  /**
   * Adding/Changing/Removing user phone with removal of verification code.
   * In this method, the code is not checked.
   */
  async changePhone(phone: string, user_id: string | User, role?: UserRoles) {
    const rules = await this.settingsService.getRulesValidations('phone_number');
    for (const rule of rules) {
      const regex = new RegExp(rule.regex);
      if (!regex.test(phone)) {
        throw new BadRequestException(rule.error);
      }
    }
    await this.changePhoneOrEmail(EProviderTypes.PHONE, phone, user_id, role);
  }

  private async changePhoneOrEmail(
    type: EProviderTypes.EMAIL | EProviderTypes.PHONE,
    value: string,
    user_id: string | User,
    role?: UserRoles,
  ) {
    value = value ? value.toLocaleLowerCase().trim() : value;
    const user = typeof user_id === 'string' ? await this.userRepo.findById(user_id) : user_id;
    if (!user) {
      throw new BadRequestException(Ei18nCodes.T3E0003);
    }
    role = role ? role : await this.roleRepo.findRoleInApp(user.id.toString(), CLIENT_ID);
    const rules = await this.settingsService.getProfileFields();

    const field_name = type === EProviderTypes.EMAIL ? 'email' : 'phone_number';

    const rule = rules.find((r) => r.field === field_name);
    if (!rule) {
      throw new BadRequestException(Ei18nCodes.T3E0016);
    }

    if (role !== UserRoles.OWNER && !rule.editable) {
      throw new BadRequestException(Ei18nCodes.T3E0017);
    }
    // Check if value is available
    if (
      value !== null &&
      (await prisma.externalAccount.findFirst({
        where: { sub: value, type, user_id: { not: user.id } },
      })) &&
      rule.unique
    ) {
      throw new BadRequestException(
        type === EProviderTypes.EMAIL ? Ei18nCodes.T3E0065 : Ei18nCodes.T3E0079,
      );
    }
    const data =
      type === EProviderTypes.EMAIL
        ? { email_verified: !!value, email: value }
        : { phone_number_verified: !!value, phone_number: value };

    const oldValue = type === EProviderTypes.EMAIL ? user.email : user.phone_number;
    if (
      oldValue === value &&
      (await prisma.externalAccount.findFirst({
        where: { sub: value, type, user_id: user.id },
      }))
    ) {
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...data,
        ExternalAccount: {
          deleteMany: oldValue ? { sub: oldValue, type } : undefined,
          create: value !== null ? { sub: value, type } : undefined,
        },
      },
    });
  }

  async changeUserPasswordByMail(email: string, password: string) {
    let user: User;
    if (!email.includes('@')) {
      user = await prisma.user.findUnique({ where: { login: email } });
      if (!user) throw new BadRequestException(Ei18nCodes.T3E0003);
    } else {
      const users = await prisma.user.findMany({
        where: { email },
      });

      if (users.length > 1) {
        throw new BadRequestException(Ei18nCodes.T3E0019);
      }

      user = users[0];
    }

    await this.checkValidPassword(password);
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

    // Find user by identifier
    const user = await this.userRepo.findByIdentifier({ identifier });
    return this.generatePublicProfileInfo(user);
  }

  /**
   * Return public profile information
   * @param user_id
   */
  async getPublicProfileById(user_id: string) {
    // Find user by id
    const user = await prisma.user.findUnique({
      where: { id: parseInt(user_id, 10) },
    });
    return this.generatePublicProfileInfo(user as UserModel);
  }

  async generatePublicProfileInfo(user: User) {
    this.checkActiveUser(user);

    // Get external accounts
    const externalAccounts = await this.getPublicExternalAccounts(user.id.toString());

    // Get scopes
    const claims = user.public_profile_claims_gravatar.split(' ') || [];

    // Form public fields according to scopes
    const userPub = claims.reduce<Partial<UserModel>>(
      (acc, item) => {
        // Skip 'id'
        if (item === 'id') return acc;
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
      userPub.custom_fields = claims.reduce((acc, item) => {
        if (user.custom_fields[item]) {
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
      `N:${profile.family_name || ''};${profile.given_name || ''};${profile.middle_name || ''};;`,
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
  private formatBirthdate(birthdate: Date) {
    const year = birthdate.getFullYear();
    // getMonth() returns a month from 0 to 11, so we add 1
    const month = (birthdate.getMonth() + 1).toString().padStart(2, '0');
    const day = birthdate.getDate().toString().padStart(2, '0');
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
  private checkActiveUser(user: User) {
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
        user_id_client_id: { user_id: parseInt(user_id), client_id },
        client: { catalog: true },
      },
      update: {},
      create: { user_id: parseInt(user_id), client_id },
    });
  }

  /**
   * Removing an application from favorites
   */
  public async deleteFavoriteClients(user_id: string, client_id: string) {
    await prisma.favoriteClients.deleteMany({
      where: {
        user_id: parseInt(user_id),
        client_id,
      },
    });
  }
}

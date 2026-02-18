import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client, Prisma, User } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CLIENT_ID } from 'src/constants';
import { app } from 'src/main';
import * as enums from '../../enums';
import { SortDirection } from '../../enums';
import { getIdentifierType } from '../../helpers';
import { prisma } from '../prisma';
import { NotificationAction } from '../providers/collection/email/email.types';
import { SettingsModel, UserModel, UserRepository } from '../repository';
import { UpdateUserDTO } from '../users/users.dto';
import * as dto from './settings.dto';

const listUnChangeableUserFields = [dto.UserProfileFields.sub, 'name'];

@Injectable()
export class SettingsService {
  private cache: Prisma.SettingsGetPayload<{ select: Prisma.SettingsSelect }>[] | null = null;
  constructor(private readonly userRepo: UserRepository) {}

  get i18nService() {
    return app.get(I18nService<Record<string, any>>, { strict: false });
  }

  /**
   * Returns service settings
   */
  public async getList() {
    return prisma.settings.findMany();
  }

  /**
   * Checks whether the user can log in
   */
  async canAuthorize(user: number | UserModel, client?: Client) {
    // If the user is an administrator, then skip
    //TODO: fix the hardcoded admin check
    const userId = typeof user === 'number' ? user : user.id;
    if (userId === 1) {
      return;
    }

    const userObj = typeof user === 'number' ? await this.userRepo.findById(user) : user;

    // Check for user existence
    if (!userObj) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0003);
    }

    // Check for user blocking
    if (userObj.blocked) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0024);
    }

    // Check for a ban on authorization for users
    const authorize_only_admins = await this.getSettingsByName<boolean>(
      dto.ESettingsNames.authorize_only_admins,
    );

    const role = await prisma.role.findFirst({ where: { user_id: userId, client_id: CLIENT_ID } });

    // If the setting is enabled, only main application admins can access
    if (
      authorize_only_admins &&
      role.role !== enums.UserRoles.EDITOR &&
      role.role !== enums.UserRoles.OWNER
    )
      throw new BadRequestException(enums.Ei18nCodes.T3E0026);

    if (client && client.authorize_only_admins) {
      const role = await prisma.role.findFirst({
        where: { user_id: userId, client_id: client.client_id },
      });

      if (!role || (role.role !== enums.UserRoles.EDITOR && role.role !== enums.UserRoles.OWNER)) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0026);
      }
    }

    if (client && client.authorize_only_employees) {
      const isEmployee = await prisma.role.findFirst({
        where: {
          user_id: userId,
          client_id: client.client_id,
        },
      });

      const invite = await prisma.clientInvitation.findFirst({
        where: {
          client_id: client.client_id,
          email: userObj.email,
        },
      });

      if (!isEmployee && !invite) throw new ForbiddenException(enums.Ei18nCodes.T3E0026);
    }
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
  public async getUserByIdentifier(identifier: string, checkIds = false) {
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

    if (identifierType === enums.IdentifierType.Email && !user.email_verified) {
      throw new ForbiddenException(enums.Ei18nCodes.T3E0070);
    }

    if (identifierType === enums.IdentifierType.PhoneNumber && !user.phone_number_verified) {
      throw new ForbiddenException(enums.Ei18nCodes.T3E0069);
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

    // Reset the cache
    this.cache = null;

    return Promise.all(updatePromises);
  }

  /**
   * Returns service settings
   */
  async getSettings(role?: enums.UserRoles) {
    if (!this.cache) {
      // Get settings from the repository if there is no cache
      this.cache = await this.getList();
    }

    return this.convertToOldVersion(
      ...this.cache.filter((s) => {
        if (role === enums.UserRoles.OWNER || role === enums.UserRoles.EDITOR) {
          return true;
        }

        return s.public;
      }),
    );
  }

  /**
   * Returns a service setting
   */
  async getSettingsByName<T = string>(name: string) {
    if (!this.cache) {
      // Get settings from the repository if there is no cache
      this.cache = await this.getList();
    }

    return this.cache.find((s) => s.name === name).value as T;
  }

  private convertToOldVersion(...values: SettingsModel[]): {
    [key: string]: string | number | boolean | object;
  } {
    return values.reduce((acc, item) => {
      acc[item.name] = item.value;
      return acc;
    }, {});
  }

  /**
   * Change Trusted settings
   */
  async changeSettings(params: dto.EditSettingsDto) {
    // Check for values ​​for claims
    await this.checkScopes(params.default_public_profile_claims_gravatar);
    await this.checkScopes(params.default_public_profile_claims_oauth);

    await this.checkLoginFields(params.allowed_login_fields);

    if (params.data_processing_agreement) {
      await prisma.user.updateMany({ data: { data_processing_agreement: false } });
    }

    // Convert settings
    const settings = Object.entries(params).map(([name, value]) => ({
      name: name as dto.ESettingsNames,
      value,
    }));

    // Update settings
    await this.updateSettings(...settings);
  }

  //#region email_templates
  async getEmailTemplates() {
    const i18n = await this.getSettingsByName<{ default_language: enums.ELocales }>(
      dto.ESettingsNames.i18n,
    );
    return prisma.emailTemplates.findMany({ where: { locale: i18n.default_language } });
  }

  async getEmailTemplate(action: NotificationAction, locale: enums.ELocales) {
    return prisma.emailTemplates.findFirst({
      where: { action, locale },
    });
  }

  async updateEmailTemplate(action: string, params: dto.UpdateEmailTemplateDto) {
    return prisma.emailTemplates.update({
      where: { action_locale: { action, locale: params.locale } },
      data: params,
    });
  }
  //#endregion

  async deleteLoginField(field: string) {
    const settings = await this.getSettings();
    const loginFields = `${settings[dto.ESettingsNames.allowed_login_fields]}`.split(' ');

    if (!loginFields.includes(field)) {
      return;
    }

    loginFields.splice(loginFields.indexOf(field), 1);

    // Check for remaining filled-in identifiers for the administrator
    const admin = await prisma.user.findFirst({
      where: {
        id: 1,
      },
    });

    const check = loginFields.find((field) => admin[field]);
    if (!check) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0040);
    }

    await this.changeSettings({
      allowed_login_fields: loginFields.join(' '),
    });
  }

  async addLoginField(field: string) {
    const settings = await this.getSettings();
    const loginFields = `${settings[dto.ESettingsNames.allowed_login_fields]}`.split(' ');

    if (loginFields.includes(field)) {
      return;
    }

    loginFields.push(field);

    await this.changeSettings({
      allowed_login_fields: loginFields.join(' '),
    });
  }

  /**
   * Change claims settings
   */
  async changeClaims(field_name: string, mode: enums.EClaimPrivacy) {
    const settings = await this.getSettings();
    const defaultOAuth = `${settings[dto.ESettingsNames.default_public_profile_claims_oauth]}`;
    const defaultGravatar = `${
      settings[dto.ESettingsNames.default_public_profile_claims_gravatar]
    }`;
    let listOauth = defaultOAuth.trim().split(' ');
    let listGravatar = defaultGravatar.trim().split(' ');

    switch (mode) {
      case enums.EClaimPrivacy.private:
        listGravatar = listGravatar.filter((claim) => claim !== field_name);
        listOauth = listOauth.filter((claim) => claim !== field_name);
        break;
      case enums.EClaimPrivacy.request: {
        listGravatar = listGravatar.filter((claim) => claim !== field_name);
        const ok = listOauth.find((claim) => claim === field_name);
        if (!ok) {
          listOauth.push(field_name);
        }
        break;
      }
      case enums.EClaimPrivacy.public: {
        const okGravatar = listGravatar.find((claim) => claim === field_name);
        if (!okGravatar) {
          listGravatar.push(field_name);
        }
        const okOauth = listOauth.find((claim) => claim === field_name);
        if (!okOauth) {
          listOauth.push(field_name);
        }
        break;
      }
      default:
        break;
    }

    await this.changeSettings({
      default_public_profile_claims_oauth: listOauth.join(' '),
      default_public_profile_claims_gravatar: listGravatar.join(' '),
    });
  }

  /**
   * Generate a list of profile fields. Add rules and settings.
   */
  private async prepareProfileFields(...values: dto.ProfileField[]) {
    const rules = await this.getAllRules(true);
    const settings = await this.getSettings();

    const listOauth = `${settings[dto.ESettingsNames.default_public_profile_claims_oauth]}`.split(
      ' ',
    );
    const listGravatar = `${
      settings[dto.ESettingsNames.default_public_profile_claims_gravatar]
    }`.split(' ');
    const listLoginFields = `${settings[dto.ESettingsNames.allowed_login_fields]}`.split(' ');

    return values.map((field) => {
      const rule = rules.find((r) => r.field_name === field.field);

      if (!rule) {
        throw new InternalServerErrorException(enums.Ei18nCodes.T3E0016, { cause: field.field });
      }

      let claim = enums.EClaimPrivacy.private;
      if (listGravatar.includes(field.field)) {
        claim = enums.EClaimPrivacy.public;
      } else if (listOauth.includes(field.field)) {
        claim = enums.EClaimPrivacy.request;
      }

      return {
        type: field.type,
        field: field.field,
        title: field.title,
        default: rule.default || undefined,
        required: rule.required,
        unique: rule.unique,
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
  async getProfileFields(name?: string) {
    const result: dto.ProfileField[] = [];

    const generalFields = await this.getGeneralFields();
    result.push(...generalFields);

    const customFields = await this.getCustomFields();
    const customFieldsDto: dto.CustomProfileField[] = customFields.map((field) => ({
      id: field.id,
      type: dto.ProfileFieldTypes.custom,
      field: field.field,
      title: field.title,
      mapping_vcard: field.mapping_vcard,
    }));
    result.push(...customFieldsDto);

    return this.prepareProfileFields(
      ...(name ? [result.find((field) => field.field === name)].filter(Boolean) : result),
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
      title: this.i18nService.t(field.title, { lang: locale.default_language }),
    }));

    return list;
  }

  //#region Profile Fields
  /**
   * Adding an additional profile field
   */
  async addProfileField(params: dto.CreateProfileFieldDto) {
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

      // Check for the presence of a field with the same name or title
      const field = await prisma.customField.findFirst({
        where: {
          OR: [{ field: params.field }, { title: params.title }],
        },
      });
      if (field) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0042);
      }

      if (params.required && !params.editable) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0043);
      }

      if (params.required && !params.active) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0044);
      }

      // Parameter checks
      if (params.default && params.unique) {
        throw new BadRequestException(enums.Ei18nCodes.T3E0045);
      }

      // Add a field
      await prisma.customField.create({
        data: {
          field: params.field,
          title: params.title,
          mapping_vcard: params.mapping_vcard,
        },
      });

      // Additional check: if the rule already exists in the system, then delete it
      await prisma.rule.deleteMany({
        where: { field_name: params.field, target: dto.TargetType.user },
      });

      // Add a rule
      await prisma.rule.create({
        data: {
          field_name: params.field,
          target: dto.TargetType.user,
          editable: params.editable,
          active: params.active,
          required: params.required,
          unique: params.unique,
          default: params.default,
        },
      });

      // Change claims
      await this.changeClaims(params.field, params.claim);

      // Add a field value to users if default is specified
      if (params.default) {
        const defaultValue = JSON.stringify(params.default);
        await prisma.$executeRawUnsafe(`
          UPDATE "User"
          SET custom_fields = jsonb_set(
           COALESCE(custom_fields, '{}'::jsonb),
           '{${params.field}}',
           '${defaultValue}'::jsonb
          );
        `);
      }
    });
  }

  /**
   * Updating profile field settings
   */
  public async updateProfileField(field_name: string, params: dto.UpdateProfileFieldDto) {
    // Check for the presence of the field through a rule, since for each Fields must have a rule
    const rule = await this.getUserRuleByFieldName(field_name);
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

    if (
      dto.listProfileFields.find(
        (field) => field.field === params.field || field.title === params.title,
      )
    ) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0049);
    }

    if (
      await prisma.customField.findFirst({
        where: {
          OR: [{ field: params.field }, { title: params.title }],
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
        // Check for duplicate emails in externalAccount
        const duplicates = await prisma.$queryRaw<{ email: string; occurrences: number }[]>`
  SELECT sub AS email, COUNT(*) AS occurrences
  FROM "ExternalAccount"
  WHERE sub IS NOT NULL AND type = 'EMAIL'
  GROUP BY sub
  HAVING COUNT(*) > 1;
`;
        if (duplicates.length > 0) {
          throw new BadRequestException(enums.Ei18nCodes.T3E0089, {
            cause: duplicates.map((d) => d.email).join(', '),
          });
        }
      } else if (!(await this.checkUniqueField(field_name)))
        throw new BadRequestException(enums.Ei18nCodes.T3E0089);
    }

    if ((params.required ?? rule.required) && !(params.editable ?? rule.editable)) {
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
      if (params.field || params.title || params.mapping_vcard) {
        const customField = await prisma.customField.findFirst({
          where: { field: field_name },
        });
        if (!customField) {
          throw new BadRequestException(enums.Ei18nCodes.T3E0046);
        }

        // Update a field
        await prisma.customField.update({
          where: { id: customField.id },
          data: {
            field: params.field,
            title: params.title,
            mapping_vcard: params.mapping_vcard,
          },
        });

        if (params.field !== undefined) {
          // Update a field name for users
          const updateQuery = `
            UPDATE "User"
            SET custom_fields = jsonb_set(
              custom_fields - '${customField.field}',
              '{${params.field}}',
              custom_fields->'${customField.field}'
              )
              WHERE custom_fields ? '${customField.field}';
              `;

          await prisma.$executeRawUnsafe(updateQuery);
        }
      }

      if (
        params.field !== undefined ||
        params.editable !== undefined ||
        params.required !== undefined ||
        params.unique !== undefined ||
        params.default !== undefined ||
        params.active !== undefined
      ) {
        await prisma.rule.update({
          where: { id: rule.id },
          data: {
            field_name: params.field,
            editable: params.editable,
            required: params.required,
            unique: params.unique,
            default: params.default,
            active: params.active,
          },
        });
      }

      if (params.claim) {
        await this.changeClaims(field_name, params.claim);
      }
    });
  }

  /**
   * Removing an additional profile field
   */
  public async deleteProfileField(field_name: string) {
    await prisma.$transaction(async (prisma) => {
      const field = await prisma.customField.findFirst({
        where: { field: field_name },
      });
      if (!field) {
        return;
      }

      // Remove from the claims list in settings
      await this.changeClaims(field_name, enums.EClaimPrivacy.private);

      // Remove the rule
      await prisma.rule.deleteMany({
        where: { field_name: field_name, target: dto.TargetType.user },
      });

      // Remove the field
      await prisma.customField.deleteMany({
        where: { field: field_name },
      });

      // Remove the field for users
      await prisma.$executeRawUnsafe(`
          UPDATE "User"
          SET custom_fields = custom_fields - '${field.field}'
          WHERE custom_fields ? '${field.field}';
          `);

      // Remove from claims in settings
      await this.changeClaims(field_name, enums.EClaimPrivacy.private);

      // Remove from claims for users
      await prisma.$executeRawUnsafe(`
        UPDATE "User"
        SET public_profile_claims_gravatar = (
          regexp_replace(
              public_profile_claims_gravatar,
              '(^|\\s)${field.field}(\\s|$)',
              '\\2',
              'g'
          )
        )
        WHERE public_profile_claims_gravatar IS NOT NULL;
      `);

      // Remove from claims for users
      await prisma.$executeRawUnsafe(`
          UPDATE "User"
          SET public_profile_claims_oauth = (
            regexp_replace(
              public_profile_claims_oauth,
              '(^|\\s)${field.field}(\\s|$)',
              '\\2',
              'g'
            )
          )
          WHERE public_profile_claims_oauth IS NOT NULL;
      `);
    });
  }

  async prepareGeneralProfileFields(
    body: UpdateUserDTO,
    user_id?: number,
    role?: enums.UserRoles,
    ignoreErrors = false,
  ): Promise<UpdateUserDTO> {
    const generalFields = (await this.getProfileFields()).filter(
      (field) =>
        field.type === dto.ProfileFieldTypes.general && field.field !== dto.UserProfileFields.sub,
    );

    const user = user_id ? await prisma.user.findUnique({ where: { id: user_id } }) : null;

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
        body[key] = body[key].toLowerCase();
      }

      // Check validations.
      if (body[key] !== undefined && body[key] !== '' && body[key] !== null) {
        const errors: string[] = [];
        field.validations.forEach((validation) => {
          if (validation.active) {
            const regex = new RegExp(validation.regex);
            if (!regex.test(`${body[key]}`)) {
              errors.push(validation.error);
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
      if (field.unique && body[key] !== null) {
        const ok = await prisma.user.findFirst({
          where: {
            [key]: body[key],
            id: {
              not: user_id,
            },
          },
        });

        if (ok) {
          if (ignoreErrors) {
            delete body[key];
            continue;
          }
          throw new BadRequestException(enums.Ei18nCodes.T3E0095, { cause: field.title });
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
  async getCustomFields() {
    return prisma.customField.findMany();
  }
  //#endregion

  //#region Rules
  /**
   * Getting a list of profile editing rules
   */
  public async getAllRules(widthSub: boolean = false) {
    const rules = await prisma.rule.findMany({
      include: {
        validations: {
          include: {
            rule_validation: true,
          },
        },
      },
    });

    const cf = await this.getCustomFields();
    const gf = await this.getGeneralFields();

    // Transform the data structure to extract the validations themselves.
    const rulesWithValidations = rules.map((rule) => ({
      ...rule,
      title:
        cf.find((f) => f.field === rule.field_name)?.title ||
        gf.find((f) => f.field === rule.field_name)?.title ||
        '',
      validations: rule.validations.map((rv) => rv.rule_validation),
    }));

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
  public async getUserRuleByFieldName(fieldName: string) {
    return prisma.rule.findFirst({
      where: {
        target: dto.TargetType.user,
        field_name: fieldName,
      },
    });
  }

  /**
   * Checking for unique values ​​for a field
   * Returns true if all values ​​for the fieldName field are unique for all users
   */
  private async checkUniqueField(fieldName: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<{ value: string; occurrences: number }[]>`
        WITH custom_fields_extracted AS (
          SELECT
            (jsonb_each_text(custom_fields)).* 
          FROM
            "User"
        )
        SELECT
          value,
          COUNT(*) AS occurrences
        FROM
          custom_fields_extracted
        WHERE
          key = ${fieldName}
        GROUP BY
          value
        HAVING
          COUNT(*) > 1;
      `;

      return result.length === 0;
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
  ): Promise<boolean> {
    const userCondition = userId
      ? typeof userId === 'string'
        ? `AND id != ${userId}`
        : `AND id != ${userId.id}`
      : '';

    // Search for users with this value in custom_fields, except for the current user if one exists.
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT
      COUNT(*) AS count
    FROM
      "User"
    WHERE
      custom_fields @> jsonb_build_object(${fieldName}, ${value})::jsonb
      ${Prisma.raw(userCondition)}
  `;
    return Number(result[0].count) === 0;
  }
  //#endregion

  /**
   * Preparing custom fields for saving
   */
  async prepareCustomFieldsToSave(
    customFields: { [key: string]: string | boolean | number },
    user_id?: number,
    role?: enums.UserRoles,
    ignoreErrors = false,
  ): Promise<{ [key: string]: string | boolean | number }> {
    const customFieldsToSave = customFields || {};
    const customFieldsWithDisabled = (await this.getProfileFields()).filter(
      (f) => f.type === dto.ProfileFieldTypes.custom,
    );
    const customFieldsDef = (await this.getProfileFields()).filter(
      (f) => f.type === dto.ProfileFieldTypes.custom && f.active,
    );
    const user = user_id ? await prisma.user.findUnique({ where: { id: user_id } }) : null;

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
        throw new BadRequestException(enums.Ei18nCodes.T3E0067, { cause: field.title });
      }

      // Check validations
      if (value !== undefined && value !== '' && value !== null) {
        const errors: string[] = [];
        field.validations.forEach((validation) => {
          if (validation.active) {
            const regex = new RegExp(validation.regex);
            if (!regex.test(`${value}`)) {
              errors.push(validation.error);
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
            cause: `${field.title}: ${errors.join(', ')}`,
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
      if (field.unique) {
        if (!(await this.checkUniqueValue(key, value, user))) {
          if (ignoreErrors) {
            // Ignore the error, delete, and continue
            delete customFieldsToSave[key];
            continue;
          }
          throw new BadRequestException(enums.Ei18nCodes.T3E0095, { cause: field.title });
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

  public async checkScopes(value: string) {
    if (!value) {
      return;
    }

    // Remove extra spaces from the beginning and end of the value
    value = value.trim();

    // Get a list of profile fields
    const fields = (await this.getProfileFields()).map((field) => field.field);

    const scopes = value.split(' ');
    const newScopes: string[] = [];
    for (const scope of scopes) {
      if (fields.find((f) => scope === f)) {
        newScopes.push(scope);
      }
    }
    value = newScopes.join(' ');
  }

  /**
   * Adding a validation to a rule
   */
  public async addRuleValidationToRule(field_name: string, validationId: number) {
    // Validation cannot be assigned to the birthday, picture, and fields
    if (
      [
        dto.UserProfileFields.birthdate,
        dto.UserProfileFields.picture,
        dto.UserProfileFields.data_processing_agreement,
      ].includes(field_name as dto.UserProfileFields)
    )
      throw new BadRequestException(enums.Ei18nCodes.T3E0026);

    const rule = await prisma.rule.findFirst({ where: { field_name } });
    if (!rule) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0016);
    }

    await prisma.ruleRuleValidation.create({
      data: {
        rule_id: rule.id,
        rule_validation_id: validationId,
      },
    });
  }

  /**
   * Removing a validation from a rule
   */
  public async deleteRuleValidationFromRule(field_name: string, validationId: number) {
    const rule = await prisma.rule.findFirst({ where: { field_name } });
    if (!rule) {
      throw new BadRequestException(enums.Ei18nCodes.T3E0016);
    }

    await prisma.ruleRuleValidation.delete({
      where: {
        rule_id_rule_validation_id: {
          rule_id: rule.id,
          rule_validation_id: validationId,
        },
      },
    });
  }

  /**
   * Getting a list of validations
   */
  public async getRulesValidations(field_name?: string) {
    if (field_name) {
      const ruleRule = await prisma.ruleRuleValidation.findMany({
        where: {
          rule: {
            field_name,
          },
        },
      });

      return prisma.ruleValidation.findMany({
        where: {
          id: {
            in: ruleRule.map((r) => r.rule_validation_id),
          },
        },
        orderBy: { title: SortDirection.ASC },
      });
    }

    return prisma.ruleValidation.findMany({
      orderBy: { title: SortDirection.ASC },
    });
  }

  /**
   * Creating a validation
   */
  public async addRuleValidation(data: Prisma.RuleValidationCreateInput) {
    return prisma.ruleValidation.create({
      data,
    });
  }

  /**
   * Updating a validation
   */
  public async updateRuleValidation(id: number, data: Prisma.RuleValidationUpdateInput) {
    return prisma.ruleValidation.update({
      where: { id },
      data,
    });
  }

  /**
   * Removing a validation
   */
  public async deleteRuleValidation(id: number) {
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
      data,
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
      data,
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

import * as common from '@nestjs/common';
import * as sw from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CLIENT_ID } from 'src/constants';
import { Scope } from 'src/decorators';
import { UserId } from '../../decorators/userId.decorator';
import { Actions, Ei18nCodes, EProviderTypes } from 'src/enums';
import { CustomLogger } from '../logger';
import { prisma } from '../prisma';
import { EmailService } from '../providers/collection/email/email.service';
import { PhoneService } from '../providers/collection/phone/phone.service';
import { ConfirmPhoneNumberDTO } from '../providers/collection/phone/phone.dto';
import { LegacyUserModel, legacyUserInclude, toLegacyUser } from '../repository/user-compat';
import { getLegacyUserRecoveryEmail } from '../repository/user-search';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import { UsersContactsService } from './users-contacts.service';
import * as userDto from './users.dto';
import { UsersActions } from './users.roles';
import { UsersService } from './users.service';
import { toUserProfileResponse } from './user-visibility';

const getDefinedKeys = <T extends object>(payload: T) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);

@common.Controller('v1/profile')
@sw.ApiBearerAuth()
export class ProfileController {
  constructor(
    private readonly mailService: EmailService,
    private readonly phoneService: PhoneService,
    private readonly userService: UsersService,
    private readonly usersContactsService: UsersContactsService,
    readonly redis: RedisAdapter,
    private readonly logger: CustomLogger,
  ) {}

  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  loggedUsersTokens = new RedisAdapter(REDIS_PREFIXES.LoggedUserToken);

  private async logProfileEvent(
    req: Request,
    userId: string | null | undefined,
    event: Actions,
    details: object,
  ) {
    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event,
      description: '',
      details,
    });
  }

  private hasConfirmedPhone(user: LegacyUserModel | null, phoneNumber: string) {
    if (!user?.ExternalAccount?.length) {
      return false;
    }

    return user.ExternalAccount.some(
      (account) =>
        [EProviderTypes.PHONE, EProviderTypes.KLOUD].includes(account.type as EProviderTypes) &&
        account.sub === phoneNumber,
    );
  }

  //#region Public Profile
  @common.Get('')
  @sw.ApiOperation({ summary: 'Get public profile' })
  async getProfilePreview(@common.Query() { email }: userDto.EmailDTO) {
    return this.userService.getPublicProfileByIdentifier(email);
  }

  @common.Get('vcard')
  @sw.ApiOperation({ summary: 'Get a vCard in .vcf format' })
  @common.UseGuards(ThrottlerGuard)
  async getVCard(@common.Query() { email }: userDto.EmailDTO, @common.Res() res: Response) {
    const vCard = await this.userService.getVCard(email);
    res.setHeader('Content-Type', 'text/vcard');
    res.send(vCard);
  }
  //#endregion

  //#region Settings
  @common.Get('settings')
  @sw.ApiOperation({ summary: 'Get user settings' })
  @Scope(UsersActions.profile)
  async getSettings(@UserId() user_id: string) {
    return this.userService.getSettings(user_id);
  }

  @common.Put('settings')
  @sw.ApiOperation({ summary: 'Change user settings' })
  @Scope(UsersActions.profile)
  async changeSettings(
    @UserId() user_id: string,
    @common.Body() settings: userDto.SettingsDTO,
    @common.Req() req: Request,
  ) {
    await this.userService.setSettings(user_id, settings);

    await this.logProfileEvent(req, user_id, Actions.USER_UPDATE, {
      target: user_id,
      action: 'profile_settings_updated',
      changed_fields: getDefinedKeys(settings),
    });
  }
  //#endregion

  @common.Put('phone_number')
  @sw.ApiOkResponse()
  @sw.ApiOperation({
    summary: 'Confirm a phone number for your profile or add it as an additional contact',
  })
  @Scope(UsersActions.changePhone)
  async changePhoneNumber(
    @common.Body() { code, phone_number }: ConfirmPhoneNumberDTO,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new common.BadRequestException(Ei18nCodes.T3E0003);
    }

    if (this.hasConfirmedPhone(user, phone_number)) {
      throw new common.BadRequestException(Ei18nCodes.T3E0079);
    }

    const providerContext = await this.phoneService.confirmWithContext(phone_number, code);
    await this.usersContactsService.changePhone(phone_number, userId, undefined, {
      scope: {
        clientId: CLIENT_ID,
      },
      providerContext,
    });

    await this.logProfileEvent(req, userId, Actions.USER_UPDATE, {
      target: userId,
      action: 'profile_phone_changed',
    });
  }

  @common.Put('email')
  @sw.ApiOperation({
    summary: 'Confirm an email for your profile or add it as an additional contact',
  })
  @Scope(UsersActions.changeEmail)
  async changeUserEmail(
    @common.Body()
    { email, code }: userDto.ConfirmEmailDTO,
    @UserId() user_id: string,
    @common.Req() req: Request,
  ) {
    const providerContext = await this.mailService.confirmWithContext(email, code);
    await this.usersContactsService.changeEmail(email, user_id, undefined, {
      scope: {
        clientId: CLIENT_ID,
      },
      providerContext,
    });

    await this.logProfileEvent(req, user_id, Actions.USER_UPDATE, {
      target: user_id,
      action: 'profile_email_changed',
    });
  }

  @common.Put('recover_password')
  @sw.ApiOperation({ summary: 'Recover your password using the code sent to your email' })
  async recoverPassword(
    @common.Body() { identifier, code, password }: userDto.RecoverPasswordDTO,
    @common.Req() req: Request,
  ) {
    let login: string;
    if (!identifier.includes('@')) {
      const user = toLegacyUser(
        await prisma.user.findFirst({
          where: {
            profile_values: {
              some: {
                profile_field: {
                  key: 'login',
                },
                value: {
                  equals: identifier,
                },
              },
            },
          },
          include: legacyUserInclude,
        }),
      );
      if (!user) throw new common.BadRequestException(Ei18nCodes.T3E0003);
      login = identifier;
      const recoveryEmail = getLegacyUserRecoveryEmail(user);
      if (!recoveryEmail) throw new common.BadRequestException(Ei18nCodes.T3E0057);
      identifier = recoveryEmail;
    }
    await this.mailService.checkCode(identifier, code);
    await this.userService.changeUserPasswordByMail(login || identifier, password, req.headers['x-lang'] as string);

    await this.logProfileEvent(req, null, Actions.USER_PASSWORD_CHANGE, {
      action: 'profile_password_recovered',
      identifier_type: login ? 'login' : 'email',
    });
  }

  @common.Post('contacts/:contact_id/make-primary')
  @sw.ApiOperation({ summary: 'Make one of your confirmed contacts primary' })
  @Scope(UsersActions.profile)
  async makePrimaryContact(
    @common.Param('contact_id') contactId: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const user = await this.usersContactsService.setPrimaryContact(userId, contactId);

    await this.logProfileEvent(req, userId, Actions.USER_UPDATE, {
      target: userId,
      action: 'profile_primary_contact_updated',
      contact_id: contactId,
    });

    return toUserProfileResponse(user);
  }

  //#region external_accounts
  @common.Get('external_accounts')
  @sw.ApiOperation({ summary: 'Get external user accounts' })
  @Scope(UsersActions.externalAccounts)
  async getExternalAccounts(@UserId() user_id: string) {
    return this.userService.getExternalAccounts(user_id);
  }

  @common.Post('external_accounts/:provider_id')
  @sw.ApiOperation({ summary: 'Link an external account to a user profile' })
  @Scope(UsersActions.externalAccounts)
  async bindAccount(
    @common.Param('provider_id') providerId: string,
    @common.Body() body: any,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.userService.bindAccount(userId, providerId, body);

    await this.logProfileEvent(req, userId, Actions.USER_UPDATE, {
      target: userId,
      action: 'profile_external_account_linked',
      provider_id: providerId,
    });

    return result;
  }

  //#endregion
}

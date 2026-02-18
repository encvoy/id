import * as common from '@nestjs/common';
import * as sw from '@nestjs/swagger/dist';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { Scope } from 'src/decorators';
import { UserId } from '../../decorators/userId.decorator';
import { prisma } from '../prisma';
import { EmailService } from '../providers/collection/email/email.service';
import { PhoneService } from '../providers/collection/phone';
import { ConfirmPhoneNumberDTO } from '../providers/collection/phone/phone.dto';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import * as userDto from './users.dto';
import { UsersActions } from './users.roles';
import { UsersService } from './users.service';
import { Ei18nCodes } from 'src/enums';

@common.Controller('v1/profile')
@sw.ApiBasicAuth()
@sw.ApiBearerAuth()
export class ProfileController {
  constructor(
    private readonly mailService: EmailService,
    private readonly phoneService: PhoneService,
    private readonly userService: UsersService,
    readonly redis: RedisAdapter,
  ) {}

  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  loggedUsersTokens = new RedisAdapter(REDIS_PREFIXES.LoggedUserToken);

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
  async changeSettings(@UserId() user_id: string, @common.Body() settings: userDto.SettingsDTO) {
    await this.userService.setSettings(user_id, settings);
  }
  //#endregion

  @common.Put('phone_number')
  @sw.ApiOkResponse()
  @sw.ApiOperation({ summary: 'Change your phone number using the code sent to your phone' })
  @Scope(UsersActions.changePhone)
  async changePhoneNumber(
    @common.Body() { code, phone_number }: ConfirmPhoneNumberDTO,
    @UserId() userId: string,
  ) {
    await this.phoneService.confirm(phone_number, code);
    await this.userService.changePhone(phone_number, userId);
  }

  @common.Put('email')
  @sw.ApiOperation({ summary: 'Change your email using the code sent to your email' })
  @Scope(UsersActions.changeEmail)
  async changeUserEmail(
    @common.Body()
    { email, code }: userDto.ConfirmEmailDTO,
    @UserId() user_id: string,
  ) {
    await this.mailService.confirm(email, code);
    await this.userService.changeEmail(email, user_id);
  }

  @common.Put('recover_password')
  @sw.ApiOperation({ summary: 'Recover your password using the code sent to your email' })
  async recoverPassword(@common.Body() { identifier, code, password }: userDto.RecoverPasswordDTO) {
    let login: string;
    if (!identifier.includes('@')) {
      const user = await prisma.user.findUnique({ where: { login: identifier } });
      if (!user) throw new common.BadRequestException(Ei18nCodes.T3E0003);
      login = identifier;
      identifier = user.email;
    }
    await this.mailService.checkCode(identifier, code);
    await this.userService.changeUserPasswordByMail(login || identifier, password);
  }

  //#region external_accounts
  @common.Get('external_accounts')
  @sw.ApiOperation({ summary: 'Get external user accounts' })
  @Scope(UsersActions.externalAccounts)
  async getExternalAccounts(@UserId() user_id: string) {
    return this.userService.getExternalAccounts(user_id);
  }

  @common.Post('external_accounts')
  @sw.ApiOperation({ summary: 'Link an external account to a user profile' })
  @Scope(UsersActions.externalAccounts)
  async bindAccount(
    @common.Query('type') type: string,
    @common.Body() body: any,
    @UserId() userId: string,
  ) {
    return this.userService.bindAccount(userId, type, body);
  }

  //#endregion
}

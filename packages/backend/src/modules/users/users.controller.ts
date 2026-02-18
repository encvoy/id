import * as common from '@nestjs/common';
import * as sw from '@nestjs/swagger/dist';
import { ThrottlerGuard } from '@nestjs/throttler';
import Cookies from 'cookies';
import { Request, Response } from 'express';
import { BasicAuth, Scope } from 'src/decorators';
import { FilesInterceptor } from 'src/middlewares';
import { Role } from '../../decorators/role.decorator';
import { UserId } from '../../decorators/userId.decorator';
import { Actions, Ei18nCodes, UserRoles } from '../../enums';
import { updateLoggedUserSession } from '../interaction/interaction.helpers';
import { CustomLogger } from '../logger/logger.service';
import { EmailService } from '../providers/collection/email/email.service';
import { NotificationAction } from '../providers/collection/email/email.types';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import * as userDto from './users.dto';
import { UsersActions } from './users.roles';
import { UsersService } from './users.service';
import path from 'path';
import { CLIENT_ID } from 'src/constants';

@common.Controller('v1')
@sw.ApiBasicAuth()
@sw.ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly mailService: EmailService,
    private readonly userService: UsersService,
    readonly redis: RedisAdapter,
    private readonly logger: CustomLogger,
  ) {}

  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  loggedUsersTokens = new RedisAdapter(REDIS_PREFIXES.LoggedUserToken);

  @common.Post('users')
  @sw.ApiOperation({ summary: 'Creating a new user' })
  @BasicAuth()
  async createUser(
    @common.Req() req: Request,
    @common.Body() createUserDTO: userDto.CreateUserDTO,
    @Role() role: UserRoles,
    @UserId() userId?: string,
  ) {
    const user = await this.userService.create({
      ...createUserDTO,
      createByOwner: role === UserRoles.OWNER || role === UserRoles.EDITOR,
    });

    if ((role === UserRoles.OWNER || role === UserRoles.EDITOR) && createUserDTO.email) {
      try {
        await this.mailService.sendMail(user.email, {
          action: NotificationAction.account_create,
          password: createUserDTO.password,
          user_id: user.id.toString(),
        });
      } catch (e) {
        const error = e as Error;
        this.logger.warn({ description: error.message }, 'WARNING');
      }
    }

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.USER_CREATE,
      description: '',
      details: { target: user.id },
    });

    return { id: user.id, nickname: user.nickname };
  }

  @common.Get('users/me')
  @sw.ApiOperation({ summary: 'Getting your user profile' })
  @Scope(UsersActions.profile)
  async getById(@UserId() id: string) {
    return this.userService.getById(id);
  }

  @common.Get('users/is-login-available')
  @sw.ApiOperation({ summary: 'Checking the availability of the login for selection' })
  @sw.ApiOkResponse()
  async checkIsLoginAvailable(
    @common.Query()
    { login }: { login: string },
  ) {
    return this.userService.checkIsLoginExist(login);
  }

  @common.Get('users/available-logins')
  @sw.ApiOperation({ summary: 'Getting available logins by first name, last name, and birthday' })
  @sw.ApiOkResponse()
  async getAvailableLogins(
    @common.Query()
    { given_name, family_name }: userDto.AvailableLoginsDto,
  ) {
    return this.userService.getAvailableLogins(given_name, family_name);
  }

  @common.Get('users/check-unique-field-availability')
  @sw.ApiOperation({ summary: 'Checking the availability of a unique field' })
  @sw.ApiOkResponse()
  @common.UseGuards(ThrottlerGuard)
  async checkUniqueFieldAvailability(
    @common.Query()
    { field_name, value }: userDto.CheckUniqueFieldAvailabilityDto,
  ) {
    return this.userService.checkUniqueFieldAvailability(field_name, value);
  }

  @common.Put('users/:user_id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Editing a user profile' })
  @Scope(UsersActions.update)
  async update(
    @common.Body() updateUserDTO: userDto.UpdateUserDTO,
    @common.Req() req: Request,
    @common.Param('user_id') user_id: string,
    @UserId() userId: string,
    @Role() role: UserRoles,
  ) {
    await this.userService.update(user_id, updateUserDTO, role);
    await updateLoggedUserSession(
      req,
      { id: parseInt(user_id, 10), ...updateUserDTO },
      this.loggedUsersInfo,
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.USER_UPDATE,
      description: '',
      details: { target: user_id, params: updateUserDTO },
    });
  }

  @common.Put('users/:user_id/avatar')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Updating a user avatar' })
  @Scope(UsersActions.update)
  @sw.ApiConsumes('multipart/form-data')
  @common.UseInterceptors(FilesInterceptor('public/images/profile', { fieldName: 'picture' }))
  async updateAvatar(
    @common.Body() updateUserDTO: userDto.UpdateUserAvatarDTO,
    @common.Req() req: Request,
    @common.Param('user_id') userId: string,
    @Role() role: UserRoles,
    @common.UploadedFiles()
    files: { picture?: Express.Multer.File[] },
  ) {
    if (files && files.picture) {
      updateUserDTO.picture = files.picture[0].path.replaceAll(path.sep, path.posix.sep);
    }

    await this.userService.updateAvatar(userId, updateUserDTO, role);
    await updateLoggedUserSession(
      req,
      { id: parseInt(userId, 10), ...updateUserDTO },
      this.loggedUsersInfo,
    );
  }

  @common.Delete('users/:user_id')
  @sw.ApiOperation({ summary: 'Delete user profile' })
  @Scope(UsersActions.delete)
  async delete(
    @common.Param('user_id') user_id: string,
    @common.Body() updateUserDTO: userDto.CheckPassDTO,
    @Role() role: UserRoles,
    @UserId() userId: string,
    @common.Req() req: Request,
    @common.Res() res: Response,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.userService.delete(userId, user_id, token, role, updateUserDTO.password);

    const cookie = new Cookies(req, res);
    await this.redis.deleteLoggedSessionsByUserId(user_id, cookie);

    if (userId === user_id) {
      const cookiesToClear = [
        'refreshToken',
        '_session',
        '_session.legacy',
        '_session.legacy.sig',
        '_session.sig',
      ];

      cookiesToClear.forEach((cookieName) => {
        res.cookie(cookieName, '', {
          httpOnly: true,
          secure: true,
          path: '/',
          expires: new Date(0),
        });
      });
    }

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.USER_DELETE,
      description: '',
      details: { target: user_id },
    });

    return res.status(common.HttpStatus.NO_CONTENT).send();
  }

  @common.Put('users/:user_id/restore')
  @sw.ApiOperation({ summary: 'Restoring a deleted profile' })
  @Scope(UsersActions.restore)
  async restoreProfile(@common.Req() req: Request, @common.Param('user_id') user_id: string) {
    await this.userService.restoreProfile(user_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: user_id,
      client_id: CLIENT_ID,
      event: Actions.USER_RESTORE,
      description: '',
      details: {},
    });
  }

  @common.Put('users/:user_id/block')
  @sw.ApiOperation({ summary: 'Blocking a user' })
  @Scope(UsersActions.block)
  async block(
    @common.Req() req: Request,
    @common.Param('user_id') user_id: string,
    @UserId() u_id: string,
  ) {
    if (user_id === u_id) {
      throw new common.BadRequestException(Ei18nCodes.T3E0022);
    }
    await this.userService.block(user_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: u_id,
      client_id: CLIENT_ID,
      event: Actions.USER_BLOCK,
      description: '',
      details: { target: user_id },
    });
  }

  @common.Put('users/:user_id/unblock')
  @sw.ApiOperation({ summary: 'Unblocking a user' })
  @Scope(UsersActions.unblock)
  async unblock(
    @common.Req() req: Request,
    @common.Param('user_id') user_id: string,
    @UserId() u_id: string,
  ) {
    if (user_id === u_id) {
      throw new common.BadRequestException(Ei18nCodes.T3E0022);
    }
    await this.userService.unblock(user_id);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: u_id,
      client_id: CLIENT_ID,
      event: Actions.USER_UNBLOCK,
      description: '',
      details: { target: user_id },
    });
  }

  //#region Roles
  @common.Get('users/:user_id/roles')
  @sw.ApiOperation({ summary: 'Getting all user roles' })
  @Scope(UsersActions.getAllRoles)
  async getRoles(@common.Param('user_id') user_id: string) {
    return this.userService.getRoles(user_id);
  }
  //#endregion

  @common.Put('users/:user_id/password')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @sw.ApiOperation({ summary: 'Change password' })
  @sw.ApiConsumes('application/x-www-form-urlencoded')
  @Scope(UsersActions.changePassword)
  @common.UseGuards(ThrottlerGuard)
  async changePassword(
    @common.Body() params: userDto.UpdatePassDTO,
    @common.Param('user_id') user_id: string,
    @UserId() u_id: string,
    @common.Req() req: Request,
    @common.Res() res: Response,
  ) {
    const user = await this.userService.changePassword(params, user_id, u_id);

    const cookie = new Cookies(req, res);
    await this.redis.revokeAllTokensByUserId(user_id, cookie);

    if (u_id !== user_id && user.email) {
      await this.mailService.sendMail(user.email, {
        action: NotificationAction.password_change,
        login: user.login,
        password: params.password,
        user_id,
      });
    }

    return res.status(common.HttpStatus.NO_CONTENT).send();
  }

  @common.Get('users/public_external_accounts')
  @sw.ApiOperation({ summary: 'Get public accounts' })
  async getPublicExternalAccounts(
    @common.Query('user_id') user_id: string,
    @Role() role: UserRoles,
  ) {
    return this.userService.getPublicExternalAccounts(user_id, role);
  }

  @common.Put('/users/:user_id/external_accounts/:id')
  @sw.ApiOperation({ summary: 'Update external account' })
  @Scope(UsersActions.externalAccounts)
  async updateAccount(
    @common.Param('id') id: number,
    @common.Param('user_id') user_id: string,
    @common.Body() body: userDto.UpdateExternalAccountDTO,
  ) {
    return this.userService.updateAccount(user_id, id, body);
  }

  @common.Put('users/:user_id/private_scopes')
  @sw.ApiOperation({ summary: 'Change the publicity of your profile and external accounts' })
  @Scope(UsersActions.profile)
  async setPrivateScopes(
    @common.Body() setPrivateScopesDTO: userDto.SetPrivateScopesDTO,
    @common.Param('user_id') user_id: string,
  ) {
    await this.userService.setPrivateScopes(setPrivateScopesDTO, user_id);
  }

  @common.Get('users/:user_id/private_scopes')
  @sw.ApiOperation({ summary: 'Get privacy settings for profile data and external accounts' })
  @Scope(UsersActions.profile)
  async getPrivateScopes(@common.Param('user_id') user_id: string) {
    return this.userService.getPrivateScopes(user_id);
  }

  @common.Delete('users/:user_id/external_accounts/:account_id')
  @sw.ApiOperation({ summary: 'Delete an external account' })
  @Scope(UsersActions.deleteExternalAccounts)
  async deleteExternalAccount(
    @common.Param('account_id') accountId: string,
    @common.Param('user_id') userId: string,
    @UserId() u_id: string,
  ) {
    return this.userService.deleteExternalAccount(
      parseInt(userId, 10),
      parseInt(accountId, 10),
      u_id,
    );
  }

  //#region Favorite clients
  @common.Post('users/:user_id/favorite_clients')
  @sw.ApiOperation({ summary: 'Adding an app to favorites' })
  @Scope(UsersActions.profile)
  async addFavoriteClients(
    @common.Query('client_id') client_id: string,
    @common.Param('user_id') user_id: string,
  ) {
    await this.userService.addFavoriteClients(user_id, client_id);
  }

  @common.Delete('users/:user_id/favorite_clients')
  @sw.ApiOperation({ summary: 'Removing an app from favorites' })
  @Scope(UsersActions.profile)
  async deleteFavoriteClients(
    @common.Query('client_id') client_id: string,
    @common.Param('user_id') user_id: string,
  ) {
    await this.userService.deleteFavoriteClients(user_id, client_id);
  }
  //#endregion
}

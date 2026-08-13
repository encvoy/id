import * as common from '@nestjs/common';
import * as sw from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import Cookies from 'cookies';
import { Request, Response } from 'express';
import { Scope } from 'src/decorators';
import { prepareListResponse } from 'src/helpers';
import { FilesInterceptor } from 'src/middlewares/interceptors/files.interceptor';
import { Role } from '../../decorators/role.decorator';
import { UserId } from '../../decorators/userId.decorator';
import { Actions, Ei18nCodes, UserRoles } from '../../enums';
import { updateLoggedUserSession } from '../interaction/interaction.helpers';
import { CustomLogger } from '../logger/logger.service';
import { EmailService } from '../providers/collection/email/email.service';
import { NotificationAction } from '../providers/collection/email/email.types';
import { getLegacyUserPrimaryExternalAccountEmail } from '../repository/user-search';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import { ClientActions } from '../clients/clients.roles';
import { UsersContactsService } from './users-contacts.service';
import * as userDto from './users.dto';
import { UsersActions } from './users.roles';
import { UsersService } from './users.service';
import { toUserProfileResponse } from './user-visibility';
import path from 'path';
import { CLIENT_ID } from 'src/constants';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1')
@sw.ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly mailService: EmailService,
    private readonly userService: UsersService,
    private readonly usersContactsService: UsersContactsService,
    readonly redis: RedisAdapter,
    private readonly logger: CustomLogger,
  ) {}

  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  loggedUsersTokens = new RedisAdapter(REDIS_PREFIXES.LoggedUserToken);

  private async logUserEvent(
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

  @common.Post('users')
  @sw.ApiOperation({ summary: 'Creating a new user' })
  @Scope(UsersActions.create)
  async createUser(
    @common.Req() req: Request,
    @common.Body() createUserDTO: userDto.CreateUserDTO,
    @UserId() userId?: string,
  ) {
    const { send_account_create_email: sendAccountCreateEmail = false, ...createUserPayload } =
      createUserDTO;
    const createdUser = await this.userService.create({
      ...createUserPayload,
      org_id: null,
    });
    const user = await this.userService.userRepo.findById(createdUser.id);

    const confirmedEmail = getLegacyUserPrimaryExternalAccountEmail(user);

    if (sendAccountCreateEmail && confirmedEmail && createUserPayload.password) {
      try {
        await this.mailService.sendMail(confirmedEmail, {
          action: NotificationAction.account_create,
          password: createUserPayload.password,
          user_id: user.id,
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
      details: { target: createdUser.id },
    });

    return { id: createdUser.id, nickname: user?.nickname };
  }

  @common.Get('users/me')
  @sw.ApiOperation({ summary: 'Getting your user profile' })
  @Scope(UsersActions.profile)
  async getById(@UserId() id: string) {
    return toUserProfileResponse(await this.userService.getById(id));
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
    {
      field_name,
      value,
      user_id,
      client_id,
      organization_id,
    }: userDto.CheckUniqueFieldAvailabilityDto,
  ) {
    return this.userService.checkUniqueFieldAvailability(field_name, value, user_id, {
      clientId: client_id,
      organizationId: organization_id,
    });
  }

  @common.Get('users/check-field-availability')
  @sw.ApiOperation({
    summary: 'Checking field availability and validation rules before save',
  })
  @sw.ApiOkResponse({ type: userDto.CheckFieldAvailabilityResponseDto })
  @Scope(UsersActions.checkFieldAvailability)
  @common.UseGuards(ThrottlerGuard)
  async checkFieldAvailability(
    @common.Query()
    {
      field_name,
      value,
      user_id,
      client_id,
      organization_id,
    }: userDto.CheckUniqueFieldAvailabilityDto,
  ) {
    return this.userService.checkFieldAvailability(field_name, value, user_id, {
      clientId: client_id,
      organizationId: organization_id,
    });
  }

  @common.Get('clients/:client_id/users/autocomplete')
  @sw.ApiOperation({ summary: 'Get client users for autocomplete' })
  @Scope(ClientActions.users_list)
  async getClientAutocompleteUsers(
    @common.Param('client_id') client_id: string,
    @common.Query() params: userDto.ListUsersAutocompleteDto,
    @UserId() actorUserId: string,
    @common.Res() res: Response,
  ) {
    const { users, totalCount } = await this.userService.getClientAutocompleteUsers(
      client_id,
      params,
      actorUserId,
    );

    return prepareListResponse(res, users, totalCount, params);
  }

  @common.Put('users/:user_id')
  @sw.ApiOperation({ summary: 'Editing a user profile' })
  @Scope(UsersActions.update)
  async update(
    @common.Body() updateUserDTO: userDto.UpdateUserDTO,
    @common.Req() req: Request,
    @common.Param('user_id') user_id: string,
    @UserId() userId: string,
    @Role() role: UserRoles,
  ) {
    const updatedUser = await this.userService.update(user_id, updateUserDTO, role, userId);
    await updateLoggedUserSession(
      req,
      { id: user_id, ...updateUserDTO } as any,
      this.loggedUsersInfo,
    );

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.USER_UPDATE,
      description: '',
      details: {
        target: user_id,
        changed_fields: getDefinedKeys(updateUserDTO),
      },
    });

    return toUserProfileResponse(updatedUser);
  }

  @common.Post('users/:user_id/contacts/:contact_type/confirm')
  @sw.ApiOperation({ summary: 'Confirm a user contact from the admin profile' })
  @Scope(UsersActions.confirmContact)
  async confirmContact(
    @common.Param('user_id') targetUserId: string,
    @common.Param('contact_type', new common.ParseEnumPipe(userDto.UserContactField))
    contactType: userDto.UserContactField,
    @common.Req() req: Request,
    @UserId() userId: string,
    @Role() role: UserRoles,
  ) {
    const updatedUser = await this.usersContactsService.confirmContact(
      targetUserId,
      contactType,
      role,
      userId,
    );

    await updateLoggedUserSession(req, updatedUser as any, this.loggedUsersInfo);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: CLIENT_ID,
      event: Actions.USER_UPDATE,
      description: '',
      details: { target: targetUserId, confirm_contact: contactType },
    });

    return toUserProfileResponse(updatedUser);
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
    @common.Param('user_id') targetUserId: string,
    @UserId() actorUserId: string,
    @Role() role: UserRoles,
    @common.UploadedFiles()
    files: { picture?: Express.Multer.File[] },
  ) {
    if (files && files.picture) {
      updateUserDTO.picture = files.picture[0].path.replaceAll(path.sep, path.posix.sep);
    }

    await this.userService.updateAvatar(targetUserId, updateUserDTO, role, actorUserId);
    await updateLoggedUserSession(
      req,
      { id: targetUserId, ...updateUserDTO },
      this.loggedUsersInfo,
    );

    await this.logUserEvent(req, actorUserId, Actions.USER_UPDATE, {
      target: targetUserId,
      action: 'user_avatar_updated',
      changed_fields: getDefinedKeys(updateUserDTO),
    });
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
    const deleteResult = await this.userService.delete(
      userId,
      user_id,
      role,
      updateUserDTO.password,
    );

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

    return res.status(common.HttpStatus.OK).send(deleteResult);
  }

  @common.Put('users/:user_id/restore')
  @sw.ApiOperation({ summary: 'Restoring a deleted profile' })
  @Scope(UsersActions.restore)
  async restoreProfile(
    @common.Req() req: Request,
    @common.Param('user_id') user_id: string,
    @UserId() actorUserId: string,
  ) {
    await this.userService.restoreProfile(user_id, undefined, actorUserId);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: actorUserId,
      client_id: CLIENT_ID,
      event: Actions.USER_RESTORE,
      description: '',
      details: { target: user_id },
    });
  }

  @common.Put('users/:user_id/mark-delete')
  @sw.ApiOperation({ summary: 'Mark a user for deletion' })
  @Scope(UsersActions.markDelete)
  async markForDeletion(
    @common.Req() req: Request,
    @common.Param('user_id') user_id: string,
    @UserId() actorUserId: string,
    @Role() role: UserRoles,
  ) {
    if (user_id === actorUserId) {
      throw new common.BadRequestException(Ei18nCodes.T3E0022);
    }

    const deletedAt = await this.userService.markForDeletion(actorUserId, user_id, role);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: actorUserId,
      client_id: CLIENT_ID,
      event: Actions.USER_UPDATE,
      description: '',
      details: {
        target: user_id,
        action: 'user_marked_for_deletion',
        deleted_at: deletedAt,
      },
    });

    return { deleted: deletedAt };
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
    const user = await this.userService.changePassword(
      params,
      user_id,
      u_id,
      req.headers['x-lang'] as string,
    );
    const legacyUser = await this.userService.userRepo.findById(user.id);

    const cookie = new Cookies(req, res);
    await this.redis.revokeAllTokensByUserId(user_id, cookie);

    if (u_id !== user_id && legacyUser?.email) {
      try {
        await this.mailService.sendMail(legacyUser.email, {
          action: NotificationAction.password_change,
          login: legacyUser.login,
          password: params.password,
          user_id,
        });
      } catch (e) {
        const error = e as Error;
        this.logger.warn(
          {
            description: error.message,
            details: {
              target: user_id,
              email: legacyUser.email,
              action: 'password_change_email_failed',
            },
          },
          'WARNING',
        );
      }
    }

    await this.logUserEvent(req, u_id, Actions.USER_PASSWORD_CHANGE, {
      target: user_id,
      action: 'user_password_changed',
    });

    return res.status(common.HttpStatus.NO_CONTENT).send();
  }

  @common.Get('users/public_external_accounts')
  @sw.ApiOperation({ summary: 'Get public accounts' })
  async getPublicExternalAccounts(
    @common.Query('user_id') user_id: string,
    @common.Query('client_id') client_id: string | undefined,
    @Role() role: UserRoles,
    @UserId() actorUserId: string,
  ) {
    return this.userService.getPublicExternalAccounts(user_id, role, actorUserId, client_id);
  }

  @common.Put('/users/:user_id/external_accounts/:id')
  @sw.ApiOperation({ summary: 'Update external account' })
  @Scope(UsersActions.externalAccounts)
  async updateAccount(
    @common.Param('id') id: string,
    @common.Param('user_id') user_id: string,
    @common.Body() body: userDto.UpdateExternalAccountDTO,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.userService.updateAccount(user_id, id, body, actorUserId);

    await this.logUserEvent(req, actorUserId, Actions.USER_UPDATE, {
      target: user_id,
      action: 'user_external_account_updated',
      account_id: id,
      changed_fields: getDefinedKeys(body),
    });

    return result;
  }

  @common.Put('users/:user_id/private_scopes')
  @sw.ApiOperation({ summary: 'Change the publicity of your profile and external accounts' })
  @Scope(UsersActions.profile)
  async setPrivateScopes(
    @common.Body() setPrivateScopesDTO: userDto.SetPrivateScopesDTO,
    @common.Param('user_id') user_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.userService.setPrivateScopes(setPrivateScopesDTO, user_id, actorUserId);

    await this.logUserEvent(req, actorUserId, Actions.USER_UPDATE, {
      target: user_id,
      action: 'user_private_scopes_updated',
      field: setPrivateScopesDTO.field,
      claim_privacy: setPrivateScopesDTO.claim_privacy,
    });
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
    @Role() role: UserRoles,
    @common.Req() req: Request,
  ) {
    const result = await this.userService.deleteExternalAccount(userId, accountId, u_id, role);

    await this.logUserEvent(req, u_id, Actions.USER_UPDATE, {
      target: userId,
      action: 'user_external_account_deleted',
      account_id: accountId,
    });

    return result;
  }

  //#region Favorite clients
  @common.Post('users/:user_id/favorite_clients')
  @sw.ApiOperation({ summary: 'Adding an app to favorites' })
  @Scope(UsersActions.profile)
  async addFavoriteClients(
    @common.Query('client_id') client_id: string,
    @common.Param('user_id') user_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.userService.addFavoriteClients(user_id, client_id);

    await this.logUserEvent(req, actorUserId, Actions.USER_UPDATE, {
      target: user_id,
      action: 'user_favorite_client_added',
      client_id,
    });
  }

  @common.Delete('users/:user_id/favorite_clients')
  @sw.ApiOperation({ summary: 'Removing an app from favorites' })
  @Scope(UsersActions.profile)
  async deleteFavoriteClients(
    @common.Query('client_id') client_id: string,
    @common.Param('user_id') user_id: string,
    @UserId() actorUserId: string,
    @common.Req() req: Request,
  ) {
    await this.userService.deleteFavoriteClients(user_id, client_id);

    await this.logUserEvent(req, actorUserId, Actions.USER_UPDATE, {
      target: user_id,
      action: 'user_favorite_client_deleted',
      client_id,
    });
  }
  //#endregion
}

import * as common from '@nestjs/common';
import * as dist from '@nestjs/swagger/dist';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Provider } from '@prisma/client';
import Cookies from 'cookies';
import { Request, Response } from 'express';
import { BasicAuth } from 'src/decorators';
import { UidNotUndefinedGuard } from 'src/middlewares/guards/uid.guard';
import { CLIENT_ID, DOMAIN } from '../../constants';
import { Actions, Ei18nCodes, UserRoles } from '../../enums';
import { InteractionExceptionFilter } from '../../middlewares/exceptionFilters';
import { CustomLogger } from '../logger';
import { OidcService } from '../oidc/oidc.service';
import { prisma } from '../prisma';
import { ProviderFactory, ProviderService } from '../providers';
import { OauthService } from '../providers/collection/oauth';
import { GetExternalClientSecretResDto } from '../providers/providers.dto';
import { REDIS_PREFIXES, RedisAdapter } from '../redis/redis.adapter';
import { RoleRepository } from '../repository';
import { UsersService } from '../users/users.service';
import { getLoggedUsers, renderWidget, setPkceValuesFromRequest } from './interaction.helpers';
import { InteractionService } from './interaction.service';
import { ChangePasswordDto } from './interaction.dto';

@common.Controller('interaction')
@common.UseFilters(InteractionExceptionFilter)
@common.UseGuards(UidNotUndefinedGuard)
export class InteractionController {
  constructor(
    private readonly service: InteractionService,
    private readonly userService: UsersService,
    private readonly roleRepo: RoleRepository,
    private readonly logger: CustomLogger,
    private readonly providerFactory: ProviderFactory,
    private readonly providerService: ProviderService,
    private readonly oidcService: OidcService,
  ) {}

  mfa1 = new RedisAdapter(REDIS_PREFIXES.MFA1);
  mfa2 = new RedisAdapter(REDIS_PREFIXES.MFA2);
  userData = new RedisAdapter(REDIS_PREFIXES.UserData);
  bindData = new RedisAdapter(REDIS_PREFIXES.BindData);
  loggedUsersInfo = new RedisAdapter(REDIS_PREFIXES.LoggedUserInfoCode);
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  stateAdapter = new RedisAdapter(REDIS_PREFIXES.State);

  @common.Get(['/login', '/code'])
  @dist.ApiOperation({ summary: 'Exchange code from external Oauth provider for a token' })
  @dist.ApiOkResponse({ type: GetExternalClientSecretResDto })
  async getTokenByCode(
    @common.Req() req: Request,
    @common.Res() res: Response,
    @common.Query('code') code: string,
    @common.Query('state') state: string,
  ) {
    const stateParams = await this.stateAdapter.get<{
      client_id: string;
      provider_id: string;
      user_id: string; //profile
      interaction_id?: string; //widget`
    }>(state);
    if (!stateParams) {
      throw new common.BadRequestException(Ei18nCodes.T3E0039);
    }
    if (!code) {
      throw new common.BadRequestException(req.originalUrl);
    }

    await this.stateAdapter.destroy(state);
    const clientId = stateParams.client_id;
    const providerId = stateParams.provider_id;
    const user_id = stateParams.user_id;
    const interaction_id = stateParams.interaction_id;

    let provider: Provider;
    if (!clientId) {
      provider = await prisma.provider.findUnique({
        where: { id: parseInt(providerId) },
      });
      if (!provider.is_public) throw new common.ForbiddenException(Ei18nCodes.T3E0076);
    } else {
      provider = await this.service.getProvider(clientId, providerId);
    }

    const providerService = this.providerFactory.getProviderService(provider.type);

    //For PKCE providers
    if (
      provider.params &&
      provider.params['external_client_id'] &&
      !provider.params['external_client_secret']
    ) {
      setPkceValuesFromRequest(req, res, providerId);
    }

    const { token, userinfo_endpoint } = await providerService.getTokenByCode(
      code,
      provider,
      res,
      req,
    );

    function renderPostMessagePage(params?: object): string {
      const payloadStr = JSON.stringify(params);
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Callback</title>
            <script>
              (function() {
                window.opener.postMessage(${payloadStr}, "${DOMAIN}");
              })();
            </script>
          </head>
          <body></body>
        </html>
      `;
    }

    if (token) {
      const extInfo = await providerService.getUserInfo(userinfo_endpoint, token, provider);
      const info = await (providerService as OauthService).parseUserInfo(extInfo);
      if (user_id) {
        try {
          await this.userService.bindAccount(user_id, provider.type, {
            ...info,
            issuer: provider.params['issuer'],
          });
          return res.status(200).send(renderPostMessagePage({ result: true }));
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          return res
            .status(200)
            .send(renderPostMessagePage({ result: false, cause: errorMessage }));
        }
      } else {
        const isHasIdentifier = await prisma.externalAccount.findFirst({
          where: { issuer: provider.params['issuer'], type: provider.type, sub: info.sub },
        });
        if (!isHasIdentifier) {
          const bindData = (await this.bindData.find(interaction_id)) || [];
          bindData.push({
            data: info,
            provider_id: provider.id,
            type: provider.type,
          });
          await this.bindData.upsert(interaction_id, bindData, 3600);
        }

        return res.redirect(
          DOMAIN +
            '/api' +
            '/interaction/' +
            interaction_id +
            '/auth' +
            '?type=' +
            provider.type +
            '&token=' +
            token +
            '&provider_id=' +
            provider.id,
        );
      }
    }
  }

  @common.Get('/:uid')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Open widget' })
  @dist.ApiOkResponse({ content: { 'text/html': {} } })
  async showWidget(@common.Req() req: Request, @common.Res() res: Response) {
    res.clearCookie('required_accounts_info_uid');
    const interactionDetails = await this.oidcService.interactionDetails(req, res);
    const {
      jti: uid,
      prompt: { name },
      params: { client_id },
    } = interactionDetails;

    const client = await this.service.getClient(client_id as string);
    const loggedUsers = JSON.stringify(await getLoggedUsers(req, res, this.loggedUsersInfo));

    switch (name) {
      case 'login':
        const mfa_1 = await this.mfa1.find(uid);
        if (!mfa_1) {
          const providers = await this.providerService.getList(
            { only_active: true },
            client.client_id,
            UserRoles.NONE,
          );
          return renderWidget({
            res,
            initialRoute: 'login',
            client,
            loggedUsers,
            providers: [...providers.big, ...providers.small],
          });
        }

        const user = await prisma.user.findFirst({ where: { id: mfa_1.user_id } });
        await this.mfa1.destroy(uid);
        await this.service.finishAuthorization({
          client,
          req,
          res,
          uid,
          type: 'reload',
          user,
        });

      case 'consent': {
        //Generate a list of missing scopes to pass to the widget and request confirmation.
        const params = await this.service.checkMissingScopes(req, res);
        if (params) return renderWidget(params);

        const result = { consent: { grantId: undefined } };
        await this.oidcService.interactionFinished(req, res, result, uid, true);
        break;
      }

      default:
        throw new common.BadRequestException(Ei18nCodes.T3E0018);
    }
  }

  @common.Get('/:uid/clean')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Open widget' })
  @dist.ApiOkResponse({ content: { 'text/html': {} } })
  async clean(@common.Req() req: Request, @common.Res() res: Response) {
    const interactionDetails = await this.oidcService.interactionDetails(req, res);
    const {
      jti: uid,
      params: { client_id },
    } = interactionDetails;
    await this.mfa1.destroy(uid);
    await this.mfa2.destroy(uid);
    await this.bindData.destroy(uid);
    await this.userData.destroy(uid);

    const client = await this.service.getClient(client_id as string);
    const loggedUsers = JSON.stringify(await getLoggedUsers(req, res, this.loggedUsersInfo));

    const providers = await this.providerService.getList(
      { only_active: true },
      client.client_id,
      UserRoles.NONE,
    );
    return renderWidget({
      res,
      initialRoute: 'login',
      client,
      loggedUsers,
      providers: [...providers.big, ...providers.small],
    });
  }

  @common.Post('/:uid/confirm')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Confirm access to specified data' })
  @dist.ApiConsumes('application/x-www-form-urlencoded')
  @dist.ApiResponse({ status: 303, description: 'See Other' })
  async interactionConfirm(@common.Req() req: Request, @common.Res() res: Response) {
    const interactionDetails = await this.oidcService.interactionDetails(req, res);
    const {
      jti: uid,
      params,
      session: { accountId },
    } = interactionDetails;

    let { grantId } = interactionDetails;

    let grant;
    if (grantId) {
      grant = await this.oidcService.getGrant(grantId);
    } else {
      grant = await this.oidcService.createGrant({
        accountId,
        clientId: params.client_id as string,
      });
      grantId = grant.jti;
    }

    //Generate a list of additionally confirmed scopes to save.
    let missingOIDCScope: string[] = [];
    if (params && params.scope && typeof params.scope === 'string') {
      missingOIDCScope = (params?.scope || '').trim().replace(/\s+/g, ' ').split(' ') || [];
    }
    if (missingOIDCScope.length) {
      const userScopes = await this.service.findUserScopes(accountId, params.client_id as string);
      let newScopes = userScopes || '';

      // Filter out special scopes (openid, offline_access) before saving to DB
      const SPECIAL_SCOPES = ['openid', 'offline_access'];
      const scopesToSave: string[] = [];

      for (const scope of missingOIDCScope) {
        // Only add to newScopes if it's not special and not already saved
        if (!SPECIAL_SCOPES.includes(scope) && !userScopes.includes(scope)) {
          scopesToSave.push(scope);
        }
      }

      if (scopesToSave.length > 0) {
        newScopes = userScopes ? `${userScopes} ${scopesToSave.join(' ')}` : scopesToSave.join(' ');
        await this.service.saveUserScopes(accountId, params.client_id as string, newScopes);
      }

      if (grantId) {
        await this.oidcService.updateGrantScopes(grantId, missingOIDCScope.join(' '));
      }
    }

    const role = await this.roleRepo.findRoleInApp(accountId, params.client_id as string);
    if (!role) await this.userService.setUserRoleInApp(accountId, params.client_id as string);

    //Simply complete the interaction; grant and scopes are handled by oidc-provider.
    await this.oidcService.interactionFinished(req, res, { consent: { grantId } }, uid, true);
  }

  @common.Post('/:uid/bind')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Bind identifier' })
  @dist.ApiConsumes('application/x-www-form-urlencoded')
  @dist.ApiResponse({ status: 303, description: 'See Other' })
  @common.UseGuards(ThrottlerGuard)
  async bindAccount(@common.Req() req: Request, @common.Res() res: Response) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);
    const client = await this.service.getClient(client_id as string);
    return this.service.identityVerification({
      type: 'bind',
      uid,
      client,
      req,
      res,
    });
  }

  @common.Post('/:uid/steps')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Step-by-step registration' })
  @dist.ApiConsumes('application/x-www-form-urlencoded')
  @dist.ApiResponse({ status: 303, description: 'See Other' })
  @common.UseGuards(ThrottlerGuard)
  async steps(
    @common.Body() dto: Record<string, any>,
    @common.Req() req: Request,
    @common.Res() res: Response,
  ) {
    return this.service.steps(dto, req, res);
  }

  @common.Delete('/session/:session_id')
  @dist.ApiOperation({ summary: 'Delete user session' })
  @dist.ApiOkResponse()
  async deleteUserSession(
    @common.Param('session_id') session_id: string,
    @common.Res() res: Response,
    @common.Req() req: Request,
  ) {
    await this.service.deleteUserSession(session_id);
    const cookie = new Cookies(req, res);

    if (!req.cookies._sess) {
      res.end();
      return;
    }

    const newSessionCookie = req.cookies._sess.replace(session_id, '');

    if (newSessionCookie) {
      cookie.set('_sess', newSessionCookie, {
        httpOnly: true,
        //secure: true,
        overwrite: true,
      });
    } else {
      res.clearCookie('_sess');
    }

    res.end();
  }

  @common.Post('/:uid/recover')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Account recovery' })
  @dist.ApiConsumes('application/x-www-form-urlencoded')
  @BasicAuth()
  async recoverAndAuth(
    @common.Req() req: Request,
    @common.Res() res: Response,
    @common.Body() body: any,
  ) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);

    if (client_id !== CLIENT_ID) throw new common.BadRequestException(Ei18nCodes.T3E0067);

    const client = await this.service.getClient(client_id as string);
    const user = await this.userService.restoreProfile(body.identifier, body.password);

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: user.id.toString(),
      client_id: CLIENT_ID,
      event: Actions.USER_RESTORE,
      description: '',
      details: {},
    });

    return this.service.finishAuthorization({
      req,
      res,
      user,
      client,
      uid,
      type: 'login',
    });
  }

  @common.Post('/:uid/recover-password')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Account recovery' })
  @dist.ApiConsumes('application/x-www-form-urlencoded')
  @BasicAuth()
  async recoverPassword(
    @common.Req() req: Request,
    @common.Res() res: Response,
    @common.Body() body: any,
  ) {
    return this.service.recoverPassword(body, req, res);
  }

  @common.Get('/:uid/auth')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Prepare authorization by provider (GET)' })
  @BasicAuth()
  async prepareAuthByType(
    @common.Query('type') type: string,
    @common.Req() req: Request,
    @common.Res() res: Response,
  ) {
    //Prepare the body from the query parameters.
    const body: any = {};

    //Call the main logic of the POST method.
    return this.authByType(type, req, res, body);
  }

  @common.Post('/:uid/auth')
  @dist.ApiParam({ name: 'uid', example: 'gg-mNVXQtFNaIackQOXQ4' })
  @dist.ApiOperation({ summary: 'Authorization by provider' })
  @dist.ApiConsumes('application/x-www-form-urlencoded')
  @BasicAuth()
  async authByType(
    @common.Query('type') type: string,
    @common.Req() req: Request,
    @common.Res() res: Response,
    @common.Body() body: any,
  ) {
    const {
      jti: uid,
      params: { client_id },
    } = await this.oidcService.interactionDetails(req, res);
    const client = await this.service.getClient(client_id);

    const providers = await prisma.provider_relations.findMany({
      where: { client_id: client_id },
      include: {
        provider: true,
      },
    });

    if (!providers.length) {
      throw new common.BadRequestException(Ei18nCodes.T3E0030);
    }

    return this.service.authByType({
      type,
      req,
      res,
      body,
      uid,
      client_id,
      client,
      providers,
    });
  }
}

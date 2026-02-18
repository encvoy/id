import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalAccount, Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { areObjectsEqual, isEmpty } from 'src/helpers';
import { InitiateOauthDto } from 'src/modules/auth/auth.dto';
import { findUserAndExternalAccount } from 'src/modules/interaction/interaction.helpers';
import { REDIS_PREFIXES, RedisAdapter } from 'src/modules/redis';
import { IAuthResponse } from '../../factory.service';
import { ProviderBase } from '../../provider.base';
import { ProviderMethod } from '../../providers.decorators';
import {
  BindExternalAccountDto,
  CreateOauthProviderDto,
  InteractionProviderDto,
  UpdateOauthProviderDto,
} from './oauth.dto';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export abstract class OauthService extends ProviderBase {
  requiredAccountsInfoAdapter = new RedisAdapter(REDIS_PREFIXES.RequiredAccountsInfo);
  stateAdapter = new RedisAdapter(REDIS_PREFIXES.State);

  async onActivate(): Promise<void> {
    return;
  }

  async syncUser(params: any, req: Request, res: Response): Promise<IAuthResponse> {
    throw new BadRequestException(Ei18nCodes.T3E0031);
  }

  async onAuth(
    params: InteractionProviderDto,
    uid: string,
    provider: Provider,
    req,
    res,
  ): Promise<IAuthResponse> {
    let userinfoEndpoint: string = provider.params['userinfo_endpoint'];
    const issuer = provider.params['issuer'];

    const { required_accounts_info_uid } = req.cookies;
    const { id: stored_user_id } =
      (await this.requiredAccountsInfoAdapter.get(required_accounts_info_uid)) || {};
    res.clearCookie('required_accounts_info_uid');

    const token = (params && params.token) || req.query.token || '';
    const externalUserInfo = await this.getUserInfo(userinfoEndpoint, token);

    const { sub, ...restUserInfo } = await this.parseUserInfo(externalUserInfo);

    const { user, ...externalAccount } = await findUserAndExternalAccount(issuer, false, sub);

    if (!isEmpty(externalAccount) && stored_user_id) {
      throw new BadRequestException(Ei18nCodes.T3E0006);
    }
    if (!isEmpty(externalAccount)) {
      const { id, ...externalAccountWithoutId } = externalAccount as Partial<ExternalAccount>;
      const accountsAreEqual = areObjectsEqual(
        {
          avatar: restUserInfo.avatar,
          label: restUserInfo.label,
          profile_link: restUserInfo.profile_link,
        },
        externalAccountWithoutId,
      );

      if (!accountsAreEqual) await this.updateExternalAccount(restUserInfo, sub, issuer);

      return {
        user,
      };
    }
    const externalAccountInfo = JSON.stringify({
      provider_name: provider.name,
      type: this.type,
      issuer,
      sub,
      provider_id: provider.id,
      ...restUserInfo,
    });

    return {
      user,
      renderWidgetParams: {
        initialRoute: 'bind',
        externalAccountInfo,
      },
    };
  }

  async getOauthLink(
    provider: Provider,
    params: InitiateOauthDto,
    userId?: string,
  ): Promise<string> {
    const authorization_endpoint = provider.params['authorization_endpoint'];
    const external_client_id = provider.params['external_client_id'];
    const external_client_secret = provider.params['external_client_secret'];
    const scopes = provider.params['scopes'];
    const redirect_uri = provider.params['redirect_uri'];

    let pkceParams = '';
    if (!external_client_secret && params.code_challenge && params.code_challenge_method) {
      pkceParams =
        '&code_challenge=' +
        encodeURIComponent(params.code_challenge) +
        '&code_challenge_method=' +
        encodeURIComponent(params.code_challenge_method);
    }

    await this.stateAdapter.upsert(
      params.state,
      {
        user_id: userId || null,
        provider_id: provider.id,
        client_id: params.client_id || null,
        interaction_id: params.interaction_id,
        code_challenge: params.code_challenge || null,
        code_challenge_method: params.code_challenge_method || null,
      },
      300,
    );

    return (
      authorization_endpoint +
      '?client_id=' +
      encodeURIComponent(external_client_id) +
      '&response_type=code' +
      '&state=' +
      encodeURIComponent(params.state) +
      '&scope=' +
      scopes +
      '&redirect_uri=' +
      encodeURIComponent(redirect_uri) +
      pkceParams
    );
  }

  @ProviderMethod(CreateOauthProviderDto)
  async onCreate(
    params: CreateOauthProviderDto,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderCreateInput> {
    params.params = {
      ...params.params,
      ...this.getDefaultParams(),
    };
    return this.prepareProviderCreateInput(client_id, params);
  }

  @ProviderMethod(UpdateOauthProviderDto)
  async onUpdate(
    params: UpdateOauthProviderDto,
    provider: Provider,
    client_id: string,
    user_id: string,
  ): Promise<Prisma.ProviderUpdateInput> {
    return this.prepareProviderUpdateInput(params);
  }

  abstract getDefaultParams(): Object;

  // @ProviderMethod(BindExternalAccountDto)
  async onBindAccount(params: BindExternalAccountDto, userId: string) {
    let rest_info: Object | undefined;
    if (params.rest_info) {
      try {
        if (typeof params.rest_info === 'string') {
          rest_info = JSON.parse(params.rest_info);
        } else if (Object.keys(params.rest_info)) {
          rest_info = params.rest_info;
        }
      } catch (error) {
        console.warn('Incorrect format rest_info', error);
      }
    }
    return {
      sub: params.sub,
      issuer: params.issuer,
      type: this.type,
      label: params.label,
      avatar: decodeURIComponent(params.avatar),
      rest_info,
      profile_link: params.profile_link,
    };
  }

  async getTokenByCode(code: string, provider: Provider, res: Response, req: Request) {
    const external_client_id = provider.params['external_client_id'];
    const external_client_secret = provider.params['external_client_secret'];
    const token_endpoint = provider.params['token_endpoint'];
    const redirect_uri = provider.params['redirect_uri'];
    const userinfo_endpoint = provider.params['userinfo_endpoint'];

    let resp: any;
    try {
      let body =
        'grant_type=authorization_code' +
        '&code=' +
        encodeURIComponent(code) +
        '&client_id=' +
        encodeURIComponent(external_client_id) +
        '&redirect_uri=' +
        encodeURIComponent(redirect_uri);

      if (!external_client_secret && res.locals) {
        if (res.locals.code_verifier) {
          body += '&code_verifier=' + encodeURIComponent(res.locals.code_verifier);
        }
        if (res.locals.device_id) {
          body += '&device_id=' + encodeURIComponent(res.locals.device_id);
        }
        if (res.locals.state) {
          body += '&state=' + encodeURIComponent(res.locals.state);
        }

        delete res.locals.code_verifier;
        delete res.locals.device_id;
        delete res.locals.state;
      } else {
        body += '&client_secret=' + encodeURIComponent(external_client_secret);
      }
      const response = await fetch(token_endpoint, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        body,
      });

      resp = await response.json();
      if (!response.ok || !resp.access_token) throw new BadRequestException();

      return { token: resp.access_token, userinfo_endpoint: userinfo_endpoint };
    } catch (e) {
      const errorText = resp
        ? resp['error_description'] || resp['error'] || resp['message']
        : Ei18nCodes.T3E0078;

      throw new InternalServerErrorException(errorText, { cause: e });
    }
  }

  abstract parseUserInfo(userinfo): Promise<{
    sub: string;
    label: string;
    avatar: string;
    email?: string;
    login?: string;
    nickname?: string;
    birthdate: string | null;
    profile_link?: string;
  }>;

  async getUserInfo(userinfo_endpoint: string, access_token: string) {
    const response = await this.onGetUserInfo(userinfo_endpoint, access_token);
    if (response?.ok) {
      return response.json();
    } else {
      throw new BadRequestException(Ei18nCodes.T3E0037);
    }
  }
  abstract onGetUserInfo(userinfo_endpoint: string, access_token: string): Promise<any>;
}

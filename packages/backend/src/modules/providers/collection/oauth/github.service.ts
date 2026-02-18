import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DOMAIN } from 'src/constants';
import { OauthService } from './oauth.service';
import { UpdateOauthProviderDto } from './oauth.dto';
import { Prisma, Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { Ei18nCodes } from 'src/enums';

@Injectable()
export class GithubService extends OauthService {
  defaultUrlAvatar: string = 'public/default/github.svg';
  async onGetUserInfo(userinfo_endpoint: string, access_token: string) {
    return fetch(userinfo_endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'User-Agent': 'MyApp/1.0',
      },
    });
  }

  type = 'GITHUB';

  prepareProviderUpdateInput(paramsUpdate: UpdateOauthProviderDto): Prisma.ProviderUpdateInput {
    delete paramsUpdate.params?.authorization_endpoint;
    delete paramsUpdate.params?.issuer;
    delete paramsUpdate.params?.redirect_uri;
    delete paramsUpdate.params?.scopes;
    delete paramsUpdate.params?.token_endpoint;
    delete paramsUpdate.params?.userinfo_endpoint;

    return paramsUpdate as unknown as Prisma.ProviderUpdateInput;
  }

  getDefaultParams(): Object {
    return {
      issuer: 'https://github.com',
      authorization_endpoint: 'https://github.com/login/oauth/authorize',
      token_endpoint: 'https://github.com/login/oauth/access_token',
      userinfo_endpoint: 'https://api.github.com/user',
      scopes: '',
      redirect_uri: DOMAIN + '/api/interaction/code',
    };
  }

  async parseUserInfo(userinfo): Promise<{
    sub: string;
    label: string;
    avatar: string;
    email?: string;
    login?: string;
    nickname?: string;
    given_name?: string;
    family_name?: string;
    birthdate: string | null;
    profile_link?: string;
  }> {
    return {
      sub: userinfo.id.toString(),
      avatar: userinfo.avatar_url,
      label: userinfo.login,
      email: userinfo.email,
      login: userinfo.login,
      // nickname: '',
      // given_name: '',
      // family_name: '',
      birthdate: null,
      profile_link: 'https://github.com/' + userinfo.login,
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

      const text = await response.text();
      const params = new URLSearchParams(text);
      const access_token = params.get('access_token');
      if (!response.ok || !access_token) throw new BadRequestException();

      return { token: access_token, userinfo_endpoint: userinfo_endpoint };
    } catch (e) {
      const errorText = resp
        ? resp['error_description'] || resp['error'] || resp['message']
        : Ei18nCodes.T3E0078;

      throw new InternalServerErrorException(errorText, { cause: e });
    }
  }
}

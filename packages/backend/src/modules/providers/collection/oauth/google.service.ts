import { Injectable } from '@nestjs/common';
import { DOMAIN } from 'src/constants';
import { OauthService } from './oauth.service';
import { UpdateOauthProviderDto } from './oauth.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoogleService extends OauthService {
  defaultUrlAvatar: string = 'public/default/google.svg';
  async onGetUserInfo(userinfo_endpoint: string, access_token: string) {
    const body = 'access_token=' + access_token;
    return fetch(userinfo_endpoint, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/x-www-form-urlencoded ',
      },
      body,
    });
  }

  type = 'GOOGLE';

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
      issuer: 'https://accounts.google.com',
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/auth',
      token_endpoint: 'https://oauth2.googleapis.com/token',
      userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      scopes: 'profile email',
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
      sub: userinfo.sub,
      avatar: userinfo.picture,
      label: userinfo.email,
      email: userinfo.email,
      login: '',
      nickname: userinfo.name,
      given_name: userinfo.given_name,
      family_name: userinfo.family_name,
      birthdate: null,
      profile_link: 'https://myaccount.google.com/personal-info',
    };
  }
}

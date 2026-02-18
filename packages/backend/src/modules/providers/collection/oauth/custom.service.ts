import { Injectable } from '@nestjs/common';
import { DOMAIN } from 'src/constants';
import { OauthService } from './oauth.service';

@Injectable()
export class CustomService extends OauthService {
  type = 'CUSTOM';
  defaultUrlAvatar: string = '';

  constructor() {
    super();
  }

  getDefaultParams(): Object {
    return {
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
    birthdate: string | null;
    profile_link?: string;
    rest_info?: Object;
  }> {
    return {
      sub: userinfo.sub || userinfo.id,
      avatar: userinfo.avatar || userinfo.image,
      label: userinfo.label || userinfo.id || userinfo.sub,
      email: userinfo.email,
      login: userinfo.login || '',
      birthdate: userinfo.birthdate || null,
      nickname: userinfo.nickname,
      profile_link: userinfo.profile_link || null,
      rest_info: userinfo.rest_info || undefined,
    };
  }

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
}

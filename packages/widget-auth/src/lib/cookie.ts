import { buildPublicUrl } from './constant';

export type Assoc<T> = { [key: string]: T };

const cookieRegistry: Assoc<string | null> = {};

const cookiePath = (): string => {
  try {
    return new URL(
      buildPublicUrl('/api/interaction/code'),
      window.location.origin,
    ).pathname;
  } catch {
    return '/api/interaction/code';
  }
};

const clearLegacyDomainCookie = (name: string): void => {
  if (
    window.location.hostname === 'trusted.ru' ||
    window.location.hostname.endsWith('.trusted.ru')
  ) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=trusted.ru;`;
  }
};

export class Cookie {
  static create(name: string, value: string, days: number) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    clearLegacyDomainCookie(name);
    document.cookie = `${name}=${value}${expires}; path=${cookiePath()}; secure; samesite=lax;`;
  }

  static read(name: string) {
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].split('=');
      let key = c[0];
      let value = c[1];
      key && (key = key.trim());
      if (name === key) {
        return value;
      }
    }
    return null;
  }

  static clear(name: string) {
    this.create(name, '', -1);
  }

  static on(event: 'change', cookieName: string, cb: () => void): number {
    return setInterval(() => {
      const cookie = Cookie.read(cookieName);
      if (cookie !== cookieRegistry[cookieName]) {
        if (cookie || cookie === null) {
          // update registry so we dont get triggered again
          cookieRegistry[cookieName] = cookie;
          return cb();
        }
      } else {
        cookieRegistry[cookieName] = cookie;
      }
    }, 100) as any;
  }
}

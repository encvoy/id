export enum EHashPages {
  LOGIN = '#login',
  PASSWORD = '#password',
  EMAILSTEP = '#email-step',
  PHONESTEP = '#phone-step',
}

export enum EProviderGroups {
  BIG = 'BIG',
  SMALL = 'SMALL',
}

export enum EProviderTypes {
  CREDENTIALS = 'CREDENTIALS',
  KLOUD = 'KLOUD',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  EMAIL_CUSTOM = 'EMAIL_CUSTOM',
  GITHUB = 'GITHUB',
  GOOGLE = 'GOOGLE',
  CUSTOM = 'CUSTOM',
  WEBAUTHN = 'WEBAUTHN',
  TOTP = 'TOTP',
  HOTP = 'HOTP',
  MTLS = 'MTLS',
}

export enum ERegistrationPolicy {
  allowed = 'allowed',
  allowed_autoregistration_only = 'allowed_autoregistration_only',
  disabled = 'disabled',
}

export interface IMTLSParams {
  issuer?: string;
}

export interface IProvider {
  avatar: string;
  description: string;
  id: number;
  name: string;
  type: string;
  is_public: boolean;
  index: number;
  groupe: EProviderGroups;
  params?: IMTLSParams;
}

export type TProviders = IProvider[];

export interface IFieldEnv {
  type: string;
  title: string;
  field_name: string;
  default_value: string | undefined;
  validations: IValidation[];
}

export interface IWidgetEnv {
  TITLE: string;
  INFO: string;
  INFO_OUT: string;
  HIDE_CREATE_ACCOUNT: boolean;
  HIDE_BIND_ACCOUNT: boolean;
  HIDE_AVATARS_OF_BIG_PROVIDERS: boolean;
  LOGO: string | undefined;
  COLORS: {
    font_color: string;
    button_color: string;
  };
  HIDE_FOOTER: boolean;
  HIDE_HEADER: boolean;
  COVER: string;
  LANG: string;
}

export interface IValidation {
  created_at: Date;
  id: number;
  updated_at: Date;
  active: boolean;
  error: string;
  title: string;
  regex: string;
}

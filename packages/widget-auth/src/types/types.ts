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

export interface IOTPProviderParams {
  digits?: number;
}

export interface IBaseProvider<TType extends EProviderTypes, TParams = Record<string, never>> {
  avatar: string;
  description: string;
  id: number;
  name: string | { [lang: string]: string };
  type: TType;
  is_public: boolean;
  index: number;
  groupe: EProviderGroups;
  params?: TParams;
}

export type IMTLSProvider = IBaseProvider<EProviderTypes.MTLS, IMTLSParams>;

export type IOTPProvider = IBaseProvider<
  EProviderTypes.TOTP | EProviderTypes.HOTP,
  IOTPProviderParams
>;

export type IGenericProvider = IBaseProvider<
  Exclude<EProviderTypes, EProviderTypes.MTLS | EProviderTypes.TOTP | EProviderTypes.HOTP>,
  Record<string, unknown>
>;

export type IProvider = IMTLSProvider | IOTPProvider | IGenericProvider;

export type TProviders = IProvider[];

export type TLocalizedText = Record<string, string>;
export type TLocalizedTextCompatible = TLocalizedText | string;

export const isMTLSProvider = (provider: IProvider): provider is IMTLSProvider =>
  provider.type === EProviderTypes.MTLS;

export const isOtpProvider = (provider: IProvider): provider is IOTPProvider =>
  provider.type === EProviderTypes.TOTP || provider.type === EProviderTypes.HOTP;

export interface IFieldEnv {
  type: string;
  title: TLocalizedTextCompatible;
  field_name: string;
  default_value: string | undefined;
  unique: boolean;
  validations: IValidation[];
}

export interface IWidgetNotification {
  id: string;
  title: TLocalizedTextCompatible;
  content: TLocalizedTextCompatible;
  type?: 'system' | 'organization' | 'client';
}

export interface IOtpSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  digits: number;
  algorithm: string;
  period?: number;
  counter?: number;
  state: string;
}

export interface IWidgetEnv {
  TITLE: TLocalizedTextCompatible;
  INFO: string;
  INFO_OUT: string;
  HIDE_CREATE_ACCOUNT: boolean;
  HIDE_BIND_ACCOUNT: boolean;
  HIDE_AVATARS_OF_BIG_PROVIDERS: boolean;
  LOGO: string | undefined;
  FAVICON?: string;
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
  id: string | number;
  updated_at: Date;
  active: boolean;
  error: TLocalizedTextCompatible;
  title: TLocalizedTextCompatible;
  regex: string;
}

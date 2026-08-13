import { ReactElement } from "react";

export interface BaseWidgetConfig {
  withOutHomePage?: boolean;
  issuer?: string;
  routerMainFn?: (value: string, link?: string) => void;
  customRoute?: (token: string) => void;
  scopes?: string[];
  tokenEndPoint?: string;
  userInfoEndPoint?: string;
  profile?: {
    isHideText?: boolean;
    wrapper?: IComponentStyles;
    button?: IComponentStyles;
  };
  catalogButton?: IComponentStyles;
  headerButtons?: ICustomMenuButton[];
  loginButton?: ICustomMenuButton;
  menuButtons?: ICustomMenuButton[];
  logoutButtonFn?: () => void;
  customStyles?: ICustomStyles;
}

export interface WidgetConfig extends BaseWidgetConfig {
  appId: string;
  redirectUrl: string;
}

export interface InfoWidgetConfig extends BaseWidgetConfig {
  data: IUserProfile;
}

export interface IComponentStyles {
  color: {
    text?: string;
    background?: string;
    hover?: string;
  };
  borderRadius?: string;
  padding?: string;
  position?: "left" | "center";
  isHideIcon?: boolean;
}

export interface ICustomStyles {
  global?: IComponentStyles;
  components?: {
    accountButton?: IComponentStyles;
    primaryButton?: IComponentStyles;
    secondaryButton?: IComponentStyles;
  };
}

export interface IMenuButton {
  avatar?: string;
  text: string;
  link?: string;
  type?: string;
  client_id?: string;
  onClick?: () => void;
}

export interface ICustomMenuButton extends IMenuButton {
  icon?: string | ReactElement;
  customStyles?: IComponentStyles;
}

export interface PrivateClaims {
  public_profile_claims_oauth?: string;
  public_profile_claims_gravatar?: string;
  public_accounts_claims_oauth?: number[];
  public_accounts_claims_gravatar?: number[];
}

export interface IUserProfile extends PrivateClaims {
  sub?: string;
  login?: string;
  nickname?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  birthdate?: string;
  phone_number?: string | null;
  password_updated_at?: string;
  picture?: string;
  password_change_required?: boolean;
  custom_fields?: Record<string, unknown>;
  ExternalAccount?: Record<string, unknown>;
  deleted?: string | null;
  email_verified?: boolean;
  phone_number_verified?: boolean | null;
  locale?: string;
  profile_privacy?: boolean;
  systemClient?: string;
  orgClient?: string;
  orgClients?: Array<{
    name: string;
    client_id: string;
  }>;
  lk?: IMenuButton[];
  catalog?: boolean;
  catalogClients?: ICatalogClient[];
}

export enum EButtonTypes {
  personal = "lk_personal",
  system = "lk_system",
  org = "lk_org",
  admin = "lk_admin",
  logout = "logout",
  login = "login",
}

export enum EDefaultConfigValues {
  issuer = "https://id.kloud.one",
  userInfoEndPoint = "/auth/me",
  tokenEndPoint = "/auth/token",
  scopes = "openid lk profile offline_access locale catalog",
  loginButton = "Login",
  loginType = "login",
}

export enum EBaseColors {
  accent = "#b5262f",
  primary = "#666666",
  secondary = "#858ba0",
  main = "#ffffff",
  background = "#efefef",
  hover = "#f5f5f5",
}

export type TFileString = File | null | string | undefined;

export type TLocalizedText = Record<string, string>;

export interface IClientType {
  name: string | TLocalizedText;
  id: string;
}

export interface ICatalogClient {
  client_id: string;
  name: string | TLocalizedText;
  catalog_name?: string | TLocalizedText | null;
  description?: string;
  domain: string;
  avatar: TFileString;
  created_at: string;
  group: string;
  type: IClientType;
  favorite: boolean;
}

import { ReactElement } from "react";

export interface BaseWidgetConfig {
  withOutHomePage?: boolean;
  issuer?: string;
  routerMainFn?: (value: string) => void;
  customRoute?: (token: string) => void;
  scopes?: string[];
  tokenEndPoint?: string;
  userInfoEndPoint?: string;
  profile?: {
    isHideText?: boolean;
    wrapper?: IComponentStyles;
    button?: IComponentStyles;
  };
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
  email_public?: string | null;
  email_verified?: boolean;
  phone_number_verified?: boolean | null;
  profile_privacy?: boolean;
  systemClient?: string;
  orgClient?: string;
  lk?: IMenuButton[];
  catalog?: boolean;
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

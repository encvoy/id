import { Provider } from '@prisma/client';

export type TEmailProvider = Omit<Provider, 'params'> & {
  params: TEmailProviderParams;
};

export type TEmailProviderParams = {
  root_mail: string;
  mail_hostname: string;
  mail_port: string;
  mail_password: string;
  mail_code_ttl_sec: string;
};

export enum NotificationAction {
  confirmation_code = 'confirmation_code',
  confirmation_link = 'confirmation_link',
  account_create = 'account_create',
  password_change = 'password_change',
  password_recover = 'password_recover',
  invite = 'invite',
}

export interface IBaseEmailParams {
  action: NotificationAction;
  user_id?: string;
}

export type TEmailParams =
  | IAccountCreateEmailParams
  | IConfirmationEmailCodeParams
  | IConfirmationEmailLinkParams
  | IPasswordChangeEmailParams
  | IPasswordRecoverEmailParams
  | IInviteEmailParams;

export interface IAccountCreateEmailParams extends IBaseEmailParams {
  action: NotificationAction.account_create;
  password: string;
}

export interface IConfirmationEmailCodeParams extends IBaseEmailParams {
  action: NotificationAction.confirmation_code;
  app_name: string;
  code: string;
  expires_date: string;
  timezone: string;
}

export interface IPasswordRecoverEmailParams extends IBaseEmailParams {
  action: NotificationAction.password_recover;
  app_name: string;
  code: string;
  expires_date: string;
  timezone: string;
}

export interface IPasswordChangeEmailParams extends IBaseEmailParams {
  action: NotificationAction.password_change;
  login: string;
  password: string;
}

export interface IConfirmationEmailLinkParams extends IBaseEmailParams {
  action: NotificationAction.confirmation_link;
  app_name: string;
  code: string;
  reference: string;
  expires_date: string;
  timezone: string;
}

export interface IInviteEmailParams extends IBaseEmailParams {
  action: NotificationAction.invite;
  app_name: string;
  reference: string;
  link_name: string;
}

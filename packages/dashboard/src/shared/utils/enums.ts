export enum ERoles {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  USER = "USER",
  TRUSTED_USER = "TRUSTED_USER",
}

export enum Order {
  ASC = "asc",
  DESC = "desc",
}

export enum ECoverModes {
  NONE = "",
  INHERIT = "INHERIT",
  REPLACE = "REPLACE",
}

/**
 * Intermediate tabs
 */
export enum tabs {
  profile = "profile",
  clients = "clients",
  settings = "settings",
  eventLog = "event-log",
  request = "request",
  users = "users",
  scopes = "scopes",
  catalog = "catalog",
  widget = "widget",
}

/**
 * Action tabs
 */
export enum subTabs {
  create = "create",
  delete = "delete",
  edit = "edit",
}

/**
 * Initial routers
 */
export enum routes {
  profile = "my",
  system = "main",
  customer = "app",
  admin = "admin",
}

export enum RuleFieldNames {
  password = "password",
  sub = "sub",
  login = "login",
  email = "email",
  givenName = "given_name",
  familyName = "family_name",
  phoneNumber = "phone_number",
  birthdate = "birthdate",
  picture = "picture",
  agreement = "data_processing_agreement",
  includes = "includes",
}

export enum endPoints {
  profile = "profile",
  users = "users",
  clients = "clients",
  providers = "providers",
  settings = "settings",
  catalog = "catalog",
  orgs = "orgs",
  verification = "verification",
  sentry = "sentry",
  invitations = "invitations",
  logs = "logs",
}

export enum ETags {
  Catalog = "Catalog",
  User = "User",
  ClientUser = "ClientUser",
  Claims = "Claims",
  ExternalAccounts = "ExternalAccounts",
  PublicExternalAccounts = "PublicExternalAccounts",
  Providers = "Providers",
  Settings = "Settings",
  ProfileFields = "ProfileFields",
  Rules = "Rules",
  ClientTypes = "ClientTypes",
  Clients = "Clients",
  ClientDetails = "ClientDetails",
  Cards = "Cards",
  UserCards = "UserCards",
  EmailTemplates = "EmailTemplates",
  Organization = "Organization",
  OrgLkSelfConnect = "OrgLkSelfConnect",
  Scopes = "Scopes",
  Invites = "Invites",
}

export enum EEmailAction {
  account_create = "account_create",
  confirmation_code = "confirmation_code",
  confirmation_link = "confirmation_link",
  password_change = "password_change",
  password_recover = "password_recover",
}

export enum ENoticeType {
  error = "error",
  info = "info",
  warning = "warning",
}

export enum EClaimPrivacy {
  request = "publicOauth",
  public = "publicGravatar",
  private = "private",
}

export enum EClaimPrivacyNumber {
  private = 0,
  request = 1,
  public = 2,
}

export enum AuthMethodTypes {
  login = "login",
  session = "session",
  oauth = "oauth",
  otp = "otp",
  mtls = "mtls",
  webauthn = "webauthn",
}

export enum EEventLog {
  USER_LOGIN_SUCCESS = "USER_LOGIN_SUCCESS",
  USER_DELETED_DB = "USER_DELETED_DB",
  USER_DELETE = "USER_DELETE",
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_RESTORE = "USER_RESTORE",
  USER_BLOCK = "USER_BLOCK",
  USER_UNBLOCK = "USER_UNBLOCK",
  INVITATION_CREATE = "INVITATION_CREATE",
  INVITATION_DELETE = "INVITATION_DELETE",
  INVITATION_CONFIRM = "INVITATION_CONFIRM",
}

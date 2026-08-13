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
  tokens = "tokens",
  clients = "clients",
  organizations = "organizations",
  settings = "settings",
  system = "system",
  profileSettings = "profile-settings",
  systemProfileSettings = "system-profile-settings",
  styling = "styling",
  emailTemplates = "email-templates",
  eventLog = "event-log",
  request = "request",
  users = "users",
  scopes = "scopes",
  catalog = "catalog",
  folders = "folders",
  roles = "roles",
  rbac = "rbac",
  widget = "widget-settings",
  password = "change-password",
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
  tokens = "tokens",
  users = "users",
  groups = "groups",
  clients = "clients",
  organizations = "organizations",
  providers = "providers",
  settings = "settings",
  statistics = "statistics",
  catalog = "catalog",
  verification = "verification",
  sentry = "sentry",
  winston = "winston",
  invitations = "invitations",
  logs = "logs",
  folders = "folders",
  rbac = "rbac",
  notifications = "notifications",
}

export enum ETags {
  Catalog = "Catalog",
  User = "User",
  Groups = "Groups",
  GroupUsers = "GroupUsers",
  ApplicationAccessGroups = "ApplicationAccessGroups",
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
  Notifications = "Notifications",
  Scopes = "Scopes",
  OidcScopes = "OidcScopes",
  Tokens = "Tokens",
  Invites = "Invites",
  Folders = "Folders",
  FolderRelations = "FolderRelations",
  RbacGroups = "RbacGroups",
  RbacGroupRelations = "RbacGroupRelations",
  RbacRoles = "RbacRoles",
  RbacResources = "RbacResources",
  RbacAssignments = "RbacAssignments",
  Folder = "Folder",
  DirectoryUser = "DirectoryUser",
}

export enum EEmailAction {
  account_create = "account_create",
  confirmation_code = "confirmation_code",
  confirmation_link = "confirmation_link",
  password_change = "password_change",
  password_recover = "password_recover",
  invite = "invite",
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

export enum ETagColor {
  red = "#990000",
  green = "#006633",
  blue = "#003399",
  yellow = "#CC9900",
}

export enum EProviderGroups {
  BIG = 'BIG',
  SMALL = 'SMALL',
}

/**
 * Role types
 */
export enum UserRoles {
  /**
   * Owner
   */
  OWNER = 'OWNER',
  /**
   * Administrator
   */
  ADMIN = 'ADMIN',
  /**
   * Editor
   */
  EDITOR = 'EDITOR',
  /**
   * User
   */
  USER = 'USER',
  /**
   * Guest
   */
  NONE = 'NONE',
}

export enum ECoverModes {
  NONE = '',
  INHERIT = 'INHERIT',
  REPLACE = 'REPLACE',
}

export enum Actions {
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  USER_DELETED_DB = 'USER_DELETED_DB',
  USER_DELETE = 'USER_DELETE',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_RESTORE = 'USER_RESTORE',
  USER_BLOCK = 'USER_BLOCK',
  USER_UNBLOCK = 'USER_UNBLOCK',
  INVITATION_CREATE = 'INVITATION_CREATE',
  INVITATION_DELETE = 'INVITATION_DELETE',
  INVITATION_CONFIRM = 'INVITATION_CONFIRM',
}

export enum ELocales {
  en = 'en-US',
  es = 'es-ES',
  fr = 'fr-FR',
  de = 'de-DE',
  ru = 'ru-RU',
  it = 'it-IT',
}

/**
 * List of sorting types
 */
export enum SortDirection {
  /**
   * Ascending
   */
  ASC = 'asc',
  /**
   * Descending
   */
  DESC = 'desc',
}

export enum RegistrationPolicyVariants {
  allowed = 'allowed',
  allowed_autoregistration_only = 'allowed_autoregistration_only',
  disabled = 'disabled',
}

export enum StringAsBoolean {
  TRUE = 'true',
  FALSE = 'false',
}

export enum EClaimPrivacy {
  request = 'publicOauth',
  public = 'publicGravatar',
  private = 'private',
}

export enum EProviderTypes {
  /**
   * Custom OAuth provider
   */
  CUSTOM = 'CUSTOM',
  /**
   * Google OAuth provider
   */
  GOOGLE = 'GOOGLE',
  /**
   * CREDENTIALS provider
   */
  CREDENTIALS = 'CREDENTIALS',
  /**
   * EMAIL provider
   */
  EMAIL = 'EMAIL',
  /**
   * EMAIL_CUSTOM provider
   */
  EMAIL_CUSTOM = 'EMAIL_CUSTOM',
  /**
   * PHONE provider
   */
  PHONE = 'PHONE',
  /**
   * KLOUD provider
   */
  KLOUD = 'KLOUD',
  /**
   * ETHEREUM provider
   */
  ETHEREUM = 'ETHEREUM',
  /**
   * TOTP provider (Time-based One-Time Password)
   */
  TOTP = 'TOTP',
  /**
   * HOTP provider (HMAC-based One-Time Password)
   */
  HOTP = 'HOTP',
  /**
   * MTLS provider
   */
  MTLS = 'MTLS',
  /**
   * WEBAUTHN provider
   */
  WEBAUTHN = 'WEBAUTHN',
}

export enum EGetProviderAction {
  auth = 'auth',
}

export enum EGrantTypes {
  authorization_code = 'authorization_code',
  implicit = 'implicit',
  refresh_token = 'refresh_token',
}

export enum IdentifierType {
  /**
   * Email
   */
  Email = 'email',
  /**
   * Phone
   */
  PhoneNumber = 'phone_number',
  /**
   * Login
   */
  Login = 'login',
  /**
   * ID in service
   */
  ID = 'id',
}

export enum Ei18nCodes {
  //#region Fields
  T3F0001 = 'translation.fields.sub',
  T3F0002 = 'translation.fields.login',
  T3F0003 = 'translation.fields.email',
  T3F0004 = 'translation.fields.given_name',
  T3F0005 = 'translation.fields.family_name',
  T3F0006 = 'translation.fields.phone_number',
  T3F0007 = 'translation.fields.birthdate',
  T3F0008 = 'translation.fields.nickname',
  T3F0009 = 'translation.fields.picture',
  T3F0010 = 'translation.fields.data_processing_consent',
  T3F0011 = 'translation.fields.password',
  //#endregion
  //#region Errors
  T3E0000 = 'translation.errors.T3E0000',
  /**
   * Invalid credentials
   */
  T3E0001 = 'translation.errors.T3E0001',
  /**
   * Identifier not specified
   */
  T3E0002 = 'translation.errors.T3E0002',
  /**
   * User not found
   */
  T3E0003 = 'translation.errors.T3E0003',
  /**
   * To change the phone number, use another endpoint
   */
  T3E0004 = 'translation.errors.T3E0004',
  /**
   * Account is already linked to your profile
   */
  T3E0005 = 'translation.errors.T3E0005',
  /**
   * Account is already linked to another profile
   */
  T3E0006 = 'translation.errors.T3E0006',
  /**
   * Password not specified
   */
  T3E0007 = 'translation.errors.T3E0007',
  /**
   * Cannot remove the first owner
   */
  T3E0008 = 'translation.errors.T3E0008',
  /**
   * Cannot change the role of the application owner
   */
  T3E0009 = 'translation.errors.T3E0009',
  /**
   * Cannot assign the role of application owner
   */
  T3E0010 = 'translation.errors.T3E0010',
  /**
   * Cannot change the role of the sole administrator
   */
  T3E0011 = 'translation.errors.T3E0011',
  /**
   * Cannot remove role from the main application
   */
  T3E0012 = 'translation.errors.T3E0012',
  /**
   * DSN is missing
   */
  T3E0013 = 'translation.errors.T3E0013',
  /**
   * Old password not specified
   */
  T3E0014 = 'translation.errors.T3E0014',
  /**
   * Session token is missing
   */
  T3E0015 = 'translation.errors.T3E0015',
  /**
   * Rule not found
   */
  T3E0016 = 'translation.errors.T3E0016',
  /**
   * Field is not editable
   */
  T3E0017 = 'translation.errors.T3E0017',
  /**
   * Invalid parameters
   */
  T3E0018 = 'translation.errors.T3E0018',
  /**
   * Email is not unique
   */
  T3E0019 = 'translation.errors.T3E0019',
  /**
   * User email not specified
   */
  T3E0021 = 'translation.errors.T3E0021',
  /**
   * Cannot unblock oneself
   */
  T3E0022 = 'translation.errors.T3E0022',
  /**
   * User deleted
   */
  T3E0023 = 'translation.errors.T3E0023',
  /**
   * User blocked
   */
  T3E0024 = 'translation.errors.T3E0024',
  /**
   * Cannot delete rol
   */
  T3E0025 = 'translation.errors.T3E0025',
  /**
   * Access denied
   */
  T3E0026 = 'translation.errors.T3E0026',
  /**
   * Cannot disable all identifiers
   */
  T3E0027 = 'translation.errors.T3E0027',
  /**
   * Only 'login', 'email' and 'phone_number' can be identifiers
   */
  T3E0028 = 'translation.errors.T3E0028',
  /**
   * Failed to convert phone number
   */
  T3E0029 = 'translation.errors.T3E0029',
  /**
   * Provider not found
   */
  T3E0030 = 'translation.errors.T3E0030',
  /**
   * Method not implemented
   */
  T3E0031 = 'translation.errors.T3E0031',
  /**
   * Found more than one user
   */
  T3E0032 = 'translation.errors.T3E0032',
  /**
   * Device registration failed
   */
  T3E0033 = 'translation.errors.T3E0033',
  /**
   * Challenge not found or expired
   */
  T3E0034 = 'translation.errors.T3E0034',
  /**
   * Verification failed
   */
  T3E0035 = 'translation.errors.T3E0035',
  /**
   * Provider already exists
   */
  T3E0036 = 'translation.errors.T3E0036',
  /**
   * Failed to retrieve user information
   */
  T3E0037 = 'translation.errors.T3E0037',
  /**
   * Nonce not found
   */
  T3E0038 = 'translation.errors.T3E0038',
  /**
   * State not found
   */
  T3E0039 = 'translation.errors.T3E0039',
  /**
   * Cannot delete the last identifier
   */
  T3E0040 = 'translation.errors.T3E0040',
  /**
   * Field with this name already exists in the main fields
   */
  T3E0041 = 'translation.errors.T3E0041',
  /**
   * Field with this name or header already exists
   */
  T3E0042 = 'translation.errors.T3E0042',
  /**
   * Cannot make a non-editable field mandatory
   */
  T3E0043 = 'translation.errors.T3E0043',
  /**
   * Cannot make a non-active field mandatory
   */
  T3E0044 = 'translation.errors.T3E0044',
  /**
   * Cannot make a unique field with a default value
   */
  T3E0045 = 'translation.errors.T3E0045',
  /**
   * Profile field not found
   */
  T3E0046 = 'translation.errors.T3E0046',
  /**
   * Cannot change the name or description for main fields
   */
  T3E0047 = 'translation.errors.T3E0047',
  /**
   * Cannot make a non-active field mandatory
   */
  T3E0048 = 'translation.errors.T3E0048',
  /**
   * Cannot use names or descriptions of main fields
   */
  T3E0049 = 'translation.errors.T3E0049',
  /**
   * Field with this name or header already exists
   */
  T3E0050 = 'translation.errors.T3E0050',
  /**
   * Cannot make avatar mandatory
   */
  T3E0051 = 'translation.errors.T3E0051',
  /**
   * Client certificate not provided
   */
  T3E0052 = 'translation.errors.T3E0052',
  /**
   * Client certificate is invalid
   */
  T3E0053 = 'translation.errors.T3E0053',
  /**
   * Too many attempts
   */
  T3E0054 = 'translation.errors.T3E0054',
  /**
   * Phone number not found
   */
  T3E0055 = 'translation.errors.T3E0055',
  /**
   * Service unavailable
   */
  T3E0056 = 'translation.errors.T3E0056',
  /**
   * Email not found
   */
  T3E0057 = 'translation.errors.T3E0057',
  /**
   * Avatar not found
   */
  T3E0058 = 'translation.errors.T3E0058',
  /**
   * Role not found
   */
  T3E0059 = 'translation.errors.T3E0059',
  /**
   * Basic invalid
   */
  T3E0060 = 'translation.errors.T3E0060',
  /**s
   * Authorization invalid
   */
  T3E0061 = 'translation.errors.T3E0061',
  T3E0062 = 'translation.errors.T3E0062',
  T3E0063 = 'translation.errors.T3E0063',
  T3E0064 = 'translation.errors.T3E0064',
  T3E0065 = 'translation.errors.T3E0065',
  T3E0066 = 'translation.errors.T3E0066',
  T3E0067 = 'translation.errors.T3E0067',
  T3E0068 = 'translation.errors.T3E0068',
  T3E0069 = 'translation.errors.T3E0069',
  T3E0070 = 'translation.errors.T3E0070',
  T3E0071 = 'translation.errors.T3E0071',
  T3E0072 = 'translation.errors.T3E0072',
  T3E0073 = 'translation.errors.T3E0073',
  T3E0074 = 'translation.errors.T3E0074',
  T3E0075 = 'translation.errors.T3E0075',
  T3E0076 = 'translation.errors.T3E0076',
  T3E0077 = 'translation.errors.T3E0077',
  T3E0078 = 'translation.errors.T3E0078',
  T3E0079 = 'translation.errors.T3E0079',
  T3E0080 = 'translation.errors.T3E0080',
  T3E0081 = 'translation.errors.T3E0081',
  T3E0082 = 'translation.errors.T3E0082',
  T3E0083 = 'translation.errors.T3E0083',
  T3E0084 = 'translation.errors.T3E0084',
  T3E0085 = 'translation.errors.T3E0085',
  T3E0086 = 'translation.errors.T3E0086',
  T3E0087 = 'translation.errors.T3E0087',
  T3E0088 = 'translation.errors.T3E0088',
  T3E0089 = 'translation.errors.T3E0089',
  T3E0090 = 'translation.errors.T3E0090',
  T3E0091 = 'translation.errors.T3E0091',
  T3E0092 = 'translation.errors.T3E0092',
  T3E0093 = 'translation.errors.T3E0093',
  T3E0094 = 'translation.errors.T3E0094',
  T3E0095 = 'translation.errors.T3E0095',
  T3E0096 = 'translation.errors.T3E0096',
  T3E0097 = 'translation.errors.T3E0097',
  T3E0098 = 'translation.errors.T3E0098',
  T3E0099 = 'translation.errors.T3E0099',
  T3E0100 = 'translation.errors.T3E0100',
  //#endregion
}

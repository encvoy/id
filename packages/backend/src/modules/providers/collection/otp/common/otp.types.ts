export const PROVIDER_TYPE_TOTP = 'TOTP';
export const PROVIDER_TYPE_HOTP = 'HOTP';
export const OTP_ALGORITHMS = ['sha1', 'sha256', 'sha512'] as const;

export type TOtpAlgorithm = (typeof OTP_ALGORITHMS)[number];

export interface IOtpSetupResponse {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  digits: number;
  algorithm: string;
  period?: number;
  counter?: number;
  state: string;
}

export type OtpSetupResponseData = Omit<IOtpSetupResponse, 'state'>;

export type OtpSetupData = {
  secret: string;
  digits?: number;
  period?: number;
  counter?: number;
  algorithm?: string;
};

export type OtpSetupRecord = {
  userId: string;
  providerId: string;
  providerType: string;
  interactionId?: string;
  setupData: OtpSetupData;
};

export type OtpAccountRestInfo = {
  secret: string;
  digits: number;
  algorithm: string;
  backup_codes: string[];
  enabled: boolean;
  provider_id?: string;
  period?: number;
  counter?: number;
};

export type OtpBindAccountPayload = {
  sub: string;
  issuer: string;
  type: string;
  label: string;
  rest_info: OtpAccountRestInfo;
};

export type OtpBindAccountParams = {
  token: string;
  state: string;
  provider_id: string;
  interaction_id?: string;
};

export type OtpInteractionAuthParams = {
  identifier?: string;
  code?: string;
  otp_setup?: boolean | 'true' | 'false';
  otp_not_available?: boolean | 'true' | 'false';
  state?: string;
};

export type OtpProviderSetupParams = {
  digits?: number;
  period?: number;
  counter?: number;
  algorithm?: string;
};

export type OtpVerificationResult = {
  restInfo: OtpAccountRestInfo;
  shouldPersist?: boolean;
};

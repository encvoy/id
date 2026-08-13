import { IProvider } from "src/shared/api/provider";
import { getDirtyFieldsValues, randomString } from "src/shared/utils/helpers";

/**
 * Enum for provider avatars
 */
export enum ProviderAvatars {
  ETHEREUM = "public/default/ethereum.svg",
  MTLS = "public/default/mtls.svg",
  WEBAUTHN = "public/default/webauthn.svg",
  KLOUD = "public/default/kloud.svg",
  TOTP = "public/default/totp.svg",
  HOTP = "public/default/hotp.svg",
  GITHUB = "public/default/github.svg",
  GOOGLE = "public/default/google.svg",
  EMAIL = "public/default/email.svg",
  PHONE = "public/default/phone.svg",
  EMAIL_CUSTOM = "public/default/email_custom.svg",
}

export const OTP_ALGORITHM_OPTIONS = ["SHA1", "SHA256", "SHA512"] as const;

export const OTP_ALGORITHM_DEFAULT = "SHA1";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const buildProviderUpdatePayload = <T extends Record<string, any>>(
  values: IProvider<T>,
  dirtyFields: Partial<Record<keyof IProvider<T>, unknown>>,
  options?: {
    params?: Partial<T>;
  }
): Partial<IProvider<T>> => {
  const payload = getDirtyFieldsValues(values, dirtyFields);
  const nextPayload: Partial<IProvider<T>> = {
    id: values.id,
    client_id: values.client_id,
    type: values.type,
    ...payload,
  };

  if (options?.params && Object.keys(options.params).length > 0) {
    nextPayload.params = {
      ...(isPlainObject(nextPayload.params) ? nextPayload.params : {}),
      ...options.params,
    } as T;
  }

  return nextPayload;
};

export const scopesToChips = (scopes?: string | null) =>
  String(scopes ?? "")
    .split(/\s+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => ({
      key: randomString(10),
      value,
    }));

export const chipsToScopes = (chips: Array<{ value: string }>) =>
  chips
    .map((chip) => chip.value.trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

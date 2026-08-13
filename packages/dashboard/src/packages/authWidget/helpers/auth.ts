import Cookies from "universal-cookie";
import { EDefaultConfigValues, TrustedWidgetConfig } from "../types";
import { APP_BASE_PATH } from "src/shared/utils/appBasePath";

const cookies = new Cookies();
const AUTH_STATE_STORAGE_PREFIX = "oidc_auth_state_";
const PENDING_RETURN_TO_STORAGE_KEY = "oidc_pending_return_to";
const AUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
const AUTH_ROUTE_PATHS = new Set(["/login", "/code"]);
const TRUSTED_WIDGET_REFRESH_EVENT = "trusted-widget:refresh-profile";

const isBrowser = (): boolean => typeof window !== "undefined";

export const refreshTrustedWidgetProfile = (): void => {
  if (!isBrowser()) return;

  window.dispatchEvent(new Event(TRUSTED_WIDGET_REFRESH_EVENT));
};

export const onTrustedWidgetProfileRefresh = (
  handler: () => void
): (() => void) => {
  if (!isBrowser()) return () => undefined;

  window.addEventListener(TRUSTED_WIDGET_REFRESH_EVENT, handler);
  return () => window.removeEventListener(TRUSTED_WIDGET_REFRESH_EVENT, handler);
};

const getReturnToFromLocation = (): string => {
  if (!isBrowser()) return "";

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const normalizeReturnTo = (value?: string | null): string => {
  if (!isBrowser() || !value) return "";

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return "";
    }

    const pathname = url.pathname.startsWith(`${APP_BASE_PATH}/`)
      ? url.pathname.slice(APP_BASE_PATH.length)
      : url.pathname;

    if (AUTH_ROUTE_PATHS.has(pathname)) {
      return "";
    }

    return `${pathname}${url.search}${url.hash}`;
  } catch (error) {
    console.warn("normalizeReturnTo error:", error);
    return "";
  }
};

const pruneAuthStates = (): void => {
  if (!isBrowser()) return;

  for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
    const key = window.sessionStorage.key(i);
    if (!key || !key.startsWith(AUTH_STATE_STORAGE_PREFIX)) {
      continue;
    }

    try {
      const rawState = window.sessionStorage.getItem(key);
      if (!rawState) {
        window.sessionStorage.removeItem(key);
        continue;
      }

      const parsedState = JSON.parse(rawState) as { createdAt?: number };
      if (
        !parsedState.createdAt ||
        Date.now() - parsedState.createdAt > AUTH_STATE_MAX_AGE_MS
      ) {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("pruneAuthStates error:", error);
      window.sessionStorage.removeItem(key);
    }
  }
};

const getPendingReturnTo = (): string => {
  if (!isBrowser()) return "";

  return normalizeReturnTo(
    window.sessionStorage.getItem(PENDING_RETURN_TO_STORAGE_KEY)
  );
};

const createAuthState = (): string => {
  if (!isBrowser()) return "";

  pruneAuthStates();

  const returnTo =
    getPendingReturnTo() || normalizeReturnTo(getReturnToFromLocation());
  if (!returnTo) {
    return "";
  }

  const state = randomString();
  window.sessionStorage.setItem(
    `${AUTH_STATE_STORAGE_PREFIX}${state}`,
    JSON.stringify({
      createdAt: Date.now(),
      returnTo,
    })
  );

  return state;
};

export const setPendingReturnTo = (value?: string | null): void => {
  if (!isBrowser()) return;

  const normalizedValue = normalizeReturnTo(value);
  if (!normalizedValue) {
    window.sessionStorage.removeItem(PENDING_RETURN_TO_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(PENDING_RETURN_TO_STORAGE_KEY, normalizedValue);
};

export const consumePostLoginReturnTo = (): string => {
  if (!isBrowser()) return "";

  pruneAuthStates();

  const urlParams = new URLSearchParams(window.location.search);
  const state = urlParams.get("state");
  let returnTo = "";

  if (state) {
    const storageKey = `${AUTH_STATE_STORAGE_PREFIX}${state}`;
    const rawState = window.sessionStorage.getItem(storageKey);

    if (rawState) {
      try {
        const parsedState = JSON.parse(rawState) as {
          createdAt?: number;
          returnTo?: string;
        };
        const isExpired =
          !parsedState.createdAt ||
          Date.now() - parsedState.createdAt > AUTH_STATE_MAX_AGE_MS;

        if (!isExpired) {
          returnTo = normalizeReturnTo(parsedState.returnTo);
        }
      } catch (error) {
        console.warn("consumePostLoginReturnTo error:", error);
      }
    }

    window.sessionStorage.removeItem(storageKey);
  }

  if (!returnTo) {
    returnTo = getPendingReturnTo();
  }

  window.sessionStorage.removeItem(PENDING_RETURN_TO_STORAGE_KEY);
  return returnTo;
};

export const getTokenByRefreshToken = async (
  appId: string,
  domain: string
): Promise<{
  access_token: string;
  id_token: string;
  expires_in: number | null;
}> => {
  const body = new URLSearchParams({
    client_id: appId,
  });

  const defaultData = { access_token: "", id_token: "", expires_in: null };

  try {
    const response = await fetch(domain + "/auth/refresh", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      credentials: "include",
      body,
    });

    if (response.ok) {
      const tokenData = await response.json();
      return tokenData;
    } else {
      throw new Error("Failed to refresh tokens");
    }
  } catch (e) {
    console.error("getTokensByRefreshToken error: " + e);
    logout();
  }

  return defaultData;
};

export const checkAccessToken = async (
  token: string,
  appId: string,
  domain: string
): Promise<{ active: boolean; exp: number | null }> => {
  const errorResult = { active: false, exp: null };
  try {
    const body = new URLSearchParams({
      token,
      client_id: appId,
      token_type_hint: "access_token",
    });

    const response = await fetch(domain + "/oidc/token/introspection", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body,
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      console.error("Token introspection failed:", response.status);
      return errorResult;
    }
  } catch (e) {
    console.error("checkAccessToken error: " + e);
    return errorResult;
  }
};

// Verify the validity of a JWT token
export const isTokenValid = async (token: string): Promise<boolean> => {
  if (!token) return false;

  try {
    // Simple check of the JWT token structure
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode payload to check expiration
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    const now = Math.floor(Date.now() / 1000);

    return payload.exp && payload.exp > now;
  } catch (e) {
    console.error("isTokenValid error:", e);
    return false;
  }
};

export const setDataToLocalStorage = (
  accessToken: string,
  expiresIn: number | null
): void => {
  if (accessToken) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresIn");
    localStorage.setItem("accessToken", accessToken);

    if (!expiresIn) return;
    const now = Date.now(); // already in ms
    const expiresAt = now + expiresIn * 1000;
    localStorage.setItem("expiresIn", expiresAt.toString());
  }
};

// Decodes a JWT token
export const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("decodeJWT error: " + e);
  }
};

// Get the cryptographic object
export const getCrypto = (): Crypto => {
  return window.crypto;
};

// Generate a random string
export const randomString = (): string => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let str = "";
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43))
  );
  randomValues.forEach((v) => (str += charset[v % charset.length]));
  return str;
};

export const setCodeVerifier = (): string => {
  const codeVerifier = randomString();
  window?.localStorage.setItem("codeVerifier", codeVerifier);
  return codeVerifier;
};

// Converts an ArrayBuffer to a base64url string
export const btoaRFC7636 = (buf: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const length = bytes.byteLength;
  for (let i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

// Converts a string to an ArrayBuffer
export const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

// Generate a SHA256 hash
export const sha256 = async (str: string): Promise<ArrayBuffer> => {
  const buffer = stringToArrayBuffer(str);
  const hashBuffer = await crypto.subtle?.digest("SHA-256", buffer);
  return hashBuffer;
};

// Get URL parameters and set code_verifier in cookie for PKCE
export const getUrlParams = (): string => {
  const queryString = window?.location.search;
  const urlParams = new URLSearchParams(queryString);
  const code = urlParams.get("code");
  const providerId = urlParams.get("provider_id");

  // If has code and provider_id, save code_verifier to cookie
  if (providerId && code) {
    // Unified format: only sessionStorage
    const codeVerifier = window.sessionStorage.getItem(
      `pkce_code_verifier_${providerId}`
    );
    if (codeVerifier) {
      cookies.set(`pkce_code_verifier_${providerId}`, codeVerifier, {
        path: `${APP_BASE_PATH}/api/interaction/code`,
        maxAge: 300, //5 minutes
      });
    }
  }

  return code || "";
};

// Change code for tokens
export const getTokensByCode = async (
  config: TrustedWidgetConfig
): Promise<{
  access_token: string;
  id_token: string;
  expires_in: number | null;
}> => {
  const code = getUrlParams();
  const defaultData = { access_token: "", id_token: "", expires_in: null };
  if (!code) {
    console.error("No code found in URL parameters");
    return defaultData;
  }

  const codeVerifier = window?.localStorage.getItem("codeVerifier");
  const codeVerifierBase64 = codeVerifier
    ? btoaRFC7636(stringToArrayBuffer(codeVerifier))
    : "";

  try {
    const body = new URLSearchParams({
      code,
      code_verifier: codeVerifierBase64,
      redirect_uri: config.redirectUrl || window?.location.href,
      grant_type: "authorization_code",
      client_id: config.appId,
    });

    const response = await fetch(
      `${
        (config.issuer || EDefaultConfigValues.issuer) +
        (config.tokenEndPoint || EDefaultConfigValues.tokenEndPoint)
      }`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body,
      }
    );

    if (response.ok) {
      const tokenData = await response.json();
      return tokenData;
    } else {
      const errorText = await response.text();
      throw new Error(`Token request failed:${errorText}`);
    }
  } catch (e) {
    console.error("getTokenByCode error: ", e);
  }

  return defaultData;
};

export const login = async (config: TrustedWidgetConfig) => {
  const codeVerifier = setCodeVerifier();
  const codeVerifierBase64 = btoaRFC7636(stringToArrayBuffer(codeVerifier));
  const codeChallenge = btoaRFC7636(await sha256(codeVerifierBase64));
  const state = createAuthState();
  const scopes = EDefaultConfigValues.scopes.split(" ");
  if (config.scopes) {
    for (const scope of config.scopes) {
      if (!scopes.includes(scope)) {
        scopes.push(scope);
      }
    }
  }

  const params = new URLSearchParams({
    client_id: config.appId,
    response_type: "code",
    scope: scopes.join(" "),
    redirect_uri: config.redirectUrl || window.location.href,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });
  if (state) {
    params.set("state", state);
  }
  const url = `${
    config.issuer || EDefaultConfigValues.issuer
  }/oidc/auth?${params.toString()}`;
  window.location.href = url;
};

export const logout = (path?: string): void => {
  try {
    const preservedLanguage = window?.localStorage.getItem("i18nextLng");

    localStorage.removeItem("accessToken");

    // Remove all cookies related to authentication
    const allCookies = cookies.getAll();
    Object.keys(allCookies).forEach((cookieName) => {
      if (
        cookieName.includes("token") ||
        cookieName.includes("auth") ||
        cookieName.includes("session")
      ) {
        for (const cookiePath of new Set(["/", APP_BASE_PATH || "/"])) {
          cookies.remove(cookieName, { path: cookiePath });
        }
      }
    });

    window?.localStorage.clear();
    window?.sessionStorage.clear();
    if (preservedLanguage !== null) {
      window?.localStorage.setItem("i18nextLng", preservedLanguage);
    }

    window.location.href = path || APP_BASE_PATH || "/";
  } catch (error) {
    console.error("Error during aggressive logout:", error);
    window?.location.reload();
  }
};

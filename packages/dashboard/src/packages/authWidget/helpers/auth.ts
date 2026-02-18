import Cookies from "universal-cookie";
import { EDefaultConfigValues, WidgetConfig } from "../types";

const cookies = new Cookies();

export const getTokenByRefreshToken = async (
  appId: string,
  domain: string
): Promise<{
  access_token: string;
  id_token: string;
  expires_in: number | null;
}> => {
  const body = new URLSearchParams({
    client_id: encodeURIComponent(appId),
  });

  const defaultData = { access_token: "", id_token: "", expires_in: null };

  try {
    const response = await fetch(domain + "/auth/refresh", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded ",
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
      token: encodeURIComponent(token),
      client_id: encodeURIComponent(appId),
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
        path: "/api/interaction/code",
        maxAge: 300, //5 minutes
      });
    }
  }

  return code || "";
};

// Change code for tokens
export const getTokensByCode = async (
  config: WidgetConfig
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

export const login = async (config: WidgetConfig) => {
  const codeVerifier = setCodeVerifier();
  const codeVerifierBase64 = btoaRFC7636(stringToArrayBuffer(codeVerifier));
  const codeChallenge = btoaRFC7636(await sha256(codeVerifierBase64));
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
  const url = `${
    config.issuer || EDefaultConfigValues.issuer
  }/oidc/auth?${params.toString()}`;
  window.location.href = url;
};

export const logout = (path?: string): void => {
  try {
    localStorage.removeItem("accessToken");

    // Remove all cookies related to authentication
    const allCookies = cookies.getAll();
    Object.keys(allCookies).forEach((cookieName) => {
      if (
        cookieName.includes("token") ||
        cookieName.includes("auth") ||
        cookieName.includes("session")
      ) {
        cookies.remove(cookieName, { path: "/" });
      }
    });

    window?.localStorage.clear();
    window?.sessionStorage.clear();

    window.location.href = path || "/";
  } catch (error) {
    console.error("Error during aggressive logout:", error);
    window?.location.reload();
  }
};

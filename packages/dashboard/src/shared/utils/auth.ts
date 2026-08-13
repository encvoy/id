import {APP_PUBLIC_URL} from "./appBasePath";

export const getAccessToken = (): string => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) return accessToken;
  return "";
};

export const clearAccessToken = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("expiresIn");
};

export const isAccessTokenExpired = (): boolean => {
  const expiresAtRaw = localStorage.getItem("expiresIn");
  if (!expiresAtRaw) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return true;
  }

  return Date.now() >= expiresAt;
};

export const logout = async (): Promise<void> => {
  clearAccessToken();

  window.location.href = APP_PUBLIC_URL;
};

type AuthConfigResponse = {
  system_client_id: string;
};

export const fetchAuthConfig = async (): Promise<AuthConfigResponse> => {
  const response = await fetch(`${APP_PUBLIC_URL}/auth/config`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load auth config: ${response.status}`);
  }

  const data = (await response.json()) as Partial<AuthConfigResponse>;
  if (
    typeof data.system_client_id !== "string" ||
    data.system_client_id.trim() === ""
  ) {
    throw new Error("Auth config response does not contain system_client_id");
  }

  return {
    system_client_id: data.system_client_id.trim(),
  };
};

import { IClient } from "src/shared/api/clients";

export const getFirstClientInfo = async (
  clientId: string
): Promise<IClient | undefined> => {
  try {
    const response = await fetch(
      APP_PUBLIC_URL + `/api/v1/clients/` + clientId,
      {
        method: "GET",
      }
    );

    return await response.json();
  } catch (e) {
    console.error("getFirstClientInfo error: ", e);
  }
};

export const checkIdentifier = async (identifier: string) => {
  try {
    const body = "identifier=" + encodeURIComponent(identifier);

    const response = await fetch(
      APP_PUBLIC_URL + "/api/v1/auth/check_identifier",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded ",
        },
        method: "POST",
        body,
      }
    );
    if (!response.ok) {
      return false;
    }
    const { is_active } = await response.json();
    return is_active;
  } catch (e) {
    console.error("checkIdentifier error: ", e);
  }
};

import { Response } from "express";
import { resolveRuntimeDomain } from "./runtime-domain";

export const REFRESH_TOKEN_COOKIE = "__Secure-id-refresh-token";
const LEGACY_REFRESH_TOKEN_COOKIE = "refreshToken";

const resolveAuthCookiePath = (): string => {
  try {
    const runtimeDomain = resolveRuntimeDomain() || "https://localhost";
    const basePath = new URL(runtimeDomain).pathname.replace(/\/+$/, "");
    return `${basePath}/auth`.replace(/\/{2,}/g, "/");
  } catch {
    return "/auth";
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: resolveAuthCookiePath(),
};

const clearLegacyRefreshToken = (res: Response) => {
  for (const path of new Set(["/", "/auth", resolveAuthCookiePath()])) {
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, {
      ...cookieOptions,
      path,
    });
  }
};

export const addRefreshToken = (res: Response, refreshToken?: string) => {
  if (refreshToken) {
    clearLegacyRefreshToken(res);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
  }
};

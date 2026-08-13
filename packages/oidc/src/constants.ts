import { requireRuntimeDomain, resolveRuntimeDomain } from "./runtime-domain.js";

export const DOMAIN = requireRuntimeDomain(resolveRuntimeDomain(process.env));
export const INTERNAL_REQUEST_HEADER = "x-trusted-internal-token";
export let CLIENT_ID = "";
export const setClientId = (clientId: string) => {
  CLIENT_ID = clientId;
};
export const OIDC_COOKIE_SECRET: string =
  process.env.OIDC_COOKIE_SECRET || "K0mdxlkfbd40JsvlvL93ldfv";
export const OIDC_SESSION_TTL = process.env.OIDC_SESSION_TTL || 24 * 60 * 60;

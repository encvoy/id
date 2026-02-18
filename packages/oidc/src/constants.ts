export const DOMAIN = process.env.VITE_DOMAIN || process.env.DOMAIN || "";
export const CLIENT_ID =
  process.env.VITE_CLIENT_ID || process.env.CLIENT_ID || "";
export const OIDC_COOKIE_SECRET: string =
  process.env.OIDC_COOKIE_SECRET || "K0mdxlkfbd40JsvlvL93ldfv";
export const OIDC_SESSION_TTL = process.env.OIDC_SESSION_TTL || 24 * 60 * 60;

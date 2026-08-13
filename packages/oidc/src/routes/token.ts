import Router from "@koa/router";
import { randomUUID } from "crypto";
import { BLOCKED_ERROR, isAuthorizationBlocked } from "../client-authorization.js";
import { requireInternalRequest } from "../internal-auth.js";
import { OIDC_PROVIDER } from "../main.js";
import { getDelegablePermissionsByRole } from "../permissions.js";
import { prisma } from "../prisma.js";

const tokenRouter = new Router({ prefix: "/oidc/api/tokens" });

const DEFAULT_PERSONAL_ACCESS_TOKEN_TTL = 30 * 24 * 60 * 60;
const PERSONAL_ACCESS_TOKEN_KIND = "personal_access";
const ACCESS_TOKEN_MODEL_KIND = "AccessToken";

function normalizePositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter((permission): permission is string => typeof permission === "string" && !!permission),
    ),
  ).sort();
}

tokenRouter.post("/", requireInternalRequest(), async (ctx) => {
  try {
    if (!OIDC_PROVIDER) {
      ctx.status = 500;
      ctx.body = { error: "OIDC_PROVIDER not initialized" };
      return;
    }

    const body = (ctx.request.body as any) || {};
    const accountId = `${body.accountId || ""}`.trim();
    const clientId = `${body.clientId || ""}`.trim();
    const permissions = normalizePermissions(body.permissions);
    const name = `${body.name || ""}`.trim();
    const neverExpires = normalizeBoolean(body.neverExpires);
    const expiresInRaw = Number.parseInt(`${body.expiresIn || ""}`, 10);

    if (!accountId || !clientId) {
      ctx.status = 400;
      ctx.body = { error: "accountId and clientId are required" };
      return;
    }

    if (!permissions.length) {
      ctx.status = 400;
      ctx.body = { error: "permissions are required" };
      return;
    }

    if (!accountId) {
      ctx.status = 400;
      ctx.body = { error: "accountId must be a non-empty string" };
      return;
    }

    const client = await OIDC_PROVIDER.Client.find(clientId);
    if (!client) {
      ctx.status = 404;
      ctx.body = { error: "Client not found" };
      return;
    }

    if (await isAuthorizationBlocked(accountId, clientId)) {
      ctx.status = 403;
      ctx.body = {
        error: "access_denied",
        error_description: BLOCKED_ERROR,
      };
      return;
    }

    const roleItem = await prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id: accountId,
          client_id: clientId,
        },
      },
      select: {
        role: true,
      },
    });
    const availablePermissions = await getDelegablePermissionsByRole(roleItem?.role);
    const requestedUnavailablePermissions = permissions.filter(
      (permission) => !availablePermissions.includes(permission),
    );

    if (requestedUnavailablePermissions.length) {
      ctx.status = 403;
      ctx.body = {
        error: "Requested permissions are not available",
        unavailable_permissions: requestedUnavailablePermissions,
      };
      return;
    }

    if (neverExpires) {
      const token = new OIDC_PROVIDER.AccessToken({
        accountId,
        client,
        scope: "",
        grantId: undefined as unknown as string,
        gty: "personal_access_token",
      });

      token.extra = {
        permissions,
        token_kind: PERSONAL_ACCESS_TOKEN_KIND,
        ...(name ? { token_name: name } : {}),
      };

      if (!token.jti) {
        token.jti = randomUUID();
      }

      const issuedAt = Math.floor(Date.now() / 1000);
      const payload = {
        jti: token.jti,
        kind: ACCESS_TOKEN_MODEL_KIND,
        iat: issuedAt,
        accountId,
        clientId: client.clientId,
        gty: "personal_access_token",
        scope: "",
        extra: token.extra,
      };

      await token.adapter.upsert(token.jti, payload, 0);

      ctx.body = {
        access_token: token.jti,
        token_type: "Bearer",
        expires_in: null,
        jti: token.jti,
        permissions,
      };
      return;
    }

    const expiresIn =
      Number.isFinite(expiresInRaw) && expiresInRaw > 0
        ? expiresInRaw
        : DEFAULT_PERSONAL_ACCESS_TOKEN_TTL;
    const token = new OIDC_PROVIDER.AccessToken({
      accountId,
      client,
      expiresIn,
      scope: "",
      grantId: undefined as unknown as string,
      gty: "personal_access_token",
    });

    token.extra = {
      permissions,
      token_kind: PERSONAL_ACCESS_TOKEN_KIND,
      ...(name ? { token_name: name } : {}),
    };

    const value = await token.save();
    const resolvedExpiresIn =
      normalizePositiveNumber(token.remainingTTL) ||
      expiresIn ||
      DEFAULT_PERSONAL_ACCESS_TOKEN_TTL;
    const resolvedExp =
      normalizePositiveNumber(token.exp) ||
      Math.floor(Date.now() / 1000) + resolvedExpiresIn;

    ctx.body = {
      access_token: value,
      token_type: "Bearer",
      expires_in: resolvedExpiresIn,
      exp: resolvedExp,
      jti: token.jti,
      permissions,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: "Failed to issue token",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

export default tokenRouter;

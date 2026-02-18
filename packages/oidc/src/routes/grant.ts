import Router from "@koa/router";
import { OIDC_PROVIDER } from "../main.js";
import { addScopeToGrant } from "../config.js";

const grantRouter = new Router({ prefix: "/oidc/api" });

grantRouter.get("/grants/:grantId", async (ctx) => {
  try {
    const { grantId } = ctx.params;
    if (!OIDC_PROVIDER || !OIDC_PROVIDER.Grant) {
      ctx.status = 500;
      ctx.body = { error: "OIDC_PROVIDER.Grant not initialized" };
      return;
    }
    const grant = await OIDC_PROVIDER.Grant.find(grantId);
    if (!grant) {
      ctx.status = 404;
      ctx.body = { error: "Grant not found" };
      return;
    }
    ctx.body = grant;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: "Failed to get grant",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// POST /oidc/api/grants
grantRouter.post("/grants", async (ctx) => {
  try {
    if (!OIDC_PROVIDER || !OIDC_PROVIDER.Grant) {
      ctx.status = 500;
      ctx.body = { error: "OIDC_PROVIDER.Grant not initialized" };
      return;
    }
    const body = (ctx.request.body as any) || {};
    const { accountId, clientId } = body;
    const grant = new OIDC_PROVIDER.Grant({
      accountId,
      clientId,
    });
    await grant.save();
    ctx.body = grant;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: "Failed to create grant",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// PATCH /oidc/api/grants/:grantId/scopes
grantRouter.patch("/grants/:grantId/scopes", async (ctx) => {
  try {
    const { grantId } = ctx.params;
    if (!OIDC_PROVIDER || !OIDC_PROVIDER.Grant) {
      ctx.status = 500;
      ctx.body = { error: "OIDC_PROVIDER.Grant not initialized" };
      return;
    }
    const grant = await OIDC_PROVIDER.Grant.find(grantId);
    if (!grant) {
      ctx.status = 404;
      ctx.body = { error: "Grant not found" };
      return;
    }
    const body = (ctx.request.body as any) || {};
    const { scopes } = body;
    if (scopes) {
      addScopeToGrant(grant, scopes);
      await grant.save();
    }
    ctx.body = grant;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: "Failed to update grant",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

export default grantRouter;

import Router from "@koa/router";
import { requireInternalRequest } from "../internal-auth.js";
import { updateRolePermissionsCache } from "../permissions.js";

const permissionsRouter = new Router();

permissionsRouter.post("/oidc/update-role-permissions", requireInternalRequest(), (ctx) => {
  try {
    const body = ctx.request.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid role permissions payload");
    }

    updateRolePermissionsCache(body);

    ctx.status = 200;
    ctx.body = { message: "Role permissions updated successfully" };
  } catch (error) {
    console.error("Failed to update role permissions cache:", error);
    ctx.status = 400;
    ctx.body = { error: "Failed to update role permissions cache" };
  }
});

export default permissionsRouter;

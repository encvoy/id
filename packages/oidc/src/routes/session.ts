import { redisClient } from "../redis.client.js";
import Router from "@koa/router";

const sessionRouter = new Router();

sessionRouter.get("/session/end", async (ctx) => {
  try {
    const { post_logout_redirect_uri, client_id } = ctx.query;

    ctx.cookies.set("accessToken", null, { httpOnly: true });
    ctx.cookies.set("refreshToken", null, { httpOnly: true });

    const sessionCookie = ctx.cookies.get("_session");
    if (sessionCookie) {
      try {
        await redisClient.del(`oidc:session:${sessionCookie}`);
        ctx.cookies.set("_session", null, { httpOnly: true });
        console.info(
          `[OIDC-SERVER] Session ${sessionCookie} deleted from Redis`
        );
      } catch (error) {
        console.error(
          "[OIDC-SERVER] Failed to delete session from Redis:",
          error
        );
      }
    }

    if (
      post_logout_redirect_uri &&
      typeof post_logout_redirect_uri === "string"
    ) {
      ctx.redirect(post_logout_redirect_uri);
      return;
    }

    ctx.body = {
      message: "Session ended successfully",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[OIDC-SERVER] Failed to end session:", error);
    ctx.status = 500;
    ctx.body = {
      error: "Failed to end session",
      timestamp: new Date().toISOString(),
    };
  }
});

export default sessionRouter;

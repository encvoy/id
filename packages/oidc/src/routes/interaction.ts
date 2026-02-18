import Router from "@koa/router";
import { OIDC_PROVIDER } from "../main.js";

const interactionRouter = new Router({ prefix: "/oidc/api" });

interactionRouter.post(
  "/interaction/details",
  async (ctx: Router.RouterContext) => {
    try {
      const { cookies, headers, url } =
        (ctx.request.body as { cookies?: any; headers?: any; url?: string }) ||
        {};
      // Create a mockReq based on ctx.req
      const mockReq = Object.assign(Object.create(ctx.req), {
        cookies,
        headers,
        url,
        method: "GET",
        query: {},
        body: {},
        originalUrl: url,
      });
      // Get OIDC_PROVIDER from the global scope (via require.main.exports or import)
      const interactionDetails = await OIDC_PROVIDER.interactionDetails(
        mockReq,
        ctx.res
      );
      ctx.body = interactionDetails;
    } catch (e) {
      ctx.status = 500;
      ctx.body = {
        error:
          "Failed to get interaction details. " + (e as any)?.error_description,
        details: (e as Error)?.message,
      };
    }
  }
);

export default interactionRouter;

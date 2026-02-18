import Router from "@koa/router";

const healthRouter = new Router();
healthRouter.get("/health", async (ctx) => {
  ctx.body = { status: "ok", timestamp: new Date().toISOString() };
});

export default healthRouter;

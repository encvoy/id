import Router from "@koa/router";

const healthRouter = new Router();
const sendHealth = async (ctx: any) => {
  ctx.body = { status: "ok", service: "oidc", timestamp: new Date().toISOString() };
};

healthRouter.get("/health", sendHealth);
healthRouter.get("/oidc/health", sendHealth);
healthRouter.get("/api/oidc/health", sendHealth);

export default healthRouter;

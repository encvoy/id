import Koa from "koa";
import Router from "@koa/router";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { Provider } from "oidc-provider";
import { createOidcConfiguration } from "./config.js";
import { redisClient } from "./redis.client.js";
import mount from "koa-mount";
import { DOMAIN } from "./constants.js";
import grantRouter from "./routes/grant.js";
import healthRouter from "./routes/health.js";
import interactionRouter from "./routes/interaction.js";
import sessionRouter from "./routes/session.js";
import NodeCache from "node-cache";

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION] at:", promise, "reason:", reason);
  process.exit(1);
});

export let OIDC_PROVIDER: Provider;

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

async function fetchAllowedOrigins(): Promise<string[]> {
  try {
    const response = await fetch(`${DOMAIN}/api/v1/clients/white-list`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json()) as { origins?: string[] };
    return data.origins ?? [];
  } catch (error) {
    console.error("Error fetching allowed origins:", error);
    return [DOMAIN];
  }
}

// Function to update the cache
function updateOriginsCache(origins: string[]): void {
  cache.set("allowedOrigins", origins);
}

async function startKoaServer() {
  if (!DOMAIN) {
    console.error("[KOA-SERVER-ERROR] DOMAIN не задан");
    process.exit(1);
  }

  // Main app for custom routes
  const app = new Koa();

  // Router for updating CORS
  const corsRouter = new Router();

  // Endpoint for updating CORS origins by an external service
  corsRouter.post("/oidc/update-cors", async (ctx) => {
    try {
      const body = ctx.request.body as any;
      const origins = body?.origins ?? [];
      if (!Array.isArray(origins)) {
        throw new Error("Invalid origins format: expected an array");
      }
      updateOriginsCache(origins);
      ctx.status = 200;
      ctx.body = { message: "CORS origins updated successfully" };
    } catch (error) {
      console.error("Failed to update CORS origins:", error);
      ctx.status = 400;
      ctx.body = { error: "Failed to update CORS origins" };
    }
  });

  // Global error handler for custom routes only
  app.use(async (ctx: any, next: any) => {
    try {
      await next();
    } catch (err) {
      ctx.status = (err as any).status || 500;
      ctx.body = {
        error: "Internal Server Error",
        message: (err as any).message || "Unexpected error",
      };
      ctx.app.emit("error", err, ctx);
    }
  });
  try {
    await redisClient.ping();
    const configuration = await createOidcConfiguration();
    OIDC_PROVIDER = new Provider(DOMAIN, configuration);
    OIDC_PROVIDER.proxy = true;

    // Custom middleware and routes for the main app only
    app.proxy = true;

    // Dynamic CORS middleware
    app.use(async (ctx, next) => {
      let allowedOrigins = cache.get("allowedOrigins") as string[] | undefined;
      if (!allowedOrigins) {
        allowedOrigins = await fetchAllowedOrigins();
        cache.set("allowedOrigins", allowedOrigins);
      }

      const origin = ctx.get("Origin");
      const isAllowed = allowedOrigins.includes(origin);

      if (isAllowed) {
        // Return the specific origin that made the request (CORS spec compliant)
        ctx.set("Access-Control-Allow-Origin", origin);
        ctx.set("Access-Control-Allow-Credentials", "true");
        ctx.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, Accept, Origin",
        );
        ctx.set(
          "Access-Control-Expose-Headers",
          "Access-Control-Allow-Origin, Access-Control-Allow-Credentials",
        );

        if (ctx.method === "OPTIONS") {
          ctx.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
          );
          ctx.status = 200;
          return;
        }
      }

      await next();
    });

    // Koa-compatible logger
    app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      let methodColor = "\x1b[32m";
      switch (ctx.method) {
        case "POST":
          methodColor = "\x1b[33m";
          break;
        case "PUT":
          methodColor = "\x1b[34m";
          break;
        case "DELETE":
          methodColor = "\x1b[31m";
          break;
        case "PATCH":
          methodColor = "\x1b[35m";
          break;
      }
      let statusColor = "\x1b[0m";
      if (ctx.status >= 500) statusColor = "\x1b[31m";
      else if (ctx.status >= 400) statusColor = "\x1b[33m";
      else if (ctx.status >= 300) statusColor = "\x1b[36m";
      else if (ctx.status >= 200) statusColor = "\x1b[32m";
      let forwardedFor = ctx.headers["x-forwarded-for"];
      let forwardedIp: string | undefined;
      if (typeof forwardedFor === "string") {
        forwardedIp = forwardedFor.split(",")[0];
      } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        forwardedIp = forwardedFor[0].split(",")[0];
      }
      const ip = ctx.ip || ctx.request.ip || forwardedIp || "unknown";
      console.info(
        `\x1b[36m[OIDC]\x1b[0m ${
          new Date().toISOString().split("T")[1].split(".")[0]
        } | ${ip.split(":").pop()} | ${methodColor}${ctx.method}\x1b[0m ${
          ctx.url
        } | ${statusColor}${ctx.status}\x1b[0m | ${ms}ms`,
      );
      if (ctx.status >= 400 && ctx.body) {
        if (
          typeof ctx.body === "string" &&
          ctx.body.trim().startsWith("<!DOCTYPE html>")
        ) {
          console.error(
            `\x1b[31m[ERROR][HTML]\x1b[0m ${ctx.body.slice(0, 200)}...`,
          );
        } else {
          try {
            const responseBody =
              typeof ctx.body === "string" ? JSON.parse(ctx.body) : ctx.body;
            const errorMsg =
              responseBody.error_description ||
              responseBody.error ||
              responseBody.message ||
              JSON.stringify(responseBody);
            console.error(`\x1b[31m[ERROR]\x1b[0m ${errorMsg}`);
          } catch (e) {
            console.error(
              `\x1b[31m[ERROR]\x1b[0m Error of parsing response body:`,
              ctx.body,
            );
          }
        }
      }
    });

    app.use(bodyParser());
    app.use(corsRouter.routes()).use(corsRouter.allowedMethods());

    app.use(grantRouter.routes()).use(grantRouter.allowedMethods());
    app.use(healthRouter.routes()).use(healthRouter.allowedMethods());
    app.use(interactionRouter.routes()).use(interactionRouter.allowedMethods());
    app.use(sessionRouter.routes()).use(sessionRouter.allowedMethods());

    // Mount the OIDC provider on a separate clean app
    const oidcApp = OIDC_PROVIDER.app;
    app.use(mount("/oidc", oidcApp));

    const server = app.listen(3003, () => {
      console.info(
        `[KOA-SERVER] Discovery endpoint: ${DOMAIN}/oidc/.well-known/openid-configuration`,
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[OIDC] Received ${signal}, closing server gracefully...`);

      server.close(async () => {
        console.log("[OIDC] HTTP server closed");

        try {
          await redisClient.quit();
          console.log("[OIDC] Redis connection closed");
        } catch (error) {
          console.error("[OIDC] Error closing Redis:", error);
        }

        console.log("[OIDC] Shutdown complete");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("[OIDC] Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("[KOA-SERVER-ERROR]:", error);
    process.exit(1);
  }
}

startKoaServer().catch((error) => {
  console.error("[FATAL]:", error);
  process.exit(1);
});

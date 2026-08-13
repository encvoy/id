import Koa from "koa";
import Router from "@koa/router";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { Provider } from "oidc-provider";
import { createOidcConfiguration } from "./config.js";
import {
  DYNAMIC_SCOPES_REDIS_CHANNEL,
  syncDynamicScopes,
} from "./dynamic-scopes.js";
import {
  createRedisClient,
  redisClient,
  synchronizeOidcRedisInstallation,
} from "./redis.client.js";
import mount from "koa-mount";
import { DOMAIN, setClientId } from "./constants.js";
import grantRouter from "./routes/grant.js";
import healthRouter from "./routes/health.js";
import {
  requireInternalRequest,
  startInternalRequestTokenRotation,
} from "./internal-auth.js";
import interactionRouter from "./routes/interaction.js";
import permissionsRouter from "./routes/permissions.js";
import sessionRouter from "./routes/session.js";
import tokenRouter from "./routes/token.js";
import NodeCache from "node-cache";
import { prisma } from "./prisma.js";

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
const ALLOWED_ORIGINS_CACHE_KEY = "allowedOrigins";
const WHITE_LIST_REDIS_KEY = "ClientWhiteListCache:runtime";
const WHITE_LIST_REDIS_CHANNEL = "runtime:white-list:changed";
let dynamicScopesSubscriber: ReturnType<typeof createRedisClient> | undefined;
let whiteListRedisClient: ReturnType<typeof createRedisClient> | undefined;
let dynamicScopesSyncPromise: Promise<void> | undefined;
let oidcReady = false;
let oidcProviderMiddleware: Koa.Middleware | undefined;
const STARTUP_DEPENDENCY_MAX_ATTEMPTS = 60;
const STARTUP_DEPENDENCY_TIMEOUT_MS = 5000;
const OIDC_PUBLIC_MOUNT_PATH = new URL(DOMAIN).pathname.replace(/\/+$/, "");

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getStartupRetryDelay = (attempt: number) =>
  Math.min(500 + attempt * 500, 3000);

function getWhiteListRedisClient() {
  if (
    !whiteListRedisClient ||
    whiteListRedisClient.status === "end" ||
    whiteListRedisClient.status === "close"
  ) {
    whiteListRedisClient = createRedisClient("");
  }

  return whiteListRedisClient;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function fetchAllowedOrigins(): Promise<string[]> {
  try {
    const response = await fetch(`${DOMAIN}/api/v1/clients/white-list`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json()) as { origins?: string[] };
    return normalizeOrigins(data.origins);
  } catch (error) {
    console.error("Error fetching allowed origins:", error);

    const cachedRedisOrigins = await readAllowedOriginsFromRedis();
    if (cachedRedisOrigins) {
      return cachedRedisOrigins;
    }

    return [new URL(DOMAIN).origin];
  }
}

// Function to update the cache
function updateOriginsCache(origins: string[]): void {
  cache.set(ALLOWED_ORIGINS_CACHE_KEY, origins);
}

function normalizeOrigins(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return Array.from(
    new Set(
      payload.flatMap((value) => {
        if (typeof value !== "string" || !value.trim()) {
          return [];
        }

        try {
          return [new URL(value).origin];
        } catch {
          return [];
        }
      }),
    ),
  );
}

async function readAllowedOriginsFromRedis(): Promise<string[] | null> {
  const payload = await getWhiteListRedisClient().get(WHITE_LIST_REDIS_KEY);
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload) as { origins?: unknown };
    return normalizeOrigins(parsed.origins);
  } catch (error) {
    console.error("[OIDC] Failed to parse white-list config from Redis:", error);
    return null;
  }
}

async function syncAllowedOriginsFromRedis(reason: string): Promise<void> {
  try {
    const origins = await readAllowedOriginsFromRedis();
    if (!origins) {
      return;
    }

    updateOriginsCache(origins);
    console.info(`[OIDC] White-list cache synced from Redis (${reason})`);
  } catch (error) {
    console.error("[OIDC] Failed to sync white-list cache from Redis:", error);
  }
}

async function refreshDynamicScopes(reason: string) {
  if (dynamicScopesSyncPromise) {
    return dynamicScopesSyncPromise;
  }

  dynamicScopesSyncPromise = syncDynamicScopes(OIDC_PROVIDER)
    .then(({ scopes }) => {
      console.info(
        `[OIDC] Dynamic scopes synced (${reason}): ${
          scopes.length ? scopes.join(", ") : "none"
        }`,
      );
    })
    .catch((error) => {
      console.error(`[OIDC] Dynamic scopes sync failed (${reason}):`, error);
    })
    .finally(() => {
      dynamicScopesSyncPromise = undefined;
    });

  return dynamicScopesSyncPromise;
}

function startDynamicScopesRuntimeSync() {
  dynamicScopesSubscriber = createRedisClient("");
  dynamicScopesSubscriber
    .subscribe(DYNAMIC_SCOPES_REDIS_CHANNEL, WHITE_LIST_REDIS_CHANNEL)
    .then(() => {
      console.info(
        `[OIDC] Listening for runtime changes on ${DYNAMIC_SCOPES_REDIS_CHANNEL} and ${WHITE_LIST_REDIS_CHANNEL}`,
      );
    })
    .catch((error) => {
      console.error(
        "[OIDC] Failed to subscribe to dynamic scope changes:",
        error,
      );
    });

  dynamicScopesSubscriber.on("message", (channel, message) => {
    if (channel === DYNAMIC_SCOPES_REDIS_CHANNEL) {
      void refreshDynamicScopes("redis");
      return;
    }

    if (channel === WHITE_LIST_REDIS_CHANNEL) {
      try {
        const parsed = JSON.parse(message) as { origins?: unknown };
        const origins = normalizeOrigins(parsed.origins);
        updateOriginsCache(origins);
      } catch (error) {
        console.error("[OIDC] Failed to apply white-list update message:", error);
        void syncAllowedOriginsFromRedis("pubsub-fallback");
      }
    }
  });
}

async function initializeStartupDependencies() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= STARTUP_DEPENDENCY_MAX_ATTEMPTS; attempt++) {
    try {
      await withTimeout(
        redisClient.ping(),
        STARTUP_DEPENDENCY_TIMEOUT_MS,
        "Redis ping",
      );

      const generalClient = await withTimeout(
        prisma.client.findFirst({
          orderBy: {
            created_at: "asc",
          },
          select: {
            client_id: true,
          },
        }),
        STARTUP_DEPENDENCY_TIMEOUT_MS,
        "Database query",
      );
      if (!generalClient?.client_id) {
        throw new Error(
          "Cannot initialize OIDC provider: system client is not seeded yet",
        );
      }

      const databaseInstallations = await withTimeout(
        prisma.$queryRaw<Array<{ id: string }>>`
          SELECT "id"::text AS "id"
          FROM "_prisma_migrations"
          WHERE "finished_at" IS NOT NULL
            AND "rolled_back_at" IS NULL
          ORDER BY "started_at" ASC, "id" ASC
          LIMIT 1
        `,
        STARTUP_DEPENDENCY_TIMEOUT_MS,
        "Database installation query",
      );
      const databaseInstallationId = databaseInstallations[0]?.id;
      if (!databaseInstallationId) {
        throw new Error(
          "Cannot determine database installation: no applied Prisma migrations found",
        );
      }

      const databaseInstallationFingerprint = [
        databaseInstallationId,
        generalClient.client_id,
      ].join(":");

      const redisSynchronization = await synchronizeOidcRedisInstallation(
        databaseInstallationFingerprint,
      );
      if (redisSynchronization.installationChanged) {
        console.warn(
          `[OIDC] Database installation changed; removed ${redisSynchronization.removedKeys} stale Redis keys before provider startup`,
        );
      }

      setClientId(generalClient.client_id);

      if (attempt > 1) {
        console.info(
          `[OIDC] Startup dependencies are ready after ${attempt} attempts`,
        );
      }

      return;
    } catch (error) {
      lastError = error;

      if (attempt >= STARTUP_DEPENDENCY_MAX_ATTEMPTS) {
        break;
      }

      const delay = getStartupRetryDelay(attempt);
      console.warn(
        `[OIDC] Startup dependencies are not ready (${attempt}/${STARTUP_DEPENDENCY_MAX_ATTEMPTS}), retrying in ${delay}ms:`,
        error,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

async function initializeOidcProvider() {
  await initializeStartupDependencies();

  const configuration = await createOidcConfiguration();
  OIDC_PROVIDER = new Provider(DOMAIN, configuration);
  OIDC_PROVIDER.proxy = true;
  // Compose the provider middleware without a Koa mount prefix. Its routes
  // already include /oidc, so oidc-provider can prepend DOMAIN's pathname
  // (such as /id) when it generates public endpoints and cookie paths.
  oidcProviderMiddleware = mount(OIDC_PROVIDER.app);

  await refreshDynamicScopes("startup");
  updateOriginsCache(await fetchAllowedOrigins());
  console.info("[OIDC] Runtime white-list refreshed from backend (startup)");
  startDynamicScopesRuntimeSync();
  startInternalRequestTokenRotation();

  oidcReady = true;
  console.info(
    `[KOA-SERVER] Discovery endpoint: ${DOMAIN}/.well-known/openid-configuration`,
  );
}

async function startKoaServer() {
  if (!DOMAIN) {
    console.error("[KOA-SERVER-ERROR] DOMAIN is not configured");
    process.exit(1);
  }

  // Main app for custom routes
  const app = new Koa();

  // Router for updating CORS
  const corsRouter = new Router();

  // Endpoint for updating CORS origins by an external service
  corsRouter.post("/oidc/update-cors", requireInternalRequest(), async (ctx) => {
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
    // Custom middleware and routes for the main app only
    app.proxy = true;

    // Dynamic CORS middleware
    app.use(async (ctx, next) => {
      let allowedOrigins = cache.get(ALLOWED_ORIGINS_CACHE_KEY) as
        | string[]
        | undefined;
      if (!allowedOrigins) {
        allowedOrigins = await fetchAllowedOrigins();
        cache.set(ALLOWED_ORIGINS_CACHE_KEY, allowedOrigins);
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

    corsRouter.post("/oidc/update-dynamic-scopes", requireInternalRequest(), async (ctx) => {
      await refreshDynamicScopes("http");
      ctx.status = 200;
      ctx.body = { message: "Dynamic scopes updated successfully" };
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
    app.use(healthRouter.routes()).use(healthRouter.allowedMethods());

    app.use(async (ctx, next) => {
      if (!oidcReady) {
        ctx.status = 503;
        ctx.body = {
          status: "starting",
          message: "OIDC provider is initializing",
        };
        return;
      }

      await next();
    });

    app.use(corsRouter.routes()).use(corsRouter.allowedMethods());

    app.use(grantRouter.routes()).use(grantRouter.allowedMethods());
    app.use(interactionRouter.routes()).use(interactionRouter.allowedMethods());
    app.use(permissionsRouter.routes()).use(permissionsRouter.allowedMethods());
    app.use(sessionRouter.routes()).use(sessionRouter.allowedMethods());
    app.use(tokenRouter.routes()).use(tokenRouter.allowedMethods());

    // Mount the OIDC provider on a separate clean app
    app.use(async (ctx, next) => {
      if (!oidcProviderMiddleware) {
        ctx.status = 503;
        ctx.body = {
          status: "starting",
          message: "OIDC provider is initializing",
        };
        return;
      }

      // Accept the former internally mounted discovery path while nginx
      // configurations roll over to the issuer-standard /.well-known path.
      const originalPath = ctx.path;
      const requestWithOriginalUrl = ctx.req as typeof ctx.req & {
        originalUrl?: string;
      };
      const contextWithMountPath = ctx as typeof ctx & {
        mountPath?: string;
      };
      const originalUrl = requestWithOriginalUrl.originalUrl;
      const originalMountPath = contextWithMountPath.mountPath;
      if (ctx.path.startsWith("/oidc/.well-known/")) {
        ctx.path = ctx.path.slice("/oidc".length);
        requestWithOriginalUrl.originalUrl = ctx.request.url;
      }
      contextWithMountPath.mountPath = OIDC_PUBLIC_MOUNT_PATH;

      try {
        await oidcProviderMiddleware(ctx, next);
      } finally {
        ctx.path = originalPath;
        requestWithOriginalUrl.originalUrl = originalUrl;
        contextWithMountPath.mountPath = originalMountPath;
      }
    });

    const server = app.listen(3003, () => {
      console.info("[KOA-SERVER] Listening on 3003, initializing OIDC provider");
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.info(`\n[OIDC] Received ${signal}, closing server gracefully...`);

      server.close(async () => {
        console.info("[OIDC] HTTP server closed");

        try {
          if (dynamicScopesSubscriber) {
            await dynamicScopesSubscriber.quit();
            console.log("[OIDC] Dynamic scopes Redis subscriber closed");
          }
          await redisClient.quit();
          console.info("[OIDC] Redis connection closed");
        } catch (error) {
          console.error("[OIDC] Error closing Redis:", error);
        }

        console.info("[OIDC] Shutdown complete");
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

    void initializeOidcProvider().catch((error) => {
      console.error("[KOA-SERVER-ERROR]:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("[KOA-SERVER-ERROR]:", error);
    process.exit(1);
  }
}

startKoaServer().catch((error) => {
  console.error("[FATAL]:", error);
  process.exit(1);
});

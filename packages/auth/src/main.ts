import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";
import NodeCache from "node-cache";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import Redis from "ioredis";
import { requireInternalRequest } from "./internal-auth";
import { requireRuntimeDomain, resolveRuntimeDomain } from "./runtime-domain";

dotenv.config();
const app = express();
const port = 3007;

export const DOMAIN: string = requireRuntimeDomain(
  resolveRuntimeDomain(process.env) || "https://localhost",
);
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const ALLOWED_ORIGINS_CACHE_KEY = "allowedOrigins";
const SYSTEM_CLIENT_ID_CACHE_KEY = "systemClientId";
const WHITE_LIST_REDIS_KEY = "ClientWhiteListCache:runtime";
const WHITE_LIST_REDIS_CHANNEL = "runtime:white-list:changed";
const RUNTIME_CONFIG_REQUEST_TIMEOUT_MS = 3000;
const DOMAIN_ORIGIN = new URL(DOMAIN).origin;

type AuthRuntimeConfig = {
  origins: string[];
  system_client_id: string;
};

let runtimeRedis: Redis | undefined;
let runtimeSubscriber: Redis | undefined;
let runtimeConfigRefreshInFlight: Promise<void> | null = null;

const getDefaultRuntimeConfig = (): AuthRuntimeConfig => ({
  origins: [DOMAIN_ORIGIN],
  system_client_id: "",
});

const activeRuntimeConfig = getDefaultRuntimeConfig();

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

function getRuntimeRedisClient(): Redis {
  if (
    !runtimeRedis ||
    runtimeRedis.status === "end" ||
    runtimeRedis.status === "close"
  ) {
    runtimeRedis = new Redis(
      parseInt(process.env.REDIS_PORT || "6379", 10),
      process.env.REDIS_HOST || "127.0.0.1",
      {
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 1,
        connectTimeout: RUNTIME_CONFIG_REQUEST_TIMEOUT_MS,
        commandTimeout: RUNTIME_CONFIG_REQUEST_TIMEOUT_MS,
        enableReadyCheck: false,
        lazyConnect: false,
      },
    );
  }

  return runtimeRedis;
}

function normalizeRuntimeConfig(
  payload?: Partial<AuthRuntimeConfig> | null,
): AuthRuntimeConfig {
  const origins = Array.isArray(payload?.origins)
    ? Array.from(
        new Set(
          payload.origins.flatMap((value) => {
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
      )
    : [];

  return {
    origins,
    system_client_id:
      typeof payload?.system_client_id === "string"
        ? payload.system_client_id.trim()
        : "",
  };
}

async function readRuntimeConfigFromRedis(): Promise<AuthRuntimeConfig | null> {
  const payload = await getRuntimeRedisClient().get(WHITE_LIST_REDIS_KEY);
  if (!payload) {
    return null;
  }

  try {
    return normalizeRuntimeConfig(
      JSON.parse(payload) as Partial<AuthRuntimeConfig> | null,
    );
  } catch (error) {
    console.error("Failed to parse white-list config from Redis:", error);
    return null;
  }
}

function getAllowedOriginsFromCache(): string[] {
  const cachedOrigins = cache.get(ALLOWED_ORIGINS_CACHE_KEY) as
    | string[]
    | undefined;

  return cachedOrigins?.length
    ? cachedOrigins
    : activeRuntimeConfig.origins.length
      ? activeRuntimeConfig.origins
      : getDefaultRuntimeConfig().origins;
}

async function fetchAuthRuntimeConfigFromApi(): Promise<AuthRuntimeConfig> {
  const response = await fetch(`${DOMAIN}/api/v1/clients/white-list`, {
    timeout: RUNTIME_CONFIG_REQUEST_TIMEOUT_MS,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = (await response.json()) as {
    origins?: string[];
    system_client_id?: string;
  };

  return normalizeRuntimeConfig(data);
}

async function loadAuthRuntimeConfig(): Promise<AuthRuntimeConfig | null> {
  try {
    return await fetchAuthRuntimeConfigFromApi();
  } catch (error) {
    console.warn(
      `[AUTH] Backend runtime config unavailable; trying Redis cache: ${getErrorMessage(error)}`,
    );

    try {
      return await readRuntimeConfigFromRedis();
    } catch (redisError) {
      console.warn(
        `[AUTH] Redis runtime config unavailable; keeping cached/default config: ${getErrorMessage(redisError)}`,
      );
      return null;
    }
  }
}

async function refreshAuthRuntimeConfig(reason: string): Promise<void> {
  const runtimeConfig = await loadAuthRuntimeConfig();
  if (!runtimeConfig) {
    console.warn(
      `[AUTH] Runtime config unavailable (${reason}); keeping cached/default config`,
    );
    return;
  }

  updateRuntimeConfigCache(runtimeConfig);
  console.info(`[AUTH] Runtime config refreshed (${reason})`);
}

function scheduleAuthRuntimeConfigRefresh(reason: string): void {
  if (runtimeConfigRefreshInFlight) {
    return;
  }

  runtimeConfigRefreshInFlight = refreshAuthRuntimeConfig(reason)
    .catch((error) => {
      console.error(`[AUTH] Failed to refresh runtime config (${reason}):`, error);
    })
    .finally(() => {
      runtimeConfigRefreshInFlight = null;
    });
}

// Function to update the cache
function updateRuntimeConfigCache(config: Partial<AuthRuntimeConfig>): void {
  if (Array.isArray(config.origins)) {
    cache.set(ALLOWED_ORIGINS_CACHE_KEY, config.origins);
    activeRuntimeConfig.origins = config.origins;
  }

  const systemClientId =
    typeof config.system_client_id === "string"
      ? config.system_client_id.trim()
      : "";
  if (Object.prototype.hasOwnProperty.call(config, "system_client_id")) {
    cache.set(SYSTEM_CLIENT_ID_CACHE_KEY, systemClientId);
    activeRuntimeConfig.system_client_id = systemClientId;
  }
}

function invalidateRuntimeConfigCache(): void {
  const defaultConfig = getDefaultRuntimeConfig();
  cache.del([ALLOWED_ORIGINS_CACHE_KEY, SYSTEM_CLIENT_ID_CACHE_KEY]);
  activeRuntimeConfig.origins = defaultConfig.origins;
  activeRuntimeConfig.system_client_id = defaultConfig.system_client_id;
}

async function syncRuntimeConfigFromRedis(reason: string): Promise<void> {
  try {
    const config = await readRuntimeConfigFromRedis();
    if (!config) {
      return;
    }

    updateRuntimeConfigCache(config);
    console.info(`[AUTH] White-list cache synced from Redis (${reason})`);
  } catch (error) {
    console.error("[AUTH] Failed to sync white-list cache from Redis:", error);
  }
}

function startWhiteListRuntimeSync(): void {
  if (runtimeSubscriber) {
    return;
  }

  runtimeSubscriber = new Redis(
    parseInt(process.env.REDIS_PORT || "6379", 10),
    process.env.REDIS_HOST || "127.0.0.1",
    {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
    },
  );

  runtimeSubscriber
    .subscribe(WHITE_LIST_REDIS_CHANNEL)
    .then(() => {
      console.info(
        `[AUTH] Listening for white-list changes on ${WHITE_LIST_REDIS_CHANNEL}`,
      );
    })
    .catch((error) => {
      console.error("[AUTH] Failed to subscribe to white-list changes:", error);
    });

  runtimeSubscriber.on("message", (channel, message) => {
    if (channel !== WHITE_LIST_REDIS_CHANNEL) {
      return;
    }

    try {
      const runtimeConfig = normalizeRuntimeConfig(
        JSON.parse(message) as Partial<AuthRuntimeConfig>,
      );
      if (
        runtimeConfig.origins.length === 0 &&
        !runtimeConfig.system_client_id
      ) {
        invalidateRuntimeConfigCache();
        scheduleAuthRuntimeConfigRefresh("redis-invalidation");
        return;
      }

      updateRuntimeConfigCache(runtimeConfig);
    } catch (error) {
      console.error("[AUTH] Failed to apply white-list update message:", error);
      void syncRuntimeConfigFromRedis("pubsub-fallback");
    }
  });
}

export async function getSystemClientId(): Promise<string> {
  let systemClientId = cache.get(SYSTEM_CLIENT_ID_CACHE_KEY) as
    | string
    | undefined;
  if (cache.has(SYSTEM_CLIENT_ID_CACHE_KEY)) {
    if (!systemClientId?.trim() && runtimeConfigRefreshInFlight) {
      await runtimeConfigRefreshInFlight;
      systemClientId = cache.get(SYSTEM_CLIENT_ID_CACHE_KEY) as
        | string
        | undefined;
    }

    return systemClientId?.trim() || "";
  }

  const runtimeConfig = await loadAuthRuntimeConfig();
  if (runtimeConfig) {
    updateRuntimeConfigCache(runtimeConfig);
  }

  systemClientId = cache.get(SYSTEM_CLIENT_ID_CACHE_KEY) as string | undefined;
  return systemClientId?.trim() || activeRuntimeConfig.system_client_id;
}

function healthResponse() {
  return { status: "ok", service: "auth", timestamp: new Date().toISOString() };
}

app.get("/health", (_req, res) => {
  res.status(200).json(healthResponse());
});

app.get("/auth/health", (_req, res) => {
  res.status(200).json(healthResponse());
});

updateRuntimeConfigCache(activeRuntimeConfig);
scheduleAuthRuntimeConfigRefresh("startup");
startWhiteListRuntimeSync();

// Endpoint for updating CORS origins by an external service
app.post(
  "/auth/update-cors",
  express.json(),
  requireInternalRequest,
  (req, res) => {
    try {
      const origins = req.body.origins ?? [];
      if (!Array.isArray(origins)) {
        throw new Error("Invalid origins format: expected an array");
      }
      updateRuntimeConfigCache({
        origins,
        system_client_id: req.body.system_client_id,
      });
      res.status(200).json({ message: "CORS origins updated successfully" });
    } catch (error) {
      console.error("Failed to update CORS origins:", error);
      res.status(400).json({ error: "Failed to update CORS origins" });
    }
  },
);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOriginsFromCache();

      if (!cache.has(ALLOWED_ORIGINS_CACHE_KEY)) {
        scheduleAuthRuntimeConfigRefresh("cors-cache-miss");
      }

      callback(null, allowedOrigins.includes(origin ?? "") ? origin : false);
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`HTTPS server running at ${DOMAIN}:${port}`);
});

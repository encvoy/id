import Redis from "ioredis";
import { randomUUID } from "node:crypto";

const OIDC_REDIS_PREFIX = "oidc:";
const OIDC_INSTALLATION_MARKER_KEY =
  "oidc-runtime:database-installation:v1";
const OIDC_INSTALLATION_LOCK_KEY = `${OIDC_INSTALLATION_MARKER_KEY}:lock`;
const RUNTIME_WHITE_LIST_REDIS_CHANNEL = "runtime:white-list:changed";
const EMPTY_RUNTIME_CONFIG_MESSAGE = JSON.stringify({
  origins: [],
  system_client_id: "",
});
const OIDC_INSTALLATION_LOCK_TTL_MS = 30_000;
const OIDC_INSTALLATION_WAIT_TIMEOUT_MS = 90_000;
const OIDC_INSTALLATION_POLL_INTERVAL_MS = 250;
const OIDC_CLEANUP_SCAN_COUNT = 500;

// RedisAdapter instances in backend use both the `oidc:*` namespace and
// explicit bare prefixes for short-lived authorization flows. Keep this list
// explicit so a database reset cannot affect unrelated Redis consumers.
const DATABASE_BOUND_REDIS_PREFIXES = [
  OIDC_REDIS_PREFIX,
  "AccessToken:",
  "AuthorizationCode:",
  "BackchannelAuthenticationRequest:",
  "BindData:",
  "Client:",
  "ClientCredentials:",
  "ClientWhiteListCache:",
  "DeviceCode:",
  "EmailCode:",
  "EthereumNonce:",
  "Grant:",
  "InitialAccessToken:",
  "Interaction:",
  "LoggedUserInfoCode:",
  "LoggedUserToken:",
  "MFA1:",
  "MFA2:",
  "MailAddCode:",
  "MailAuthorizationCode:",
  "MailChangeCode:",
  "MailRecoverPasswordCode:",
  "MailRegisterCode:",
  "MtlsAuthorization:",
  "MtlsRegistration:",
  "PendingAuthorization:",
  "PhoneAddCode:",
  "PhoneAuthorizationCode:",
  "PushedAuthorizationRequest:",
  "RateLimit:",
  "RateLimitSlidingWindow:",
  "RefreshToken:",
  "RegistrationAccessToken:",
  "ReplayDetection:",
  "RequiredAccountsInfo:",
  "Session:",
  "SettingsCache:",
  "State:",
  "Totp:",
  "TwoFactorAuthentication:",
  "UserData:",
  "WebauthnAuthorization:",
  "WebauthnRegistration:",
  "grant:",
  "pat:",
  "uid:",
  "userCode:",
];

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function createRedisClient(keyPrefix?: string): Redis {
  const prefix = keyPrefix ?? OIDC_REDIS_PREFIX;

  const getRedisConfig = () => ({
    host: process.env["REDIS_HOST"] || "127.0.0.1",
    port: parseInt(process.env["REDIS_PORT"] || "6379", 10),
  });

  const config = getRedisConfig();

  const client = new Redis(config.port, config.host, {
    keyPrefix: prefix,
    retryStrategy: (times) => {
      const freshConfig = getRedisConfig();
      const delay = Math.min(times * 50, 2000);
      console.info(
        `[OIDC Redis] Reconnecting to ${freshConfig.host}:${freshConfig.port} in ${delay}ms (attempt ${times})`
      );
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });

  client.on("error", (err) => {
    console.error("OIDC Redis error:", err);
  });

  client.on("connect", () => {
    const cfg = getRedisConfig();
    console.info(`OIDC Redis connected to ${cfg.host}:${cfg.port}`);
  });

  client.on("ready", () => {
    console.info("OIDC Redis ready");
  });

  client.on("reconnecting", () => {
    console.warn("OIDC Redis reconnecting...");
  });

  return client;
}

export const redisClient = createRedisClient();

async function releaseInstallationLock(
  client: Redis,
  lockOwner: string,
): Promise<void> {
  await client.eval(
    `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end
      return 0
    `,
    1,
    OIDC_INSTALLATION_LOCK_KEY,
    lockOwner,
  );
}

async function renewInstallationLock(
  client: Redis,
  lockOwner: string,
): Promise<void> {
  const renewed = await client.eval(
    `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("PEXPIRE", KEYS[1], ARGV[2])
      end
      return 0
    `,
    1,
    OIDC_INSTALLATION_LOCK_KEY,
    lockOwner,
    String(OIDC_INSTALLATION_LOCK_TTL_MS),
  );

  if (renewed !== 1) {
    throw new Error("Lost the OIDC Redis installation cleanup lock");
  }
}

async function unlinkDatabaseStateKeys(
  client: Redis,
  lockOwner: string,
  keys: string[],
): Promise<number> {
  const removed = await client.eval(
    `
      if redis.call("GET", KEYS[1]) ~= ARGV[1] then
        return -1
      end

      local removed = 0
      for index = 2, #KEYS do
        removed = removed + redis.call("UNLINK", KEYS[index])
      end
      redis.call("PEXPIRE", KEYS[1], ARGV[2])
      return removed
    `,
    keys.length + 1,
    OIDC_INSTALLATION_LOCK_KEY,
    ...keys,
    lockOwner,
    String(OIDC_INSTALLATION_LOCK_TTL_MS),
  );

  if (typeof removed !== "number" || removed < 0) {
    throw new Error("Lost the OIDC Redis installation cleanup lock");
  }

  return removed;
}

async function clearDatabaseBoundRedisState(
  client: Redis,
  lockOwner: string,
): Promise<number> {
  let cursor = "0";
  let removedKeys = 0;

  do {
    await renewInstallationLock(client, lockOwner);

    const [nextCursor, keys] = await client.scan(
      cursor,
      "COUNT",
      OIDC_CLEANUP_SCAN_COUNT,
    );
    const databaseStateKeys = keys.filter((key) =>
      DATABASE_BOUND_REDIS_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );
    if (databaseStateKeys.length > 0) {
      removedKeys += await unlinkDatabaseStateKeys(
        client,
        lockOwner,
        databaseStateKeys,
      );
    }

    cursor = nextCursor;
  } while (cursor !== "0");

  return removedKeys;
}

async function completeInstallationCleanup(
  client: Redis,
  lockOwner: string,
  databaseInstallationId: string,
): Promise<void> {
  const completed = await client.eval(
    `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        redis.call("PUBLISH", ARGV[3], ARGV[4])
        redis.call("SET", KEYS[2], ARGV[2])
        redis.call("DEL", KEYS[1])
        return 1
      end
      return 0
    `,
    2,
    OIDC_INSTALLATION_LOCK_KEY,
    OIDC_INSTALLATION_MARKER_KEY,
    lockOwner,
    databaseInstallationId,
    RUNTIME_WHITE_LIST_REDIS_CHANNEL,
    EMPTY_RUNTIME_CONFIG_MESSAGE,
  );

  if (completed !== 1) {
    throw new Error("Lost the OIDC Redis installation cleanup lock");
  }
}

/**
 * Removes PostgreSQL-bound OIDC state when the database installation changes.
 *
 * The marker is outside the data namespaces, while cleanup itself is strictly
 * limited to an explicit list of ID/OIDC authorization-state patterns. A
 * Redis lease makes startup safe when several OIDC replicas observe a freshly
 * recreated database simultaneously.
 */
export async function synchronizeOidcRedisInstallation(
  databaseInstallationId: string,
): Promise<{ removedKeys: number; installationChanged: boolean }> {
  if (!databaseInstallationId) {
    throw new Error("Database installation id is empty");
  }

  // A raw client is required because SCAN returns physical Redis keys and an
  // ioredis keyPrefix would be applied a second time when deleting them.
  const client = createRedisClient("");
  const waitDeadline = Date.now() + OIDC_INSTALLATION_WAIT_TIMEOUT_MS;

  try {
    while (Date.now() < waitDeadline) {
      const currentInstallationId = await client.get(
        OIDC_INSTALLATION_MARKER_KEY,
      );
      if (currentInstallationId === databaseInstallationId) {
        return { removedKeys: 0, installationChanged: false };
      }

      const lockOwner = randomUUID();
      const acquired = await client.set(
        OIDC_INSTALLATION_LOCK_KEY,
        lockOwner,
        "PX",
        OIDC_INSTALLATION_LOCK_TTL_MS,
        "NX",
      );

      if (acquired !== "OK") {
        await sleep(OIDC_INSTALLATION_POLL_INTERVAL_MS);
        continue;
      }

      try {
        // Another replica may have completed cleanup between our marker read
        // and lock acquisition.
        const installationAfterLock = await client.get(
          OIDC_INSTALLATION_MARKER_KEY,
        );
        if (installationAfterLock === databaseInstallationId) {
          await releaseInstallationLock(client, lockOwner);
          return { removedKeys: 0, installationChanged: false };
        }

        const removedKeys = await clearDatabaseBoundRedisState(
          client,
          lockOwner,
        );
        await completeInstallationCleanup(
          client,
          lockOwner,
          databaseInstallationId,
        );

        return { removedKeys, installationChanged: true };
      } catch (error) {
        await releaseInstallationLock(client, lockOwner).catch(() => undefined);
        throw error;
      }
    }

    throw new Error(
      "Timed out waiting for OIDC Redis installation synchronization",
    );
  } finally {
    await client.quit().catch(() => client.disconnect());
  }
}

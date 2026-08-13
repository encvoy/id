import type { Provider } from "oidc-provider";
import { Prisma } from "@prisma/client";
// oidc-provider does not expose a public runtime configuration mutator.
// This internal accessor is already used by oidc-provider itself and lets us refresh scopes in memory.
// @ts-ignore
import instance from "oidc-provider/lib/helpers/weak_cache.js";
import { CLIENT_ID } from "./constants.js";
import { prisma } from "./prisma.js";

export const DYNAMIC_SCOPES_REDIS_CHANNEL = "oidc:dynamic-scopes:changed";

const BASE_OIDC_SCOPES = new Set([
  "openid",
  "offline_access",
  "email",
  "phone",
  "profile",
  "accounts",
  "internal",
  "lk",
  "catalog",
  "locale",
]);

const GENERAL_PROFILE_FIELD_KEYS = new Set([
  "sub",
  "login",
  "email",
  "birthdate",
  "family_name",
  "given_name",
  "nickname",
  "phone_number",
  "picture",
  "data_processing_agreement",
  "password",
]);

type DynamicScopeField = {
  claim_name: string | null;
  profile_field: {
    key: string;
    active: boolean;
  };
};

type DynamicScopeGroup = {
  name: string;
  fields: DynamicScopeField[];
};

type DynamicScopeGroupWhere = {
  active?: boolean;
  organization_id?: string;
  name?: string | { in?: string[] };
};

type DynamicScopeRow = {
  group_name: string;
  claim_name: string | null;
  profile_field_key: string | null;
  profile_field_active: boolean | null;
};

type DynamicClaimValueRow = {
  claim_name: string | null;
  profile_field_key: string;
  profile_field_active: boolean;
  value: Prisma.JsonValue | null;
};

type DynamicScopeClaims = Record<string, string[]>;
type DynamicScopeSyncResult = {
  scopes: string[];
  claims: string[];
};

let appliedDynamicScopeNames = new Set<string>();
let appliedDynamicProfileClaimNames = new Set<string>();

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function isDynamicScopeTableMissing(error: unknown) {
  const code = isObjectRecord(error) ? error.code : undefined;
  const meta =
    isObjectRecord(error) && isObjectRecord(error.meta) ? error.meta : {};
  const metaCode = meta.code;
  const metaMessage = String(meta.message || "");
  const message = isObjectRecord(error) ? String(error.message || "") : "";

  return (
    code === "P2021" ||
    (code === "P2010" && metaCode === "42P01") ||
    metaMessage.includes("OidcScopeGroup") ||
    metaMessage.includes("OidcScopeGroupField") ||
    code === "42P01" ||
    message.includes("OidcScopeGroup") ||
    message.includes("OidcScopeGroupField")
  );
}

function normalizeScopeNames(scopes: string[]) {
  return Array.from(
    new Set(scopes.map((scope) => scope.trim()).filter(Boolean)),
  );
}

function toDynamicScopeClaims(groups: DynamicScopeGroup[]): DynamicScopeClaims {
  const claims: DynamicScopeClaims = {};

  for (const group of groups) {
    const groupClaims = group.fields
      .filter((field) => field.profile_field.active)
      .map((field) => field.claim_name || field.profile_field.key);

    claims[group.name] = Array.from(
      new Set([...(claims[group.name] || []), ...groupClaims]),
    );
  }

  return claims;
}

function toOidcProviderClaimConfig(claims: string[]) {
  return claims.reduce<Record<string, null>>((result, claim) => {
    result[claim] = null;
    return result;
  }, {});
}

function rebuildClaimsSupportedInPlace(configuration: {
  scopes: Set<string>;
  claims: Record<string, Record<string, null> | null>;
  claimsSupported: Set<string>;
}) {
  configuration.claimsSupported.clear();

  configuration.scopes.forEach((scope) => {
    const scopeClaims = configuration.claims[scope];
    if (scopeClaims && typeof scopeClaims === "object") {
      Object.keys(scopeClaims).forEach((claim) =>
        configuration.claimsSupported.add(claim),
      );
    }
  });

  Object.entries(configuration.claims).forEach(([claim, value]) => {
    if (value === null) {
      configuration.claimsSupported.add(claim);
    }
  });
}

async function findDynamicScopeGroups(where: DynamicScopeGroupWhere) {
  const filters: Prisma.Sql[] = [];

  if (typeof where.active === "boolean") {
    filters.push(Prisma.sql`g."active" = ${where.active}`);
  }

  if (typeof where.organization_id === "string") {
    filters.push(Prisma.sql`g."organization_id" = ${where.organization_id}`);
  }

  if (typeof where.name === "string") {
    filters.push(Prisma.sql`g."name" = ${where.name}`);
  } else if (Array.isArray(where.name?.in)) {
    const scopeNames = normalizeScopeNames(where.name.in);
    if (!scopeNames.length) {
      return [];
    }

    filters.push(Prisma.sql`g."name" IN (${Prisma.join(scopeNames)})`);
  }

  const rows = await prisma.$queryRaw<DynamicScopeRow[]>(Prisma.sql`
    SELECT
      g."name" AS "group_name",
      f."claim_name" AS "claim_name",
      pf."key" AS "profile_field_key",
      pf."active" AS "profile_field_active"
    FROM "OidcScopeGroup" AS g
    LEFT JOIN "OidcScopeGroupField" AS f
      ON f."scope_group_id" = g."id"
    LEFT JOIN "ProfileField" AS pf
      ON pf."id" = f."profile_field_id"
     AND (
       pf."organization_id" = ${CLIENT_ID}
       OR pf."organization_id" = g."organization_id"
     )
    ${filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty}
    ORDER BY g."name" ASC, f."order" ASC, pf."key" ASC
  `);

  const groupsByName = new Map<string, DynamicScopeGroup>();
  for (const row of rows) {
    const group =
      groupsByName.get(row.group_name) ??
      ({
        name: row.group_name,
        fields: [],
      } satisfies DynamicScopeGroup);
    groupsByName.set(row.group_name, group);

    if (!row.profile_field_key) {
      continue;
    }

    group.fields.push({
      claim_name: row.claim_name,
      profile_field: {
        key: row.profile_field_key,
        active: row.profile_field_active === true,
      },
    });
  }

  return [...groupsByName.values()];
}

async function findProfileScopeClaimNames() {
  const generalFieldKeys = [...GENERAL_PROFILE_FIELD_KEYS];
  const rows = await prisma.$queryRaw<
    Array<{ profile_field_key: string }>
  >(Prisma.sql`
    SELECT DISTINCT pf."key" AS "profile_field_key"
    FROM "ProfileField" AS pf
    WHERE pf."active" = true
      AND pf."key" NOT IN (${Prisma.join(generalFieldKeys)})
    ORDER BY pf."key" ASC
  `);

  return rows.map((row) => row.profile_field_key);
}

export async function loadDynamicScopeClaims(): Promise<DynamicScopeClaims> {
  try {
    const [groups, profileClaims] = await Promise.all([
      findDynamicScopeGroups({ active: true }),
      findProfileScopeClaimNames(),
    ]);
    const claims = toDynamicScopeClaims(groups);
    claims.profile = Array.from(
      new Set([...(claims.profile || []), ...profileClaims]),
    );
    return claims;
  } catch (error) {
    if (isDynamicScopeTableMissing(error)) {
      console.warn("[OIDC] Dynamic scope tables are not available yet");
      return {};
    }

    console.error("[OIDC] Failed to load dynamic scopes:", error);
    return {};
  }
}

export async function syncDynamicScopes(
  provider: Provider,
): Promise<DynamicScopeSyncResult> {
  const dynamicScopeClaims = await loadDynamicScopeClaims();
  const nextDynamicProfileClaimNames = new Set(
    dynamicScopeClaims.profile || [],
  );
  const nextDynamicScopeNames = new Set(
    Object.keys(dynamicScopeClaims).filter(
      (scope) => !BASE_OIDC_SCOPES.has(scope),
    ),
  );
  const configuration = instance(provider).configuration();
  const profileClaims = configuration.claims.profile || {};
  configuration.claims.profile = profileClaims;

  for (const claim of appliedDynamicProfileClaimNames) {
    if (!nextDynamicProfileClaimNames.has(claim)) {
      delete profileClaims[claim];
    }
  }

  for (const claim of nextDynamicProfileClaimNames) {
    profileClaims[claim] = null;
  }

  for (const scope of appliedDynamicScopeNames) {
    if (!nextDynamicScopeNames.has(scope)) {
      configuration.scopes.delete(scope);
      delete configuration.claims[scope];
    }
  }

  for (const scope of nextDynamicScopeNames) {
    configuration.scopes.add(scope);
    configuration.claims[scope] = toOidcProviderClaimConfig(
      dynamicScopeClaims[scope],
    );
  }

  configuration.collectScopes();
  rebuildClaimsSupportedInPlace(configuration);
  appliedDynamicScopeNames = nextDynamicScopeNames;
  appliedDynamicProfileClaimNames = nextDynamicProfileClaimNames;

  return {
    scopes: [...nextDynamicScopeNames],
    claims: [...configuration.claimsSupported],
  };
}

async function resolveDynamicScopeOrganizationId(clientId: string) {
  if (clientId === CLIENT_ID) {
    return CLIENT_ID;
  }

  const client = await prisma.client.findUnique({
    where: { client_id: clientId },
    select: {
      client_id: true,
      parent_id: true,
    },
  });

  if (!client) {
    return null;
  }

  if (client.parent_id && client.parent_id !== CLIENT_ID) {
    return client.parent_id;
  }

  if (!client.parent_id) {
    return client.client_id;
  }

  return CLIENT_ID;
}

export async function loadDynamicClaimsForClient(
  clientId: string,
  scopes: string[],
  userId: string,
) {
  const scopeNames = normalizeScopeNames(scopes);
  if (!scopeNames.length) {
    return {};
  }

  const organizationId = await resolveDynamicScopeOrganizationId(clientId);
  if (!organizationId) {
    return {};
  }

  try {
    const rows: DynamicClaimValueRow[] = [];
    const visibleOrganizationIds =
      organizationId === CLIENT_ID ? [CLIENT_ID] : [CLIENT_ID, organizationId];
    const groupedScopeNames = scopeNames.filter((scope) => scope !== "profile");

    if (groupedScopeNames.length) {
      rows.push(
        ...(await prisma.$queryRaw<DynamicClaimValueRow[]>(Prisma.sql`
          SELECT
            f."claim_name" AS "claim_name",
            pf."key" AS "profile_field_key",
            pf."active" AS "profile_field_active",
            upv."value" AS "value"
          FROM "OidcScopeGroup" AS g
          JOIN "OidcScopeGroupField" AS f
            ON f."scope_group_id" = g."id"
          JOIN "ProfileField" AS pf
            ON pf."id" = f."profile_field_id"
           AND pf."organization_id" IN (${Prisma.join(visibleOrganizationIds)})
          LEFT JOIN "UserProfileValue" AS upv
            ON upv."profile_field_id" = pf."id"
           AND upv."user_id" = ${userId}
          WHERE g."organization_id" = ${organizationId}
            AND g."active" = true
            AND g."name" IN (${Prisma.join(groupedScopeNames)})
          ORDER BY g."name" ASC, f."order" ASC, pf."key" ASC
        `)),
      );
    }

    if (scopeNames.includes("profile")) {
      const generalFieldKeys = [...GENERAL_PROFILE_FIELD_KEYS];
      rows.push(
        ...(await prisma.$queryRaw<DynamicClaimValueRow[]>(Prisma.sql`
          SELECT
            NULL AS "claim_name",
            pf."key" AS "profile_field_key",
            pf."active" AS "profile_field_active",
            upv."value" AS "value"
          FROM "ProfileField" AS pf
          LEFT JOIN "UserProfileValue" AS upv
            ON upv."profile_field_id" = pf."id"
           AND upv."user_id" = ${userId}
          WHERE pf."active" = true
            AND pf."key" NOT IN (${Prisma.join(generalFieldKeys)})
            AND pf."organization_id" IN (${Prisma.join(visibleOrganizationIds)})
            AND COALESCE(upv."public", pf."default_public", 0) >= 1
            AND NOT EXISTS (
              SELECT 1
              FROM "OidcScopeGroupField" AS gf
              JOIN "OidcScopeGroup" AS g
                ON g."id" = gf."scope_group_id"
              WHERE gf."profile_field_id" = pf."id"
                AND g."organization_id" = ${organizationId}
            )
          ORDER BY pf."key" ASC
        `)),
      );
    }

    return rows.reduce<Record<string, unknown>>((result, row) => {
      if (!row.profile_field_active || row.value === null) {
        return result;
      }

      const claimName = row.claim_name || row.profile_field_key;
      result[claimName] = row.value;
      return result;
    }, {});
  } catch (error) {
    if (!isDynamicScopeTableMissing(error)) {
      console.error("[OIDC] Failed to load dynamic claims:", error);
    }

    return {};
  }
}

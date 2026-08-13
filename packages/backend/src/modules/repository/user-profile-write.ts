import { randomUUID } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';

export const LEGACY_GENERAL_PROFILE_FIELD_KEYS = [
  'sub',
  'login',
  'email',
  'birthdate',
  'family_name',
  'given_name',
  'nickname',
  'phone_number',
  'picture',
  'data_processing_agreement',
  'password',
] as const;

type TProfileValueClient = Prisma.TransactionClient | PrismaClient;
type TLegacyProfileFieldMeta = {
  id: string;
  default_public: number;
};
type TLegacyProfileValueUpsert = {
  userId: string;
  values: Record<string, unknown>;
  publicLevels?: Record<string, number | null | undefined>;
};
type TLegacyProfileValueEntry = {
  userId: string;
  key: string;
  value: unknown;
  publicLevels?: Record<string, number | null | undefined>;
};
type TLegacyProfileValuePayloadRow = {
  id: string;
  user_id: string;
  profile_field_id: string;
  value: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
  explicit_public: number | null;
  has_explicit_public: boolean;
  default_public: number;
  created_at: string;
  updated_at: string;
};

const legacyProfileFieldCache = new Map<string, TLegacyProfileFieldMeta>();

export function clearLegacyProfileFieldCache(keys?: string[]) {
  if (!keys?.length) {
    legacyProfileFieldCache.clear();
    return;
  }

  for (const key of keys) {
    legacyProfileFieldCache.delete(key);
  }
}

function serializeLegacyProfileValue(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value as Prisma.InputJsonValue;
}

async function resolveLegacyProfileFields(prismaClient: TProfileValueClient, keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys));
  const missingKeys = uniqueKeys.filter((key) => !legacyProfileFieldCache.has(key));

  if (missingKeys.length > 0) {
    const profileFields = await prismaClient.profileField.findMany({
      where: {
        key: {
          in: missingKeys,
        },
      },
      select: {
        id: true,
        key: true,
        default_public: true,
      },
    });

    for (const field of profileFields) {
      legacyProfileFieldCache.set(field.key, {
        id: field.id,
        default_public: field.default_public,
      });
    }
  }

  return new Map(
    uniqueKeys.flatMap((key) => {
      const field = legacyProfileFieldCache.get(key);
      return field ? [[key, field] as const] : [];
    }),
  );
}

async function buildLegacyProfileValueRows(
  prismaClient: TProfileValueClient,
  rows: TLegacyProfileValueUpsert[],
) {
  const entries: TLegacyProfileValueEntry[] = rows.flatMap(({ userId, values, publicLevels }) =>
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({
        userId,
        key,
        value,
        publicLevels,
      })),
  );
  if (!entries.length) {
    return [];
  }

  const profileFieldByKey = await resolveLegacyProfileFields(
    prismaClient,
    entries.map((entry) => entry.key),
  );

  const now = new Date().toISOString();
  return entries.flatMap<TLegacyProfileValuePayloadRow>(({ userId, key, value, publicLevels }) => {
    const profileField = profileFieldByKey.get(key);
    if (!profileField) {
      return [];
    }

    const hasExplicitPublicLevel = Boolean(
      publicLevels && Object.prototype.hasOwnProperty.call(publicLevels, key),
    );
    const explicitPublicValue = hasExplicitPublicLevel ? publicLevels?.[key] ?? null : null;

    return [
      {
        id: randomUUID(),
        user_id: userId,
        profile_field_id: profileField.id,
        value: serializeLegacyProfileValue(value),
        explicit_public: explicitPublicValue,
        has_explicit_public: hasExplicitPublicLevel,
        default_public: profileField.default_public ?? 0,
        created_at: now,
        updated_at: now,
      },
    ];
  });
}

async function executeLegacyProfileValueUpsert(
  prismaClient: TProfileValueClient,
  payloadRows: TLegacyProfileValuePayloadRow[],
) {
  if (!payloadRows.length) {
    return;
  }

  const payload = JSON.stringify(payloadRows);

  await prismaClient.$executeRaw`
    WITH payload AS (
      SELECT *
      FROM jsonb_to_recordset(${payload}::jsonb) AS p(
        id text,
        user_id text,
        profile_field_id text,
        value jsonb,
        explicit_public integer,
        has_explicit_public boolean,
        default_public integer,
        created_at timestamptz,
        updated_at timestamptz
      )
    ),
    prepared AS (
      SELECT
        p.id,
        p.user_id,
        p.profile_field_id,
        p.value,
        CASE
          WHEN p.has_explicit_public THEN COALESCE(p.explicit_public, p.default_public)
          ELSE COALESCE(existing."public", p.default_public)
        END AS public,
        p.created_at,
        p.updated_at
      FROM payload AS p
      LEFT JOIN "UserProfileValue" AS existing
        ON existing."user_id" = p.user_id
       AND existing."profile_field_id" = p.profile_field_id
    )
    INSERT INTO "UserProfileValue" (
      "id",
      "user_id",
      "profile_field_id",
      "value",
      "public",
      "created_at",
      "updated_at"
    )
    SELECT
      p.id,
      p.user_id,
      p.profile_field_id,
      p.value,
      p.public,
      p.created_at,
      p.updated_at
    FROM prepared AS p
    ON CONFLICT ("user_id", "profile_field_id") DO UPDATE
    SET
      "value" = EXCLUDED."value",
      "public" = EXCLUDED."public",
      "updated_at" = EXCLUDED."updated_at"
  `;
}

export async function upsertLegacyUserProfileValuesBatch(
  prismaClient: TProfileValueClient,
  rows: TLegacyProfileValueUpsert[],
) {
  const payloadRows = await buildLegacyProfileValueRows(prismaClient, rows);
  if (!payloadRows.length) {
    return;
  }

  try {
    await executeLegacyProfileValueUpsert(prismaClient, payloadRows);
  } catch (error) {
    clearLegacyProfileFieldCache();
    const refreshedPayloadRows = await buildLegacyProfileValueRows(prismaClient, rows);
    await executeLegacyProfileValueUpsert(prismaClient, refreshedPayloadRows);
  }
}

export async function upsertLegacyUserProfileValues(
  prismaClient: TProfileValueClient,
  userId: string,
  values: Record<string, unknown>,
  publicLevels?: Record<string, number | null | undefined>,
) {
  await upsertLegacyUserProfileValuesBatch(prismaClient, [
    {
      userId,
      values,
      publicLevels,
    },
  ]);
}

export async function deleteLegacyUserProfileValues(
  prismaClient: TProfileValueClient,
  userId: string,
  fieldKeys: string[],
) {
  if (!fieldKeys.length) {
    return;
  }

  const profileFields = await resolveLegacyProfileFields(prismaClient, fieldKeys);

  const profileFieldIds = Array.from(profileFields.values()).map((field) => field.id);

  if (!profileFieldIds.length) {
    return;
  }

  await prismaClient.userProfileValue.deleteMany({
    where: {
      user_id: userId,
      profile_field_id: {
        in: profileFieldIds,
      },
    },
  });
}

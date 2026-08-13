import type { Prisma } from "@prisma/client";
import { CLIENT_ID, DOMAIN } from "./constants.js";
import { loadDynamicClaimsForClient } from "./dynamic-scopes.js";
import { getPermissionsForClientRole } from "./permissions.js";
import { prisma } from "./prisma.js";
import { resolvePublicImageUrl } from "./public-url.js";
import { legacyUserInclude, toLegacyUser } from "./user-compat.js";

const EMAIL_ACCOUNT_TYPES = new Set(["EMAIL", "EMAIL_CUSTOM"]);
const PHONE_ACCOUNT_TYPES = new Set(["PHONE", "KLOUD"]);

function resolveApplicationUrl(link?: string | null) {
  if (!link) return undefined;
  const normalizedLink = link.trim();
  const isAbsoluteUrl =
    normalizedLink.startsWith("http://") ||
    normalizedLink.startsWith("https://");
  return isAbsoluteUrl
    ? normalizedLink
    : `${DOMAIN}/${normalizedLink.replace(/^\/+/, "")}`;
}

function resolveLocalizedName(name: unknown, locale?: string): string {
  if (typeof name === "string") return name;
  if (!name || typeof name !== "object" || Array.isArray(name)) return "";

  const localized = name as Record<string, unknown>;
  const requested =
    locale && typeof localized[locale] === "string"
      ? localized[locale]
      : undefined;
  if (requested && requested.trim()) return requested;

  const ru = typeof localized.ru === "string" ? localized.ru : undefined;
  if (ru && ru.trim()) return ru;

  for (const value of Object.values(localized)) {
    if (typeof value === "string" && value.trim()) return value;
  }

  return "";
}

function hasConfirmedContactValue(
  externalAccounts: Array<{ type: string; sub: string | null }> | undefined,
  acceptedTypes: Set<string>,
  value?: unknown,
) {
  if (typeof value !== "string" || !value || !externalAccounts?.length) {
    return false;
  }

  return externalAccounts.some(
    (account) => acceptedTypes.has(account.type) && account.sub === value,
  );
}

function sanitizeOidcClaims<
  T extends {
    email?: unknown;
    email_verified?: unknown;
    phone_number?: unknown;
    phone_number_verified?: unknown;
  },
>(
  claims: T,
  externalAccounts: Array<{ type: string; sub: string | null }> | undefined,
): T {
  const sanitizedClaims = { ...claims };
  const emailVerified = hasConfirmedContactValue(
    externalAccounts,
    EMAIL_ACCOUNT_TYPES,
    claims.email,
  );
  const phoneVerified = hasConfirmedContactValue(
    externalAccounts,
    PHONE_ACCOUNT_TYPES,
    claims.phone_number,
  );

  sanitizedClaims.email_verified = emailVerified;
  sanitizedClaims.phone_number_verified = phoneVerified;

  if (!emailVerified) {
    sanitizedClaims.email = undefined;
  }

  if (!phoneVerified) {
    sanitizedClaims.phone_number = undefined;
  }

  return sanitizedClaims;
}

function shouldShowADM(
  roles: Array<{
    role: string;
    client_id: string;
    client: { parent_id: string | null };
  }>,
) {
  const hasSystemAdminRole = roles.some(
    (item) =>
      item.client_id === CLIENT_ID &&
      (item.role === "OWNER" || item.role === "EDITOR"),
  );

  if (hasSystemAdminRole) {
    return false;
  }

  return roles.some((item) => {
    if (item.role !== "EDITOR" || !item.client.parent_id) {
      return false;
    }

    return !roles.some(
      (role) =>
        role.client_id === item.client.parent_id &&
        (role.role === "OWNER" || role.role === "EDITOR"),
    );
  });
}

function isOwnerOrEditorRole(role?: string | null) {
  return role === "OWNER" || role === "EDITOR";
}

export class Account {
  /**
   * The main account search function for the OIDC Provider
   * The logic from the old OIDC has been completely migrated.
   */
  static async findAccount(ctx: any, id: string, token?: any): Promise<any> {
    const client_id = ctx.oidc.client.clientId;

    // Scopes requested by the client
    const requestedScopeValue =
      (
        ctx.oidc.entities?.AuthorizationCode ||
        ctx.oidc.entities?.AccessToken ||
        token
      )?.scope ||
      ctx.oidc.params.scope ||
      "";
    const scopes: string[] =
      typeof requestedScopeValue === "string"
        ? requestedScopeValue.split(" ").filter(Boolean)
        : [];
    const grantedScopes = Array.from(new Set(scopes));

    if (client_id === CLIENT_ID) {
      scopes.push("openid");
      scopes.push("email");
      scopes.push("phone");
      scopes.push("profile");
      scopes.push("accounts");
      scopes.push("offline_access");
      scopes.push("internal"); // Unified scope for lk, catalog, locale
    }

    // Getting user data and their external accounts
    const [userRow, publicExternalAccounts] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id },
        include: {
          ...legacyUserInclude,
          roles: {
            include: {
              client: true,
            },
          },
        },
      }),
      prisma.externalAccount.findMany({
        where: { user_id: id, public: { in: [1, 2] } },
        select: {
          id: true,
          sub: true,
          label: true,
          rest_info: true,
          type: true,
          issuer: true,
        },
      }),
    ]);
    const user = userRow
      ? {
          ...toLegacyUser(userRow),
          Role: userRow.roles,
        }
      : undefined;

    // Checking user presence
    if (!user) {
      // Returning undefined if the user is not found (required by oidc-provider)
      return undefined;
    }

    const {
      id: userId,
      locale: userLocale,
      custom_fields: _customFields,
      ...rawClaims
    } = user;
    const allClaims = sanitizeOidcClaims(rawClaims, userRow?.externalAccounts);
    const permissions = await getPermissionsForClientRole(user.Role, client_id);
    const settings = await prisma.settings.findMany({
      where: { name: { in: ["i18n", "catalog"] } },
    });
    const i18nSystem = settings.find((item) => item.name === "i18n");
    const catalogEnabled = settings.find((item) => item.name === "catalog");
    const isCatalogEnabled = catalogEnabled?.value === true;
    const locale =
      userLocale ||
      (i18nSystem?.value &&
      typeof i18nSystem?.value === "object" &&
      !Array.isArray(i18nSystem.value) &&
      "default_language" in i18nSystem.value
        ? (i18nSystem.value as { default_language?: string }).default_language
        : undefined);

    // If the user is deleted, redirect to the recovery page
    if (user.deleted) {
      ctx.oidc.params.redirect_uri = DOMAIN + "/code";
    }

    const orgClients: Array<{
      name: string;
      client_id: string;
      avatar?: string | null;
    }> = [];
    const manageableOrgClients: Array<{
      name: string;
      client_id: string;
      avatar?: string | null;
    }> = [];
    let systemClient: {
      name: string;
      client_id: string;
      avatar?: string | null;
    } = { name: "", client_id: "" };

    // set info orgClients and systemClient
    user.Role.forEach((item: any) => {
      if (item.client_id === CLIENT_ID) {
        systemClient = {
          name: resolveLocalizedName(item.client.name, locale),
          client_id: item.client_id,
          avatar: item.client.avatar,
        };
      }

      if (!item.client.parent_id && item.client_id !== CLIENT_ID) {
        const orgClient = {
          name: resolveLocalizedName(item.client.name, locale),
          client_id: item.client_id,
          avatar: item.client.avatar,
        };

        if (!orgClients.some((org) => org.client_id === item.client_id)) {
          orgClients.push(orgClient);
        }

        if (
          isOwnerOrEditorRole(item.role) &&
          !manageableOrgClients.some((org) => org.client_id === item.client_id)
        ) {
          manageableOrgClients.push(orgClient);
        }
      }
    });

    const hasSystemClientAccess = user.Role.some(
      (item: any) =>
        item.client_id === CLIENT_ID && isOwnerOrEditorRole(item.role),
    );

    const accessibleOrganizationIds = Array.from(
      new Set(
        user.Role.filter(
          (item: any) =>
            item.client_id !== CLIENT_ID && item.client.parent_id === null,
        ).map((item: any) => item.client_id as string),
      ),
    );
    const catalogAccessConditions: Prisma.ClientWhereInput[] = [
      { parent_id: CLIENT_ID },
    ];

    for (const organizationId of accessibleOrganizationIds) {
      catalogAccessConditions.push({
        client_id: organizationId,
        parent_id: null,
      });
      catalogAccessConditions.push({ parent_id: organizationId });
    }

    const catalogRows =
      isCatalogEnabled &&
      (scopes.includes("internal") || scopes.includes("catalog"))
        ? await prisma.client.findMany({
            where: {
              catalog: true,
              OR: catalogAccessConditions,
            },
            select: {
              client_id: true,
              name: true,
              catalog_name: true,
              description: true,
              domain: true,
              avatar: true,
              created_at: true,
              type: true,
              favorite_clients: {
                where: { user_id: userId },
                select: { id: true },
              },
            },
            orderBy: { created_at: "asc" },
          })
        : [];
    const catalogClients = catalogRows.map(
      ({ favorite_clients: favoriteClients, ...client }) => ({
        ...client,
        avatar: resolvePublicImageUrl(client.avatar, DOMAIN),
        favorite: favoriteClients.length > 0,
      }),
    );

    const lk: Array<{
      avatar?: string;
      text: string;
      link?: string;
      type: string;
      client_id?: string;
    }> = [];

    if (hasSystemClientAccess) {
      lk.push({
        avatar: resolvePublicImageUrl(systemClient.avatar, DOMAIN),
        text: systemClient.name,
        link: `${DOMAIN}/main/${CLIENT_ID}/settings`,
        type: "lk_system",
        client_id: CLIENT_ID,
      });
    }

    for (const org of manageableOrgClients) {
      lk.push({
        avatar: resolvePublicImageUrl(org.avatar, DOMAIN),
        text: org.name,
        link: `${DOMAIN}/app/${org.client_id}/settings`,
        type: "lk_org",
        client_id: org.client_id,
      });
    }

    if (
      shouldShowADM(
        user.Role as Array<{
          role: string;
          client_id: string;
          client: { parent_id: string | null };
        }>,
      )
    ) {
      lk.push({
        text: "ADM",
        link: `${DOMAIN}/admin/${CLIENT_ID}/clients`,
        type: "lk_admin",
      });
    }

    lk.push({
      text: "Profile",
      link: DOMAIN,
      type: "lk_personal",
    });

    let shouldAddSystemClients = false;
    let shouldAddOrgClients = false;
    let targetOrgId: string | undefined;

    if (client_id === CLIENT_ID) {
      shouldAddSystemClients = true;
      if (orgClients[0]?.client_id) {
        shouldAddOrgClients = true;
        targetOrgId = orgClients[0].client_id;
      }
    } else {
      const currentClient = await prisma.client.findUnique({
        where: { client_id },
      });

      if (currentClient?.parent_id === CLIENT_ID) {
        shouldAddSystemClients = true;
      } else if (
        currentClient?.parent_id &&
        currentClient.parent_id !== CLIENT_ID
      ) {
        shouldAddSystemClients = true;
        shouldAddOrgClients = true;
        targetOrgId = currentClient.parent_id;
      }
    }

    if (shouldAddSystemClients) {
      const systemClients = await prisma.client.findMany({
        where: {
          parent_id: CLIENT_ID,
          mini_widget: true,
          NOT: { client_id: client_id },
        },
      });

      for (const item of systemClients) {
        lk.push({
          text: resolveLocalizedName(item.name, locale),
          link: resolveApplicationUrl(item.domain),
          type: "client_system",
          avatar: resolvePublicImageUrl(item.avatar, DOMAIN),
        });
      }
    }

    if (shouldAddOrgClients && targetOrgId) {
      const orgClients = await prisma.client.findMany({
        where: {
          parent_id: targetOrgId,
          mini_widget: true,
          NOT: { client_id: client_id },
        },
      });

      for (const item of orgClients) {
        lk.push({
          text: resolveLocalizedName(item.name, locale),
          link: resolveApplicationUrl(item.domain),
          type: "client_org",
          avatar: resolvePublicImageUrl(item.avatar, DOMAIN),
        });
      }
    }

    // Generating claims
    const claims = async (use?: string) => {
      // Generating name from family_name and given_name if available
      let name: string | undefined;
      if (allClaims.given_name && allClaims.family_name) {
        name = `${allClaims.given_name} ${allClaims.family_name}`;
      }

      if (client_id === CLIENT_ID) {
        return {
          sub: userId,
          ...(use === "id_token" ? { scopes: grantedScopes, permissions } : {}),
          name,
          publicExternalAccounts,
          lk,
          catalog: isCatalogEnabled,
          catalogClients,
          systemClient: systemClient.name ? systemClient.name : undefined,
          orgClient: orgClients[0]?.name,
          orgClients,
          locale,
          ...allClaims,
        };
      }

      const publicFields = user.public_profile_claims_oauth?.split(" ") || [];
      if (
        !publicFields.includes("family_name") ||
        !publicFields.includes("given_name")
      )
        name = undefined;

      // The returned fields depend on the requested scopes
      const res: any = publicFields.reduce(
        (acc: any, item: string) => {
          if (item === "id") return acc;
          if (item === "picture" && user?.picture) {
            acc.picture = resolvePublicImageUrl(user.picture, DOMAIN);
          } else if (item === "phone") {
            acc.phone_number = allClaims.phone_number;
          } else if (item in allClaims) {
            acc[item] = allClaims[item as keyof typeof allClaims];
          }
          return acc;
        },
        {
          sub: user.id,
          ...(use === "id_token" ? { scopes: grantedScopes, permissions } : {}),
          name,
          lk,
          catalog: isCatalogEnabled,
          catalogClients,
          systemClient: systemClient.name ? systemClient.name : undefined,
          orgClient: orgClients[0]?.name,
          orgClients,
          locale,
        },
      );
      // Adding external accounts
      res.publicExternalAccounts = publicExternalAccounts;
      if (grantedScopes.includes("email") && "email" in res) {
        res.email_verified = allClaims.email_verified;
      }
      if (grantedScopes.includes("phone") && "phone_number" in res) {
        res.phone_number_verified = allClaims.phone_number_verified;
      }

      const dynamicClaims = await loadDynamicClaimsForClient(
        client_id,
        grantedScopes,
        String(userId),
      );

      return {
        ...dynamicClaims,
        ...res,
      };
    };

    return {
      accountId: id,
      async claims(use?: string) {
        return {
          ...(await claims(use)),
        };
      },
    };
  }
}

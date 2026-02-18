import { CLIENT_ID, DOMAIN } from "./constants.js";
import { prisma } from "./prisma.js";

function getUrl(link?: string) {
  if (!link) return undefined;
  return link.startsWith("http://") || link.startsWith("https://")
    ? link
    : `${DOMAIN}/${link}`;
}

export class Account {
  /**
   * The main account search function for the OIDC Provider
   * The logic from the old OIDC has been completely migrated.
   */
  static async findAccount(ctx: any, id: string, token?: any): Promise<any> {
    const client_id = ctx.oidc.client.clientId;

    // Scopes requested by the client
    const scopes =
      (
        ctx.oidc.entities?.AuthorizationCode || ctx.oidc.entities?.AccessToken
      )?.scope?.split(" ") || [];

    if (client_id === CLIENT_ID) {
      scopes.push("openid");
      scopes.push("email");
      scopes.push("phone");
      scopes.push("profile");
      scopes.push("accounts");
      scopes.push("offline_access");
      scopes.push("lk");
      scopes.push("catalog");
    }

    const idInt = parseInt(id, 10);

    // Getting user data and their external accounts
    const [user, publicExternalAccounts] =
      typeof id === "string"
        ? await prisma.$transaction([
            prisma.user.findUnique({
              where: { id: idInt },
              // Fields to return
              select: {
                // openid (sub)
                id: true,

                // email
                email: scopes.includes("email"),
                email_public: scopes.includes("email"),
                email_verified: scopes.includes("email"),

                // phone
                phone_number: scopes.includes("phone"),
                phone_number_verified: scopes.includes("phone"),

                // profile
                nickname: scopes.includes("profile"),
                login: scopes.includes("profile"),
                family_name: scopes.includes("profile"),
                given_name: scopes.includes("profile"),
                birthdate: scopes.includes("profile"),
                password_updated_at: scopes.includes("profile"),
                password_change_required: scopes.includes("profile"),
                picture: scopes.includes("profile"),
                custom_fields: scopes.includes("profile"),

                // technical fields
                public_profile_claims_oauth: true,
                deleted: true,
                Role: {
                  include: {
                    client: true,
                  },
                },

                // Lang
                locale: true,
              },
            }),
            prisma.externalAccount.findMany({
              where: { user_id: idInt, public: { in: [1, 2] } },
              select: {
                id: true,
                sub: true,
                label: true,
                rest_info: true,
                type: true,
                issuer: true,
              },
            }),
          ])
        : [undefined, []];

    // Checking user presence
    if (!user) {
      // Returning undefined if the user is not found (required by oidc-provider)
      return undefined;
    }

    const { id: userId, locale: userLocale, ...allClaims } = user;

    // If the user is deleted, redirect to the recovery page
    if (user.deleted) {
      ctx.oidc.params.redirect_uri = DOMAIN + "/code";
    }

    const lk = user.Role.reduce((acc: any, item: any) => {
      if (
        (item.role === "OWNER" || item.role === "EDITOR") &&
        item.client_id === CLIENT_ID
      ) {
        acc.push({
          avatar: getUrl(item.client.avatar),
          text: item.client.name,
          link: `${DOMAIN}/main/${CLIENT_ID}/settings`,
          type: "lk_system",
        });
      }

      if (
        item.role === "OWNER" &&
        !item.client.parent_id &&
        item.client_id !== CLIENT_ID
      ) {
        acc.push({
          avatar: getUrl(item.client.avatar),
          text: item.client.name,
          link: `${DOMAIN}/app/${item.client_id}/settings`,
          type: "lk_org",
        });
      }

      return acc;
    }, []);

    let orgClient: {
      name: string;
      client_id: string;
    } = { name: "", client_id: "" };
    let systemClient: {
      name: string;
      client_id: string;
    } = { name: "", client_id: "" };

    // set info orgClient and systemClient
    user.Role.forEach((item: any) => {
      if (item.client_id === CLIENT_ID) {
        systemClient = { name: item.client.name, client_id: item.client_id };
      }

      if (!item.client.parent_id && item.client_id !== CLIENT_ID) {
        orgClient = { name: item.client.name, client_id: item.client_id };
      }
    });

    if (
      user.Role.find(
        (item: any) => item.role === "EDITOR" && item.client.parent_id,
      )
    ) {
      const org = user.Role.find(
        (item: any) =>
          item.role === "OWNER" &&
          !item.client.parent_id &&
          item.client_id !== CLIENT_ID,
      );
      lk.push({
        text: "ADM",
        link: `${DOMAIN}/admin/${org ? org.client_id : CLIENT_ID}/clients`,
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
    let shouldAddCreateOrg = false;
    let targetOrgId: string | undefined;

    const s = await prisma.settings.findUnique({
      where: { name: "org-lk-self-connect" },
    });
    if (s && s.value === true) {
      shouldAddCreateOrg = true;
    }

    if (client_id === CLIENT_ID) {
      shouldAddSystemClients = true;
      if (orgClient?.client_id) {
        shouldAddCreateOrg = false;
        shouldAddOrgClients = true;
        targetOrgId = orgClient.client_id;
      }
    } else {
      shouldAddCreateOrg = false;

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
          text: item.name,
          link: item.domain,
          type: "client_system",
          avatar: item.avatar ? getUrl(item.avatar) : undefined,
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
          text: "ID",
          link: item.domain,
          type: "client_org",
          avatar: item.avatar ? getUrl(item.avatar) : undefined,
        });
      }
    }

    if (shouldAddCreateOrg) {
      const isAdmin = user.Role.find(
        (item: any) =>
          item.client_id === CLIENT_ID &&
          (item.role === "OWNER" || item.role === "EDITOR"),
      );

      if (!isAdmin) {
        lk.push({
          text: "SSO",
          link: `${DOMAIN}/api/v1/orgs`,
          type: "add_sso",
        });
      }
    }

    const settings = await prisma.settings.findMany({
      where: { name: { in: ["i18n", "catalog"] } },
    });
    const i18nSystem = settings.find((item) => item.name === "i18n");
    const catalogEnabled = settings.find((item) => item.name === "catalog");

    const locale =
      userLocale ||
      (i18nSystem?.value &&
      typeof i18nSystem?.value === "object" &&
      !Array.isArray(i18nSystem.value) &&
      "default_language" in i18nSystem.value
        ? (i18nSystem.value as { default_language?: string }).default_language
        : undefined);

    // Generating claims
    const claims = () => {
      // Generating name from family_name and given_name if available
      let name: string | undefined;
      if (allClaims.given_name && allClaims.family_name) {
        name = `${allClaims.given_name} ${allClaims.family_name}`;
      }

      if (client_id === CLIENT_ID) {
        return {
          sub: userId.toString(),
          name,
          publicExternalAccounts,
          lk,
          catalog: catalogEnabled?.value,
          systemClient: systemClient.name ? systemClient.name : undefined,
          orgClient: orgClient.name ? orgClient.name : undefined,
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
            acc.picture =
              user?.picture.startsWith("http://") ||
              user?.picture.startsWith("https://")
                ? user.picture
                : `${DOMAIN}/${user.picture}`;
          } else if (item === "phone")
            acc.phone_number = allClaims.phone_number;
          // Checking custom_fields
          else if (
            user.custom_fields &&
            typeof user.custom_fields === "object" &&
            item in (user.custom_fields as Record<string, unknown>)
          ) {
            if (!acc["custom_fields"]) acc["custom_fields"] = {};
            acc["custom_fields"][item] = (
              user.custom_fields as Record<string, unknown>
            )[item];
          } else if (item in allClaims) {
            acc[item] = allClaims[item as keyof typeof allClaims];
          }
          return acc;
        },
        {
          sub: user.id.toString(),
          name,
          lk,
          catalog: catalogEnabled?.value,
          systemClient: systemClient.name ? systemClient.name : undefined,
          orgClient: orgClient.name ? orgClient.name : undefined,
          locale,
        },
      );
      // Adding external accounts
      res.publicExternalAccounts = publicExternalAccounts;

      return res;
    };

    return {
      accountId: id,
      async claims() {
        return {
          ...claims(),
        };
      },
    };
  }
}

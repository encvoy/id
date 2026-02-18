import { Configuration } from "oidc-provider";
import { getJwks, getPublicJwks } from "./utils/jwks.js";
import { createInteractionPolicy } from "./policies/interaction.policy.js";
import { Adapter } from "./adapter.js";
import { Account } from "./account.js";
import { prisma } from "./prisma.js";
import {
  CLIENT_ID,
  DOMAIN,
  OIDC_COOKIE_SECRET,
  OIDC_SESSION_TTL,
} from "./constants.js";

const interactionPolicy = createInteractionPolicy();

/**
 * Normalizes scope string by removing duplicates and ensuring openid is present
 */
export function normalizeScope(scope: string): string {
  const scopes = scope.split(" ").filter((s) => s.trim());
  const uniqueScopes = Array.from(new Set(scopes));

  // Ensure openid is always present
  if (!uniqueScopes.includes("openid")) {
    uniqueScopes.unshift("openid");
  }

  return uniqueScopes.join(" ");
}

/**
 * Adds scope to grant and explicitly enables refresh_token if offline_access is present
 */
export function addScopeToGrant(grant: any, scopeString: string): void {
  const normalizedScope = normalizeScope(scopeString);
  grant.addOIDCScope(normalizedScope);
}

export async function createOidcConfiguration(): Promise<Configuration> {
  // Initializing JWKS
  const jwks = await getJwks();

  return {
    // Supported scopes (as in the old OIDC)
    scopes: [
      "openid",
      "offline_access",
      "email",
      "phone",
      "profile",
      "accounts",
      "lk",
      "catalog",
      "locale",
    ],

    // Claims configuration (as in the old OIDC)
    claims: {
      openid: ["sub"],
      email: ["email", "email_public", "email_verified"],
      phone: ["phone_number", "phone_number_verified"],
      profile: [
        "name", // Composite field of given_name and family_name
        "nickname",
        "given_name",
        "family_name",
        "login",
        "profile",
        "birthdate",
        "password_updated_at",
        "password_change_required",
        "deleted",
        "picture",
        "custom_fields",
      ],
      accounts: ["publicExternalAccounts"],
      lk: ["lk", "systemClient", "orgClient"],
      catalog: ["catalog"],
      locale: ["locale"],
    },

    // Client-based CORS configuration (as in the old OIDC)
    clientBasedCORS: (ctx: any, origin: string, client: any) => {
      if (
        client.applicationType === "native" &&
        origin.startsWith("cryptoarm://")
      ) {
        return true; // Allow cryptoarm://
      }
      return false; // Check other cases as usual
    },

    // Conform ID Token Claims
    conformIdTokenClaims: false,

    // Supported response types (as in the old OIDC)
    responseTypes: [
      "code token",
      "code id_token token",
      "code id_token",
      "code",
      "id_token",
      "none",
    ],

    // Subject types
    subjectTypes: ["public", "pairwise"],

    // PKCE configuration
    pkce: {
      required: function pkceRequired(ctx: any, client: any) {
        return false;
      },
    },

    // Expires with session
    expiresWithSession: async (ctx: any, token: any) => {
      return true;
    },

    // Features configuration
    features: {
      devInteractions: { enabled: false }, // Disable built-in interfaces
      introspection: {
        enabled: true,
        allowedPolicy: async (ctx: any, client: any, token: any) => {
          return client.clientId === token.clientId;
        },
      },
      revocation: { enabled: true },
      registration: {
        enabled: false,
      },
      registrationManagement: {
        enabled: false,
      },
      rpInitiatedLogout: {
        enabled: true,
        logoutSource: async function logoutSource(ctx: any, form: string) {
          ctx.body = `<!DOCTYPE html>
            <body>
              ${form}
              <input type="hidden" form="op.logoutForm" name="logout" value="yes"/>
              <script type="text/javascript">
                document.getElementById('op.logoutForm').submit()
              </script>
            </body>
            </html>`;
        },
      },
      deviceFlow: {
        enabled: false,
      },
    },

    // List of additional client fields (as in the old OIDC)
    // Required for widget rendering
    extraClientMetadata: {
      properties: [
        "show_avatar_in_widget",
        "widget_title",
        "widget_info",
        "avatar",
        "widget_colors",
        "domain",
        "name",
        "access_token_ttl",
        "refresh_token_ttl",
      ],
    },

    // Cookies configuration
    cookies: {
      keys: [OIDC_COOKIE_SECRET],
    },

    // JWKS configuration
    jwks: jwks,

    ttl: {
      Grant: 24 * 60 * 60, // 1 day in seconds
      IdToken: 1800, // 30 minutes in seconds
      Interaction: 60 * 60 * 24, // 1 day in seconds
      AccessToken: function AccessTokenTTL(ctx, token, client) {
        return client.access_token_ttl &&
          typeof client.access_token_ttl === "number"
          ? client.access_token_ttl
          : 1800; // 30 minutes in seconds
      },
      RefreshToken: function RefreshTokenTTL(ctx, token, client) {
        if (
          ctx &&
          ctx.oidc.entities.RotatedRefreshToken &&
          client.applicationType === "web" &&
          client.tokenEndpointAuthMethod === "none" &&
          !token.isSenderConstrained()
        ) {
          // Non-Sender Constrained SPA RefreshTokens do not have infinite expiration through rotation
          return ctx.oidc.entities.RotatedRefreshToken.remainingTTL;
        }

        return client.refresh_token_ttl &&
          typeof client.refresh_token_ttl === "number"
          ? client.refresh_token_ttl
          : 86400; // 1 day in seconds
      },
      Session:
        OIDC_SESSION_TTL && typeof OIDC_SESSION_TTL === "number"
          ? OIDC_SESSION_TTL
          : 24 * 60 * 60, // 1 day in seconds
    },

    // Issue refresh token when offline_access is requested
    async issueRefreshToken(ctx: any, client: any, code: any) {
      // Check if client supports refresh_token grant
      if (!client.grantTypes.includes("refresh_token")) {
        return false;
      }
      // Check if offline_access scope was requested
      const hasOfflineAccess = code.scopes.has("offline_access");
      return hasOfflineAccess;
    },

    // Redis adapter for sessions and tokens
    adapter: Adapter,

    // Interactions configuration with a custom policy
    interactions: {
      url: async function interactionsUrl(ctx: any, interaction: any) {
        return `${DOMAIN}/api/interaction/${interaction.uid}`;
      },
      policy: interactionPolicy,
    },

    // Load existing grant function
    async loadExistingGrant(ctx: any) {
      // Get original scope from the request (before OIDC provider filters it)
      // Try multiple sources: query params, authorization object, or filtered params
      const originalScope =
        ctx.query?.scope ||
        ctx.request?.query?.scope ||
        ctx.oidc.authorization?.scope ||
        ctx.oidc.params.scope;

      const grantId =
        (ctx.oidc.result &&
          ctx.oidc.result.consent &&
          ctx.oidc.result.consent.grantId) ||
        ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId);
      const isFirstParty = ctx.oidc.params.redirect_uri === DOMAIN + "/code";

      // Get user scopes from the database
      const scopesRecord = await prisma.scopes.findUnique({
        where: {
          user_id_client_id: {
            user_id: parseInt(ctx.oidc.session.accountId, 10),
            client_id: ctx.oidc.client.clientId,
          },
        },
        select: { scopes: true },
      });

      const givenScopes = scopesRecord?.scopes || "";
      const requestedScopesArr = (originalScope as string).split(" ");
      let missingScopes = "";

      // offline_access is a special scope that doesn't need to be saved
      const SPECIAL_SCOPES = ["openid", "offline_access"];

      if (Array.isArray(requestedScopesArr)) {
        for (const scope of requestedScopesArr) {
          if (!SPECIAL_SCOPES.includes(scope) && !givenScopes.includes(scope)) {
            missingScopes += scope + " ";
          }
        }
      }

      const uid = ctx.oidc.entities.Interaction
        ? ctx.oidc.entities.Interaction.uid
        : ctx.oidc.entities.Session.uid;

      const trimmedMissingScopes = missingScopes.trim();

      // If there are missing scopes and this is NOT a trusted client, redirect to consent
      if (trimmedMissingScopes && ctx.oidc.client.clientId !== CLIENT_ID) {
        ctx.redirect(`${DOMAIN}/interaction/${uid}?prompt=consent`);
        return;
      }

      // If there are missing scopes and this is a trusted client, update the database
      if (trimmedMissingScopes && ctx.oidc.client.clientId === CLIENT_ID) {
        if (grantId) {
          try {
            const existingGrant = await ctx.oidc.provider.Grant.find(grantId);
            if (existingGrant) {
              await existingGrant.destroy();
            }
          } catch (error) {
            // Ignore error
          }
        }

        // Filter out special scopes before saving to database
        const scopesToSave = (givenScopes + " " + trimmedMissingScopes)
          .split(" ")
          .filter((s) => s && !s.includes("offline_access"))
          .join(" ");

        await prisma.scopes.upsert({
          where: {
            user_id_client_id: {
              user_id: parseInt(ctx.oidc.session.accountId, 10),
              client_id: ctx.oidc.client.clientId,
            },
          },
          update: {
            scopes: scopesToSave,
          },
          create: {
            user_id: parseInt(ctx.oidc.session.accountId, 10),
            client_id: ctx.oidc.client.clientId,
            scopes: scopesToSave,
          },
        });

        const grant = new ctx.oidc.provider.Grant({
          clientId: ctx.oidc.client.clientId,
          accountId: ctx.oidc.session.accountId,
        });

        addScopeToGrant(grant, originalScope as string);
        await grant.save();

        return grant;
      }

      if (isFirstParty) {
        const grant = new ctx.oidc.provider.Grant({
          clientId: ctx.oidc.client.clientId,
          accountId: ctx.oidc.session.accountId,
        });

        addScopeToGrant(grant, originalScope as string);

        await grant.save();
        return grant;
      }

      const grant = grantId
        ? await ctx.oidc.provider.Grant.find(grantId)
        : null;

      if (grant) {
        // Check if new scopes are requested (e.g., offline_access)
        const requestedScopes = (originalScope as string).split(" ");
        const grantScopes = grant.getOIDCScope();
        const grantScopesSet = new Set(grantScopes.split(" "));
        let needsUpdate = false;

        for (const scope of requestedScopes) {
          if (!grantScopesSet.has(scope)) {
            needsUpdate = true;
            break;
          }
        }

        // If new scopes requested, update the grant
        if (needsUpdate) {
          const allScopes = Array.from(
            new Set([...grantScopes.split(" "), ...requestedScopes]),
          ).join(" ");
          await grant.destroy();

          const newGrant = new ctx.oidc.provider.Grant({
            clientId: ctx.oidc.client.clientId,
            accountId: ctx.oidc.session.accountId,
          });
          addScopeToGrant(newGrant, allScopes);
          await newGrant.save();
          return newGrant;
        }

        // IMPORTANT: Use ONLY requested scopes
        // refresh_token should be issued ONLY if offline_access is explicitly requested
        const requestedScopesArray = (originalScope as string).split(" ");
        // Use only requested scopes (don't auto-add offline_access from grant)
        const finalScopes = requestedScopesArray.join(" ");

        ctx.oidc.params.scope = finalScopes;
        return grant;
      } else {
        const updatedScopesRecord = await prisma.scopes.findUnique({
          where: {
            user_id_client_id: {
              user_id: parseInt(ctx.oidc.session.accountId, 10),
              client_id: ctx.oidc.client.clientId,
            },
          },
          select: { scopes: true },
        });

        const currentUserScopes = updatedScopesRecord?.scopes || "";

        // Merge saved scopes with requested scopes (to include special scopes like offline_access)
        const requestedScopes = originalScope as string;
        const mergedScopes = currentUserScopes
          ? `${currentUserScopes} ${requestedScopes}`
          : requestedScopes;

        const grant = new ctx.oidc.provider.Grant({
          clientId: ctx.oidc.client.clientId,
          accountId: ctx.oidc.session.accountId,
        });
        addScopeToGrant(grant, mergedScopes);

        await grant.save();
        return grant;
      }
    },

    // Find account function
    findAccount: Account.findAccount,
  };
}

export function getPublicKeys(jwks: any) {
  return getPublicJwks(jwks);
}

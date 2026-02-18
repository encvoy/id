import { interactionPolicy } from "oidc-provider";

const { Check, base } = interactionPolicy;

/**
 * Creates a custom interaction policy with an additional check
 * for the _interaction_resume cookie to enhance authentication security
 */
export function createInteractionPolicy() {
  const policy = base();

  // Remove the standard no_session check
  const loginPolicy = policy.get("login");
  if (loginPolicy && loginPolicy.checks) {
    loginPolicy.checks.remove("no_session");
    // Add a custom check with additional cookie validation
    loginPolicy.checks.add(
      new Check("no_session", "End-User authentication is required", (ctx) => {
        const { oidc } = ctx;

        // Secure check for object existence
        if (!oidc || !oidc.session || !oidc.cookies) {
          return true; // Authentication is required if there are no base objects
        }

        const interactionResumeCookie = oidc.cookies.get("_interaction_resume");

        // Double check: both the session and the cookie must exist
        if (oidc.session.accountId && interactionResumeCookie) {
          return false; // Authentication is not required
        }

        return true; // Authentication is required
      })
    );
  }

  return policy;
}

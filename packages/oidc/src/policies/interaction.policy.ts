import { interactionPolicy } from "oidc-provider";

const { Check, base } = interactionPolicy;

/**
 * Creates a custom interaction policy with an additional check
 * that always starts a backend interaction for fresh authorization requests,
 * but allows the resumed authorization request to continue after backend
 * finishes its business checks.
 */
export function createInteractionPolicy() {
  const policy = base();

  // Remove the standard no_session check
  const loginPolicy = policy.get("login");
  if (loginPolicy && loginPolicy.checks) {
    loginPolicy.checks.remove("no_session");
    // Fresh /oidc/auth requests must go through backend interaction so it can
    // decide whether to auto-authorize the user or require additional steps.
    // Resumed /oidc/auth/:uid requests should not prompt again, otherwise the
    // flow loops forever after a successful widget submission.
    loginPolicy.checks.add(
      new Check("no_session", "End-User authentication is required", (ctx) => {
        const { oidc } = ctx;

        if (!oidc || !oidc.session) {
          return true;
        }

        const isResumeRequest =
          typeof ctx.params?.uid === "string" && ctx.params.uid.length > 0;

        if (!isResumeRequest) {
          return true;
        }

        return !oidc.session.accountId;
      })
    );
  }

  return policy;
}

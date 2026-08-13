import { CLIENT_ID } from "./constants.js";
import { prisma } from "./prisma.js";

export const BLOCKED_ERROR = "translation.errors.T3E0024";

class ClientBlockedAccessDenied extends Error {
  allow_redirect = true;
  error = "access_denied";
  error_description: string;
  expose = true;
  status = 400;
  statusCode = 400;

  constructor(description: string) {
    super("access_denied");
    this.name = "ClientBlockedAccessDenied";
    this.message = "access_denied";
    this.error_description = description;
  }
}

export async function isAuthorizationBlocked(
  accountId: string,
  clientId: string,
): Promise<boolean> {
  if (!accountId || !clientId || accountId === "1") {
    return false;
  }

  const mainRole = await prisma.role.findUnique({
    where: {
      user_id_client_id: {
        user_id: accountId,
        client_id: CLIENT_ID,
      },
    },
    select: {
      blocked: true,
    },
  });

  if (mainRole?.blocked) {
    return true;
  }

  if (clientId === CLIENT_ID) {
    return false;
  }

  const client = await prisma.client.findUnique({
    where: {
      client_id: clientId,
    },
    select: {
      client_id: true,
      parent_id: true,
    },
  });

  const organizationClientId =
    client && client.client_id !== CLIENT_ID ? client.parent_id ?? client.client_id : null;
  const scopedClientIds = Array.from(
    new Set(
      [clientId, organizationClientId].filter((value): value is string => Boolean(value)),
    ),
  );

  const roles = await prisma.role.findMany({
    where: {
      user_id: accountId,
      client_id: {
        in: scopedClientIds,
      },
    },
    select: {
      client_id: true,
      blocked: true,
    },
  });

  const roleByClientId = new Map(roles.map((role) => [role.client_id, role]));
  const clientRole = roleByClientId.get(clientId);
  const organizationRole = organizationClientId
    ? roleByClientId.get(organizationClientId)
    : undefined;

  return Boolean(
    clientRole?.blocked ||
      (organizationClientId &&
        organizationClientId !== clientId &&
        organizationRole?.blocked),
  );
}

export async function ensureAuthorizationAllowed(
  accountId: string,
  clientId: string,
): Promise<void> {
  if (await isAuthorizationBlocked(accountId, clientId)) {
    throw new ClientBlockedAccessDenied(BLOCKED_ERROR);
  }
}

import { Client, Role } from '@prisma/client';
import { CLIENT_ID } from 'src/constants';
import { prisma } from '../prisma';

type TAuthorizationClient = Pick<Client, 'client_id' | 'parent_id'> | null | undefined;

type TAuthorizationRole = Pick<Role, 'client_id' | 'role' | 'blocked'>;

export type TClientAuthorizationContext = {
  mainRole: TAuthorizationRole | null;
  clientRole: TAuthorizationRole | null;
  organizationRole: TAuthorizationRole | null;
  organizationClientId: string | null;
  isMainRoleBlocked: boolean;
  isClientAccessBlocked: boolean;
  isBlocked: boolean;
};

export function resolveOrganizationRootClientId(client: TAuthorizationClient): string | null {
  if (!client?.client_id || client.client_id === CLIENT_ID) {
    return null;
  }

  return client.parent_id ?? client.client_id;
}

export async function getClientAuthorizationContext(
  userId: string,
  client?: TAuthorizationClient,
): Promise<TClientAuthorizationContext> {
  const targetClientId = client?.client_id ?? null;
  const organizationClientId = resolveOrganizationRootClientId(client);
  const clientIds = Array.from(
    new Set(
      [CLIENT_ID, targetClientId, organizationClientId].filter(
        (clientId): clientId is string => Boolean(clientId),
      ),
    ),
  );

  const roles = await prisma.role.findMany({
    where: {
      user_id: userId,
      client_id: {
        in: clientIds,
      },
    },
    select: {
      client_id: true,
      role: true,
      blocked: true,
    },
  });

  const roleByClientId = new Map(roles.map((role) => [role.client_id, role]));
  const mainRole = roleByClientId.get(CLIENT_ID) ?? null;
  const clientRole = targetClientId ? roleByClientId.get(targetClientId) ?? null : null;
  const organizationRole = organizationClientId
    ? roleByClientId.get(organizationClientId) ?? null
    : null;

  const isMainRoleBlocked = Boolean(mainRole?.blocked);
  const isClientAccessBlocked = Boolean(
    clientRole?.blocked ||
      (organizationClientId &&
        organizationClientId !== targetClientId &&
        organizationRole?.blocked),
  );

  return {
    mainRole,
    clientRole,
    organizationRole,
    organizationClientId,
    isMainRoleBlocked,
    isClientAccessBlocked,
    isBlocked: isMainRoleBlocked || isClientAccessBlocked,
  };
}

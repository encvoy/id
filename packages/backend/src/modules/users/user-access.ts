import { BadRequestException } from '@nestjs/common';
import { CLIENT_ID } from '../../constants';
import { Ei18nCodes, UserRoles } from '../../enums';
import { prisma } from '../prisma';
import { RoleRepository } from '../repository';

export const isSystemManagerRole = (role?: UserRoles) =>
  role === UserRoles.OWNER || role === UserRoles.EDITOR;

export const isOrganizationManagerRole = (role?: UserRoles) =>
  role === UserRoles.OWNER || role === UserRoles.EDITOR;

export type TManagedUserAccessContext = {
  actorUserId: string;
  isSystemManager: boolean;
  managedOrganizationIds: Set<string>;
};

export const buildManagedUserAccessContext = async (
  actorUserId: string,
): Promise<TManagedUserAccessContext> => {
  if (!actorUserId) {
    return {
      actorUserId: '',
      isSystemManager: false,
      managedOrganizationIds: new Set<string>(),
    };
  }

  const actorSystemRoleItem = await prisma.role.findUnique({
    where: {
      user_id_client_id: {
        user_id: actorUserId,
        client_id: CLIENT_ID,
      },
    },
    select: {
      role: true,
    },
  });

  const actorSystemRole = actorSystemRoleItem?.role as UserRoles | undefined;
  if (isSystemManagerRole(actorSystemRole)) {
    return {
      actorUserId,
      isSystemManager: true,
      managedOrganizationIds: new Set<string>(),
    };
  }

  const organizationRoles = await prisma.role.findMany({
    where: {
      user_id: actorUserId,
      role: {
        in: [UserRoles.OWNER, UserRoles.EDITOR],
      },
      client: {
        client_id: {
          not: CLIENT_ID,
        },
        parent_id: null,
      },
    },
    select: {
      client_id: true,
    },
  });

  return {
    actorUserId,
    isSystemManager: false,
    managedOrganizationIds: new Set(organizationRoles.map((role) => role.client_id)),
  };
};

export const canManageTargetUserByContext = (
  context: TManagedUserAccessContext,
  targetUserId: string,
  targetUserOrgId?: string | null,
) => {
  if (!context.actorUserId || !targetUserId) {
    return false;
  }

  if (context.actorUserId === targetUserId) {
    return true;
  }

  if (context.isSystemManager) {
    return true;
  }

  if (!targetUserOrgId || targetUserOrgId === CLIENT_ID) {
    return false;
  }

  return context.managedOrganizationIds.has(targetUserOrgId);
};

export const canManageTargetUser = async (
  actorUserId: string,
  targetUserId: string,
  _roleRepo: RoleRepository,
) => {
  if (!actorUserId || !targetUserId) {
    return false;
  }

  const [accessContext, targetUser] = await Promise.all([
    buildManagedUserAccessContext(actorUserId),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        org_id: true,
      },
    }),
  ]);

  if (!targetUser) {
    throw new BadRequestException(Ei18nCodes.T3E0003);
  }

  return canManageTargetUserByContext(accessContext, targetUser.id, targetUser.org_id);
};

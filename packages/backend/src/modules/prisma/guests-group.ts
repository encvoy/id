import { Prisma, PrismaClient, RbacGroup } from '@prisma/client';
import { CLIENT_ID } from '../../constants';

export const GUESTS_GROUP_NAME = 'Guests';
const SYSTEM_GUESTS_GROUP_DESCRIPTION =
  'System group for users without trusted external accounts or active source links';
const ORGANIZATION_GUESTS_GROUP_DESCRIPTION = 'System group for external users of the organization';
const DIRECTORY_FOLDER_NAME = 'Directory';
const GUESTS_SYNC_BATCH_SIZE = 5_000;

type TGuestsGroupClient = Prisma.TransactionClient | PrismaClient;
type TGuestsScope = {
  clientId: string;
  folderId: string;
};

function splitIntoBindSafeBatches<T>(items: T[]) {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += GUESTS_SYNC_BATCH_SIZE) {
    batches.push(items.slice(index, index + GUESTS_SYNC_BATCH_SIZE));
  }
  return batches;
}

async function resolveGuestsScope(
  prisma: TGuestsGroupClient,
  clientId: string,
): Promise<TGuestsScope | null> {
  const client = await prisma.client.findUnique({
    where: { client_id: clientId },
    select: {
      client_id: true,
      folder_id: true,
    },
  });

  if (!client) {
    return null;
  }

  if (client.folder_id) {
    return {
      clientId: client.client_id,
      folderId: client.folder_id,
    };
  }

  const directoryFolder = await prisma.folder.findFirst({
    where: {
      client_id: client.client_id,
      name: DIRECTORY_FOLDER_NAME,
      parent_id: null,
    },
    select: {
      id: true,
    },
  });

  if (!directoryFolder) {
    return null;
  }

  return {
    clientId: client.client_id,
    folderId: directoryFolder.id,
  };
}

async function resolveOrganizationClientIdForClient(
  prisma: TGuestsGroupClient,
  clientId: string,
): Promise<string | null> {
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

  return client.parent_id || client.client_id;
}

function getGuestsGroupDescription(clientId: string) {
  return clientId === CLIENT_ID
    ? SYSTEM_GUESTS_GROUP_DESCRIPTION
    : ORGANIZATION_GUESTS_GROUP_DESCRIPTION;
}

async function ensureGuestsGroupInScope(
  prisma: TGuestsGroupClient,
  scope: TGuestsScope,
): Promise<RbacGroup> {
  const existingGroup = await prisma.rbacGroup.findFirst({
    where: {
      client_id: scope.clientId,
      folder_id: scope.folderId,
      name: GUESTS_GROUP_NAME,
    },
  });

  if (existingGroup) {
    return existingGroup;
  }

  return prisma.rbacGroup.create({
    data: {
      client_id: scope.clientId,
      folder_id: scope.folderId,
      name: GUESTS_GROUP_NAME,
      description: getGuestsGroupDescription(scope.clientId),
    },
  });
}

async function setGuestsMembership(
  prisma: TGuestsGroupClient,
  groupId: string,
  userId: string,
  shouldBeMember: boolean,
) {
  const existingMembership = await prisma.rbacGroupMember.findFirst({
    where: {
      parent_group_id: groupId,
      member_user_id: userId,
    },
    select: {
      id: true,
    },
  });

  if (shouldBeMember && !existingMembership) {
    await prisma.rbacGroupMember.create({
      data: {
        parent_group_id: groupId,
        member_user_id: userId,
      },
    });
    return;
  }

  if (!shouldBeMember && existingMembership) {
    await prisma.rbacGroupMember.delete({
      where: {
        id: existingMembership.id,
      },
    });
  }
}

async function isExternalForOrganization(
  prisma: TGuestsGroupClient,
  userId: string,
  organizationClientId: string,
) {
  const [user, organizationRole] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        deleted: true,
        org_id: true,
      },
    }),
    prisma.role.findUnique({
      where: {
        user_id_client_id: {
          user_id: userId,
          client_id: organizationClientId,
        },
      },
      select: {
        user_id: true,
      },
    }),
  ]);

  if (!user || user.deleted) {
    return false;
  }

  if (user.org_id === organizationClientId) {
    return false;
  }

  if (organizationRole) {
    return false;
  }

  return true;
}

async function hasOrganizationGuestRelation(
  prisma: TGuestsGroupClient,
  userId: string,
  organizationClientId: string,
) {
  const organizationClientsFilter = {
    OR: [{ client_id: organizationClientId }, { parent_id: organizationClientId }],
  } satisfies Prisma.ClientWhereInput;

  const [appRole, groupMembership, directAssignment] = await Promise.all([
    prisma.role.findFirst({
      where: {
        user_id: userId,
        client: organizationClientsFilter,
      },
      select: {
        user_id: true,
      },
    }),
    prisma.rbacGroupMember.findFirst({
      where: {
        member_user_id: userId,
        parent_group: {
          client: organizationClientsFilter,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.rbacAssignment.findFirst({
      where: {
        user_id: userId,
        resource: {
          client: organizationClientsFilter,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  return Boolean(appRole || groupMembership || directAssignment);
}

async function clientHasGuestsAssignment(
  prisma: TGuestsGroupClient,
  clientId: string,
  guestsGroupId: string,
) {
  const assignment = await prisma.rbacAssignment.findFirst({
    where: {
      group_id: guestsGroupId,
      resource: {
        client_id: clientId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(assignment);
}

export async function ensureGuestsGroup(
  prisma: TGuestsGroupClient,
  clientId = CLIENT_ID,
): Promise<RbacGroup | null> {
  const scope = await resolveGuestsScope(prisma, clientId);

  if (!scope) {
    return null;
  }

  return ensureGuestsGroupInScope(prisma, scope);
}

export async function ensureOrganizationGuestsGroup(
  prisma: TGuestsGroupClient,
  organizationClientId: string,
) {
  if (!organizationClientId || organizationClientId === CLIENT_ID) {
    return null;
  }

  return ensureGuestsGroup(prisma, organizationClientId);
}

export async function isGuestsGroupId(prisma: TGuestsGroupClient, groupId: string) {
  const group = await prisma.rbacGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      client_id: true,
      folder_id: true,
      name: true,
      client: {
        select: {
          parent_id: true,
        },
      },
    },
  });

  if (!group || group.name !== GUESTS_GROUP_NAME || group.client.parent_id !== null) {
    return false;
  }

  const guestsGroup = await ensureGuestsGroup(prisma, group.client_id);
  return guestsGroup?.id === group.id && guestsGroup.folder_id === group.folder_id;
}

export async function isSystemGuestsGroupId(
  prisma: TGuestsGroupClient,
  groupId: string,
  systemClientId = CLIENT_ID,
) {
  const group = await prisma.rbacGroup.findUnique({
    where: { id: groupId },
    select: {
      client_id: true,
    },
  });

  if (!group || group.client_id !== systemClientId) {
    return false;
  }

  return isGuestsGroupId(prisma, groupId);
}

export async function syncGuestsMembershipForUser(
  prisma: TGuestsGroupClient,
  userId: string,
  systemClientId = CLIENT_ID,
) {
  await syncGuestsMembershipForUsers(prisma, [userId], systemClientId);
}

export async function syncGuestsMembershipForUsers(
  prisma: TGuestsGroupClient,
  userIds: Iterable<string | null | undefined>,
  systemClientId = CLIENT_ID,
) {
  const normalizedUserIds = Array.from(
    new Set(Array.from(userIds).filter((userId): userId is string => Boolean(userId))),
  );

  if (!normalizedUserIds.length) {
    return;
  }

  const guestsGroup = await ensureGuestsGroup(prisma, systemClientId);

  if (!guestsGroup) {
    return;
  }

  const eligibleUsers = await prisma.user.findMany({
    where: {
      id: {
        in: normalizedUserIds,
      },
      deleted: null,
      org_id: null,
    },
    select: {
      id: true,
    },
  });

  const eligibleUserIds = eligibleUsers.map((user) => user.id);
  const eligibleUserIdsSet = new Set(eligibleUserIds);

  const existingMembers = await prisma.rbacGroupMember.findMany({
    where: {
      parent_group_id: guestsGroup.id,
      member_user_id: {
        in: normalizedUserIds,
      },
    },
    select: {
      id: true,
      member_user_id: true,
    },
  });

  const existingMemberUserIds = new Set(
    existingMembers
      .map((member) => member.member_user_id)
      .filter((memberUserId): memberUserId is string => Boolean(memberUserId)),
  );

  const membersToAdd = eligibleUserIds.filter((userId) => !existingMemberUserIds.has(userId));
  if (membersToAdd.length) {
    await prisma.rbacGroupMember.createMany({
      data: membersToAdd.map((memberUserId) => ({
        parent_group_id: guestsGroup.id,
        member_user_id: memberUserId,
      })),
      skipDuplicates: true,
    });
  }

  const membershipIdsToDelete = existingMembers
    .filter((member) => !member.member_user_id || !eligibleUserIdsSet.has(member.member_user_id))
    .map((member) => member.id);

  if (membershipIdsToDelete.length) {
    await prisma.rbacGroupMember.deleteMany({
      where: {
        id: {
          in: membershipIdsToDelete,
        },
      },
    });
  }
}

export async function syncGuestsGroupMembers(
  prisma: TGuestsGroupClient,
  systemClientId = CLIENT_ID,
) {
  const guestsGroup = await ensureGuestsGroup(prisma, systemClientId);

  if (!guestsGroup) {
    return null;
  }

  const eligibleUsers = await prisma.user.findMany({
    where: {
      deleted: null,
      org_id: null,
    },
    select: {
      id: true,
    },
  });

  const eligibleUserIds = eligibleUsers.map((user) => user.id);
  const eligibleUserIdsSet = new Set(eligibleUserIds);
  const existingMembers = await prisma.rbacGroupMember.findMany({
    where: {
      parent_group_id: guestsGroup.id,
      member_group_id: null,
    },
    select: {
      id: true,
      member_user_id: true,
    },
  });

  const existingMemberUserIds = new Set(
    existingMembers
      .map((member) => member.member_user_id)
      .filter((memberUserId): memberUserId is string => Boolean(memberUserId)),
  );

  const membersToAdd = eligibleUserIds.filter((userId) => !existingMemberUserIds.has(userId));
  if (membersToAdd.length) {
    await prisma.rbacGroupMember.createMany({
      data: membersToAdd.map((userId) => ({
        parent_group_id: guestsGroup.id,
        member_user_id: userId,
      })),
      skipDuplicates: true,
    });
  }

  const membershipIdsToDelete = existingMembers
    .filter((member) => !member.member_user_id || !eligibleUserIdsSet.has(member.member_user_id))
    .map((member) => member.id);

  if (membershipIdsToDelete.length) {
    await prisma.rbacGroupMember.deleteMany({
      where: {
        id: {
          in: membershipIdsToDelete,
        },
      },
    });
  }

  return guestsGroup;
}

export async function syncOrganizationGuestsMembershipForUser(
  prisma: TGuestsGroupClient,
  userId: string,
  organizationClientId: string,
) {
  const guestsGroup = await ensureOrganizationGuestsGroup(prisma, organizationClientId);

  if (!guestsGroup) {
    return;
  }

  const shouldBeMember =
    (await isExternalForOrganization(prisma, userId, organizationClientId)) &&
    (await hasOrganizationGuestRelation(prisma, userId, organizationClientId));

  await setGuestsMembership(prisma, guestsGroup.id, userId, shouldBeMember);
}

export async function prepareOrganizationGuestsMembershipForClientAuthorization(
  prisma: TGuestsGroupClient,
  userId: string,
  clientId: string,
) {
  const organizationClientId = await resolveOrganizationClientIdForClient(prisma, clientId);

  if (!organizationClientId || organizationClientId === CLIENT_ID) {
    return;
  }

  const guestsGroup = await ensureOrganizationGuestsGroup(prisma, organizationClientId);

  if (!guestsGroup) {
    return;
  }

  if (!(await clientHasGuestsAssignment(prisma, clientId, guestsGroup.id))) {
    return;
  }

  const shouldBeMember = await isExternalForOrganization(prisma, userId, organizationClientId);
  await setGuestsMembership(prisma, guestsGroup.id, userId, shouldBeMember);
}

export async function syncOrganizationGuestsMembershipForAuthorizedClient(
  prisma: TGuestsGroupClient,
  userId: string,
  clientId: string,
) {
  const organizationClientId = await resolveOrganizationClientIdForClient(prisma, clientId);

  if (!organizationClientId || organizationClientId === CLIENT_ID) {
    return;
  }

  const guestsGroup = await ensureOrganizationGuestsGroup(prisma, organizationClientId);

  if (!guestsGroup) {
    return;
  }

  const shouldBeMember = await isExternalForOrganization(prisma, userId, organizationClientId);
  await setGuestsMembership(prisma, guestsGroup.id, userId, shouldBeMember);
}

export async function syncOrganizationGuestsGroupMembers(
  prisma: TGuestsGroupClient,
  organizationClientId: string,
) {
  const guestsGroup = await ensureOrganizationGuestsGroup(prisma, organizationClientId);

  if (!guestsGroup) {
    return null;
  }

  const organizationClientsFilter = {
    OR: [{ client_id: organizationClientId }, { parent_id: organizationClientId }],
  } satisfies Prisma.ClientWhereInput;

  const [roleRelations, groupRelations, assignmentRelations] = await Promise.all([
    prisma.role.findMany({
      where: {
        client: organizationClientsFilter,
      },
      select: {
        user_id: true,
        client_id: true,
      },
    }),
    prisma.rbacGroupMember.findMany({
      where: {
        member_user_id: {
          not: null,
        },
        parent_group: {
          client: organizationClientsFilter,
        },
      },
      select: {
        member_user_id: true,
      },
    }),
    prisma.rbacAssignment.findMany({
      where: {
        user_id: {
          not: null,
        },
        resource: {
          client: organizationClientsFilter,
        },
      },
      select: {
        user_id: true,
      },
    }),
  ]);

  const relatedUserIds = Array.from(
    new Set(
      [
        ...roleRelations.map((item) => item.user_id),
        ...groupRelations.map((item) => item.member_user_id),
        ...assignmentRelations.map((item) => item.user_id),
      ].filter((userId): userId is string => Boolean(userId)),
    ),
  );

  const rootRoleUserIds = new Set(
    roleRelations
      .filter((role) => role.client_id === organizationClientId)
      .map((role) => role.user_id),
  );
  const relatedUsers: Array<{ id: string; deleted: Date | null; org_id: string | null }> = [];

  for (const relatedUserIdsBatch of splitIntoBindSafeBatches(relatedUserIds)) {
    const relatedUsersBatch = await prisma.user.findMany({
      where: {
        id: {
          in: relatedUserIdsBatch,
        },
      },
      select: {
        id: true,
        deleted: true,
        org_id: true,
      },
    });

    relatedUsers.push(...relatedUsersBatch);
  }

  const eligibleUserIds = relatedUsers
    .filter((user) => !user.deleted)
    .filter((user) => user.org_id !== organizationClientId)
    .filter((user) => !rootRoleUserIds.has(user.id))
    .map((user) => user.id);

  const eligibleUserIdsSet = new Set(eligibleUserIds);
  const existingMembers = await prisma.rbacGroupMember.findMany({
    where: {
      parent_group_id: guestsGroup.id,
      member_group_id: null,
    },
    select: {
      id: true,
      member_user_id: true,
    },
  });

  const existingMemberUserIds = new Set(
    existingMembers
      .map((member) => member.member_user_id)
      .filter((memberUserId): memberUserId is string => Boolean(memberUserId)),
  );

  const membersToAdd = eligibleUserIds.filter((userId) => !existingMemberUserIds.has(userId));
  for (const membersToAddBatch of splitIntoBindSafeBatches(membersToAdd)) {
    await prisma.rbacGroupMember.createMany({
      data: membersToAddBatch.map((userId) => ({
        parent_group_id: guestsGroup.id,
        member_user_id: userId,
      })),
      skipDuplicates: true,
    });
  }

  const membershipIdsToDelete = existingMembers
    .filter((member) => !member.member_user_id || !eligibleUserIdsSet.has(member.member_user_id))
    .map((member) => member.id);

  for (const membershipIdsToDeleteBatch of splitIntoBindSafeBatches(membershipIdsToDelete)) {
    await prisma.rbacGroupMember.deleteMany({
      where: {
        id: {
          in: membershipIdsToDeleteBatch,
        },
      },
    });
  }

  return guestsGroup;
}

export async function syncAllGuestsGroups(prisma: TGuestsGroupClient) {
  await syncGuestsGroupMembers(prisma, CLIENT_ID);

  const organizations = await prisma.client.findMany({
    where: {
      client_id: {
        not: CLIENT_ID,
      },
      parent_id: null,
    },
    select: {
      client_id: true,
    },
  });

  for (const organization of organizations) {
    await syncOrganizationGuestsGroupMembers(prisma, organization.client_id);
  }
}

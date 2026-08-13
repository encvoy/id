jest.mock('../../constants', () => ({
  CLIENT_ID: 'system-client',
}));

import { syncOrganizationGuestsGroupMembers } from './guests-group';

const ORGANIZATION_CLIENT_ID = 'organization-client';
const GUESTS_GROUP_ID = 'guests-group';
const EXPECTED_MAX_BATCH_SIZE = 5_000;

describe('syncOrganizationGuestsGroupMembers', () => {
  it('keeps large guest synchronization queries within a bind-safe batch size', async () => {
    const relatedUserIds = Array.from({ length: 32_767 }, (_, index) => `user-${index}`);
    const staleMembers = relatedUserIds.map((_, index) => ({
      id: `membership-${index}`,
      member_user_id: `stale-user-${index}`,
    }));

    const roleFindMany = jest
      .fn()
      .mockResolvedValue([
        ...relatedUserIds.map((user_id) => ({ user_id, client_id: 'child-client' })),
        { user_id: relatedUserIds[0], client_id: ORGANIZATION_CLIENT_ID },
      ]);
    const userFindMany = jest.fn().mockImplementation(async ({ where }) =>
      where.id.in.map((id: string) => ({
        id,
        deleted: null,
        org_id: 'another-organization',
      })),
    );
    const groupMemberFindMany = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(staleMembers);
    const createMany = jest.fn().mockResolvedValue({ count: 0 });
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

    const prisma = {
      client: {
        findUnique: jest.fn().mockResolvedValue({
          client_id: ORGANIZATION_CLIENT_ID,
          folder_id: 'organization-folder',
        }),
      },
      rbacGroup: {
        findFirst: jest.fn().mockResolvedValue({ id: GUESTS_GROUP_ID }),
      },
      role: {
        findMany: roleFindMany,
      },
      user: {
        findMany: userFindMany,
      },
      rbacGroupMember: {
        findMany: groupMemberFindMany,
        createMany,
        deleteMany,
      },
      rbacAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    await syncOrganizationGuestsGroupMembers(prisma as any, ORGANIZATION_CLIENT_ID);

    expect(roleFindMany).toHaveBeenCalledTimes(1);
    expect(roleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          user_id: true,
          client_id: true,
        },
      }),
    );

    const lookedUpUserIds = userFindMany.mock.calls.flatMap(([query]) => query.where.id.in);
    expect(
      userFindMany.mock.calls.every(
        ([query]) => query.where.id.in.length <= EXPECTED_MAX_BATCH_SIZE,
      ),
    ).toBe(true);
    expect(lookedUpUserIds).toHaveLength(relatedUserIds.length);
    expect(new Set(lookedUpUserIds).size).toBe(relatedUserIds.length);

    const createBatches = createMany.mock.calls.map(([query]) => query.data);
    const createdUserIds = createBatches.flatMap((batch) =>
      batch.map((member: { member_user_id: string }) => member.member_user_id),
    );
    expect(createBatches.every((batch) => batch.length <= EXPECTED_MAX_BATCH_SIZE)).toBe(true);
    expect(createdUserIds).toHaveLength(relatedUserIds.length - 1);
    expect(createdUserIds).not.toContain(relatedUserIds[0]);
    expect(new Set(createdUserIds).size).toBe(createdUserIds.length);

    const deleteBatches = deleteMany.mock.calls.map(([query]) => query.where.id.in);
    const deletedMembershipIds = deleteBatches.flat();
    expect(deleteBatches.every((batch) => batch.length <= EXPECTED_MAX_BATCH_SIZE)).toBe(true);
    expect(deletedMembershipIds).toHaveLength(staleMembers.length);
    expect(new Set(deletedMembershipIds).size).toBe(staleMembers.length);
  });
});

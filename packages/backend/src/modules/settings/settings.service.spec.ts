jest.mock('../prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

import { EClaimPrivacy } from '../../enums';
import { prisma } from '../prisma';
import { SettingsService } from './settings.service';

describe('SettingsService organization profile defaults', () => {
  it('backfills a new organization field for role members from another organization', async () => {
    const organizationId = 'organization-b';
    const profileField = {
      id: 'profile-field-id',
      default_public: 0,
    };
    const transaction = {
      profileField: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(profileField),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'organization-owner' }]),
      },
      userProfileValue: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback(transaction),
    );

    const service = new SettingsService({} as any, {} as any);
    jest
      .spyOn(service as any, 'resolveProfileFieldOwnerOrganizationId')
      .mockResolvedValue(organizationId);
    jest.spyOn(service as any, 'notifyDynamicScopesChanged').mockResolvedValue(undefined);

    await service.addProfileField({
      field: 'organization_code',
      title: { 'ru-RU': 'Код организации' },
      default: 'default-code',
      required: false,
      unique: false,
      active: true,
      editable: true,
      claim: EClaimPrivacy.private,
    });

    expect(transaction.user.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { org_id: organizationId },
          { roles: { some: { client_id: organizationId } } },
        ],
      },
      select: { id: true },
    });
    expect(transaction.userProfileValue.createMany).toHaveBeenCalledWith({
      data: [
        {
          user_id: 'organization-owner',
          profile_field_id: profileField.id,
          value: 'default-code',
          public: profileField.default_public,
        },
      ],
      skipDuplicates: true,
    });
  });
});

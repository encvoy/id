import { UserRoles } from '../../enums';
import { canTransferOrganizationOwner } from './organization-owner-access';

describe('canTransferOrganizationOwner', () => {
  it.each([UserRoles.OWNER, UserRoles.EDITOR])(
    'allows a system %s to transfer organization ownership',
    (systemRole) => {
      expect(canTransferOrganizationOwner(systemRole, UserRoles.USER)).toBe(true);
    },
  );

  it('allows the current organization owner to transfer ownership', () => {
    expect(canTransferOrganizationOwner(UserRoles.USER, UserRoles.OWNER)).toBe(true);
  });

  it.each([UserRoles.EDITOR, UserRoles.MANAGER, UserRoles.USER, UserRoles.TRUSTED_USER])(
    'denies an organization %s without a system management role',
    (organizationRole) => {
      expect(canTransferOrganizationOwner(undefined, organizationRole)).toBe(false);
    },
  );
});

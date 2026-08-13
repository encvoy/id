import { UserRoles } from '../../enums';

export const canTransferOrganizationOwner = (
  systemRole?: UserRoles,
  organizationRole?: UserRoles,
) =>
  systemRole === UserRoles.OWNER ||
  systemRole === UserRoles.EDITOR ||
  organizationRole === UserRoles.OWNER;

import { IRoleClients } from "src/shared/api/users";
import { ERoles } from "./enums";

const isSystemManagerRole = (role?: string) =>
  role === ERoles.OWNER || role === ERoles.EDITOR;

const isOrganizationManagerRole = (role?: string) =>
  role === ERoles.OWNER || role === ERoles.EDITOR;

export const canTransferOrganizationOwner = ({
  systemRole,
  organizationRole,
}: {
  systemRole?: string;
  organizationRole?: string;
}) => isSystemManagerRole(systemRole) || organizationRole === ERoles.OWNER;

export const canManageTargetUser = ({
  roleInApp,
  roles,
  targetUserOrgId,
}: {
  roleInApp?: string;
  roles?: IRoleClients[];
  targetUserOrgId?: string | null;
}) => {
  if (isSystemManagerRole(roleInApp)) {
    return true;
  }

  if (!targetUserOrgId) {
    return false;
  }

  const actorOrganizationRole = roles?.find(
    (item) =>
      item.client.parent_id === null && item.client.client_id === targetUserOrgId
  )?.role;

  return isOrganizationManagerRole(actorOrganizationRole);
};

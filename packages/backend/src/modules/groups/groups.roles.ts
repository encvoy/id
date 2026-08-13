import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

export enum GroupsActions {
  groups_read = 'groups:read',
  groups_write = 'groups:write',
  groups_delete = 'groups:delete',
  application_access_groups_read = 'application_access_groups:read',
  application_access_groups_write = 'application_access_groups:write',
}

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  GroupsActions.groups_read,
  GroupsActions.groups_write,
  GroupsActions.groups_delete,
  GroupsActions.application_access_groups_read,
  GroupsActions.application_access_groups_write,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  GroupsActions.groups_read,
  GroupsActions.groups_write,
  GroupsActions.groups_delete,
  GroupsActions.application_access_groups_read,
  GroupsActions.application_access_groups_write,
]);

import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Scope actions
 */
export enum ScopesActions {
  /**
   * Getting a list of permissions
   */
  list = 'scopes:list',
  /**
   * Revoking a permission
   */
  delete = 'scopes:delete',
}

ROLES.set(UserRoles.USER, [
  ...(ROLES.get(UserRoles.USER) || []),
  ScopesActions.list,
  ScopesActions.delete,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  ScopesActions.list,
  ScopesActions.delete,
]);

ROLES.set(UserRoles.ADMIN, [
  ...(ROLES.get(UserRoles.ADMIN) || []),
  ScopesActions.list,
  ScopesActions.delete,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  ScopesActions.list,
  ScopesActions.delete,
]);

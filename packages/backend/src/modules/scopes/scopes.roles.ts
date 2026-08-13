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
  /**
   * Managing dynamic OIDC scopes
   */
  manageOidc = 'scopes:manage-oidc',
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
  ScopesActions.manageOidc,
]);

ROLES.set(UserRoles.MANAGER, [
  ...(ROLES.get(UserRoles.MANAGER) || []),
  ScopesActions.list,
  ScopesActions.delete,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  ScopesActions.list,
  ScopesActions.delete,
  ScopesActions.manageOidc,
]);

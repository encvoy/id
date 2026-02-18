import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Client actions
 */
export enum ClientActions {
  scopes_read = 'client:scopes:read',
  /**
   * Reading an app
   */
  read = 'client:read',
  /**
   * Getting a list of apps
   */
  list = 'client:list',
  /**
   * Creating and editing an app
   */
  write = 'client:write',
  /**
   * Deleting an app
   */
  delete = 'client:delete',
  /**
   * Getting user role in an application
   */
  getRole = 'client:users:role:get',
  /**
   * Update role
   */
  updateRole = 'client:users:role:update',
}

ROLES.set(UserRoles.USER, [
  ...(ROLES.get(UserRoles.USER) || []),
  ClientActions.list,
  ClientActions.scopes_read,
  ClientActions.getRole,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  ClientActions.list,
  ClientActions.read,
  ClientActions.write,
  ClientActions.delete,
  ClientActions.scopes_read,
  ClientActions.updateRole,
  ClientActions.getRole,
]);

ROLES.set(UserRoles.ADMIN, [
  ...(ROLES.get(UserRoles.ADMIN) || []),
  ClientActions.list,
  ClientActions.read,
  ClientActions.write,
  ClientActions.delete,
  ClientActions.scopes_read,
  ClientActions.getRole,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  ClientActions.list,
  ClientActions.read,
  ClientActions.write,
  ClientActions.delete,
  ClientActions.scopes_read,
  ClientActions.updateRole,
  ClientActions.getRole,
]);

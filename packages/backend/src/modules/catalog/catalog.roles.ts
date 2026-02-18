import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Catalog actions
 */
export enum CatalogActions {
  /**
   * Get list
   */
  list = 'catalog:list',
  /**
   * Update card settings
   */
  settingsRead = 'catalog:settings:read',
  /**
   * Update card settings
   */
  settingsWrite = 'catalog:settings:write',
}

ROLES.set(UserRoles.USER, [
  ...(ROLES.get(UserRoles.USER) || []),
  CatalogActions.list,
  CatalogActions.settingsRead,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  CatalogActions.list,
  CatalogActions.settingsRead,
  CatalogActions.settingsWrite,
]);

ROLES.set(UserRoles.ADMIN, [
  ...(ROLES.get(UserRoles.ADMIN) || []),
  CatalogActions.list,
  CatalogActions.settingsRead,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  CatalogActions.list,
  CatalogActions.settingsRead,
  CatalogActions.settingsWrite,
]);

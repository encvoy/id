import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * User actions
 */
export enum UsersActions {
  /**
   * Get all user roles
   */
  getAllRoles = 'users:roles:get',
  /**
   * Update user
   */
  update = 'users:update',
  /**
   * Delete user
   */
  delete = 'users:delete',
  /**
   * Block user
   */
  block = 'users:block',
  /**
   * Unblock user
   */
  unblock = 'users:unblock',
  /**
   * Restore user
   */
  restore = 'users:restore',
  /**
   * Change password
   */
  changePassword = 'password:update',
  /**
   * Get profile
   */
  profile = 'users:profile',
  /**
   * Change email
   */
  changeEmail = 'email:change',
  /**
   * Change phone
   */
  changePhone = 'phone:change',

  externalAccounts = 'users:external_accounts',
  createExternalAccounts = 'users:external_accounts:create',
  deleteExternalAccounts = 'users:external_accounts:delete',
}

ROLES.set(UserRoles.USER, [
  ...(ROLES.get(UserRoles.USER) || []),
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.update,
  UsersActions.restore,
  UsersActions.changePassword,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.update,
  UsersActions.restore,
  UsersActions.block,
  UsersActions.unblock,
  UsersActions.changePassword,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
]);

ROLES.set(UserRoles.ADMIN, [
  ...(ROLES.get(UserRoles.ADMIN) || []),
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.update,
  UsersActions.restore,
  UsersActions.changePassword,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.update,
  UsersActions.restore,
  UsersActions.block,
  UsersActions.unblock,
  UsersActions.changePassword,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
]);

import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * User actions
 */
export enum UsersActions {
  /**
   * Create user
   */
  create = 'users:create',
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
   * Mark user for deletion
   */
  markDelete = 'users:mark_delete',
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
  /**
   * Confirm contact from admin profile
   */
  confirmContact = 'users:contacts:confirm',

  externalAccounts = 'users:external_accounts',
  createExternalAccounts = 'users:external_accounts:create',
  deleteExternalAccounts = 'users:external_accounts:delete',
  checkFieldAvailability = 'users:field:availability',
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

ROLES.set(UserRoles.TRUSTED_USER, [
  ...(ROLES.get(UserRoles.TRUSTED_USER) || []),
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.restore,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  UsersActions.create,
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.markDelete,
  UsersActions.update,
  UsersActions.restore,
  UsersActions.block,
  UsersActions.unblock,
  UsersActions.changePassword,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.confirmContact,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
  UsersActions.checkFieldAvailability,
]);

ROLES.set(UserRoles.MANAGER, [
  ...(ROLES.get(UserRoles.MANAGER) || []),
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
  UsersActions.create,
  UsersActions.getAllRoles,
  UsersActions.delete,
  UsersActions.markDelete,
  UsersActions.update,
  UsersActions.restore,
  UsersActions.block,
  UsersActions.unblock,
  UsersActions.changePassword,
  UsersActions.changeEmail,
  UsersActions.changePhone,
  UsersActions.confirmContact,
  UsersActions.profile,
  UsersActions.externalAccounts,
  UsersActions.createExternalAccounts,
  UsersActions.deleteExternalAccounts,
  UsersActions.checkFieldAvailability,
]);

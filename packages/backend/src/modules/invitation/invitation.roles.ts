import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Invitation actions
 */
export enum InvitationActions {
  getAllByClient = 'invitation:client:list',
  create = 'invitation:client:create',
  deleteClient = 'invitation:client:delete',
  getAllByUser = 'invitation:user:list',
  deleteUser = 'invitation:user:delete',
  confirmUser = 'invitation:user:confirm',
}

ROLES.set(UserRoles.USER, [
  ...(ROLES.get(UserRoles.USER) || []),
  InvitationActions.getAllByUser,
  InvitationActions.deleteUser,
  InvitationActions.confirmUser,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  InvitationActions.getAllByClient,
  InvitationActions.create,
  InvitationActions.deleteClient,
  InvitationActions.getAllByUser,
  InvitationActions.deleteUser,
  InvitationActions.confirmUser,
]);

ROLES.set(UserRoles.MANAGER, [
  ...(ROLES.get(UserRoles.MANAGER) || []),
  InvitationActions.getAllByUser,
  InvitationActions.deleteUser,
  InvitationActions.confirmUser,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  InvitationActions.getAllByClient,
  InvitationActions.create,
  InvitationActions.deleteClient,
  InvitationActions.getAllByUser,
  InvitationActions.deleteUser,
  InvitationActions.confirmUser,
]);

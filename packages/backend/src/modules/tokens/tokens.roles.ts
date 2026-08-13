import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

export enum TokensActions {
  list = 'tokens:list',
  create = 'tokens:create',
  delete = 'tokens:delete',
}

ROLES.set(UserRoles.USER, [
  ...(ROLES.get(UserRoles.USER) || []),
  TokensActions.list,
  TokensActions.create,
  TokensActions.delete,
]);

ROLES.set(UserRoles.TRUSTED_USER, [
  ...(ROLES.get(UserRoles.TRUSTED_USER) || []),
  TokensActions.list,
  TokensActions.create,
  TokensActions.delete,
]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  TokensActions.list,
  TokensActions.create,
  TokensActions.delete,
]);

ROLES.set(UserRoles.MANAGER, [
  ...(ROLES.get(UserRoles.MANAGER) || []),
  TokensActions.list,
  TokensActions.create,
  TokensActions.delete,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  TokensActions.list,
  TokensActions.create,
  TokensActions.delete,
]);

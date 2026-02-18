import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Provider actions
 */
export enum ProviderActions {
  /**
   * Getting the list of providers
   */
  list = 'providers:list',
  /**
   * Creating and editing providers
   */
  write = 'providers:write',
  /**
   * Deleting a provider
   */
  delete = 'providers:delete',
}

ROLES.set(UserRoles.USER, [...(ROLES.get(UserRoles.USER) || [])]);

ROLES.set(UserRoles.ADMIN, [...(ROLES.get(UserRoles.ADMIN) || [])]);

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  ProviderActions.write,
  ProviderActions.delete,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  ProviderActions.write,
  ProviderActions.delete,
]);

import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Session actions
 */
export enum SessionsActions {
  /**
   * Deleting sessions
   */
  delete = 'users:sessions:delete',
}

ROLES.set(UserRoles.USER, [...(ROLES.get(UserRoles.USER) || []), SessionsActions.delete]);

ROLES.set(UserRoles.EDITOR, [...(ROLES.get(UserRoles.EDITOR) || []), SessionsActions.delete]);

ROLES.set(UserRoles.ADMIN, [...(ROLES.get(UserRoles.ADMIN) || []), SessionsActions.delete]);

ROLES.set(UserRoles.OWNER, [...(ROLES.get(UserRoles.OWNER) || []), SessionsActions.delete]);

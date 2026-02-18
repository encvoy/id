import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Logger actions
 */
export enum LoggerActions {
  /**
   * Getting a list of records
   */
  list = 'logger:list',
}

ROLES.set(UserRoles.USER, [...(ROLES.get(UserRoles.USER) || []), LoggerActions.list]);

ROLES.set(UserRoles.EDITOR, [...(ROLES.get(UserRoles.EDITOR) || []), LoggerActions.list]);

ROLES.set(UserRoles.ADMIN, [...(ROLES.get(UserRoles.ADMIN) || []), LoggerActions.list]);

ROLES.set(UserRoles.OWNER, [...(ROLES.get(UserRoles.OWNER) || []), LoggerActions.list]);

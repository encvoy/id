import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Winston logging actions
 */
export enum WinstonActions {
  /**
   * Changing logging settings
   */
  write = 'winston:write',
}

ROLES.set(UserRoles.EDITOR, [...(ROLES.get(UserRoles.EDITOR) || []), WinstonActions.write]);

ROLES.set(UserRoles.OWNER, [...(ROLES.get(UserRoles.OWNER) || []), WinstonActions.write]);

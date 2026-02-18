import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Sentry actions
 */
export enum SentryActions {
  /**
   * Changing settings
   */
  write = 'sentry:write',
}

ROLES.set(UserRoles.EDITOR, [...(ROLES.get(UserRoles.EDITOR) || []), SentryActions.write]);

ROLES.set(UserRoles.OWNER, [...(ROLES.get(UserRoles.OWNER) || []), SentryActions.write]);

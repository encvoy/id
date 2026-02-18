import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

/**
 * Settings actions
 */
export enum SettingsActions {
  update = 'settings:update',
}

ROLES.set(UserRoles.EDITOR, [...(ROLES.get(UserRoles.EDITOR) || []), SettingsActions.update]);

ROLES.set(UserRoles.OWNER, [...(ROLES.get(UserRoles.OWNER) || []), SettingsActions.update]);

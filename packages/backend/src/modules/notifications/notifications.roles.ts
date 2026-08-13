import { UserRoles } from '../../enums';
import { ROLES } from '../../roles';

export enum NotificationsActions {
  list = 'notifications:list',
  write = 'notifications:write',
  delete = 'notifications:delete',
  stats = 'notifications:stats',
}

ROLES.set(UserRoles.EDITOR, [
  ...(ROLES.get(UserRoles.EDITOR) || []),
  NotificationsActions.list,
  NotificationsActions.write,
  NotificationsActions.delete,
  NotificationsActions.stats,
]);

ROLES.set(UserRoles.OWNER, [
  ...(ROLES.get(UserRoles.OWNER) || []),
  NotificationsActions.list,
  NotificationsActions.write,
  NotificationsActions.delete,
  NotificationsActions.stats,
]);

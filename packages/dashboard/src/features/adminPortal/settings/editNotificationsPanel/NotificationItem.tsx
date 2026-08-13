import Button from "@mui/material/Button";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import {
  INotificationListItem,
  NotificationTargetType,
} from "src/shared/api/notifications";
import { SurfaceBlock } from "@encvoy-id/components";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import styles from "./NotificationItem.module.css";

interface INotificationItemProps {
  notification: INotificationListItem;
  onEdit: () => void;
  onArchive: () => void;
}

export const NotificationItem: FC<INotificationItemProps> = ({
  notification,
  onEdit,
  onArchive,
}) => {
  const { t: translate, i18n } = useTranslation();

  const targetLabelMap: Record<NotificationTargetType, string> = {
    [NotificationTargetType.ALL]: translate(
      "pages.settings.notifications.targets.ALL"
    ),
    [NotificationTargetType.NEW_USERS]: translate(
      "pages.settings.notifications.targets.NEW_USERS"
    ),
    [NotificationTargetType.EXISTING_USERS]: translate(
      "pages.settings.notifications.targets.EXISTING_USERS"
    ),
    [NotificationTargetType.USER_LIST]: translate(
      "pages.settings.notifications.targets.USER_LIST"
    ),
  };

  return (
    <ListItem disablePadding>
      <SurfaceBlock className={styles.item}>
        <div className={styles.header}>
          <div>
            <Typography className="text-16">
              {getLocalizedTextValue(notification.title, i18n.language)}
            </Typography>
            <Typography className={styles.content} color="text.secondary">
              {getLocalizedTextValue(notification.content, i18n.language)}
            </Typography>

            <div className={styles.meta}>
              <span className={styles.badge}>
                <Typography className="text-12">
                  {targetLabelMap[notification.target]}
                </Typography>
              </span>
              <span className={styles.badge}>
                <Typography className="text-12">
                  {notification.is_active
                    ? translate("statuses.active")
                    : translate("statuses.inactive")}
                </Typography>
              </span>
              <Typography className="text-12" color="text.secondary">
                {translate("pages.settings.notifications.readStats", {
                  read: notification.read_count,
                  total: notification.total_target,
                })}
              </Typography>
              <Typography className="text-12" color="text.secondary">
                {new Date(notification.created_at).toLocaleString()}
              </Typography>
            </div>
          </div>

          <div className={styles.actions}>
            {notification.is_active && (
              <>
                <Button
                  variant="text"
                  onClick={onEdit}
                  data-testid={`btn-notice-configure-${notification.id}`}
                >
                  {translate("actionButtons.configure")}
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={onArchive}
                  data-testid={`btn-notice-archive-${notification.id}`}
                >
                  {translate("actionButtons.archive")}
                </Button>
              </>
            )}
          </div>
        </div>
      </SurfaceBlock>
    </ListItem>
  );
};

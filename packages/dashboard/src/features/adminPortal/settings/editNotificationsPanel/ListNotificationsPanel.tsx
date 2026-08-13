import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  INotificationListItem,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
} from 'src/shared/api/notifications';
import { setNoticeError } from 'src/shared/slices/noticesSlice';
import { SubmitModal } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { getLocalizedTextValue } from 'src/shared/utils/locales';
import { CreateNotificationPanel } from './CreateNotificationPanel';
import { NotificationItem } from './NotificationItem';

interface IListNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export const ListNotificationsPanel: FC<IListNotificationsPanelProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [selectedNotification, setSelectedNotification] = useState<
    INotificationListItem | undefined
  >(undefined);
  const [notificationToArchive, setNotificationToArchive] = useState<
    INotificationListItem | undefined
  >(undefined);
  const [isEditNotificationOpen, setIsEditNotificationOpen] = useState(false);
  const { data: notifications = [] } = useGetNotificationsQuery({ clientId }, { skip: !isOpen });
  const [deleteNotification, { isLoading: isArchiveLoading }] = useDeleteNotificationMutation();

  const handleArchive = async () => {
    if (!notificationToArchive) return;

    try {
      await deleteNotification({
        id: notificationToArchive.id,
        clientId,
      }).unwrap();
      setNotificationToArchive(undefined);
    } catch (error) {
      console.error(error);
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={translate('panel.notifications.title')}
        description={translate('panel.notifications.description')}
        actionButtonDataTestId="btn-notice-create"
        cancelButtonDataTestId="btn-form-cancel"
        AdditionalAction={() => {
          setSelectedNotification(undefined);
          setIsEditNotificationOpen(true);
        }}
      >
        <List sx={{ padding: '0 24px 24px', display: 'grid', gap: '12px' }}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onEdit={() => {
                setSelectedNotification(notification);
                setIsEditNotificationOpen(true);
              }}
              onArchive={() => setNotificationToArchive(notification)}
            />
          ))}
          {!notifications.length && (
            <Typography color="text.secondary">
              {translate('pages.settings.notifications.empty')}
            </Typography>
          )}
        </List>
      </SidePanel>

      <CreateNotificationPanel
        isOpen={isEditNotificationOpen}
        onClose={() => {
          setSelectedNotification(undefined);
          setIsEditNotificationOpen(false);
        }}
        clientId={clientId}
        notification={selectedNotification}
      />

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={!!notificationToArchive}
        onSubmit={handleArchive}
        onClose={() => setNotificationToArchive(undefined)}
        title={translate('panel.notifications.modals.archive.title')}
        mainMessage={[
          translate('panel.notifications.modals.archive.mainMessage', {
            title: getLocalizedTextValue(notificationToArchive?.title, i18n.language),
          }),
        ]}
        actionButtonText={translate('actionButtons.archive')}
        submitButtonDataTestId="btn-notice-archive"
        disabled={isArchiveLoading}
      />
    </>
  );
};

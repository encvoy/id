import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { RootState } from 'src/app/store/store';
import { refreshTrustedWidgetProfile } from 'src/packages/authWidget/helpers/auth';
import {
  useDeleteOrganizationMutation,
  useGetClientInfoQuery,
  useTransferOrganizationOwnerMutation,
} from 'src/shared/api/clients';
import { TUserWithRole } from 'src/shared/api/users';
import { setNoticeError, setNoticeInfo } from 'src/shared/slices/noticesSlice';
import { AccordionBlock } from '@encvoy-id/components';
import { CustomIcon } from '@encvoy-id/components';
import { routes, tabs } from 'src/shared/utils/enums';
import { isAdministrator } from 'src/shared/utils/helpers';
import { useSystemClientId } from 'src/shared/hooks/useSystemClientId';
import { canTransferOrganizationOwner } from 'src/shared/utils/userAccess';
import { SubmitModal } from '@encvoy-id/components';
import { UserSearchModal } from 'src/shared/ui/modal/UserSearchModal';
import { SettingsHeader } from '../components/SettingsHeader';
import { ListNotificationsPanel } from '../editNotificationsPanel/ListNotificationsPanel';
import styles from './Settings.module.css';

export const OrgSettings: FC = () => {
  const { appId = '' } = useParams<{ appId: string }>();
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const startRoutePath = useSelector((state: RootState) => state.app.startRoutePath);
  const systemClientId = useSystemClientId();
  const { profile, roleInApp } = useSelector(({ user }: RootState) => user);
  const {
    data: client,
    isLoading,
    isFetching,
    isError,
  } = useGetClientInfoQuery(
    { id: appId },
    {
      skip: !appId,
    },
  );
  const [deleteOrganization, deleteState] = useDeleteOrganizationMutation();
  const [transferOrganizationOwner] = useTransferOrganizationOwnerMutation();
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  if (!client && (isLoading || isFetching)) {
    return <Typography>{translate('helperText.loading')}</Typography>;
  }

  if (!appId || isError || !client) {
    return <Typography>{translate('pages.clientDetails.notFound')}</Typography>;
  }

  const roleForRoute = profile.Role?.find((item) => item.client_id === appId)?.role || roleInApp;
  const organizationRole = profile.Role?.find((item) => item.client_id === appId)?.role;
  const systemRole = profile.Role?.find((item) => item.client_id === systemClientId)?.role;
  const canTransferOwner = canTransferOrganizationOwner({ systemRole, organizationRole });

  if (!isAdministrator(roleForRoute)) {
    return (
      <div className="page-container">
        <div className="content">
          <div>
            <Typography>{translate('errors.insufficientAccessRights')}</Typography>
            <Typography className="text-14" color="text.secondary">
              {translate('errors.insufficientAccessRightsDescription')}
            </Typography>
            <CustomIcon
              Icon={BlockOutlinedIcon}
              style={{ width: 40, height: 40 }}
              color="textSecondary"
            />
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteOrganization = async () => {
    try {
      await deleteOrganization(client.client_id).unwrap();
      setIsDeleteModalOpen(false);
      refreshTrustedWidgetProfile();
      dispatch(setNoticeInfo(translate('pages.organizations.notices.deleted')));
      navigate(`/${routes.profile}/${tabs.profile}`, { replace: true });
    } catch (error) {
      console.error('delete organization rejected', error);
    }
  };

  const handleTransferOwner = async (selectedOwner: TUserWithRole) => {
    try {
      await transferOrganizationOwner({
        client_id: client.client_id,
        user_id: selectedOwner.user.id,
      }).unwrap();

      refreshTrustedWidgetProfile();
      dispatch(setNoticeInfo(translate('info.infoUpdated')));
    } catch (error) {
      console.error('transfer owner rejected', error);
      dispatch(setNoticeError(translate('info.updateError')));
      throw error;
    }
  };

  return (
    <>
      <div className="page-container">
        <div className={clsx('content', styles.content)}>
          <SettingsHeader client={client} />

          <AccordionBlock
            dataTestIdCompact="btn-settings-widget-appearance"
            title={translate('pages.settings.sections.widgetAppearance')}
            onClick={() => navigate(`/${startRoutePath}/${client?.client_id}/${tabs.widget}`)}
            configureText={translate('actionButtons.configure')}
            mode="compact"
          />

          <AccordionBlock
            dataTestIdCompact="btn-settings-notifications"
            title={translate('pages.settings.sections.notifications')}
            onClick={() => setIsNotificationsPanelOpen(true)}
            configureText={translate('actionButtons.configure')}
            dataTestId="btn-settings-notifications-settings"
            mode="compact"
          />

          <AccordionBlock
            dataTestIdCompact="btn-settings-profile-fields"
            title={translate('pages.settings.sections.profileFields')}
            onClick={() =>
              navigate(`/${startRoutePath}/${client?.client_id}/${tabs.profileSettings}`)
            }
            configureText={translate('actionButtons.configure')}
            mode="compact"
          />

          <AccordionBlock title={translate('pages.profile.sections.otherActions')}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {canTransferOwner ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  {translate('pages.organizations.menuControls.transferOwner')}
                </Button>
              ) : null}
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                {translate('pages.organizations.menuControls.delete')}
              </Button>
            </Box>
          </AccordionBlock>

          <ListNotificationsPanel
            onClose={() => setIsNotificationsPanelOpen(false)}
            isOpen={isNotificationsPanelOpen}
            clientId={client.client_id}
          />
        </div>
      </div>

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={isDeleteModalOpen}
        title={translate('pages.organizations.modals.delete.title')}
        mainMessage={[translate('pages.organizations.modals.delete.mainMessage')]}
        onSubmit={handleDeleteOrganization}
        onClose={() => setIsDeleteModalOpen(false)}
        actionButtonText={translate('actionButtons.delete')}
        disabled={deleteState.isLoading}
      />

      {canTransferOwner ? (
        <UserSearchModal
          isOpen={isTransferModalOpen}
          clientId={client.client_id}
          disabledUserId={undefined}
          title={translate('pages.organizations.modals.transferOwner.title')}
          mainMessage={[
            translate('pages.organizations.modals.transferOwner.mainMessage', {
              ownerName: translate('helperText.loading'),
            }),
          ]}
          actionButtonText={translate('pages.organizations.modals.transferOwner.action')}
          placeholder={translate('pages.organizations.modals.transferOwner.placeholder')}
          helperText={translate('pages.organizations.modals.transferOwner.helper')}
          onClose={() => setIsTransferModalOpen(false)}
          onSubmit={handleTransferOwner}
        />
      ) : null}
    </>
  );
};

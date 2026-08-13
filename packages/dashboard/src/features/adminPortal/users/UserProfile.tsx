import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import clsx from 'clsx';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { CustomIcon } from '@encvoy-id/components';
import { SubmitModal } from '@encvoy-id/components';
import { ChangePasswordBlock } from 'src/features/accountPortal/components/ChangePasswordBlock';
import { AdditionalProfileFields } from 'src/features/accountPortal/components/AdditionalProfileFields';
import { IUserClient, useGetUserClientQuery } from 'src/shared/api/clients';
import { EProviderType } from 'src/shared/api/provider';
import {
  IExternalAccount,
  IUserProfile,
  useConfirmUserContactMutation,
  useDeleteUsersMutation,
  useGetPrivateClaimsQuery,
  useGetPublicExternalAccountsQuery,
  useLazyDeleteAllSessionQuery,
  useUpdateUserMutation,
} from 'src/shared/api/users';
import { EClaimPrivacy, ERoles, routes, subTabs, tabs } from 'src/shared/utils/enums';
import { exportToJson, formatPhoneNumber, getImageURL } from 'src/shared/utils/helpers';
import { getLocalizedTextValue } from 'src/shared/utils/locales';
import { TAppSlice } from 'src/shared/slices/appSlice';
import { setNoticeError, setNoticeInfo } from 'src/shared/slices/noticesSlice';
import { useGetProfileFieldsQuery, useGetSettingsQuery } from 'src/shared/api/settings';
import { RootState } from 'src/app/store/store';
import { TUserSlice } from 'src/shared/slices/userSlice';
import { ExternalAccount } from '../../../shared/ui/ExternalAccount';
import styles from './UserProfile.module.css';
import Link from '@mui/material/Link';
import { AccordionBlock } from '@encvoy-id/components';
import { SurfaceBlock } from '@encvoy-id/components';
import Typography from '@mui/material/Typography';
import { UserProfileField } from 'src/features/accountPortal/components/UserProfileField';
import { ContactStatusIndicator } from '@encvoy-id/components';
import { canManageTargetUser } from 'src/shared/utils/userAccess';

interface IUserProfileProps {
  startRoutePath: TAppSlice['startRoutePath'];
  roleInApp: TUserSlice['roleInApp'];
  loggedUserId: IUserProfile['id'];
  roles: TUserSlice['roles'];
  clientProfile: TAppSlice['clientProfile'];
  userIdOverride?: string;
  embedded?: boolean;
  onEditClick?: () => void;
  onChangePasswordClick?: () => void;
  onDeleted?: () => void;
}

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
  roleInApp: state.user.roleInApp,
  loggedUserId: state.user.profile.id,
  roles: state.user.roles,
  clientProfile: state.app.clientProfile,
});

const EMAIL_CONTACT_TYPES = [EProviderType.EMAIL, EProviderType.EMAIL_CUSTOM];
const PHONE_CONTACT_TYPES = [EProviderType.PHONE, EProviderType.KLOUD];

type TContactGroup = 'email' | 'phone';

const normalizeContactValue = (contactGroup: TContactGroup, value?: string | null) => {
  if (!value) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  return contactGroup === 'email' ? trimmedValue.toLowerCase() : trimmedValue.replace(/\D/g, '');
};

const getContactGroupByAccountType = (type: IExternalAccount['type']): TContactGroup | null => {
  if (EMAIL_CONTACT_TYPES.includes(type as EProviderType)) {
    return 'email';
  }

  if (PHONE_CONTACT_TYPES.includes(type as EProviderType)) {
    return 'phone';
  }

  return null;
};

const UserProfileComponent: FC<IUserProfileProps> = ({
  roleInApp,
  startRoutePath,
  loggedUserId,
  roles,
  clientProfile,
  userIdOverride,
  embedded = false,
  onEditClick,
  onChangePasswordClick,
  onDeleted,
}) => {
  const {
    appId = '',
    clientId = '',
    userId = '',
  } = useParams<{ appId: string; clientId: string; userId: string }>();
  const resolvedUserId = userIdOverride || userId;
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // state
  const [selectedUser, setSelectedUser] = useState<
    { user: IUserClient; role: string } | null | undefined
  >(null);
  const [deleteUsersModalOpen, setDeleteUsersModalOpen] = useState(false);
  const [contactToConfirm, setContactToConfirm] = useState<'email' | 'phone_number' | null>(null);

  // get data
  const { data: externalAccounts } = useGetPublicExternalAccountsQuery({
    id: String(resolvedUserId),
    client_id: clientId || appId,
  });
  const profileFieldScope = clientId || appId ? { client_id: clientId || appId } : undefined;
  const { data: profileFields } = useGetProfileFieldsQuery(profileFieldScope);

  const { data: dataSettings } = useGetSettingsQuery();
  const { data: userProfile } = useGetUserClientQuery({
    client_id: clientId || appId,
    id: String(resolvedUserId),
  });
  const targetUserOrgId = selectedUser?.user?.org_id || userProfile?.user?.org_id;
  const canManageUserAccounts = canManageTargetUser({
    roleInApp,
    roles,
    targetUserOrgId,
  });
  const { data: privateClaims } = useGetPrivateClaimsQuery(
    { id: String(resolvedUserId) },
    {
      skip: !canManageUserAccounts || !resolvedUserId,
    },
  );

  useEffect(() => {
    setSelectedUser(userProfile);
  }, [userProfile]);

  const [deleteAllSession] = useLazyDeleteAllSessionQuery();
  const [confirmUserContact, { isLoading: confirmUserContactLoading }] =
    useConfirmUserContactMutation();
  const [deleteUsers, { isLoading: deleteUsersLoading }] = useDeleteUsersMutation();
  const [updateUserFetch, { isLoading: updateUserLoading }] = useUpdateUserMutation();

  const currentLanguage = i18n.language;
  const PROJECT_NAME =
    getLocalizedTextValue(clientProfile?.name, currentLanguage) || 'PROJECT_NAME';
  const userProfileEditLink = clientId
    ? `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${resolvedUserId}/${subTabs.edit}`
    : `/${startRoutePath}/${appId}/${tabs.users}/${resolvedUserId}/${subTabs.edit}`;
  const changePasswordLink =
    resolvedUserId?.toString() === loggedUserId?.toString()
      ? `/${routes.profile}/${tabs.password}`
      : clientId
        ? `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${resolvedUserId}/${tabs.password}`
        : `/${startRoutePath}/${appId}/${tabs.users}/${resolvedUserId}/${tabs.password}`;
  const name = (
    (selectedUser?.user.given_name || '') +
    ' ' +
    (selectedUser?.user.family_name || '')
  ).trim();
  const date = selectedUser?.user?.birthdate ? new Date(selectedUser?.user?.birthdate) : null;

  const handleConfirmContact = async (contactType: 'email' | 'phone_number') => {
    try {
      await confirmUserContact({
        userId: String(resolvedUserId),
        contactType,
      }).unwrap();

      dispatch(setNoticeInfo(translate('info.infoUpdated')));
      return true;
    } catch (e) {
      console.error('handleConfirmContact error', e);
      dispatch(setNoticeError(translate('info.updateError')));
      return false;
    }
  };

  const closeConfirmContactModal = () => {
    setContactToConfirm(null);
  };

  const getContactLabel = (contactType: 'email' | 'phone_number') =>
    translate(
      contactType === 'email' ? 'pages.profile.fields.email' : 'pages.profile.fields.phone',
    );

  const getContactValue = (contactType: 'email' | 'phone_number') => {
    if (contactType === 'email') {
      return selectedUser?.user.email || '';
    }

    return selectedUser?.user.phone_number ? formatPhoneNumber(selectedUser.user.phone_number) : '';
  };

  const submitConfirmContact = async () => {
    if (!contactToConfirm) return;

    const isConfirmed = await handleConfirmContact(contactToConfirm);

    if (isConfirmed) {
      closeConfirmContactModal();
    }
  };

  const handleDeleteButton = async () => {
    try {
      if (!selectedUser?.user?.id) return;
      setDeleteUsersModalOpen(true);
    } catch (e) {
      console.error('handleDeleteButton error', e);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.user?.id) return;

    try {
      await deleteUsers({
        id: selectedUser?.user.id.toString(),
      }).unwrap();

      const id: string =
        selectedUser.user.nickname || selectedUser.user.login || selectedUser.user.id.toString();

      dispatch(
        setNoticeInfo(
          translate('pages.userProfile.notifications.userDeleted', {
            userName: id,
            projectName: PROJECT_NAME,
          }),
        ),
      );

      setDeleteUsersModalOpen(false);
      if (onDeleted) {
        onDeleted();
        return;
      }

      if (clientId) {
        navigate(`/${startRoutePath}/${appId}/${tabs.clients}/${clientId}${tabs.users}`);
      } else {
        navigate(`/${startRoutePath}/${appId}/${tabs.users}`);
      }
    } catch (e) {
      console.error('handleDeleteUsers error', e);
    }
  };

  const handlePasswordChangeRequiredToggle = async (value: boolean) => {
    if (!selectedUser?.user?.id) return;

    const previousValue = Boolean(selectedUser.user.password_change_required);

    setSelectedUser((prev) =>
      prev
        ? {
            ...prev,
            user: {
              ...prev.user,
              password_change_required: value,
            },
          }
        : prev,
    );

    try {
      await updateUserFetch({
        userId: String(selectedUser.user.id),
        body: {
          password_change_required: value,
        },
      }).unwrap();

      dispatch(setNoticeInfo(translate('info.infoUpdated')));
    } catch (e) {
      console.error('handlePasswordChangeRequiredToggle error', e);
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                password_change_required: previousValue,
              },
            }
          : prev,
      );
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  const baseIdentifierAccounts = canManageUserAccounts
    ? externalAccounts || []
    : externalAccounts?.filter((account) => {
        const contactGroup = getContactGroupByAccountType(account.type);
        if (!contactGroup) {
          return true;
        }

        const primaryValue =
          contactGroup === 'email' ? selectedUser?.user.email : selectedUser?.user.phone_number;

        return (
          normalizeContactValue(contactGroup, account.sub) !==
          normalizeContactValue(contactGroup, primaryValue)
        );
      }) || [];

  const normalizedConfirmedEmail = selectedUser?.user.email_verified
    ? normalizeContactValue('email', selectedUser?.user.email)
    : null;

  const identifierAccounts = baseIdentifierAccounts.filter((account) => {
    const contactGroup = getContactGroupByAccountType(account.type);

    if (contactGroup !== 'email') {
      return true;
    }

    return normalizeContactValue('email', account.sub) !== normalizedConfirmedEmail;
  });

  if (!userProfile) {
    return <div>{translate('helperText.loading')}</div>;
  }

  const hasVisibleAdditionalFields = Boolean(
    selectedUser?.user.custom_fields && Object.keys(selectedUser.user.custom_fields).length,
  );

  return (
    <div className={embedded ? '' : 'page-container'}>
      <div className={embedded ? '' : 'content'}>
        <div className={styles.panelTop}>
          <Avatar className={styles.appIconWrapper} src={getImageURL(selectedUser?.user?.picture)}>
            {!selectedUser?.user.picture && selectedUser?.user.nickname && (
              <div className={styles.appIconDefault}>
                {selectedUser?.user.nickname
                  ?.split(' ')
                  .map((name: string) => name[0]?.toUpperCase())
                  .join('')}
              </div>
            )}
            {!selectedUser?.user.picture && !selectedUser?.user.nickname && (
              <CustomIcon className={styles.appIconDefault} Icon={PersonIcon} />
            )}
          </Avatar>
          <div className={styles.nameWrapper}>
            <Typography className={clsx('text-20-medium', styles.overflowEllipsis)}>
              {!name
                ? translate('pages.userProfile.nameHidden')
                : name || translate('pages.userProfile.noName')}
            </Typography>
          </div>
        </div>
        <SurfaceBlock className={styles.panel}>
          <div className={styles.panelTitle}>
            <Typography className="text-17">{translate('helperText.mainInfo')}</Typography>
            {canManageUserAccounts && (
              <>
                {onEditClick ? (
                  <Link
                    data-test-id="lnk-profile-edit"
                    component="button"
                    type="button"
                    onClick={onEditClick}
                    underline="hover"
                  >
                    {translate('actionButtons.edit')}
                  </Link>
                ) : (
                  <Link
                    data-test-id="lnk-profile-edit"
                    component={RouterLink}
                    to={userProfileEditLink}
                  >
                    {translate('actionButtons.edit')}
                  </Link>
                )}
              </>
            )}
          </div>
          <div>
            <UserProfileField
              title={translate('pages.profile.fields.userId')}
              value={selectedUser?.user.id}
              fieldName="id"
              disabled
              showPrivacyStatus={canManageUserAccounts}
              claimPrivacyOverride={EClaimPrivacy.public}
            />
            {!!(selectedUser?.user.nickname || '').trim() && (
              <UserProfileField
                title={translate('pages.profile.fields.publicName')}
                value={
                  (selectedUser?.user.nickname || '').trim()
                    ? selectedUser?.user.nickname
                    : translate('pages.userProfile.noName')
                }
                privateClaims={privateClaims}
                fieldName="nickname"
                userId={String(selectedUser?.user.id)}
                showPrivacyStatus={canManageUserAccounts}
              />
            )}
            {!!selectedUser?.user.picture && (
              <UserProfileField
                title={translate('pages.profile.fields.profilePhoto')}
                privateClaims={privateClaims}
                fieldName="picture"
                userId={String(selectedUser?.user.id)}
                isMaxSize
                urlImage={getImageURL(selectedUser?.user?.picture)}
                showPrivacyStatus={canManageUserAccounts}
              />
            )}
            {!!name && (
              <UserProfileField
                title={translate('pages.profile.fields.fullName')}
                value={name || translate('helperText.value.notSet')}
                privateClaims={privateClaims}
                fieldName="family_name given_name"
                otherField="family_name"
                userId={String(selectedUser?.user.id)}
                showPrivacyStatus={canManageUserAccounts}
              />
            )}
            {!!selectedUser?.user.login && (
              <UserProfileField
                title={translate('pages.profile.fields.login')}
                value={selectedUser?.user.login || translate('helperText.value.notSet')}
                privateClaims={privateClaims}
                fieldName="login"
                userId={String(selectedUser?.user.id)}
                showPrivacyStatus={canManageUserAccounts}
              />
            )}
            {!!selectedUser?.user.birthdate && (
              <UserProfileField
                title={translate('pages.profile.fields.birthDate')}
                value={
                  date
                    ? date.toLocaleDateString(currentLanguage)
                    : translate('helperText.value.notSet')
                }
                privateClaims={privateClaims}
                fieldName="birthdate"
                userId={String(selectedUser?.user.id)}
                showPrivacyStatus={canManageUserAccounts}
              />
            )}
            {!!selectedUser?.user.email && (
              <UserProfileField
                title={translate('pages.profile.fields.email')}
                value={
                  selectedUser?.user.email
                    ? selectedUser.user.email
                    : translate('helperText.value.notSet')
                }
                statusIndicator={
                  <ContactStatusIndicator
                    unverifiedText={translate('pages.profile.tooltips.contactUnverified')}
                    verified={selectedUser?.user.email_verified}
                  />
                }
                privateClaims={privateClaims}
                fieldName="email"
                userId={String(selectedUser?.user.id)}
                showPrivacyStatus={canManageUserAccounts}
              >
                {!selectedUser?.user.email_verified && canManageUserAccounts && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setContactToConfirm('email')}
                    data-test-id="btn-user-profile-confirm-email"
                  >
                    {translate('actionButtons.confirm')}
                  </Button>
                )}
              </UserProfileField>
            )}
            {!!selectedUser?.user.phone_number && (
              <UserProfileField
                title={translate('pages.profile.fields.phone')}
                value={
                  selectedUser?.user.phone_number
                    ? formatPhoneNumber(selectedUser.user.phone_number)
                    : translate('helperText.value.notSet')
                }
                statusIndicator={
                  <ContactStatusIndicator
                    unverifiedText={translate('pages.profile.tooltips.contactUnverified')}
                    verified={selectedUser?.user.phone_number_verified}
                  />
                }
                privateClaims={privateClaims}
                fieldName="phone_number"
                userId={String(selectedUser?.user.id)}
                showPrivacyStatus={canManageUserAccounts}
              >
                {!selectedUser?.user.phone_number_verified && canManageUserAccounts && (
                  <Link
                    component="button"
                    type="button"
                    onClick={() => setContactToConfirm('phone_number')}
                    data-test-id="btn-user-profile-confirm-phone"
                    underline="hover"
                    sx={{
                      opacity: confirmUserContactLoading ? 0.5 : 1,
                      pointerEvents: confirmUserContactLoading ? 'none' : 'auto',
                    }}
                  >
                    {translate('actionButtons.confirm')}
                  </Link>
                )}
              </UserProfileField>
            )}
            {hasVisibleAdditionalFields && (
              <div>
                <Typography className="text-17">
                  {translate('helperText.additionalInfo')}
                </Typography>
                <AdditionalProfileFields
                  profileFields={profileFields}
                  customFields={selectedUser?.user.custom_fields}
                  privateClaims={privateClaims}
                  userId={selectedUser?.user.id?.toString()}
                  scopeClientId={clientId || appId}
                  showPrivacyStatus={canManageUserAccounts}
                  hideEmptyFields
                />
              </div>
            )}
          </div>
        </SurfaceBlock>

        <SurfaceBlock className={styles.panel}>
          <Typography style={{ marginBottom: 24 }} className="text-17">
            {translate('pages.profile.sections.identifiers')}
          </Typography>
          <div>
            {identifierAccounts.map((account) => (
              <ExternalAccount
                account={account}
                userProfileId={selectedUser?.user?.id}
                withoutButtons={!canManageUserAccounts}
                key={(account.sub || '') + (account.issuer || '') + (account.type || '')}
              />
            ))}
            {!identifierAccounts.length && (
              <Typography className="text-14" color="text.secondary">
                {translate('pages.userProfile.emptyIdentifiers')}
              </Typography>
            )}
          </div>
        </SurfaceBlock>

        {canManageUserAccounts && selectedUser?.role !== ERoles.TRUSTED_USER && (
          <SurfaceBlock className={styles.panel}>
            <div className={styles.panelTitle}>
              <Typography className="text-17">
                {translate('pages.profile.sections.security')}
              </Typography>
            </div>
            <ChangePasswordBlock
              passwordUpdateDate={new Date(selectedUser?.user.password_updated_at || '')}
              navigateTo={changePasswordLink}
              onClick={onChangePasswordClick}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 24,
              }}
            >
              <div>
                <Typography className="text-14" sx={{ marginBottom: '4px' }}>
                  {translate('helperText.requirePasswordChangeOnNextAuthorization')}
                </Typography>
                <Typography className="text-12" color="text.secondary">
                  {translate('helperText.requirePasswordChangeOnNextAuthorizationDescription')}
                </Typography>
              </div>
              <Switch
                checked={Boolean(selectedUser?.user.password_change_required)}
                disabled={updateUserLoading || !selectedUser?.user?.id}
                onChange={(_, checked) => {
                  void handlePasswordChangeRequiredToggle(checked);
                }}
                data-test-id="swt-user-profile-password-change-required"
              />
            </div>
          </SurfaceBlock>
        )}

        {canManageUserAccounts && (
          <AccordionBlock
            dataTestId="ddl-profile-other-actions"
            title={translate('pages.profile.sections.otherActions')}
          >
            {dataSettings?.data_processing_agreement && (
              <Link href={dataSettings.data_processing_agreement} target="_blank" rel="noreferrer">
                {translate('pages.profile.actions.privacyPolicy')}
              </Link>
            )}

            <div className={styles.actions}>
              {selectedUser?.user.id !== '1' && selectedUser?.user.id !== loggedUserId && (
                <Button
                  data-test-id="btn-profile-other-delete-account"
                  variant="contained"
                  color="secondary"
                  onClick={handleDeleteButton}
                >
                  {translate('actionButtons.deleteAccount')}
                </Button>
              )}
              <Button
                data-test-id="btn-profile-other-logout-all-devices"
                variant="contained"
                color="secondary"
                onClick={() => deleteAllSession(selectedUser?.user.id)}
              >
                {translate('pages.profile.actions.logoutAllDevices')}
              </Button>
              <Button
                data-test-id="btn-profile-other-download-data"
                variant="contained"
                color="secondary"
                onClick={() => exportToJson({ ...selectedUser }, 'profile.json')}
              >
                {translate('pages.profile.actions.downloadData')}
              </Button>
            </div>
          </AccordionBlock>
        )}
      </div>

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        title={translate('pages.userProfile.confirmContactModal.title', {
          contactName: contactToConfirm ? getContactLabel(contactToConfirm) : '',
        })}
        isOpen={Boolean(contactToConfirm)}
        onClose={closeConfirmContactModal}
        onSubmit={() => {
          void submitConfirmContact();
        }}
        mainMessage={
          contactToConfirm
            ? [
                translate('pages.userProfile.confirmContactModal.message', {
                  contactName: getContactLabel(contactToConfirm),
                  contactValue: getContactValue(contactToConfirm),
                }),
              ]
            : []
        }
        actionButtonText={translate('actionButtons.confirm')}
        disabled={confirmUserContactLoading}
      />

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        title={translate('pages.userProfile.deleteAccountModal.title', {
          projectName: PROJECT_NAME,
        })}
        isOpen={deleteUsersModalOpen}
        onClose={() => setDeleteUsersModalOpen(false)}
        onSubmit={() => {
          handleDeleteUser();
          setDeleteUsersModalOpen(false);
        }}
        mainMessage={Object.values(
          translate('pages.userProfile.deleteAccountModal.message', {
            userName:
              selectedUser?.user?.nickname || selectedUser?.user?.login || selectedUser?.user?.id,
            projectName: PROJECT_NAME,
            returnObjects: true,
          }) as Record<string, string>,
        )}
        disabled={deleteUsersLoading}
      />
    </div>
  );
};

export const UserProfile = connect(mapStateToProps)(UserProfileComponent);

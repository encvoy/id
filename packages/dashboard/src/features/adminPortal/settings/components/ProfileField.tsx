import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ListItem from '@mui/material/ListItem';
import clsx from 'clsx';
import { FC, MouseEventHandler, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconsLibrary } from '@encvoy-id/components';
import { EClaimPrivacy } from 'src/shared/utils/enums';
import { IProfileField, useDeleteProfileFieldMutation } from 'src/shared/api/settings';
import { IconWithTooltip } from '@encvoy-id/components';
import { SurfaceBlock } from '@encvoy-id/components';
import { SubmitModal } from '@encvoy-id/components';
import styles from './ProfileField.module.css';
import Typography from '@mui/material/Typography';
import { getLocalizedTextValue } from 'src/shared/utils/locales';

type ProfileFieldProps = {
  profile: IProfileField;
  onClick: () => void;
  clientId?: string;
  deleted?: boolean;
};

const profileFieldTestIdMap: Record<string, string> = {
  password: 'btn-settings-user-profile-password',
  login: 'btn-settings-user-profile-login',
  email: 'btn-settings-user-profile-email',
  given_name: 'btn-settings-user-profile-firstname',
  family_name: 'btn-settings-user-profile-lastname',
  phone_number: 'btn-settings-user-profile-phone',
  birthdate: 'btn-settings-user-profile-birthday',
  nickname: 'btn-settings-user-profile-nickname',
  picture: 'btn-settings-user-profile-picture',
  data_processing_agreement: 'btn-settings-user-profile-privacy',
};

export const ProfileField: FC<ProfileFieldProps> = ({ profile, onClick, clientId, deleted }) => {
  const { t: translate, i18n } = useTranslation();
  const [deleteProfileField] = useDeleteProfileFieldMutation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const required = profile.required;
  const editable = profile.editable;
  const unique = profile.unique;
  const active = profile.active;
  const allowed_as_login = profile.allowed_as_login;

  let claimText = translate('privacy.private.title');
  let claimIcon = LockOutlinedIcon;

  switch (profile.claim) {
    case EClaimPrivacy.request:
      claimText = translate('privacy.publicOauth.title');
      claimIcon = LockOpenOutlinedIcon;
      break;
    case EClaimPrivacy.public:
      claimText = translate('privacy.publicGravatar.title');
      claimIcon = PublicOutlinedIcon;
      break;
    default:
      break;
  }

  const handleDelete = async () => {
    if (profile.type === 'custom') {
      await deleteProfileField(
        clientId ? { field_name: profile.field, client_id: clientId } : profile.field,
      );
      setIsDeleteModalOpen(false);
    }
  };

  const handleOpenDeleteModal: MouseEventHandler<HTMLElement> = (event) => {
    event.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleClick: MouseEventHandler<HTMLLIElement> = (event) => {
    if (profile.field === 'sub') {
      event.preventDefault();
      return;
    }
    onClick();
  };

  const profileFieldDataTestId =
    profileFieldTestIdMap[profile.field] || `txt-settings-user-profile-${profile.field}`;

  return (
    <ListItem
      key={profile.field}
      disablePadding
      onClick={handleClick}
      data-test-id={profileFieldDataTestId}
    >
      <SurfaceBlock
        className={clsx(styles.field, profile.field === 'sub' ? '' : styles.fieldHover)}
      >
        <div className={styles.header}>
          <Typography className={styles.title}>
            {getLocalizedTextValue(profile.title, i18n.language)}
          </Typography>
          <Typography color="text.secondary" className={styles.text}>
            {profile.field}
          </Typography>
        </div>
        <div className={styles.icons}>
          {!active && (
            <IconWithTooltip
              title={translate('toolTips.notActive')}
              Icon={VisibilityOffOutlinedIcon}
              hideHovered
            />
          )}
          {allowed_as_login && (
            <IconsLibrary title={translate('toolTips.id')} type="id" hideHovered />
          )}
          {unique && (
            <IconsLibrary title={translate('toolTips.unique')} type="unique" hideHovered />
          )}
          {editable && (
            <IconsLibrary title={translate('toolTips.penFilled')} type="penFilled" hideHovered />
          )}
          {required && (
            <IconsLibrary type="required" title={translate('toolTips.required')} hideHovered />
          )}
          {<IconWithTooltip title={claimText} Icon={claimIcon} hideHovered />}
          {deleted && (
            <IconsLibrary
              title={translate('toolTips.delete')}
              type="delete"
              onClick={handleOpenDeleteModal}
              dataTestId={`btn-settings-user-profile-field-delete-${profile.field}`}
            />
          )}
        </div>
      </SurfaceBlock>
      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={isDeleteModalOpen}
        onSubmit={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        title={translate('panel.profileFields.modals.deleteField.title')}
        mainMessage={[
          translate('panel.profileFields.modals.deleteField.message', {
            fieldName: getLocalizedTextValue(profile.title, i18n.language),
          }),
        ]}
      />
    </ListItem>
  );
};

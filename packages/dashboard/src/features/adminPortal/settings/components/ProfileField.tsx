import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ListItem from "@mui/material/ListItem";
import clsx from "clsx";
import { FC, MouseEventHandler } from "react";
import { useTranslation } from "react-i18next";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { EClaimPrivacy } from "src/shared/utils/enums";
import {
  IProfileField,
  useDeleteProfileFieldMutation,
} from "src/shared/api/settings";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import styles from "./ProfileField.module.css";
import Typography from "@mui/material/Typography";

type ProfileFieldProps = {
  profile: IProfileField;
  onClick: () => void;
  deleted?: boolean;
};

export const ProfileField: FC<ProfileFieldProps> = ({
  profile,
  onClick,
  deleted,
}) => {
  const { t: translate } = useTranslation();
  const [deleteProfileField] = useDeleteProfileFieldMutation();
  const required = profile.required;
  const editable = profile.editable;
  const unique = profile.unique;
  const active = profile.active;
  const allowed_as_login = profile.allowed_as_login;

  let claimText = translate("privacy.private.title");
  let claimIcon = LockOutlinedIcon;

  switch (profile.claim) {
    case EClaimPrivacy.request:
      claimText = translate("privacy.publicOauth.title");
      claimIcon = LockOpenOutlinedIcon;
      break;
    case EClaimPrivacy.public:
      claimText = translate("privacy.publicGravatar.title");
      claimIcon = PublicOutlinedIcon;
      break;
    default:
      break;
  }

  const handleDelete = async () => {
    if (profile.type === "custom") {
      await deleteProfileField(profile.field);
    }
  };

  const handleClick: MouseEventHandler<HTMLLIElement> = (event) => {
    if (profile.field === "sub") {
      event.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <ListItem
      key={profile.field}
      className={clsx(
        styles.container,
        profile.field === "sub" ? "" : styles.containerHover
      )}
      onClick={handleClick}
    >
      <div className={styles.header}>
        <Typography className={styles.title}>{profile.title}</Typography>
        <Typography color="text.secondary" className={styles.text}>
          {profile.field}
        </Typography>
      </div>
      <div className={styles.icons}>
        {!active && (
          <IconWithTooltip
            title={translate("toolTips.notActive")}
            Icon={VisibilityOffOutlinedIcon}
            hideHovered
          />
        )}
        {allowed_as_login && <IconsLibrary type="id" hideHovered />}
        {unique && <IconsLibrary type="unique" hideHovered />}
        {editable && <IconsLibrary type="penFilled" hideHovered />}
        {required && (
          <IconsLibrary
            type="required"
            title={translate("toolTips.required")}
            hideHovered
          />
        )}
        {<IconWithTooltip title={claimText} Icon={claimIcon} hideHovered />}
        {deleted && (
          <IconsLibrary type="delete" onClick={() => handleDelete()} />
        )}
      </div>
    </ListItem>
  );
};

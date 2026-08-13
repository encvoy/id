import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/material/Avatar";
import clsx from "clsx";
import { FC, ReactNode } from "react";
import { getClaimPrivacy } from "src/shared/utils/helpers";
import { IPrivateClaims } from "src/shared/api/users";
import { PublicStatusPopover } from "src/shared/ui/PublicStatusPopover";
import { EClaimPrivacy } from "src/shared/utils/enums";
import styles from "./UserProfileField.module.css";
import Typography from "@mui/material/Typography";

interface IUserProfileFieldProps {
  title: string;
  fieldName: string;
  userId?: string;
  value?: ReactNode;
  statusIndicator?: ReactNode;
  privateClaims?: IPrivateClaims;
  otherField?: string;
  disabled?: boolean;
  isMaxSize?: boolean;
  urlImage?: string;
  showPrivacyStatus?: boolean;
  claimPrivacyOverride?: EClaimPrivacy;
  children?: ReactNode;
  dataTestId?: string;
}

export const UserProfileField: FC<IUserProfileFieldProps> = ({
  title,
  value,
  statusIndicator,
  privateClaims,
  fieldName,
  otherField,
  userId,
  disabled,
  isMaxSize,
  urlImage,
  showPrivacyStatus = true,
  claimPrivacyOverride,
  children,
  dataTestId,
}) => {
  const { public_profile_claims_oauth, public_profile_claims_gravatar } =
    privateClaims || {};
  const claimPrivacy =
    claimPrivacyOverride ||
    getClaimPrivacy(
      otherField ? otherField : fieldName,
      public_profile_claims_oauth,
      public_profile_claims_gravatar
    );

  return (
    <div className={clsx(styles.container, isMaxSize && styles.containerImage)}>
      <div className={styles.field}>
        <Typography
          className={clsx("text-14", styles.fieldText)}
          color="text.secondary"
        >
          {title}
        </Typography>
        {value && (
          <Typography
            translate="no"
            className={clsx("text-14", styles.fieldValue)}
            data-test-id={dataTestId}
          >
            {value}
          </Typography>
        )}
        {isMaxSize && (
          <Avatar className={styles.avatarContainer} src={urlImage}>
            {urlImage ? undefined : <PersonIcon />}
          </Avatar>
        )}
      </div>
      <div className={styles.actions}>
        {statusIndicator}
        {children}
        {showPrivacyStatus && (
          <PublicStatusPopover
            claimPrivacy={claimPrivacy}
            field={fieldName}
            userId={userId}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

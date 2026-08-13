import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { ElementType, FC, MouseEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomIcon } from "@encvoy-id/components";
import styles from "./PublicStatusPopover.module.css";
import { EClaimPrivacy, EClaimPrivacyNumber } from "src/shared/utils/enums";
import {
  useChangeClaimPrivacyMutation,
  useChangeExternalAccountMutation,
} from "src/shared/api/users";
import { IconWithTooltip } from "@encvoy-id/components";
import Box from "@mui/material/Box";
import { SvgIconProps } from "@mui/material";
import { MenuControls } from "@encvoy-id/components";

const testIds = [
  "btn-profile-available-private",
  "btn-profile-available-oauth",
  "btn-profile-available-public",
];

type TButtonPrivacyClaim = {
  title: string;
  icon: ElementType<SvgIconProps>;
  claimPrivacy: EClaimPrivacy | EClaimPrivacyNumber;
  description: string;
};

type PublicStatusPopoverProps = {
  claimPrivacy: EClaimPrivacy;
  field?: string;
  userId?: string;
  disabled?: boolean;
  readOnly?: boolean;
  externalAccountId?: string;
  setStatus?: (status: EClaimPrivacy | EClaimPrivacyNumber) => void;
  mode?: "string" | "number";
  dataTestId?: string;
};

export const PublicStatusPopover: FC<PublicStatusPopoverProps> = ({
  claimPrivacy,
  field,
  disabled,
  readOnly = false,
  externalAccountId,
  userId,
  setStatus,
  mode = "string",
  dataTestId,
}) => {
  const [buttonClaimPrivacy, setButtonClaimPrivacy] =
    useState<TButtonPrivacyClaim>();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [changeClaimPrivacy] = useChangeClaimPrivacyMutation();
  const [changeExternalAccount] = useChangeExternalAccountMutation();
  const { t: translate } = useTranslation();

  const claimPrivacyButtons: TButtonPrivacyClaim[] = [
    {
      title: translate("privacy.private.title"),
      icon: LockOutlinedIcon,
      claimPrivacy:
        mode === "number" ? EClaimPrivacyNumber.private : EClaimPrivacy.private,
      description: translate("privacy.private.description"),
    },
    {
      title: translate("privacy.publicOauth.title"),
      icon: LockOpenOutlinedIcon,
      claimPrivacy:
        mode === "number" ? EClaimPrivacyNumber.request : EClaimPrivacy.request,
      description: translate("privacy.publicOauth.description"),
    },
    {
      title: translate("privacy.publicGravatar.title"),
      icon: PublicOutlinedIcon,
      claimPrivacy:
        mode === "number" ? EClaimPrivacyNumber.public : EClaimPrivacy.public,
      description: translate("privacy.publicGravatar.description"),
    },
  ];

  useEffect(() => {
    const buttonParams = claimPrivacyButtons.find(
      (button) => button.claimPrivacy === claimPrivacy
    );
    setButtonClaimPrivacy(buttonParams);
  }, [claimPrivacy]);

  const openPopover = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (readOnly) {
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const closePopover = () => {
    setAnchorEl(null);
  };

  const handleButtonClick = async (element: TButtonPrivacyClaim) => {
    setButtonClaimPrivacy(element);
    closePopover();
    const { claimPrivacy } = element;
    if (userId) {
      try {
        if (field)
          changeClaimPrivacy({
            field,
            claim_privacy: claimPrivacy as EClaimPrivacy,
            userId,
          });
        if (externalAccountId)
          changeExternalAccount({
            userId,
            claim_privacy: claimPrivacy as EClaimPrivacyNumber,
            id: externalAccountId,
          });
      } catch (error) {
        console.error("Error changing claim privacy", error);
      }
    }
    if (setStatus) {
      let convertPrivacy: EClaimPrivacyNumber | EClaimPrivacy = claimPrivacy;
      if (mode === "number") {
        convertPrivacy =
          claimPrivacy === EClaimPrivacy.private
            ? EClaimPrivacyNumber.private
            : claimPrivacy === EClaimPrivacy.request
            ? EClaimPrivacyNumber.request
            : EClaimPrivacyNumber.public;
      }
      setStatus(convertPrivacy);
    }
  };

  return (
    <Box
      className={disabled ? styles.publicButtonDisabled : ""}
      data-test-id={dataTestId || `btn-profile-available-${field}`}
    >
      <IconWithTooltip
        dataTestId={dataTestId}
        onClick={openPopover}
        Icon={buttonClaimPrivacy?.icon}
        title={buttonClaimPrivacy?.title}
        customStyleButton={readOnly ? undefined : styles.publicButton}
        disabled={disabled}
      >
        {!readOnly && (
          <CustomIcon
            Icon={KeyboardArrowDownOutlinedIcon}
            className={anchorEl ? styles.arrowRotate : ""}
            sx={{
              display: "block",
              position: "absolute",
              right: "4px",
              width: "16px",
              transition: "transform 0.4s ease",
            }}
          />
        )}
      </IconWithTooltip>

      {!disabled && !readOnly && (
        <>
          <MenuControls
            dataTestId={testIds}
            anchorEl={anchorEl}
            onClose={closePopover}
            controls={claimPrivacyButtons.map((item) => {
              return {
                title: item.title,
                description: item.description,
                icon: item.icon,
                action: () => handleButtonClick(item),
              };
            })}
          />
        </>
      )}
    </Box>
  );
};

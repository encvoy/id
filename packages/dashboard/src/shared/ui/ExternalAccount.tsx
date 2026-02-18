import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import Avatar from "@mui/material/Avatar";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { EClaimPrivacy } from "src/shared/utils/enums";
import { getImageURL } from "src/shared/utils/helpers";
import { ProviderType } from "src/shared/api/provider";
import { IExternalAccount, IMTLSProps } from "src/shared/api/users";
import { useDeleteExternalAccountMutation } from "src/shared/api/users";
import { CustomIcon } from "./components/CustomIcon";
import { IconsLibrary } from "./components/IconLibrary";
import { IconWithTooltip } from "./components/IconWithTooltip";
import styles from "./ExternalAccount.module.css";
import { PublicStatusPopover } from "./PublicStatusPopover";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import clsx from "clsx";
import Typography from "@mui/material/Typography";

type ExternalAccountProps = {
  account: Omit<IExternalAccount, "user" | "user_id">;
  userProfileId?: number | string;
  withoutButtons?: boolean;
};

export const ExternalAccount: FC<ExternalAccountProps> = ({
  account,
  userProfileId,
  withoutButtons = false,
}) => {
  const { userId = "" } = useParams<{ userId: string }>();
  const { t: translate } = useTranslation();
  const [deleteExternalAccount] = useDeleteExternalAccountMutation();

  const getAvatar = () => {
    if (account.avatar) return account.avatar;

    switch (account.type) {
      case ProviderType.EMAIL:
        return ProviderAvatars.EMAIL;
      case ProviderType.KLOUD:
        return ProviderAvatars.KLOUD;
      case ProviderType.GITHUB:
        return ProviderAvatars.GITHUB;
      case ProviderType.GOOGLE:
        return ProviderAvatars.GOOGLE;
      case ProviderType.WEBAUTHN:
        return ProviderAvatars.WEBAUTHN;
      case ProviderType.MTLS:
        return ProviderAvatars.MTLS;
      case ProviderType.ETHEREUM:
        return ProviderAvatars.ETHEREUM;
      default:
        return null;
    }
  };

  const handleDeleteClick = async () => {
    await deleteExternalAccount({
      userId: Number(userId) || Number(userProfileId),
      accountId: account.id,
    });
  };

  const getExternalAccountClaimPrivacy = () => {
    switch (account.public) {
      case 0:
        return EClaimPrivacy.private;
      case 1:
        return EClaimPrivacy.request;
      case 2:
        return EClaimPrivacy.public;
      default:
        throw new Error("Unknown claim privacy");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentHeader}>
        {getAvatar() ? (
          <Avatar className={styles.avatar} src={getImageURL(getAvatar())} />
        ) : (
          <CustomIcon
            className={clsx(styles.avatar, styles.defaultIcon)}
            Icon={SwapHorizontalCircleOutlined}
            color="textSecondary"
            sx={{ width: "35px", height: "35px" }}
          />
        )}
        <div>
          <Typography className="text-14">{account.label}</Typography>
          <Typography className="text-12" color="text.secondary">
            {account.type}
          </Typography>
        </div>
      </div>
      <div className={styles.actions}>
        {account.type === ProviderType.MTLS &&
          (account?.rest_info as IMTLSProps)?.cert && (
            <IconWithTooltip
              title={translate("toolTips.goToLink")}
              Icon={InsertLinkOutlinedIcon}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(
                  "https://sign.kloud.one/cert?cert=" +
                    (account?.rest_info as IMTLSProps)?.cert,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            />
          )}
        {!withoutButtons && account.profile_link && (
          <IconWithTooltip
            title={translate("toolTips.goToLink")}
            Icon={InsertLinkOutlinedIcon}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(
                account.profile_link,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          />
        )}
        <IconsLibrary
          type="delete"
          styleButton={styles.actionButton}
          onClick={() => {
            handleDeleteClick();
          }}
          disabled={withoutButtons}
        />
        <PublicStatusPopover
          userId={userId || userProfileId?.toString()}
          claimPrivacy={getExternalAccountClaimPrivacy()}
          externalAccountId={parseInt(account.id, 10)}
        />
      </div>
    </div>
  );
};

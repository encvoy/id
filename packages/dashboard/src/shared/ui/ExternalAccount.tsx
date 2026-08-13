import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ProviderAvatars } from "src/features/adminPortal/settings/providers/utils";
import { EProviderType } from "src/shared/api/provider";
import {
  ICertificateRestInfo,
  IExternalAccount,
  useDeleteExternalAccountMutation,
} from "src/shared/api/users";
import { EClaimPrivacy } from "src/shared/utils/enums";
import { formatPhoneNumber, getImageURL } from "src/shared/utils/helpers";
import { CustomIcon } from "@encvoy-id/components";
import { IconsLibrary } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import styles from "./ExternalAccount.module.css";
import { PublicStatusPopover } from "./PublicStatusPopover";
import { SurfaceBlock } from "@encvoy-id/components";
import { CertificatePanel } from "src/shared/ui/sidePanel/CertificatePanel.tsx";

type ExternalAccountProps = {
  account: Omit<IExternalAccount, "user" | "user_id">;
  userProfileId?: string;
  withoutButtons?: boolean;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCertificateRestInfo = (
  value: IExternalAccount["rest_info"]
): value is ICertificateRestInfo => isPlainObject(value);

export const ExternalAccount: FC<ExternalAccountProps> = ({
  account,
  userProfileId,
  withoutButtons = false,
}) => {
  const { userId = "" } = useParams<{ userId: string }>();
  const { t: translate } = useTranslation();
  const [isCertificatePanelOpen, setIsCertificatePanelOpen] = useState(false);
  const [deleteExternalAccount] = useDeleteExternalAccountMutation();
  const isCertificateAccount = account.type === EProviderType.MTLS;
  const certificateRestInfo = isCertificateRestInfo(account.rest_info)
    ? account.rest_info
    : null;
  const certificate =
    typeof certificateRestInfo?.cert === "string"
      ? certificateRestInfo.cert
      : undefined;

  const getAvatar = () => {
    if (account.avatar) return account.avatar;

    switch (account.type) {
      case EProviderType.EMAIL:
        return ProviderAvatars.EMAIL;
      case EProviderType.KLOUD:
        return ProviderAvatars.KLOUD;
      case EProviderType.GITHUB:
        return ProviderAvatars.GITHUB;
      case EProviderType.GOOGLE:
        return ProviderAvatars.GOOGLE;
      case EProviderType.WEBAUTHN:
        return ProviderAvatars.WEBAUTHN;
      case EProviderType.MTLS:
        return ProviderAvatars.MTLS;
      case EProviderType.ETHEREUM:
        return ProviderAvatars.ETHEREUM;
      case EProviderType.TOTP:
        return ProviderAvatars.TOTP;
      case EProviderType.HOTP:
        return ProviderAvatars.HOTP;
      default:
        return null;
    }
  };

  const handleDeleteClick = async () => {
    await deleteExternalAccount({
      userId: userId || String(userProfileId || ""),
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

  const getDisplayLabel = () => {
    const trimmedLabel = account.label?.trim();
    if (trimmedLabel) {
      return trimmedLabel;
    }

    if (
      [EProviderType.PHONE, EProviderType.KLOUD].includes(
        account.type as EProviderType
      )
    ) {
      return formatPhoneNumber(account.sub);
    }

    return account.sub;
  };

  return (
    <SurfaceBlock className={styles.container}>
      <div className={styles.content}>
        <SurfaceBlock sx={{ width: "40px", height: "40px" }}>
          {getAvatar() ? (
            <Avatar className={styles.icon} src={getImageURL(getAvatar())} />
          ) : (
            <CustomIcon
              className={styles.icon}
              Icon={SwapHorizontalCircleOutlined}
              color="textSecondary"
            />
          )}
        </SurfaceBlock>
        <div>
          <Typography className="text-14">{getDisplayLabel()}</Typography>
          <Typography className="text-12" color="text.secondary">
            {account.type}
          </Typography>
        </div>
      </div>
      <div className={styles.content}>
        {isCertificateAccount && certificate && (
          <IconWithTooltip
            title="Certificate details"
            Icon={ReadMoreIcon}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCertificatePanelOpen(true);
            }}
          />
        )}
        {!withoutButtons && account.profile_link && (
          <IconWithTooltip
            dataTestId={`btn-profile-identifier-link-${account.id}`}
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
        {!withoutButtons && (
          <IconsLibrary
            title={translate("toolTips.delete")}
            dataTestId={`btn-profile-identifier-delete-${account.id}`}
            type="delete"
            styleButton={styles.actionButton}
            onClick={() => {
              handleDeleteClick();
            }}
          />
        )}
        <PublicStatusPopover
          userId={userId || userProfileId?.toString()}
          claimPrivacy={getExternalAccountClaimPrivacy()}
          externalAccountId={account.id}
          readOnly={withoutButtons}
        />
      </div>
      <CertificatePanel
        restInfo={certificateRestInfo}
        onClose={() => setIsCertificatePanelOpen(false)}
        isOpen={isCertificatePanelOpen}
      />
    </SurfaceBlock>
  );
};

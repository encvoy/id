import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import SwapHorizontalCircleOutlined from "@mui/icons-material/SwapHorizontalCircleOutlined";
import { Avatar, Button, Switch, Typography } from "@mui/material";
import clsx from "clsx";
import { CSSProperties, FC, ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { IProvider, EProviderType } from "src/shared/api/provider";
import { CustomIcon } from "@encvoy-id/components";
import { IconsLibrary } from "@encvoy-id/components";
import { IconWithTooltip } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { getImageURL, getProviderTitleByType } from "src/shared/utils/helpers";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import styles from "./ProviderItem.module.css";

export interface ProviderItemCommonProps {
  provider: IProvider;
  currentClientID: string;
  isRequired: boolean;
  onlyRemove: boolean;
  canClick: boolean;
  onEdit: (provider: IProvider) => void;
  onActivate: (provider: IProvider, index?: number) => void;
  onChangeRequired: (provider: IProvider, isRequired: boolean) => void;
  onCopy: (provider: IProvider) => void;
  onDelete: (provider: IProvider) => void;
  editProviderTypes: string[];
  maxQuantity?: number;
}

interface ProviderItemBaseProps extends ProviderItemCommonProps {
  rootRef?: Ref<HTMLDivElement>;
  rootStyle?: CSSProperties;
  dragHandle?: ReactNode;
  shouldRestrictClickToEditableType?: boolean;
}

export const ProviderItemBase: FC<ProviderItemBaseProps> = ({
  provider,
  currentClientID,
  isRequired,
  onlyRemove,
  canClick,
  onEdit,
  onActivate,
  onChangeRequired,
  onCopy,
  onDelete,
  editProviderTypes,
  maxQuantity,
  rootRef,
  rootStyle,
  dragHandle,
  shouldRestrictClickToEditableType = false,
}) => {
  const { t: translate, i18n } = useTranslation();
  const systemClientId = useSystemClientId();

  const isEditableType = editProviderTypes.includes(provider.type);
  const providerTitle = getProviderTitleByType(provider.type);
  const isPublicVisible =
    provider.client_id === systemClientId && provider.is_public;
  const isClickable =
    canClick && (!shouldRestrictClickToEditableType || isEditableType);
  const activationIndex =
    typeof maxQuantity === "number" ? maxQuantity + 1 : undefined;
  const isRequiredSupported =
    !onlyRemove &&
    (providerTitle === EProviderType.OAUTH ||
      provider.type === EProviderType.WEBAUTHN ||
      provider.type === EProviderType.MTLS ||
      provider.type === EProviderType.TOTP ||
      provider.type === EProviderType.HOTP);

  return (
    <SurfaceBlock
      boxRef={rootRef}
      style={rootStyle}
      className={clsx(styles.provider, isClickable ? styles.providerHover : "")}
      onClick={() => {
        if (isClickable) {
          onEdit(provider);
        }
      }}
    >
      {dragHandle}
      <div className={styles.providerHeader}>
        <div className={styles.switch} onClick={(e) => e.stopPropagation()}>
          <Switch
            data-test-id={`chk-settings-login-method-widget-enable-${provider.id}`}
            checked={provider.is_active}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onActivate(provider, activationIndex);
            }}
          />
        </div>
        <Avatar
          src={getImageURL(provider.avatar)}
          className={styles.providerIcon}
        >
          {!provider.avatar && (
            <CustomIcon
              Icon={SwapHorizontalCircleOutlined}
              sx={{ width: "35px", height: "35px" }}
              color="textSecondary"
            />
          )}
        </Avatar>
        {isPublicVisible && (
          <IconWithTooltip
            Icon={PublicOutlinedIcon}
            hideHovered
            title={translate("pages.widget.tooltip")}
          />
        )}
        <div className={styles.nameWrapper}>
          <Typography className={clsx("text-14", styles.name)}>
            {getLocalizedTextValue(provider.name, i18n.language)}
          </Typography>
          <Typography className="text-12" color="text.secondary">
            {providerTitle}
          </Typography>
        </div>
      </div>
      <div className={styles.buttons}>
        {isEditableType && (
          <>
            {canClick && (
              <Button
                className={styles.buttonIcon}
                variant="text"
                data-test-id={`btn-settings-login-method-configure-${provider.id}`}
                onClick={() => onEdit(provider)}
              >
                {translate("actionButtons.configure")}
              </Button>
            )}
            {isRequiredSupported && (
              <IconsLibrary
                styleButton={styles.buttonIcon}
                type={isRequired ? "doNotRequired" : "doRequired"}
                title={translate(
                  isRequired ? "toolTips.doNotRequired" : "toolTips.doRequired"
                )}
                onClick={() => onChangeRequired(provider, isRequired)}
                description={translate(
                  `pages.widget.${isRequired ? "notRequired" : "required"}`
                )}
              />
            )}
            {canClick && (
              <IconsLibrary
                title={translate("toolTips.copy")}
                styleButton={styles.buttonIcon}
                type="copy"
                onClick={() => onCopy(provider)}
              />
            )}
            {provider.client_id === currentClientID && (
              <IconsLibrary
                title={translate("toolTips.delete")}
                styleButton={styles.buttonIcon}
                type="delete"
                dataTestId={`btn-settings-login-method-delete-${provider.id}`}
                onClick={() => onDelete(provider)}
              />
            )}
          </>
        )}
      </div>
    </SurfaceBlock>
  );
};

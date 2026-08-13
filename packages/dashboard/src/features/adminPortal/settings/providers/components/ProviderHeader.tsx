import { SwapHorizontalCircleOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { FC } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import styles from "./ProviderHeader.module.css";
import { InputField } from "@encvoy-id/components";
import { MultiLanguageModalInputField } from "src/shared/ui/components/MultiLanguageModalInputField";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage";
import { SwitchBlock } from "@encvoy-id/components";
import { PublicStatusPopover } from "src/shared/ui/PublicStatusPopover";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";

interface IProviderHeaderProps {
  defaultAvatar?: string;
  withoutPublicStatus?: boolean;
}

export const ProviderHeader: FC<IProviderHeaderProps> = ({
  defaultAvatar,
  withoutPublicStatus,
}) => {
  const { clientId = "", appId = "" } = useParams<{
    clientId: string;
    appId: string;
  }>();
  const { t: translate } = useTranslation();
  const systemClientId = useSystemClientId();

  const { setValue, control } = useFormContext();
  const uploadedPrivacy = useWatch({ control, name: "default_public" });
  const uploadedAvatar = useWatch({ control, name: "avatar" });
  const currentScopeId = clientId || appId;
  const canManagePublicVisibility =
    !clientId && currentScopeId === systemClientId;

  return (
    <>
      <Typography className={clsx("text-17", styles.subtitle)}>
        {translate("helperText.mainInfo")}
      </Typography>
      <MultiLanguageModalInputField
        name="name"
        label={translate("providers.name")}
        required
        dataTestId="txt-settings-login-method-name"
        description={translate("providers.nameDescription")}
      />
      <InputField
        name="description"
        label={translate("providers.description")}
        dataTestId="txt-settings-login-method-description"
        watchLength
        characterCountLabel={translate("helperText.characterCount")}
        maxCharacterCount={255}
      />

      <UploadAndDisplayImage
        title={translate("providers.logo")}
        defaultIconSrc={defaultAvatar}
        defaultIcon={SwapHorizontalCircleOutlined}
        disabledDeleted={defaultAvatar === uploadedAvatar}
      />

      <div className={styles.divider} />

      <Typography className={clsx("text-17", styles.subtitle)}>
        {translate("helperText.parameters")}
      </Typography>
      {canManagePublicVisibility && (
        <SwitchBlock
          name="is_public"
          label={translate("providers.publicMethods")}
          description={translate("providers.publicMethodsDescription")}
          dataTestId="chk-settings-login-method-public"
        />
      )}

      {!withoutPublicStatus && (
        <div className={styles.fieldRow}>
          <div>
            <Typography className="text-14">
              {translate("providers.publicIdentity")}
            </Typography>
            <Typography className="text-14" color="text.secondary">
              {translate("providers.publicDescriptionIdentity")}
            </Typography>
          </div>
          <PublicStatusPopover
            dataTestId="btn-settings-trusted-available"
            claimPrivacy={uploadedPrivacy}
            mode="number"
            setStatus={(status) => {
              setValue("default_public", status, { shouldDirty: true });
            }}
          />
        </div>
      )}
    </>
  );
};

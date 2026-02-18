import { SwapHorizontalCircleOutlined } from "@mui/icons-material";
import clsx from "clsx";
import { FC } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import styles from "./ProviderHeader.module.css";
import { InputField } from "src/shared/ui/components/InputBlock";
import { UploadAndDisplayImage } from "src/shared/ui/UploadAndDisplayImage";
import { SwitchBlock } from "src/shared/ui/components/SwitchBlock";
import { PublicStatusPopover } from "src/shared/ui/PublicStatusPopover";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";

interface IProviderHeaderProps {
  defaultAvatar?: string;
  withoutPublicStatus?: boolean;
}

export const ProviderHeader: FC<IProviderHeaderProps> = ({
  defaultAvatar,
  withoutPublicStatus,
}) => {
  const { clientId = "" } = useParams<{ clientId: string }>();
  const { t: translate } = useTranslation();

  const { setValue, control } = useFormContext();
  const uploadedPrivacy = useWatch({ control, name: "default_public" });
  const uploadedAvatar = useWatch({ control, name: "avatar" });

  return (
    <>
      <Typography className={clsx("text-17", styles.subtitle)}>
        {translate("helperText.mainInfo")}
      </Typography>
      <InputField
        name="name"
        label={translate("providers.name")}
        required
        description={translate("providers.nameDescription")}
      />
      <InputField
        name="description"
        label={translate("providers.description")}
        watchLength
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
      {!clientId && (
        <SwitchBlock
          name="is_public"
          label={translate("providers.publicMethods")}
          description={translate("providers.publicMethodsDescription")}
        />
      )}

      {!withoutPublicStatus && (
        <div className={styles.fieldRow}>
          <div>
            <Typography className="text-14">
              {translate("providers.public")}
            </Typography>
            <Typography className="text-14" color="text.secondary">
              {translate("providers.publicDescription")}
            </Typography>
          </div>
          <PublicStatusPopover
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

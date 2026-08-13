import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import { SurfaceBlock } from "@encvoy-id/components";
import { OidcScopesSettings } from "../oidcScopesPanel/OidcScopesPanel";
import { ProfileFieldsSettings } from "../profileSettings/ProfileFieldsSettings";
import styles from "./ProfileSettings.module.css";

interface IProfileSettingsProps {
  mode: "custom" | "base";
}

export const ProfileSettings: FC<IProfileSettingsProps> = ({ mode }) => {
  const { t: translate } = useTranslation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId?: string }>();
  const targetClientId = clientId || appId;
  const isCustomMode = mode === "custom";
  const {
    data: client,
    isLoading,
    isFetching,
    isError,
  } = useGetClientInfoQuery(
    { id: targetClientId },
    {
      skip: !targetClientId,
    }
  );

  if (!client && (isLoading || isFetching)) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  if (!targetClientId || isError || !client) {
    return <Typography>{translate("pages.clientDetails.notFound")}</Typography>;
  }

  return (
    <div className="page-container">
      <div className={clsx("content_max", styles.content)}>
        <Typography className="title-medium" sx={{ margin: "32px 0" }}>
          {translate("pages.settings.sections.profileFields")}
        </Typography>
        <div className={styles.container}>
          {isCustomMode ? (
            <SurfaceBlock sx={{ padding: "24px" }}>
              <OidcScopesSettings clientId={client.client_id} />
            </SurfaceBlock>
          ) : (
            <SurfaceBlock sx={{ padding: "24px" }}>
              <ProfileFieldsSettings clientId={client.client_id} mode={mode} />
            </SurfaceBlock>
          )}
        </div>
      </div>
    </div>
  );
};

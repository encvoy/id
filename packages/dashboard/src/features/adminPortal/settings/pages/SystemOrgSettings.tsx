import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { ListNotificationsPanel } from "src/features/adminPortal/settings/editNotificationsPanel/ListNotificationsPanel";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import { TAppSlice } from "src/shared/slices/appSlice";
import { TUserSlice } from "src/shared/slices/userSlice";
import { AccordionBlock } from "@encvoy-id/components";
import { CustomIcon } from "@encvoy-id/components";
import { ERoles, tabs } from "src/shared/utils/enums";
import { SettingsHeader } from "../components/SettingsHeader";
import { SettingsParams } from "../components/SettingsParams";
import styles from "./Settings.module.css";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
  roleInApp: state.user.roleInApp,
});

interface ISystemSettingsProps {
  startRoutePath: TAppSlice["startRoutePath"];
  roleInApp: TUserSlice["roleInApp"];
}

export const SystemOrgSettingsComponent: FC<ISystemSettingsProps> = ({
  startRoutePath,
  roleInApp,
}) => {
  const navigate = useNavigate();
  const { appId = "" } = useParams<{ appId: string }>();
  const { t: translate } = useTranslation();
  const {
    data: client,
    isLoading,
    isFetching,
    isError,
  } = useGetClientInfoQuery(
    { id: appId },
    {
      skip: !appId,
    }
  );

  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] =
    useState(false);

  if (!client && (isLoading || isFetching)) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  if (!appId || isError || !client) {
    return <Typography>{translate("pages.clientDetails.notFound")}</Typography>;
  }

  if (roleInApp !== ERoles.OWNER && roleInApp !== ERoles.EDITOR) {
    return (
      <div className="page-container">
        <div
          className="content"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div>
            <Typography className="text-16">
              {translate("errors.insufficientAccessRights")}
            </Typography>
            <Typography className="text-14" color="text.secondary">
              {translate("errors.insufficientAccessRightsDescription")}
            </Typography>
            <CustomIcon
              Icon={BlockOutlinedIcon}
              style={{ width: 40, height: 40 }}
              color="textSecondary"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        <div className={clsx("content", styles.content)}>
          <SettingsHeader client={client} />

          <SettingsParams client={client} />

          <AccordionBlock
            dataTestIdCompact="btn-settings-widget-appearance"
            title={translate("pages.settings.sections.widgetAppearance")}
            onClick={() =>
              navigate(`/${startRoutePath}/${appId}/${tabs.widget}`)
            }
            configureText={translate("actionButtons.configure")}
            dataTestId="btn-settings-login-methods-settings"
            mode="compact"
          />

          <AccordionBlock
            dataTestIdCompact="btn-settings-profile-fields"
            title={translate("pages.settings.sections.profileFields")}
            onClick={() =>
              navigate(`/${startRoutePath}/${appId}/${tabs.profileSettings}`)
            }
            configureText={translate("actionButtons.configure")}
            mode="compact"
          />

          <AccordionBlock
            dataTestIdCompact="btn-settings-notifications"
            title={translate("pages.settings.sections.notifications")}
            onClick={() => setIsNotificationsPanelOpen(true)}
            configureText={translate("actionButtons.configure")}
            dataTestId="btn-settings-notifications-settings"
            mode="compact"
          />

          <ListNotificationsPanel
            onClose={() => setIsNotificationsPanelOpen(false)}
            isOpen={isNotificationsPanelOpen}
            clientId={client.client_id}
          />
        </div>
      </div>
    </>
  );
};

export const SystemOrgSettings = connect(mapStateToProps)(
  SystemOrgSettingsComponent
);

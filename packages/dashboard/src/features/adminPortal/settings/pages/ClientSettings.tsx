import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import { SettingsHeader } from "../components/SettingsHeader";
import { SettingsParams } from "../components/SettingsParams";
import { RequiredFields } from "../components/RequiredFields";
import { AccordionBlock } from "@encvoy-id/components";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tabs } from "src/shared/utils/enums";
import { TAppSlice } from "src/shared/slices/appSlice";
import { RootState } from "src/app/store/store";
import styles from "./Settings.module.css";
import clsx from "clsx";
import Typography from "@mui/material/Typography";
import { ListNotificationsPanel } from "../editNotificationsPanel/ListNotificationsPanel";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
});

type TClientSettings = {
  startRoutePath: TAppSlice["startRoutePath"];
};

export const ClientSettingsComponent: FC<TClientSettings> = ({
  startRoutePath,
}) => {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const targetClientId = clientId || appId;
  const {
    data: client,
    isLoading,
    isFetching,
    isError,
  } = useGetClientInfoQuery(
    {
      id: targetClientId,
    },
    {
      skip: !targetClientId,
    }
  );
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] =
    useState(false);

  if (!client && (isLoading || isFetching)) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  if (!targetClientId || isError || !client || clientId === appId) {
    return <Typography>{translate("pages.clientDetails.notFound")}</Typography>;
  }

  return (
    <div className="page-container">
      <div className={clsx("content", styles.content)}>
        <SettingsHeader client={client} />

        <SettingsParams client={client} />

        <AccordionBlock
          dataTestId="btn-settings-application-required-fields"
          title={translate("pages.settings.sections.requiredFields")}
        >
          <RequiredFields client={client} />
        </AccordionBlock>

        <AccordionBlock
          dataTestIdCompact="btn-settings-widget-appearance"
          title={translate("pages.settings.sections.widgetAppearance")}
          onClick={() =>
            navigate(
              `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.widget}`
            )
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

        <div className="zeroBlock"></div>
      </div>
    </div>
  );
};

export const ClientSettings = connect(mapStateToProps)(ClientSettingsComponent);

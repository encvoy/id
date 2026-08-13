import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { AdditionalModulesSettings } from "src/features/adminPortal/settings/components/AdditionalModulesSettings";
import { SentryPanel } from "src/features/adminPortal/settings/sentryPanel/SentryPanel";
import { WinstonPanel } from "src/features/adminPortal/settings/winstonPanel/WinstonPanel";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import {
  EGetProviderAction,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import { TAppSlice } from "src/shared/slices/appSlice";
import { TUserSlice } from "src/shared/slices/userSlice";
import { AccordionBlock } from "@encvoy-id/components";
import { CustomIcon } from "@encvoy-id/components";
import { ERoles, tabs } from "src/shared/utils/enums";
import { AccessSettings } from "../components/AccessSettings";
import AdditionalParamsSettings from "../components/AdditionalParamsSettings";
import LocaleSettings from "../components/LocaleSettings";
import { LogRetentionSettings } from "../components/LogRetentionSettings";
import { TypesListPanel } from "../editTypesPanel/TypesListPanel";
import styles from "./Settings.module.css";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
  roleInApp: state.user.roleInApp,
});

interface ISystemSettingsProps {
  startRoutePath: TAppSlice["startRoutePath"];
  roleInApp: TUserSlice["roleInApp"];
}

export const SystemSettingsComponent: FC<ISystemSettingsProps> = ({
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
  const { data: providers = [] } = useGetProvidersQuery(
    {
      client_id: client?.client_id || "",
      query: {
        action: EGetProviderAction.all,
      },
    },
    { skip: !client?.client_id }
  );

  const [isClientTypesPanelOpen, setClientTypesPanelOpen] = useState(false);
  const [isSentryPanelOpen, setIsSentryPanelOpen] = useState(false);
  const [isWinstonPanelOpen, setIsWinstonPanelOpen] = useState(false);

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
          <AccordionBlock
            dataTestIdCompact="btn-settings-profile-fields"
            title={translate("pages.settings.sections.profileFields")}
            onClick={() =>
              navigate(
                `/${startRoutePath}/${appId}/${tabs.systemProfileSettings}`
              )
            }
            configureText={translate("actionButtons.configure")}
            mode="compact"
          />

          <AccordionBlock
            dataTestIdCompact="btn-settings-application-types"
            title={translate("pages.settings.sections.additionalParams")}
          >
            <div className={styles.fieldWrapper}>
              <div className={styles.row}>
                <Typography className="text-14">
                  {translate("pages.settings.sections.appTypes")}
                </Typography>
                <Button
                  data-test-id="btn-settings-app-types-settings"
                  variant="text"
                  onClick={() => setClientTypesPanelOpen(true)}
                >
                  {translate("actionButtons.configure")}
                </Button>
              </div>
              <Typography className="text-14" color="text.secondary">
                {translate("panel.types.description")}
              </Typography>
            </div>

            <div
              className={styles.fieldWrapper}
              data-test-id="ddl-settings-localization"
            >
              <LocaleSettings />
            </div>

            <div className={styles.fieldWrapper}>
              <AdditionalParamsSettings />
            </div>
          </AccordionBlock>

          <AccordionBlock
            dataTestIdCompact="btn-settings-additional-modules"
            title={translate("pages.settings.sections.additionalModules")}
          >
            <div className={styles.fieldWrapper}>
              <AdditionalModulesSettings />
            </div>
          </AccordionBlock>

          <AccordionBlock
            dataTestId="ddl-settings-access-settings"
            title={translate("pages.settings.sections.styling")}
            onClick={() =>
              navigate(`/${startRoutePath}/${appId}/${tabs.styling}`)
            }
            configureText={translate("actionButtons.configure")}
            mode="compact"
          />

          <AccordionBlock
            title={translate("pages.settings.sections.accessSettings")}
          >
            <AccessSettings providers={providers} />
          </AccordionBlock>

          <AccordionBlock
            dataTestId="ddl-settings-logging"
            title={translate("pages.settings.sections.logging")}
          >
            <div className={styles.fieldWrapper}>
              <div className={styles.row}>
                <Typography className="text-14">
                  {translate("pages.settings.sections.sentry")}
                </Typography>
                <Button
                  data-test-id="btn-settings-sentry"
                  variant="text"
                  onClick={() => setIsSentryPanelOpen(true)}
                >
                  {translate("actionButtons.configure")}
                </Button>
              </div>
              <Typography className="text-14" color="text.secondary">
                {translate("pages.settings.logging.sentryDescription")}
              </Typography>
            </div>

            <div className={styles.fieldWrapper}>
              <div className={styles.row}>
                <Typography className="text-14">
                  {translate("pages.settings.sections.winston")}
                </Typography>
                <Button
                  data-test-id="btn-settings-winston"
                  variant="text"
                  onClick={() => setIsWinstonPanelOpen(true)}
                >
                  {translate("actionButtons.configure")}
                </Button>
              </div>
              <Typography className="text-14" color="text.secondary">
                {translate("pages.settings.logging.winstonDescription")}
              </Typography>
            </div>

            <div className={styles.fieldWrapper}>
              <LogRetentionSettings />
            </div>
          </AccordionBlock>

          <TypesListPanel
            onClose={() => setClientTypesPanelOpen(false)}
            isOpen={isClientTypesPanelOpen}
          />
          <WinstonPanel
            isOpen={isWinstonPanelOpen}
            onClose={() => setIsWinstonPanelOpen(false)}
          />

          <SentryPanel
            isOpen={isSentryPanelOpen}
            onClose={() => setIsSentryPanelOpen(false)}
          />
        </div>
      </div>
    </>
  );
};

export const SystemSettings = connect(mapStateToProps)(SystemSettingsComponent);

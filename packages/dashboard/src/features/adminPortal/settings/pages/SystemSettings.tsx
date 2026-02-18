import Button from "@mui/material/Button";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ERoles, tabs } from "src/shared/utils/enums";
import { TAppSlice } from "src/shared/lib/appSlice";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import {
  EGetProviderAction,
  IEmailParams,
  IPhoneParams,
  IProvider,
  ProviderType,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import {
  IProfileField,
  useGetProfileFieldsQuery,
} from "src/shared/api/settings";
import { RootState } from "src/app/store/store";
import { AccessSettings } from "../components/AccessSettings";
import LocaleSettings from "../components/LocaleSettings";
import { SettingsHeader } from "../components/SettingsHeader";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import { SettingsParams } from "../components/SettingsParams";
import { ListEmailTemplatesPanel } from "src/features/adminPortal/settings/editEmailTemplatesPanel/ListEmailTemplatesPanel";
import { TypesListPanel } from "../editTypesPanel/TypesListPanel";
import { EditProfileFieldPanel } from "../components/EditProfileFieldPanel";
import { ProfileField } from "../components/ProfileField";
import { ListRuleValidationsPanel } from "src/features/adminPortal/settings/ruleValidationsPanel/ListRuleValidationsPanel";
import { SentryPanel } from "src/features/adminPortal/settings/sentryPanel/SentryPanel";
import styles from "./Settings.module.css";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { TUserSlice } from "src/shared/lib/userSlice";
import Typography from "@mui/material/Typography";

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
  const { data: client, isLoading } = useGetClientInfoQuery({ id: appId });
  const { t: translate } = useTranslation();
  const { data: profileFields } = useGetProfileFieldsQuery();
  const { data: providers = [] } = useGetProvidersQuery(
    {
      client_id: client?.client_id || "",
      query: {
        action: EGetProviderAction.all,
      },
    },
    { skip: !client?.client_id }
  );

  const [isProfileFieldPanelOpen, setIsProfileFieldPanelOpen] = useState(false);
  const [isEmailTemplatesModalOpen, setEmailTemplatesModalOpen] =
    useState(false);
  const [isClientTypesPanelOpen, setClientTypesPanelOpen] = useState(false);
  const [savePasswordPolicyModalOpen, setSavePasswordPolicyModalOpen] =
    useState(false);
  const [phoneProvider, setPhoneProvider] = useState<
    IProvider<IPhoneParams> | undefined
  >(undefined);
  const [emailProvider, setEmailProvider] = useState<
    IProvider<IEmailParams> | undefined
  >(undefined);
  const [selectedProfileField, setSelectedProfileField] = useState<
    IProfileField | undefined
  >(undefined);
  const [isSentryPanelOpen, setIsSentryPanelOpen] = useState(false);
  const passwordProfileField = profileFields?.find(
    (f) => f.field === "password"
  );
  const generalProfileFields = profileFields?.filter(
    (item) => item.type === "general" && item.field !== "password"
  );
  const customProfileFields = profileFields?.filter(
    (item) => item.type === "custom"
  );

  useEffect(() => {
    if (providers.length) {
      if (selectedProfileField?.field === "phone_number") {
        const phoneProvider = providers.find(
          (provider) => provider.type === ProviderType.PHONE
        );

        if (phoneProvider && phoneProvider.type === ProviderType.PHONE) {
          setPhoneProvider(phoneProvider as IProvider<IPhoneParams>);
        } else {
          setPhoneProvider(undefined);
        }
      }

      if (selectedProfileField?.field === "email") {
        const emailProvider = providers.find(
          (provider) => provider.type === ProviderType.EMAIL
        );

        if (emailProvider && emailProvider.type === ProviderType.EMAIL) {
          setEmailProvider(emailProvider as IProvider<IEmailParams>);
        } else {
          setEmailProvider(undefined);
        }
      }
    }
  }, [selectedProfileField, providers]);

  if (isLoading || client === undefined) {
    return <Typography>{translate("helperText.loading")}</Typography>;
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

  const listGeneralProfileFields = generalProfileFields?.map((item) => {
    return (
      <ProfileField
        onClick={() => {
          setIsProfileFieldPanelOpen(true);
          setSelectedProfileField(item);
        }}
        key={item.field}
        profile={item}
      />
    );
  });

  const listCustomProfileFields = customProfileFields?.map((item) => {
    return (
      <ProfileField
        onClick={() => {
          setIsProfileFieldPanelOpen(true);
          setSelectedProfileField(item);
        }}
        key={item.field}
        profile={item}
        deleted={true}
      />
    );
  });

  return (
    <>
      <div className="page-container">
        <div className={clsx("content", styles.content)}>
          <SettingsHeader client={client} />

          <SettingsParams client={client} />

          <AccordionBlock
            title={translate("pages.settings.sections.widgetAppearance")}
            onClick={() =>
              navigate(`/${startRoutePath}/${appId}/${tabs.widget}`)
            }
            mode="compact"
          />

          <AccordionBlock
            title={translate("pages.settings.sections.profileFields")}
          >
            <Typography className="text-14" color="text.secondary">
              {translate("pages.settings.profileFieldsSubtitle")}
            </Typography>
            <Typography className={clsx(styles.subTitleWrapper, "text-17")}>
              {translate("pages.settings.passwordPolicy")}
            </Typography>
            {passwordProfileField && (
              <ProfileField
                onClick={() => {
                  setIsProfileFieldPanelOpen(true);
                  setSelectedProfileField(passwordProfileField);
                }}
                key={"password"}
                profile={passwordProfileField}
              />
            )}

            <Typography className={clsx(styles.subTitleWrapper, "text-17")}>
              {translate("pages.settings.sections.generalInfo")}
            </Typography>
            {listGeneralProfileFields}

            <div className={styles.subTitleWrapper}>
              <Typography className="text-17">
                {translate("pages.settings.sections.additionalInfo")}
              </Typography>
              <Button
                variant="text"
                onClick={() => setIsProfileFieldPanelOpen(true)}
              >
                {translate("actionButtons.add")}
              </Button>
            </div>
            {listCustomProfileFields}
          </AccordionBlock>

          <AccordionBlock
            title={translate("pages.settings.sections.emailTemplates")}
            onClick={() => setEmailTemplatesModalOpen(true)}
            mode="compact"
          />
          <AccordionBlock
            title={translate("pages.settings.sections.appTypes")}
            onClick={() => setClientTypesPanelOpen(true)}
            mode="compact"
          />

          <AccordionBlock
            title={translate("pages.settings.sections.localization")}
          >
            <LocaleSettings />
          </AccordionBlock>

          <AccordionBlock
            title={translate("pages.settings.sections.accessSettings")}
          >
            <AccessSettings providers={providers} />
          </AccordionBlock>

          <AccordionBlock
            title={translate("pages.settings.sections.sentry")}
            onClick={() => setIsSentryPanelOpen(true)}
            mode="compact"
          />

          <ListEmailTemplatesPanel
            onClose={() => setEmailTemplatesModalOpen(false)}
            isOpen={isEmailTemplatesModalOpen}
          />
          <TypesListPanel
            onClose={() => setClientTypesPanelOpen(false)}
            isOpen={isClientTypesPanelOpen}
          />
          <EditProfileFieldPanel
            onClose={() => {
              setIsProfileFieldPanelOpen(false);
              setSelectedProfileField(undefined);
            }}
            isOpen={isProfileFieldPanelOpen}
            selectedProfile={selectedProfileField}
            phoneProvider={phoneProvider}
            emailProvider={emailProvider}
          />
          <ListRuleValidationsPanel
            onClose={() => setSavePasswordPolicyModalOpen(false)}
            fieldName={"password"}
            isOpen={savePasswordPolicyModalOpen}
            isNoBackdrop={false}
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

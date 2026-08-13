import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  EGetProviderAction,
  IEmailParams,
  IPhoneParams,
  IProvider,
  EProviderType,
  useGetProvidersQuery,
} from "src/shared/api/provider";
import {
  IProfileField,
  useGetProfileFieldsQuery,
} from "src/shared/api/settings";
import { ProfileField } from "../components/ProfileField";
import { EditProfileFieldPanel } from "../ProfileFieldPanel/EditProfileFieldPanel";
import { ListRuleValidationsPanel } from "../ruleValidationsPanel/ListRuleValidationsPanel";
import styles from "../pages/Settings.module.css";

interface IProfileFieldsSettingsProps {
  clientId: string;
  mode: "custom" | "base";
}

export const ProfileFieldsSettings: FC<IProfileFieldsSettingsProps> = ({
  clientId,
  mode,
}) => {
  const { t: translate } = useTranslation();
  const { appId = "" } = useParams<{ appId?: string }>();
  const ownerScopeClientId = appId || clientId;
  const { data: profileFields } = useGetProfileFieldsQuery(
    clientId ? { client_id: clientId } : undefined,
    { skip: !clientId }
  );
  const { data: providers = [] } = useGetProvidersQuery(
    {
      client_id: clientId,
      query: {
        action: EGetProviderAction.all,
      },
    },
    { skip: !clientId }
  );
  const [isProfileFieldPanelOpen, setIsProfileFieldPanelOpen] = useState(false);
  const [savePasswordPolicyModalOpen, setSavePasswordPolicyModalOpen] =
    useState(false);
  const [selectedProfileField, setSelectedProfileField] = useState<
    IProfileField | undefined
  >(undefined);
  const [phoneProvider, setPhoneProvider] = useState<
    IProvider<IPhoneParams> | undefined
  >(undefined);
  const [emailProvider, setEmailProvider] = useState<
    IProvider<IEmailParams> | undefined
  >(undefined);

  const passwordProfileField = profileFields?.find(
    (field) => field.field === "password"
  );
  const generalProfileFields = profileFields?.filter(
    (field) => field.type === "general" && field.field !== "password"
  );
  const customProfileFields = profileFields?.filter(
    (field) =>
      field.type === "custom" && field.organization_id === ownerScopeClientId
  );
  const isCustomMode = mode === "custom";
  const isBaseMode = mode === "base";

  useEffect(() => {
    if (!providers.length) {
      return;
    }

    if (selectedProfileField?.field === "phone_number") {
      const provider = providers.find(
        (item) => item.type === EProviderType.PHONE
      );
      setPhoneProvider(
        provider && provider.type === EProviderType.PHONE
          ? (provider as IProvider<IPhoneParams>)
          : undefined
      );
    }

    if (selectedProfileField?.field === "email") {
      const provider = providers.find(
        (item) => item.type === EProviderType.EMAIL
      );
      setEmailProvider(
        provider && provider.type === EProviderType.EMAIL
          ? (provider as IProvider<IEmailParams>)
          : undefined
      );
    }
  }, [selectedProfileField, providers]);

  const openProfileField = (field?: IProfileField) => {
    setSelectedProfileField(field);
    setIsProfileFieldPanelOpen(true);
  };

  return (
    <>
      <Typography className="title-medium" sx={{ marginBottom: "16px" }}>
        {translate(
          isCustomMode
            ? "pages.settings.requiredFields.customFields"
            : "pages.settings.requiredFields.mainFields"
        )}
      </Typography>
      <Typography className="text-14" color="text.secondary">
        {translate("pages.settings.profileFieldsSubtitle")}
      </Typography>

      {isBaseMode && (
        <>
          <Typography className={clsx(styles.subTitleWrapper, "text-17")}>
            {translate("pages.settings.passwordPolicy")}
          </Typography>
          {passwordProfileField && (
            <ProfileField
              onClick={() => openProfileField(passwordProfileField)}
              key="password"
              profile={passwordProfileField}
              clientId={clientId}
            />
          )}

          <Typography className={clsx(styles.subTitleWrapper, "text-17")}>
            {translate("pages.settings.sections.generalInfo")}
          </Typography>
          {generalProfileFields?.map((field) => (
            <ProfileField
              onClick={() => openProfileField(field)}
              key={field.field}
              profile={field}
              clientId={clientId}
            />
          ))}
        </>
      )}

      {isCustomMode && (
        <>
          <div className={styles.subTitleWrapper}>
            <Typography className="text-17">
              {translate("pages.settings.sections.additionalInfo")}
            </Typography>
            <Button
              data-test-id="btn-settings-user-profile-field-add"
              variant="text"
              onClick={() => openProfileField()}
            >
              {translate("actionButtons.add")}
            </Button>
          </div>
          {customProfileFields?.map((field) => (
            <ProfileField
              onClick={() => openProfileField(field)}
              key={field.field}
              profile={field}
              clientId={clientId}
              deleted
            />
          ))}
        </>
      )}

      <EditProfileFieldPanel
        onClose={() => {
          setIsProfileFieldPanelOpen(false);
          setSelectedProfileField(undefined);
        }}
        isOpen={isProfileFieldPanelOpen}
        selectedProfile={selectedProfileField}
        clientId={clientId}
        phoneProvider={phoneProvider}
        emailProvider={emailProvider}
      />
      <ListRuleValidationsPanel
        onClose={() => setSavePasswordPolicyModalOpen(false)}
        fieldName="password"
        clientId={clientId}
        isOpen={savePasswordPolicyModalOpen}
        isNoBackdrop={false}
      />
    </>
  );
};

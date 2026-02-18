import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import clsx from "clsx";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import { IconsLibrary } from "src/shared/ui/components/IconLibrary";
import { InputField } from "src/shared/ui/components/InputBlock";
import { SwitchBlock } from "src/shared/ui/components/SwitchBlock";
import { EClaimPrivacy, RuleFieldNames } from "src/shared/utils/enums";
import { getImageURL, isUrl } from "src/shared/utils/helpers";
import { useGetMeInfoQuery } from "src/shared/api/users";
import {
  IEmailParams,
  IPhoneParams,
  IProvider,
  useDeleteProviderMutation,
} from "src/shared/api/provider";
import {
  IProfileField,
  useCreateProfileFieldMutation,
  useEditSettingsMutation,
  useGetRuleValidationsByFieldNameQuery,
  useGetSettingsQuery,
  useUpdateProfileFieldMutation,
} from "src/shared/api/settings";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { PublicStatusPopover } from "src/shared/ui/PublicStatusPopover";
import { EmailProvider } from "src/features/adminPortal/settings/providers/editPanel/EmailProvider";
import { PhoneProvider } from "src/features/adminPortal/settings/providers/editPanel/PhoneProvider";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { ListRuleValidationsPanel } from "src/features/adminPortal/settings/ruleValidationsPanel/ListRuleValidationsPanel";
import styles from "./EditProfileFieldPanel.module.css";
import Typography from "@mui/material/Typography";

interface IEditProfileFieldPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfile?: IProfileField;
  phoneProvider?: IProvider<IPhoneParams>;
  emailProvider?: IProvider<IEmailParams>;
}

export const EditProfileFieldPanel: FC<IEditProfileFieldPanelProps> = ({
  isOpen,
  onClose,
  selectedProfile,
  phoneProvider,
  emailProvider,
}) => {
  const { t: translate } = useTranslation();
  const [createProfileField] = useCreateProfileFieldMutation();
  const [updateProfileField] = useUpdateProfileFieldMutation();
  const { data: dataSettings } = useGetSettingsQuery(undefined, {
    skip: selectedProfile?.field !== RuleFieldNames.agreement,
  });
  const [editSettings] = useEditSettingsMutation();
  const [deleteProvider] = useDeleteProviderMutation();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();

  const [isEditRuleValidationsOpen, setIsEditRuleValidationsOpen] =
    useState(false);
  const [isPhoneProviderOpen, setIsPhoneProviderOpen] = useState(false);
  const [isEmailProviderOpen, setIsEmailProviderOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>("");
  const [fileUrlError, setUrlFileUrl] = useState("");
  const { refetch: getUser } = useGetMeInfoQuery();

  const headerText = !selectedProfile
    ? translate("panel.profileFields.createTitle")
    : translate("panel.profileFields.editTitle", {
        fieldName: selectedProfile.title,
      });

  const { data: ruleValidations = [] } = useGetRuleValidationsByFieldNameQuery(
    selectedProfile?.field || ""
  );
  const listTitleRuleValidations = selectedProfile
    ? ruleValidations.filter((item) => item.active).map((item) => item.title) ||
      []
    : [];

  const defaultProfileFieldValues = {
    field: "",
    title: "",
    default: undefined,
    mapping_vcard: undefined,
    editable: false,
    required: false,
    unique: false,
    active: false,
    allowed_as_login: undefined,
    claim: EClaimPrivacy.private,
  };

  const methods = useForm<IProfileField>({
    defaultValues: defaultProfileFieldValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const {
    handleSubmit,
    reset,
    formState: { dirtyFields, errors },
    setValue,
    control,
  } = methods;

  const claimPrivacy = useWatch({
    control,
    name: "claim",
  });

  useEffect(() => {
    if (selectedProfile) {
      reset(selectedProfile);
    } else {
      reset(defaultProfileFieldValues);
    }
    setFileUrl("");
  }, [selectedProfile, isOpen]);

  useEffect(() => {
    getUser();
  }, [selectedProfile, createProfileField]);

  useEffect(() => {
    if (dataSettings) {
      setFileUrl(dataSettings?.data_processing_agreement);
    }
  }, [dataSettings]);

  const onSubmit = async (data: IProfileField) => {
    if (Object.keys(errors).length) return;
    const changedFields = (
      Object.keys(dirtyFields) as Array<keyof typeof data>
    ).reduce((acc, field) => ({ ...acc, [field]: data[field] }), {});

    try {
      if (selectedProfile?.field === RuleFieldNames.agreement) {
        const validUrl = isUrl(fileUrl);
        if (!validUrl) {
          setUrlFileUrl(translate("errors.invalidUrlFormat"));
          return;
        }
        editSettings({
          data_processing_agreement: fileUrl ? fileUrl?.trim() : null,
        });
      }

      if (selectedProfile) {
        await updateProfileField({
          field_name: selectedProfile.field,
          body: changedFields,
        }).unwrap();
      } else {
        await createProfileField(data).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Error updating profile field", error);
    }
  };

  const handleDeleteProvider = async (providerId?: string) => {
    await deleteProvider({
      clientId: clientId || appId,
      providerId: providerId || "",
    });
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrlFileUrl("");
    setFileUrl(event.target.value);
  };

  return (
    <SidePanel
      onClose={() => onClose()}
      isOpen={isOpen}
      title={headerText}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className={styles.wrapper}>
        <FormProvider {...methods}>
          <InputField
            label={translate("panel.profileFields.labels.field")}
            name="field"
            required
            disabled={selectedProfile?.type === "general"}
            description={translate("panel.profileFields.descriptions.field")}
          />

          <InputField
            label={translate("panel.profileFields.labels.title")}
            name="title"
            required
            disabled={selectedProfile?.type === "general"}
            description={translate("panel.profileFields.descriptions.title")}
          />

          {selectedProfile &&
            ["login", "email", "phone_number"].includes(
              selectedProfile.field
            ) && (
              <SwitchBlock
                name="allowed_as_login"
                label={translate("panel.profileFields.labels.allowedAsLogin")}
                onChange={(value) => {
                  if (selectedProfile?.field === "email") {
                    setValue("unique", value, {
                      shouldDirty: value,
                    });
                  }
                  if (value) {
                    setValue("required", value, { shouldDirty: true });
                    setValue("editable", value, { shouldDirty: true });
                  }
                }}
              />
            )}
          <SwitchBlock
            name="active"
            label={translate("panel.profileFields.labels.active")}
            disabled={selectedProfile && selectedProfile?.type !== "custom"}
          />
          <Typography style={{ marginBottom: 8 }} className="text-17">
            {translate("panel.profileFields.labels.parameters")}
          </Typography>
          <Typography
            style={{ marginBottom: 16 }}
            className="text-14"
            color="text.secondary"
          >
            {translate("panel.profileFields.labels.parametersDescription")}
          </Typography>
          <div>
            <SwitchBlock
              name="editable"
              label={translate("panel.profileFields.labels.editable")}
              disabled={
                selectedProfile?.field === RuleFieldNames.agreement ||
                selectedProfile?.field === RuleFieldNames.password
              }
            />
            <SwitchBlock
              name="required"
              label={translate("panel.profileFields.labels.required")}
              onChange={(value) => {
                if (value) {
                  setValue("editable", value, { shouldDirty: true });
                } else {
                  setValue("allowed_as_login", false, {
                    shouldDirty: true,
                  });
                }
              }}
              disabled={selectedProfile?.field === RuleFieldNames.picture}
            />
            <SwitchBlock
              name="unique"
              label={translate("panel.profileFields.labels.unique")}
              onChange={(value) => {
                if (!value) {
                  setValue("allowed_as_login", false, {
                    shouldDirty: true,
                  });
                }
              }}
              disabled={
                selectedProfile?.type !== "custom" &&
                selectedProfile?.field !== "email"
              }
            />
            <div className={styles.fieldRow}>
              <div>
                <Typography
                  className={clsx("text-14", styles["info-item-value"])}
                >
                  {translate("panel.profileFields.labels.public")}
                </Typography>
                <Typography className="text-14" color="text.secondary">
                  {translate("panel.profileFields.labels.publicDescription")}
                </Typography>
              </div>
              <PublicStatusPopover
                claimPrivacy={claimPrivacy}
                setStatus={(value) =>
                  setValue("claim", value as EClaimPrivacy, {
                    shouldDirty: true,
                  })
                }
                disabled={
                  !selectedProfile ||
                  selectedProfile.field === RuleFieldNames.password
                }
              />
            </div>
            {(selectedProfile?.type === "custom" || !selectedProfile) && (
              <InputField
                label={translate("panel.profileFields.labels.vcardAttribute")}
                name="mapping_vcard"
                disabled={selectedProfile?.type === "general"}
                description={translate(
                  "panel.profileFields.labels.vcardDescription"
                )}
                placeholder={translate(
                  "panel.profileFields.labels.vcardPlaceholder"
                )}
              />
            )}
            {(selectedProfile?.type === "custom" || !selectedProfile) && (
              <InputField
                label={translate("panel.profileFields.labels.defaultValue")}
                name="default"
                description={translate(
                  "panel.profileFields.labels.defaultDescription"
                )}
                placeholder={translate(
                  "panel.profileFields.labels.defaultPlaceholder"
                )}
              />
            )}
          </div>
          {selectedProfile?.field === "phone_number" && (
            <ProviderCard
              title={translate("panel.profileFields.labels.phoneProviderTitle")}
              provider={phoneProvider}
              onAddClick={() => setIsPhoneProviderOpen(true)}
              onDeleteClick={() => setIsModalDeleteOpen(true)}
              type="phone"
            />
          )}
          {selectedProfile?.field === "email" && (
            <ProviderCard
              title={translate("panel.profileFields.labels.emailProviderTitle")}
              provider={emailProvider}
              onAddClick={() => setIsEmailProviderOpen(true)}
              onDeleteClick={() => setIsModalDeleteOpen(true)}
              type="email"
            />
          )}

          {![
            RuleFieldNames.agreement,
            RuleFieldNames.birthdate,
            RuleFieldNames.picture,
          ].includes(selectedProfile?.field as RuleFieldNames) && (
            <>
              <div className={styles.fieldRow}>
                <Typography className="text-14">
                  {translate("panel.profileFields.labels.validationRules")}
                </Typography>
                <Button
                  variant="text"
                  onClick={() => setIsEditRuleValidationsOpen(true)}
                  disabled={!selectedProfile}
                >
                  {translate("actionButtons.configure")}
                </Button>
              </div>
              <TextField
                placeholder={translate(
                  "panel.profileFields.labels.validationRulesPlaceholder"
                )}
                value={
                  listTitleRuleValidations
                    ? listTitleRuleValidations.join(", ")
                    : undefined
                }
                disabled={true}
                fullWidth
                variant="standard"
                className="custom"
              />
            </>
          )}

          {selectedProfile?.field === RuleFieldNames.agreement && (
            <div className={styles.agreement}>
              <Typography className="text-14">
                {translate("panel.profileFields.labels.agreementLink")}
              </Typography>
              <TextField
                placeholder={translate(
                  "panel.profileFields.labels.agreementPlaceholder"
                )}
                value={fileUrl}
                onChange={handleUrlChange}
                className="custom"
                fullWidth
                variant="standard"
                error={!!fileUrlError}
                helperText={fileUrlError}
              />
            </div>
          )}
        </FormProvider>
      </div>

      <ListRuleValidationsPanel
        onClose={() => setIsEditRuleValidationsOpen(false)}
        fieldName={selectedProfile?.field || ""}
        isOpen={isEditRuleValidationsOpen}
      />

      <PhoneProvider
        isOpen={isPhoneProviderOpen}
        onClose={() => setIsPhoneProviderOpen(false)}
        provider={phoneProvider}
      />
      <EmailProvider
        isOpen={isEmailProviderOpen}
        onClose={() => setIsEmailProviderOpen(false)}
        provider={emailProvider}
      />

      <SubmitModal
        isOpen={isModalDeleteOpen}
        onSubmit={() => {
          handleDeleteProvider(emailProvider?.id || phoneProvider?.id);
          setIsModalDeleteOpen(false);
        }}
        onClose={() => setIsModalDeleteOpen(false)}
        title={translate("panel.profileFields.modals.deleteProvider.title")}
        mainMessage={[
          translate("panel.profileFields.modals.deleteProvider.message"),
        ]}
      />
    </SidePanel>
  );
};

const ProviderCard: FC<{
  title: string;
  provider?: IProvider<IPhoneParams | IEmailParams>;
  onAddClick: () => void;
  onDeleteClick: () => void;
  type: "email" | "phone";
}> = ({ title, provider, onAddClick, onDeleteClick, type }) => {
  const { t: translate } = useTranslation();
  return (
    <div className={styles.itemSettings}>
      <div className={styles.fieldRow}>
        <Typography className="text-14">{title}</Typography>
        {!provider && (
          <Button variant="text" onClick={onAddClick}>
            {translate("actionButtons.add")}
          </Button>
        )}
      </div>
      {provider && (
        <div
          data-id={`${type}-provider-card`}
          className={styles.provider}
          onClick={onAddClick}
        >
          <Avatar
            src={getImageURL(provider.avatar)}
            className={styles.providerIcon}
          />
          <Typography className={clsx("text-14", styles.providerName)}>
            {type === "email"
              ? (provider?.params as IEmailParams)?.root_mail
              : (provider?.params as IPhoneParams)?.issuer}
          </Typography>
          <div className={styles.actions}>
            <Button variant="text" onClick={onAddClick}>
              {translate("actionButtons.configure")}
            </Button>
            <IconsLibrary type="delete" onClick={onDeleteClick} />
          </div>
        </div>
      )}
    </div>
  );
};

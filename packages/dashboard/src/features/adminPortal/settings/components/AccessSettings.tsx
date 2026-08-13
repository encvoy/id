import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { FC, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { getDirtyFieldsValues, isObjectEmpty } from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";
import { IProvider } from "src/shared/api/provider";
import {
  ISettings,
  useEditSettingsMutation,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import { EditTwoFactorPanel } from "../editTwoFactorPanel/editTwoFactorPanel";
import styles from "./AccessSettings.module.css";
import { RadioGroupField } from "@encvoy-id/components";
import { SwitchBlock } from "@encvoy-id/components";

export enum ERegistrationPolicyTypes {
  allowed = "allowed",
  allowed_autoregistration_only = "allowed_autoregistration_only",
  disabled = "disabled",
}

interface IAccessSettingsProps {
  providers: IProvider[];
}

export const AccessSettings: FC<IAccessSettingsProps> = ({ providers }) => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const [isTwoFactorPanelOpen, setIsTwoFactorPanelOpen] = useState(false);

  const accessSettingsSchema = yup
    .object({
      registration_policy: yup
        .string()
        .required(translate("errors.requiredField")),
      authorize_only_admins: yup
        .boolean()
        .required(translate("errors.requiredField")),
      ignore_required_fields_for_clients: yup
        .boolean()
        .required(translate("errors.requiredField")),
      prohibit_identifier_binding: yup
        .boolean()
        .required(translate("errors.requiredField")),
    })
    .required();
  const { data: dataSettings } = useGetSettingsQuery();
  const [editSettings, editSettingsResult] = useEditSettingsMutation();

  const methods = useForm<ISettings>({
    resolver: yupResolver(accessSettingsSchema) as any,
    defaultValues: {
      authorize_only_admins: dataSettings?.authorize_only_admins,
      registration_policy: dataSettings?.registration_policy,
      ignore_required_fields_for_clients:
        dataSettings?.ignore_required_fields_for_clients,
      prohibit_identifier_binding: dataSettings?.prohibit_identifier_binding,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const {
    reset,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = methods;

  useEffect(() => {
    if (editSettingsResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    }
  }, [editSettingsResult, dispatch, translate]);

  useEffect(() => {
    reset(dataSettings);
  }, [dataSettings]);

  const onSubmit: SubmitHandler<ISettings> = async (data) => {
    if (Object.keys(errors).length) console.error(errors);

    const payload = getDirtyFieldsValues(data, dirtyFields);

    await editSettings(payload).unwrap();
  };

  return (
    <>
      <Box className={styles.container}>
        <div className={styles.fieldWrapper}>
          <div className={styles.row}>
            <Typography className="text-14">
              {translate("pages.settings.access.twoFactorTitle")}
            </Typography>
            <Button
              data-test-id="btn-settings-access-2fa-settings"
              variant="text"
              className={styles.button}
              onClick={() => setIsTwoFactorPanelOpen(true)}
            >
              {translate("actionButtons.configure")}
            </Button>
          </div>
          <Typography className="text-14" color="text.secondary">
            {translate("pages.settings.access.twoFactorDescription")}
          </Typography>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormProvider {...methods}>
            <SwitchBlock
              dataTestId="chk-settings-access-ignore-required-fields"
              name="ignore_required_fields_for_clients"
              label={translate(
                "pages.settings.access.ignoreRequiredFieldsTitle"
              )}
              description={translate(
                "pages.settings.access.ignoreRequiredFieldsDescription"
              )}
            />
            <SwitchBlock
              dataTestId="chk-settings-access-disable-binding-widget"
              name="prohibit_identifier_binding"
              label={translate("pages.settings.access.prohibitBindingTitle")}
              description={translate(
                "pages.settings.access.prohibitBindingDescription"
              )}
            />
            <SwitchBlock
              dataTestId="chk-settings-access-limited-access"
              name="authorize_only_admins"
              label={translate("pages.settings.access.restrictedAccessTitle")}
              description={translate(
                "pages.settings.access.restrictedAccessDescription"
              )}
            />
            <div className={styles.fieldWrapper}>
              <Typography className="text-14">
                {translate("pages.settings.access.registrationPolicyTitle")}
              </Typography>
              <div className={styles.radioWrapper}>
                <RadioGroupField
                  name="registration_policy"
                  options={[
                    {
                      value: ERegistrationPolicyTypes.disabled,
                      dataTestId: "chk-settings-access-registartion-disable",
                      title: translate(
                        "pages.settings.access.registrationDisabled"
                      ),
                    },
                    {
                      value: ERegistrationPolicyTypes.allowed,
                      dataTestId: "chk-settings-access-registartion-allowed",
                      title: translate(
                        "pages.settings.access.registrationAllowed"
                      ),
                    },
                    {
                      value:
                        ERegistrationPolicyTypes.allowed_autoregistration_only,
                      dataTestId:
                        "chk-settings-access-autoregistartion-allowed",
                      title: translate(
                        "pages.settings.access.registrationAutoOnly"
                      ),
                    },
                  ]}
                />
              </div>
            </div>
            <div className={styles.buttonWrapper}>
              <Button
                data-test-id="btn-settings-access-save"
                className={styles.saveButton}
                type="submit"
                variant="contained"
                disabled={isObjectEmpty(dirtyFields)}
              >
                {translate("actionButtons.save")}
              </Button>
            </div>
          </FormProvider>
        </form>
      </Box>

      <EditTwoFactorPanel
        isOpen={isTwoFactorPanelOpen}
        onClose={() => setIsTwoFactorPanelOpen(false)}
        settings={dataSettings?.two_factor_authentication}
        providers={providers}
      />
    </>
  );
};

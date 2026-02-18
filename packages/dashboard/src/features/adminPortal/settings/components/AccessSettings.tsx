import { yupResolver } from "@hookform/resolvers/yup";
import { Box, FormControlLabel, Radio, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { FC, useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import * as yup from "yup";
import { isObjectEmpty } from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import { IProvider } from "src/shared/api/provider";
import {
  ISettings,
  useEditSettingsMutation,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import { EditTwoFactorPanel } from "../editTwoFactorPanel/editTwoFactorPanel";
import styles from "./AccessSettings.module.css";
import { SwitchBlock } from "src/shared/ui/components/SwitchBlock";

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
    control,
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

    const payload: Partial<ISettings> = (
      Object.keys(dirtyFields) as Array<keyof typeof data>
    ).reduce(
      (acc, field) => ({ ...acc, [field]: data[field] }),
      {} as Partial<ISettings>
    );

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
              name="ignore_required_fields_for_clients"
              label={translate(
                "pages.settings.access.ignoreRequiredFieldsTitle"
              )}
              description={translate(
                "pages.settings.access.ignoreRequiredFieldsDescription"
              )}
            />
            <SwitchBlock
              name="prohibit_identifier_binding"
              label={translate("pages.settings.access.prohibitBindingTitle")}
              description={translate(
                "pages.settings.access.prohibitBindingDescription"
              )}
            />
            <SwitchBlock
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
                <Controller
                  control={control}
                  name={"registration_policy"}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <FormControlLabel
                        label={
                          <Typography className="text-14">
                            {translate(
                              "pages.settings.access.registrationDisabled"
                            )}
                          </Typography>
                        }
                        checked={value === ERegistrationPolicyTypes.disabled}
                        onClick={() =>
                          onChange(ERegistrationPolicyTypes.disabled)
                        }
                        control={<Radio disableRipple />}
                      />
                      <FormControlLabel
                        label={
                          <Typography className="text-14">
                            {translate(
                              "pages.settings.access.registrationAllowed"
                            )}
                          </Typography>
                        }
                        checked={value === ERegistrationPolicyTypes.allowed}
                        onClick={() =>
                          onChange(ERegistrationPolicyTypes.allowed)
                        }
                        control={<Radio disableRipple />}
                      />
                      <FormControlLabel
                        label={
                          <Typography className="text-14">
                            {translate(
                              "pages.settings.access.registrationAutoOnly"
                            )}
                          </Typography>
                        }
                        checked={
                          value ===
                          ERegistrationPolicyTypes.allowed_autoregistration_only
                        }
                        onClick={() =>
                          onChange(
                            ERegistrationPolicyTypes.allowed_autoregistration_only
                          )
                        }
                        control={<Radio disableRipple />}
                      />
                    </>
                  )}
                />
              </div>
            </div>
            <div className={styles.buttonWrapper}>
              <Button
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

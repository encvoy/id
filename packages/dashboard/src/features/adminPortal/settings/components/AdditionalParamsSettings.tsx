import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@mui/material/Button";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";
import {
  ISettings,
  useEditSettingsMutation,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import {
  getDirtyFieldsValues,
  isObjectEmpty,
  isUrl,
} from "src/shared/utils/helpers";
import { InputField } from "@encvoy-id/components";
import { MultiLanguageModalInputField } from "src/shared/ui/components/MultiLanguageModalInputField";
import { SwitchBlock } from "@encvoy-id/components";
import styles from "./AccessSettings.module.css";

export const AdditionalParamsSettings = () => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: dataSettings } = useGetSettingsQuery();
  const [editSettings, editSettingsResult] = useEditSettingsMutation();
  const schema = yup
    .object({
      manual_url: yup
        .string()
        .max(2000, translate("errors.valueMaxLength", { maxLength: 2000 }))
        .test(
          "is-url",
          translate("errors.invalidUrlFormat"),
          (value?: string) => {
            if (!value) return true;
            return isUrl(value);
          }
        ),
      prohibit_restore_deleted_users: yup
        .boolean()
        .required(translate("errors.requiredField")),
      delete_profile_after_days: yup
        .number()
        .transform((value, originalValue) => {
          if (originalValue === "" || originalValue === null) {
            return NaN;
          }

          return value;
        })
        .integer(translate("errors.integerMinMinusOne"))
        .min(-1, translate("errors.integerMinMinusOne"))
        .required(translate("errors.requiredField")),
    })
    .required();

  const methods = useForm<ISettings>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      copyright: dataSettings?.copyright || {},
      manual_url: dataSettings?.manual_url || "",
      prohibit_restore_deleted_users:
        dataSettings?.prohibit_restore_deleted_users ?? false,
      delete_profile_after_days: dataSettings?.delete_profile_after_days ?? 30,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const {
    reset,
    handleSubmit,
    formState: { dirtyFields, errors },
  } = methods;

  useEffect(() => {
    reset({
      copyright: dataSettings?.copyright || {},
      manual_url: dataSettings?.manual_url || "",
      prohibit_restore_deleted_users:
        dataSettings?.prohibit_restore_deleted_users ?? false,
      delete_profile_after_days: dataSettings?.delete_profile_after_days ?? 30,
    });
  }, [dataSettings, reset]);

  useEffect(() => {
    if (editSettingsResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    }
  }, [dispatch, editSettingsResult.isSuccess, translate]);

  const onSubmit: SubmitHandler<ISettings> = async (data) => {
    if (Object.keys(errors).length) return;

    const payload = getDirtyFieldsValues(data, dirtyFields);
    await editSettings(payload).unwrap();
  };

  return (
    <FormProvider {...methods}>
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        <MultiLanguageModalInputField
          name="copyright"
          label={translate("pages.settings.additionalParams.copyright")}
          description={translate(
            "pages.settings.additionalParams.copyrightDescription"
          )}
        />
        <InputField
          name="manual_url"
          label={translate("pages.settings.additionalParams.manualUrl")}
          description={translate(
            "pages.settings.additionalParams.manualUrlDescription",
            {
              helpLabel: translate("helperText.help"),
            }
          )}
        />
        <SwitchBlock
          name="prohibit_restore_deleted_users"
          label={translate(
            "pages.settings.additionalParams.prohibitRestoreDeletedUsers"
          )}
          description={translate(
            "pages.settings.additionalParams.prohibitRestoreDeletedUsersDescription"
          )}
        />
        <InputField
          name="delete_profile_after_days"
          type="number"
          label={translate(
            "pages.settings.additionalParams.deleteProfileAfterDays"
          )}
          description={translate(
            "pages.settings.additionalParams.deleteProfileAfterDaysDescription"
          )}
          inputProps={{ min: -1, step: 1 }}
        />
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
      </form>
    </FormProvider>
  );
};

export default AdditionalParamsSettings;

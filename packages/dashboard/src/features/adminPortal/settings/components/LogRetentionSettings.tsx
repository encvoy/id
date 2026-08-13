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
import { getDirtyFieldsValues, isObjectEmpty } from "src/shared/utils/helpers";
import { InputField } from "@encvoy-id/components";
import styles from "./AccessSettings.module.css";

export const LogRetentionSettings = () => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: dataSettings } = useGetSettingsQuery();
  const [editSettings, editSettingsResult] = useEditSettingsMutation();

  const schema = yup
    .object({
      log_retention_days: yup
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

  const methods = useForm<Pick<ISettings, "log_retention_days">>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      log_retention_days: dataSettings?.log_retention_days ?? 365,
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
      log_retention_days: dataSettings?.log_retention_days ?? 365,
    });
  }, [dataSettings, reset]);

  useEffect(() => {
    if (editSettingsResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
    }
  }, [dispatch, editSettingsResult.isSuccess, translate]);

  const onSubmit: SubmitHandler<Pick<ISettings, "log_retention_days">> = async (
    data
  ) => {
    if (Object.keys(errors).length) return;

    const payload = getDirtyFieldsValues(data, dirtyFields);
    await editSettings(payload).unwrap();
  };

  return (
    <FormProvider {...methods}>
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        <InputField
          name="log_retention_days"
          type="number"
          label={translate("pages.settings.logging.logRetentionDaysLabel")}
          description={translate(
            "pages.settings.logging.logRetentionDaysDescription"
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

export default LogRetentionSettings;

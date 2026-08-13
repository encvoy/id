import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  ISettings,
  useEditSettingsMutation,
  useGetProfileFieldsQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import styles from "./AccessSettings.module.css";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setNoticeInfo } from "src/shared/slices/noticesSlice";
import { useTranslation } from "react-i18next";
import { SystemLanguageSelect } from "src/shared/ui/components/SystemLanguageSelect";
import { TSystemLanguage } from "src/shared/utils/locales";

export const LocaleSettings = () => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: dataSettings } = useGetSettingsQuery();
  const [editSettings, editSettingsResult] = useEditSettingsMutation();
  const { refetch: refetchProfileFields } = useGetProfileFieldsQuery();

  const schema = yup
    .object({
      i18n: yup.object({
        default_language: yup
          .string()
          .required(translate("errors.requiredField")),
      }),
    })
    .required();

  const methods = useForm<ISettings>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      i18n: {
        default_language: dataSettings?.i18n?.default_language || "ru-RU",
      },
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const {
    control,
    resetField,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = methods;

  useEffect(() => {
    const lang = dataSettings?.i18n?.default_language;
    if (lang !== undefined) {
      resetField("i18n.default_language", { defaultValue: lang });
    }
  }, [dataSettings]);

  useEffect(() => {
    if (editSettingsResult.isSuccess) {
      dispatch(setNoticeInfo(translate("info.infoUpdated")));
      refetchProfileFields();
    }
  }, [editSettingsResult]);

  const onSubmit: SubmitHandler<ISettings> = async (data) => {
    if (Object.keys(errors).length) return;

    const payload: Partial<ISettings> = (
      Object.keys(dirtyFields) as Array<keyof typeof data>
    ).reduce(
      (acc, field) => ({ ...acc, [field]: data[field] }),
      {} as Partial<ISettings>
    );

    await editSettings(payload).unwrap();
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <Typography className="text-14">
        {translate("pages.settings.locale.title")}
      </Typography>
      <Controller
        control={control}
        name="i18n.default_language"
        defaultValue={dataSettings?.i18n?.default_language ?? "ru-RU"}
        render={({ field }) => (
          <SystemLanguageSelect
            className={styles.selectWrapper}
            dataTestId="ddl-settigs-locale-selection"
            dataId="locale-select"
            optionTestIdPrefix="btn-settigs-locale-language"
            value={
              (field.value ??
                dataSettings?.i18n?.default_language ??
                "ru-RU") as TSystemLanguage
            }
            onChange={field.onChange}
          />
        )}
      />
      <Typography className="text-12" color="text.secondary">
        {translate("pages.settings.locale.description")}
      </Typography>
      <div className={styles.buttonWrapper}>
        <Button
          data-test-id="btn-settings-locale-save"
          className={styles.saveButton}
          type="submit"
          variant="contained"
          disabled={dirtyFields?.i18n?.default_language ? false : true}
        >
          {translate("actionButtons.save")}
        </Button>
      </div>
    </form>
  );
};

export default LocaleSettings;

import { MenuItem, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  ISettings,
  useEditSettingsMutation,
  useGetEmailTemplatesQuery,
  useGetProfileFieldsQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import styles from "./AccessSettings.module.css";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import { useTranslation } from "react-i18next";
import Select from "@mui/material/Select";

export const LocaleSettings = () => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: dataSettings } = useGetSettingsQuery();
  const [editSettings, editSettingsResult] = useEditSettingsMutation();
  const { refetch: refetchProfileFields } = useGetProfileFieldsQuery();
  const { refetch: refetchTemplates } = useGetEmailTemplatesQuery();

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
      refetchTemplates();
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
          <Select
            ref={null}
            className={styles.selectWrapper}
            data-id="locale-select"
            value={
              field.value ?? dataSettings?.i18n?.default_language ?? "ru-RU"
            }
            onChange={(e) => {
              field.onChange((e as any).target.value);
            }}
          >
            <MenuItem className="custom-select" key={0} value={"en-US"}>
              {translate("pages.settings.locale.english")}
            </MenuItem>
            <MenuItem className="custom-select" key={1} value={"ru-RU"}>
              {translate("pages.settings.locale.russian")}
            </MenuItem>
            <MenuItem className="custom-select" key={1} value={"fr-FR"}>
              {translate("pages.settings.locale.french")}
            </MenuItem>
            <MenuItem className="custom-select" key={1} value={"es-ES"}>
              {translate("pages.settings.locale.spanish")}
            </MenuItem>
            <MenuItem className="custom-select" key={1} value={"de-DE"}>
              {translate("pages.settings.locale.german")}
            </MenuItem>
            <MenuItem className="custom-select" key={1} value={"it-IT"}>
              {translate("pages.settings.locale.italian")}
            </MenuItem>
          </Select>
        )}
      />
      <Typography className="text-12" color="text.secondary">
        {translate("pages.settings.locale.description")}
      </Typography>
      <div className={styles.buttonWrapper}>
        <Button
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

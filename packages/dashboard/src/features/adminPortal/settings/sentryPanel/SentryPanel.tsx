import { Switch, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import {
  ISentry,
  useGetSentryQuery,
  useUpdateSentryMutation,
} from "../../../../shared/api/sentry";
import styles from "./SentryPanel.module.css";
import { InputField } from "src/shared/ui/components/InputBlock";

interface ISentryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SentryPanel: FC<ISentryPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: sentryData } = useGetSentryQuery();
  const [updateSentry] = useUpdateSentryMutation();

  const methods = useForm<ISentry>({
    defaultValues: {
      dsn: null,
      user_id: "",
      enabled: false,
    },
  });

  const { handleSubmit, control, reset } = methods;

  useEffect(() => {
    if (sentryData) {
      reset(sentryData);
    }
  }, [sentryData, reset, dispatch]);

  const onSubmit = async (data: ISentry) => {
    try {
      await updateSentry(data).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to save the sentry:", error);
      dispatch(setNoticeError(translate("info.saveError")));
    }
  };

  return (
    <SidePanel
      onClose={onClose}
      isOpen={isOpen}
      title={translate("panel.sentry.title")}
      description={translate("panel.sentry.description")}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className={styles.container}>
        <FormProvider {...methods}>
          <InputField
            name="dsn"
            label={translate("panel.sentry.dsnLabel")}
            required
            description={translate("panel.sentry.dsnDescription")}
          />

          <Box className={styles.switchWrapper}>
            <Typography className={clsx("text-14", styles.label)}>
              {translate("panel.sentry.enabledLabel")}
            </Typography>
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </Box>

          <InputField
            name="user_id"
            label={translate("panel.sentry.userIdLabel")}
            required
            description={translate("panel.sentry.userIdDescription")}
          />
        </FormProvider>
      </div>
    </SidePanel>
  );
};

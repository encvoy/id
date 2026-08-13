import { Switch, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import clsx from 'clsx';
import { FC, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SidePanel } from '@encvoy-id/components';
import { setNoticeError } from 'src/shared/slices/noticesSlice';
import { ISentry, useGetSentryQuery, useUpdateSentryMutation } from '../../../../shared/api/sentry';
import styles from './SentryPanel.module.css';
import { InputField } from '@encvoy-id/components';

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
      user_id: '',
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
      console.error('Failed to save the sentry:', error);
      dispatch(setNoticeError(translate('info.saveError')));
    }
  };

  return (
    <SidePanel
      buttonSubmitText={translate('actionButtons.save')}
      customAdditionalText={translate('actionButtons.create')}
      cancelText={translate('actionButtons.cancel')}
      onClose={onClose}
      isOpen={isOpen}
      title={translate('panel.sentry.title')}
      description={translate('panel.sentry.description')}
      onSubmit={handleSubmit(onSubmit)}
      submitButtonDataTestId="btn-form-save"
      closeButtonDataTestId="btn-modal-close"
    >
      <div className={styles.container}>
        <FormProvider {...methods}>
          <InputField
            name="dsn"
            label={translate('panel.sentry.dsnLabel')}
            dataTestId="txt-settings-sentry-dsn"
            required
            description={translate('panel.sentry.dsnDescription')}
          />

          <Box className={styles.switchWrapper}>
            <Typography className={clsx('text-14', styles.label)}>
              {translate('panel.sentry.enabledLabel')}
            </Typography>
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  data-test-id="chk-settings-sentry-active"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </Box>

          <InputField
            name="user_id"
            label={translate('panel.sentry.userIdLabel')}
            dataTestId="txt-settings-sentry-user-id"
            required
            description={translate('panel.sentry.userIdDescription')}
          />
        </FormProvider>
      </div>
    </SidePanel>
  );
};

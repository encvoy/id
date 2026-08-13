import { Switch, Typography, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import clsx from 'clsx';
import { FC, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, Controller, FormProvider, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SidePanel } from '@encvoy-id/components';
import { setNoticeError } from 'src/shared/slices/noticesSlice';
import {
  IWinston,
  LogExportProvider,
  useGetWinstonQuery,
  useUpdateWinstonMutation,
} from '../../../../shared/api/winston';
import styles from './WinstonPanel.module.css';
import { InputField } from '@encvoy-id/components';

interface IWinstonPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WinstonPanel: FC<IWinstonPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const { data: winstonData } = useGetWinstonQuery();
  const [updateWinston] = useUpdateWinstonMutation();

  const methods = useForm<IWinston>({
    defaultValues: {
      enabled: true,
      export_enabled: false,
      export_provider: LogExportProvider.STDOUT,
      export_url: '',
      export_api_key: '',
      audit_export_enabled: false,
      redact_headers: 'authorization,cookie,set-cookie',
      service_name: 'backend',
      log_level: 'info',
    },
  });

  const { handleSubmit, control, reset } = methods;

  const exportEnabled = useWatch({ control, name: 'export_enabled' });

  useEffect(() => {
    if (winstonData) {
      reset({
        enabled: winstonData.enabled ?? true,
        export_enabled: winstonData.export_enabled ?? false,
        export_provider: winstonData.export_provider ?? LogExportProvider.STDOUT,
        export_url: winstonData.export_url ?? '',
        export_api_key: winstonData.export_api_key ?? '',
        audit_export_enabled: winstonData.audit_export_enabled ?? false,
        redact_headers: winstonData.redact_headers ?? 'authorization,cookie,set-cookie',
        service_name: winstonData.service_name ?? 'backend',
        log_level: winstonData.log_level ?? 'info',
      });
    }
  }, [winstonData, reset, dispatch]);

  const onSubmit = async (data: IWinston) => {
    try {
      await updateWinston(data).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to save the winston settings:', error);
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
      title={translate('panel.winston.title')}
      description={translate('panel.winston.description')}
      onSubmit={handleSubmit(onSubmit)}
      submitButtonDataTestId="btn-form-save"
      closeButtonDataTestId="btn-modal-close"
    >
      <div className={styles.container}>
        <FormProvider {...methods}>
          <Box className={styles.switchWrapper}>
            <Typography className={clsx('text-14', styles.label)}>
              {translate('panel.winston.exportEnabledLabel')}
            </Typography>
            <Controller
              name="export_enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  data-test-id="chk-settings-winston-export-enabled"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </Box>

          <InputField
            name="export_provider"
            label={translate('panel.winston.exportProviderLabel')}
            dataTestId="sel-settings-winston-export-provider"
            select
            description={translate('panel.winston.exportProviderDescription')}
          >
            <MenuItem value={LogExportProvider.LOKI}>Loki</MenuItem>
            <MenuItem value={LogExportProvider.HTTP}>HTTP</MenuItem>
            <MenuItem value={LogExportProvider.GRAYLOG}>Graylog</MenuItem>
            <MenuItem value={LogExportProvider.STDOUT}>Stdout</MenuItem>
          </InputField>

          <InputField
            name="export_url"
            label={translate('panel.winston.exportUrlLabel')}
            dataTestId="txt-settings-winston-export-url"
            required={exportEnabled}
            description={translate('panel.winston.exportUrlDescription')}
          />

          <InputField
            name="export_api_key"
            label={translate('panel.winston.exportApiKeyLabel')}
            dataTestId="txt-settings-winston-export-api-key"
            description={translate('panel.winston.exportApiKeyDescription')}
          />

          <Box className={styles.switchWrapper}>
            <Typography className={clsx('text-14', styles.label)}>
              {translate('panel.winston.auditExportEnabledLabel')}
            </Typography>
            <Controller
              name="audit_export_enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  data-test-id="chk-settings-winston-audit-export"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </Box>

          <InputField
            name="service_name"
            label={translate('panel.winston.serviceNameLabel')}
            dataTestId="txt-settings-winston-service-name"
            description={translate('panel.winston.serviceNameDescription')}
          />

          <InputField
            name="log_level"
            label={translate('panel.winston.logLevelLabel')}
            dataTestId="txt-settings-winston-log-level"
            required
            description={translate('panel.winston.logLevelDescription')}
          />

          <InputField
            name="redact_headers"
            label={translate('panel.winston.redactHeadersLabel')}
            dataTestId="txt-settings-winston-redact-headers"
            required
            description={translate('panel.winston.redactHeadersDescription')}
          />
        </FormProvider>
      </div>
    </SidePanel>
  );
};

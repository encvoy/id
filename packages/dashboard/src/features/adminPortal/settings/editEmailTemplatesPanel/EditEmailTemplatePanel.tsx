import { FormControl, MenuItem, Select, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { FC, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  IEmailTemplate,
  useGetProviderEmailTemplatesQuery,
  useUpdateProviderEmailTemplateMutation,
} from 'src/shared/api/provider';
import { useGetSettingsQuery } from 'src/shared/api/settings';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { InputField } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { isObjectEmpty } from 'src/shared/utils/helpers';
import { ViewEmailTemplate } from './ViewEmailTemplate';

interface IEditEmailTemplatePanelProps {
  clientId: string;
  providerId: string;
  isOpen: boolean;
  onClose: () => void;
  template?: IEmailTemplate;
}

export const EditEmailTemplatePanel: FC<IEditEmailTemplatePanelProps> = ({
  clientId,
  providerId,
  isOpen,
  onClose,
  template,
}) => {
  const { t: translate } = useTranslation();
  const templateAction = template?.action;
  const [selectedLocale, setSelectedLocale] = useState<string>('ru-RU');
  const { data: settings } = useGetSettingsQuery();
  const [editEmailTemplate] = useUpdateProviderEmailTemplateMutation();
  const { data: localeTemplates = [] } = useGetProviderEmailTemplatesQuery(
    {
      clientId,
      providerId,
      query: selectedLocale ? { locale: selectedLocale } : undefined,
    },
    { skip: !isOpen || !clientId || !providerId },
  );

  const methods = useForm<IEmailTemplate>({
    mode: 'all',
  });
  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    reset,
    register,
    setValue,
  } = methods;

  const watchContent = useWatch({
    control,
    name: 'content',
    defaultValue: '',
  });

  useEffect(() => {
    register('content');
  }, [register]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedLocale(template?.locale || settings?.i18n?.default_language || 'ru-RU');
  }, [isOpen, template?.locale, settings?.i18n?.default_language]);

  const selectedTemplate = useMemo(() => {
    if (!templateAction) return undefined;
    return localeTemplates.find((item) => item.action === templateAction);
  }, [localeTemplates, templateAction]);

  useEffect(() => {
    if (!isOpen) return;

    if (selectedTemplate) {
      reset(selectedTemplate);
      return;
    }

    if (template) {
      reset({
        ...template,
        locale: selectedLocale,
      });
    }
  }, [isOpen, selectedTemplate, template, selectedLocale, reset]);

  const handleSave = async (data: IEmailTemplate) => {
    // field id do not put body
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, action, ...body } = data;

    try {
      await editEmailTemplate({
        clientId,
        providerId,
        action: templateAction || action,
        body: {
          ...body,
          locale: selectedLocale,
        },
        query: { locale: selectedLocale },
      }).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to save the template:', error);
    }
  };

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={`${translate('panel.mailTemplate.edit.editTitle')} ${
          template ? `'${template.title}'` : ''
        }`}
        description={translate('panel.mailTemplate.edit.editDescription', {
          action: templateAction || '',
        })}
        isNoBackdrop
        onSubmit={handleSubmit(handleSave)}
        disabledButtonSubmit={isObjectEmpty(dirtyFields)}
        submitButtonDataTestId="btn-form-save"
        cancelButtonDataTestId="btn-form-cancel"
        closeButtonDataTestId="btn-modal-close"
      >
        <FormProvider {...methods}>
          <form>
            <Box sx={{ overflow: 'scroll', paddingRight: '6px' }}>
              <FormControl fullWidth size="small" sx={{ marginBottom: '20px' }}>
                <Typography sx={{ marginBottom: '8px' }} className={'text-14'}>
                  {translate('panel.mailTemplate.edit.languageLabel')}
                </Typography>
                <Select
                  labelId="template-locale-label"
                  value={selectedLocale}
                  inputProps={{
                    'data-test-id': 'ddl-settings-email-templates-language',
                  }}
                  onChange={(event) => setSelectedLocale(event.target.value as string)}
                >
                  <MenuItem value="en-US">{translate('pages.settings.locale.english')}</MenuItem>
                  <MenuItem value="ru-RU">{translate('pages.settings.locale.russian')}</MenuItem>
                  <MenuItem value="fr-FR">{translate('pages.settings.locale.french')}</MenuItem>
                  <MenuItem value="es-ES">{translate('pages.settings.locale.spanish')}</MenuItem>
                  <MenuItem value="de-DE">{translate('pages.settings.locale.german')}</MenuItem>
                  <MenuItem value="it-IT">{translate('pages.settings.locale.italian')}</MenuItem>
                </Select>
              </FormControl>

              <InputField
                label={translate('panel.mailTemplate.edit.titleLabel')}
                name="title"
                dataTestId="txt-settings-email-templates-name"
              />
              <InputField
                label={translate('panel.mailTemplate.edit.subjectLabel')}
                name="subject"
                dataTestId="txt-settings-email-templates-subject"
              />
              <Box sx={{ marginBottom: '20px' }}>
                <ViewEmailTemplate content={watchContent} />
              </Box>
              <Typography sx={{ marginBottom: '8px' }} className="text-14">
                {translate('panel.mailTemplate.edit.contentLabel')}
              </Typography>
              <Box sx={{ marginBottom: '20px' }}>
                <CodeMirror
                  value={watchContent || ''}
                  height="320px"
                  extensions={[html()]}
                  onChange={(value) => setValue('content', value, { shouldDirty: true })}
                  data-testid="txt-settings-email-templates-body"
                />
              </Box>
            </Box>
          </form>
        </FormProvider>
      </SidePanel>
    </>
  );
};

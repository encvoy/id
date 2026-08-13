import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IEmailTemplate, useGetProviderEmailTemplatesQuery } from 'src/shared/api/provider';
import { EEmailAction } from 'src/shared/utils/enums';
import { SidePanel } from '@encvoy-id/components';
import { EditEmailTemplatePanel } from './EditEmailTemplatePanel';
import { EmailTemplate } from './EmailTemplate';
import Box from '@mui/material/Box';

interface IListEmailTemplatesPanelProps {
  clientId: string;
  providerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ListEmailTemplatesPanel: FC<IListEmailTemplatesPanelProps> = ({
  clientId,
  providerId,
  isOpen,
  onClose,
}) => {
  const { t: translate } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<IEmailTemplate | undefined>(undefined);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const { data: templates = [] } = useGetProviderEmailTemplatesQuery(
    { clientId, providerId },
    { skip: !isOpen || !clientId || !providerId },
  );

  const getTemplateTestId = (template: IEmailTemplate) => {
    if (template.action === EEmailAction.account_create) {
      return 'btn-settings-email-templates-registration';
    }
    if (template.action === EEmailAction.confirmation_code) {
      return 'btn-settings-email-templates-confirmation-code';
    }
    if (template.action === EEmailAction.confirmation_link) {
      return 'btn-settings-email-templates-confirmation-link';
    }
    if (template.action === EEmailAction.password_change) {
      return 'btn-settings-email-templates-password-change';
    }
    if (template.action === EEmailAction.password_recover) {
      return 'btn-settings-email-templates-password-reset';
    }

    return 'btn-settings-email-templates-invitation';
  };

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        closeButtonDataTestId="btn-modal-close"
        onClose={onClose}
        isOpen={isOpen}
        title={translate('panel.mailTemplate.title')}
        description={translate('panel.mailTemplate.description')}
      >
        <Box sx={{ overflow: 'scroll', padding: '12px' }}>
          {templates.map((template) => (
            <EmailTemplate
              key={template.id}
              template={template}
              configureDataTestId={getTemplateTestId(template)}
              onClick={() => {
                setSelectedTemplate(template);
                setIsEditTemplateOpen(true);
              }}
            />
          ))}
        </Box>
      </SidePanel>

      <EditEmailTemplatePanel
        clientId={clientId}
        providerId={providerId}
        isOpen={isEditTemplateOpen}
        onClose={() => {
          setIsEditTemplateOpen(false);
          setSelectedTemplate(undefined);
        }}
        template={selectedTemplate}
      />
    </>
  );
};

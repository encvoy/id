import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidePanel } from '@encvoy-id/components';
import {
  IRuleValidation,
  useGetRuleValidationsByFieldNameQuery,
  useGetRuleValidationsQuery,
} from 'src/shared/api/settings';
import { EditRuleValidationPanel } from './EditRuleValidationPanel';
import { RuleValidation } from './RuleValidation';

interface IListRuleValidationsPanelProps {
  isOpen: boolean;
  fieldName: string;
  clientId: string;
  onClose: () => void;
  isNoBackdrop?: boolean;
}

export const ListRuleValidationsPanel: FC<IListRuleValidationsPanelProps> = ({
  isOpen,
  fieldName,
  clientId,
  onClose,
  isNoBackdrop = true,
}) => {
  const { t: translate } = useTranslation();
  const [ruleValidationModalOpen, setRuleValidationModalOpen] = useState(false);
  const [ruleValidationField, setRuleValidationField] = useState<IRuleValidation | undefined>(
    undefined,
  );
  const shouldLoadRules = isOpen && !!clientId;
  const shouldLoadFieldRules = shouldLoadRules && !!fieldName;

  const { data: ruleValidations = [] } = useGetRuleValidationsQuery(
    {
      client_id: clientId,
    },
    {
      skip: !shouldLoadRules,
    },
  );
  const { data: ruleValidationsField = [] } = useGetRuleValidationsByFieldNameQuery(
    {
      client_id: clientId,
      field_name: fieldName,
    },
    {
      skip: !shouldLoadFieldRules,
    },
  );

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={translate('panel.ruleValidation.title', { fieldName })}
        description={translate('panel.ruleValidation.description')}
        actionButtonDataTestId="btn-settings-user-profile-rule-create"
        closeButtonDataTestId="btn-modal-close"
        AdditionalAction={() => {
          setRuleValidationModalOpen(true);
          setRuleValidationField(undefined);
        }}
        isNoBackdrop={isNoBackdrop}
      >
        <div>
          {ruleValidations.map((ruleValidation) => (
            <RuleValidation
              key={ruleValidation.id}
              rule={ruleValidation}
              onEdit={() => {
                setRuleValidationField(ruleValidation);
                setRuleValidationModalOpen(true);
              }}
              checked={!!ruleValidationsField.find((f) => f.id === ruleValidation.id)}
              fieldName={fieldName}
              clientId={clientId}
            />
          ))}
        </div>
      </SidePanel>

      <EditRuleValidationPanel
        isOpen={ruleValidationModalOpen}
        onClose={() => {
          setRuleValidationField(undefined);
          setRuleValidationModalOpen(false);
        }}
        selectedRuleValidation={ruleValidationField}
        clientId={clientId}
      />
    </>
  );
};

import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import {
  IRuleValidation,
  useGetRuleValidationsByFieldNameQuery,
  useGetRuleValidationsQuery,
} from "src/shared/api/settings";
import { EditRuleValidationPanel } from "./EditRuleValidationPanel";
import { RuleValidation } from "./RuleValidation";

interface IListRuleValidationsPanelProps {
  isOpen: boolean;
  fieldName: string;
  onClose: () => void;
  isNoBackdrop?: boolean;
}

export const ListRuleValidationsPanel: FC<IListRuleValidationsPanelProps> = ({
  isOpen,
  fieldName,
  onClose,
  isNoBackdrop = true,
}) => {
  const { t: translate } = useTranslation();
  const [ruleValidationModalOpen, setRuleValidationModalOpen] = useState(false);
  const [ruleValidationField, setRuleValidationField] = useState<
    IRuleValidation | undefined
  >(undefined);

  const { data: ruleValidations = [] } = useGetRuleValidationsQuery();
  const { data: ruleValidationsField = [] } =
    useGetRuleValidationsByFieldNameQuery(fieldName);

  return (
    <>
      <SidePanel
        onClose={onClose}
        isOpen={isOpen}
        title={translate("panel.ruleValidation.title", { fieldName })}
        description={translate("panel.ruleValidation.description")}
        AdditionalAction={() => setRuleValidationModalOpen(true)}
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
              checked={
                !!ruleValidationsField.find((f) => f.id === ruleValidation.id)
              }
              fieldName={fieldName}
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
      />
    </>
  );
};

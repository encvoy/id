import { FC, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { InputField } from "src/shared/ui/components/InputBlock";
import { SwitchBlock } from "src/shared/ui/components/SwitchBlock";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { isObjectEmpty } from "src/shared/utils/helpers";
import {
  IRuleValidation,
  IRuleValidationData,
  useCreateRuleValidationMutation,
  useUpdateRuleValidationMutation,
} from "src/shared/api/settings";

interface IEditRuleValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRuleValidation?: IRuleValidation;
}

export const EditRuleValidationPanel: FC<IEditRuleValidationPanelProps> = ({
  isOpen,
  onClose,
  selectedRuleValidation,
}) => {
  const { t: translate } = useTranslation();
  const [createRuleValidation] = useCreateRuleValidationMutation();
  const [updateRuleValidation] = useUpdateRuleValidationMutation();

  const headerText = selectedRuleValidation
    ? translate("panel.ruleValidation.edit.editTitle")
    : translate("panel.ruleValidation.edit.createTitle");

  const methods = useForm<IRuleValidationData>({
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { dirtyFields },
    reset,
  } = methods;

  useEffect(() => {
    reset({
      title: selectedRuleValidation?.title || "",
      error: selectedRuleValidation?.error || "",
      regex: selectedRuleValidation?.regex || "",
      active: selectedRuleValidation?.active || false,
    });
  }, [selectedRuleValidation]);

  const onSubmit = async (data: IRuleValidationData) => {
    try {
      if (selectedRuleValidation) {
        await updateRuleValidation({
          id: selectedRuleValidation.id,
          body: data,
        }).unwrap();
      } else {
        await createRuleValidation(data).unwrap();
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SidePanel
      onClose={onClose}
      isOpen={isOpen}
      title={headerText}
      isNoBackdrop
      onSubmit={handleSubmit(onSubmit)}
      disabledButtonSubmit={isObjectEmpty(dirtyFields)}
    >
      <form>
        <FormProvider {...methods}>
          <InputField
            name="title"
            label={translate("panel.ruleValidation.edit.titleLabel")}
            description={translate(
              "panel.ruleValidation.edit.titleDescription"
            )}
          />
          <InputField
            name="error"
            label={translate("panel.ruleValidation.edit.errorLabel")}
            placeholder={translate(
              "panel.ruleValidation.edit.errorPlaceholder"
            )}
            description={translate(
              "panel.ruleValidation.edit.errorDescription"
            )}
          />
          <InputField
            name="regex"
            label={translate("panel.ruleValidation.edit.regexLabel")}
            placeholder={translate(
              "panel.ruleValidation.edit.regexPlaceholder"
            )}
            description={translate(
              "panel.ruleValidation.edit.regexDescription"
            )}
          />
          <SwitchBlock
            name="active"
            label={translate("panel.ruleValidation.edit.activeLabel")}
            description={translate(
              "panel.ruleValidation.edit.activeDescription"
            )}
          />
        </FormProvider>
      </form>
    </SidePanel>
  );
};

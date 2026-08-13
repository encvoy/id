import { yupResolver } from '@hookform/resolvers/yup';
import { FC, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  IRuleValidation,
  IRuleValidationData,
  useCreateRuleValidationMutation,
  useUpdateRuleValidationMutation,
} from 'src/shared/api/settings';
import { InputField } from '@encvoy-id/components';
import { MultiLanguageModalInputField } from 'src/shared/ui/components/MultiLanguageModalInputField';
import { SwitchBlock } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { getDirtyFieldsValues, isObjectEmpty } from 'src/shared/utils/helpers';
import {
  buildLocalizedTextSchema,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  TLocalizedText,
} from 'src/shared/utils/locales';
import * as yup from 'yup';

interface IEditRuleValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  selectedRuleValidation?: IRuleValidation;
}

type TRuleValidationFormValues = Omit<IRuleValidationData, 'title' | 'error'> & {
  title: TLocalizedText;
  error: TLocalizedText;
};

const getDefaultValues = (selectedRuleValidation?: IRuleValidation): TRuleValidationFormValues => ({
  active: selectedRuleValidation?.active ?? true,
  regex: selectedRuleValidation?.regex || '',
  title: getLocalizedTextMap(selectedRuleValidation?.title, DEFAULT_SYSTEM_LANGUAGE),
  error: getLocalizedTextMap(selectedRuleValidation?.error, DEFAULT_SYSTEM_LANGUAGE),
});

export const EditRuleValidationPanel: FC<IEditRuleValidationPanelProps> = ({
  isOpen,
  onClose,
  clientId,
  selectedRuleValidation,
}) => {
  const { t: translate } = useTranslation();
  const [createRuleValidation] = useCreateRuleValidationMutation();
  const [updateRuleValidation] = useUpdateRuleValidationMutation();

  const headerText = selectedRuleValidation
    ? translate('panel.ruleValidation.edit.editTitle')
    : translate('panel.ruleValidation.edit.createTitle');

  const schema = yup
    .object({
      title: buildLocalizedTextSchema({
        translate,
      }),
      error: buildLocalizedTextSchema({
        translate,
      }),
      regex: yup.string().required(translate('errors.requiredField')),
    })
    .required();

  const methods = useForm<TRuleValidationFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: getDefaultValues(selectedRuleValidation),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { dirtyFields },
    reset,
  } = methods;

  useEffect(() => {
    reset(getDefaultValues(selectedRuleValidation));
  }, [selectedRuleValidation, isOpen, reset]);

  const onSubmit = async (data: TRuleValidationFormValues) => {
    try {
      if (selectedRuleValidation) {
        const changedFields = getDirtyFieldsValues(data, dirtyFields);

        await updateRuleValidation({
          client_id: clientId,
          id: selectedRuleValidation.id,
          body: changedFields,
        }).unwrap();
      } else {
        await createRuleValidation({
          client_id: clientId,
          ...data,
        }).unwrap();
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SidePanel
      buttonSubmitText={translate('actionButtons.save')}
      customAdditionalText={translate('actionButtons.create')}
      cancelText={translate('actionButtons.cancel')}
      onClose={onClose}
      isOpen={isOpen}
      title={headerText}
      isNoBackdrop
      onSubmit={handleSubmit(onSubmit)}
      disabledButtonSubmit={isObjectEmpty(dirtyFields)}
      cancelButtonDataTestId="btn-form-cancel"
      submitButtonDataTestId="btn-form-save"
      closeButtonDataTestId="btn-modal-close"
    >
      <form>
        <FormProvider {...methods}>
          <MultiLanguageModalInputField
            dataTestId="txt-settings-user-profile-rule-name"
            name="title"
            label={translate('panel.ruleValidation.edit.titleLabel')}
            required
            description={translate('panel.ruleValidation.edit.titleDescription')}
          />
          <MultiLanguageModalInputField
            dataTestId="txt-settings-user-profile-rule-error"
            name="error"
            label={translate('panel.ruleValidation.edit.errorLabel')}
            required
            placeholder={translate('panel.ruleValidation.edit.errorPlaceholder')}
            description={translate('panel.ruleValidation.edit.errorDescription')}
          />
          <InputField
            dataTestId="txt-settings-user-profile-rule-regex"
            name="regex"
            label={translate('panel.ruleValidation.edit.regexLabel')}
            required
            placeholder={translate('panel.ruleValidation.edit.regexPlaceholder')}
            description={translate('panel.ruleValidation.edit.regexDescription')}
          />
          <SwitchBlock
            dataTestId="chk-settings-user-profile-rule-active"
            name="active"
            label={translate('panel.ruleValidation.edit.activeLabel')}
            description={translate('panel.ruleValidation.edit.activeDescription')}
          />
        </FormProvider>
      </form>
    </SidePanel>
  );
};

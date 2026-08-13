import { yupResolver } from '@hookform/resolvers/yup';
import { FC, useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  IClientType,
  useCreateClientTypeMutation,
  useUpdateClientTypeMutation,
} from 'src/shared/api/settings';
import { MultiLanguageModalInputField } from 'src/shared/ui/components/MultiLanguageModalInputField';
import { SidePanel } from '@encvoy-id/components';
import {
  buildLocalizedTextSchema,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  TLocalizedText,
} from 'src/shared/utils/locales';
import * as yup from 'yup';
import styles from './EditTypePanel.module.css';

interface IEditClientTypeProps {
  isOpen: boolean;
  onClose: () => void;
  type?: IClientType;
}

type TEditClientTypeFormValues = {
  name: TLocalizedText;
};

const getDefaultValues = (type?: IClientType): TEditClientTypeFormValues => ({
  name: getLocalizedTextMap(type?.name, DEFAULT_SYSTEM_LANGUAGE),
});

export const EditTypePanel: FC<IEditClientTypeProps> = ({ isOpen, onClose, type }) => {
  const { t: translate } = useTranslation();
  const [createClientType] = useCreateClientTypeMutation();
  const [updateClientType] = useUpdateClientTypeMutation();

  const schema = yup.object({
    name: buildLocalizedTextSchema({
      translate,
      maxLength: 50,
    }),
  });

  const methods = useForm<TEditClientTypeFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: getDefaultValues(type),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset(getDefaultValues(type));
  }, [isOpen, type]);

  const onSubmit: SubmitHandler<TEditClientTypeFormValues> = async (data) => {
    if (Object.keys(errors).length) return;

    if (type) {
      await updateClientType({
        id: type.id,
        body: { name: data.name },
      }).unwrap();
    } else {
      await createClientType({ name: data.name }).unwrap();
    }
    onClose();
  };

  const headerText = type
    ? translate('panel.types.edit.editTitle')
    : translate('panel.types.edit.createTitle');

  return (
    <>
      <SidePanel
        buttonSubmitText={translate('actionButtons.save')}
        customAdditionalText={translate('actionButtons.create')}
        cancelText={translate('actionButtons.cancel')}
        onClose={onClose}
        isOpen={isOpen}
        title={headerText}
        onSubmit={handleSubmit(onSubmit)}
        isNoBackdrop
        submitButtonDataTestId="btn-form-save"
        cancelButtonDataTestId="btn-form-cancel"
        closeButtonDataTestId="btn-modal-close"
      >
        <div className={styles.wrapper}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <MultiLanguageModalInputField
                label={translate('panel.types.edit.nameLabel')}
                name="name"
                dataTestId="txt-settings-app-types-group-name"
                description={translate('panel.types.edit.nameDescription')}
                required
              />
            </form>
          </FormProvider>
        </div>
      </SidePanel>
    </>
  );
};

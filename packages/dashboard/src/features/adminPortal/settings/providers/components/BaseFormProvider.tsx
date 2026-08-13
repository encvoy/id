import ContentPasteGoOutlinedIcon from '@mui/icons-material/ContentPasteGoOutlined';
import { ReactNode, useState } from 'react';
import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setNoticeError } from 'src/shared/slices/noticesSlice';
import { SubmitModal } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { handlePasteToForm, isObjectEmpty } from 'src/shared/utils/helpers';
import { buildLocalizedTextSchema } from 'src/shared/utils/locales';
import * as yup from 'yup';
import { ActionButtons } from '@encvoy-id/components';
import styles from './BaseFormProvider.module.css';

interface IFormProviderProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: (createChooseProvider?: boolean) => void;
  methods: UseFormReturn<T, object>;
  onSubmit: () => void;
  disabled: boolean;
  title?: string;
  mode?: 'create' | 'edit';
  type?: string;
  isNoBackdrop?: boolean;
  children?: ReactNode;
}

export const createProviderBaseSchema = (translate: (key: string, options?: any) => string) => ({
  name: buildLocalizedTextSchema({
    translate,
    maxLength: 50,
  }),
  description: yup.string().max(255, translate('errors.valueMaxLength', { maxLength: 255 })),
  is_public: yup.boolean(),
  default_public: yup.number().oneOf([0, 1, 2]),
});

/**
 * SharedFormProvider component manages the logic and state of provider forms.
 *
 * @component
 * @param isOpen - Flag indicating whether the panel is open
 * @param onClose - Function called when closing the panel. Optional parameter indicates if provider selection should be shown
 * @param methods - React Hook Form methods object for form management
 * @param onSubmit - Function called when form is submitted
 * @param title - Optional custom title for the panel. If not provided, title will be determined based on mode and type
 * @param mode - Mode of the form: 'create' or 'edit'
 * @param disabled - Flag indicating whether submit button should be disabled
 * @param type - Type of provider for create mode title
 * @param children - Form content to be rendered inside the provider
 */
export const BaseFormProvider = <T extends FieldValues>({
  isOpen,
  onClose,
  methods,
  onSubmit,
  disabled,
  title,
  type,
  mode = 'edit',
  isNoBackdrop,
  children,
}: IFormProviderProps<T>) => {
  const { t: translate } = useTranslation();

  const dispatch = useDispatch();
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const {
    formState: { dirtyFields },
  } = methods;

  const pasteFields = async () => {
    try {
      await handlePasteToForm(methods);
    } catch (err) {
      dispatch(setNoticeError(`${translate('info.pasteFields')}: ${err}`));
    }
  };

  const handleClose = () => {
    if (isObjectEmpty(dirtyFields)) onClose();
    else setSaveModalOpen(true);
  };

  const closeSaveModal = () => setSaveModalOpen(false);

  return (
    <SidePanel
      buttonSubmitText={translate('actionButtons.save')}
      cancelText={translate('actionButtons.cancel')}
      onClose={handleClose}
      isOpen={isOpen}
      title={
        title ||
        (mode === 'edit'
          ? translate('providers.editProvider.title')
          : translate('providers.createProvider.title', { type }))
      }
      isNoBackdrop={isNoBackdrop}
      closeButtonDataTestId="btn-modal-close"
      actionButtonDataTestId="btn-settings-paste"
      AdditionalAction={pasteFields}
      customAdditionalText={translate('toolTips.paste')}
      CustomAdditionalIcon={ContentPasteGoOutlinedIcon}
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <div className={styles.wrapper}>{children}</div>
          <ActionButtons
            cancelText={translate('actionButtons.cancel')}
            onCancel={handleClose}
            submitText={
              mode === 'edit' ? translate('actionButtons.save') : translate('actionButtons.create')
            }
            onSubmit={onSubmit}
            disabled={disabled}
            cancelButtonDataTestId="btn-form-cancel"
            submitButtonDataTestId="btn-form-save"
          />
        </form>
      </FormProvider>

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        title={translate('modals.unSavedChanges.title')}
        mainMessage={[translate('modals.unSavedChanges.mainMessage')]}
        actionButtonText={translate('actionButtons.continue')}
        isOpen={saveModalOpen}
        onSubmit={() => {
          setSaveModalOpen(false);
          onClose();
        }}
        onClose={closeSaveModal}
      />
    </SidePanel>
  );
};

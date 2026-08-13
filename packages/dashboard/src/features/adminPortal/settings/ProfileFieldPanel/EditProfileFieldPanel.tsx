import { yupResolver } from '@hookform/resolvers/yup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import { ChangeEvent, FC, useEffect, useState } from 'react';
import { FormProvider, type Resolver, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { EmailProvider } from 'src/features/adminPortal/settings/providers/editPanel/EmailProvider';
import { PhoneProvider } from 'src/features/adminPortal/settings/providers/editPanel/PhoneProvider';
import { ListRuleValidationsPanel } from 'src/features/adminPortal/settings/ruleValidationsPanel/ListRuleValidationsPanel';
import {
  IEmailParams,
  IPhoneParams,
  IProvider,
  useDeleteProviderMutation,
} from 'src/shared/api/provider';
import {
  ICreateProfileFieldPayload,
  IProfileField,
  useCreateProfileFieldMutation,
  useEditSettingsMutation,
  useGetRuleValidationsByFieldNameQuery,
  useGetSettingsQuery,
  useUpdateProfileFieldMutation,
} from 'src/shared/api/settings';
import { useGetMeInfoQuery } from 'src/shared/api/users';
import { IconsLibrary } from '@encvoy-id/components';
import { InputField } from '@encvoy-id/components';
import { MultiLanguageModalInputField } from 'src/shared/ui/components/MultiLanguageModalInputField';
import { SurfaceBlock } from '@encvoy-id/components';
import { SwitchBlock } from '@encvoy-id/components';
import { SubmitModal } from '@encvoy-id/components';
import { PublicStatusPopover } from 'src/shared/ui/PublicStatusPopover';
import { SidePanel } from '@encvoy-id/components';
import { EClaimPrivacy, RuleFieldNames } from 'src/shared/utils/enums';
import { getDirtyFieldsValues, getImageURL, isUrl } from 'src/shared/utils/helpers';
import {
  buildLocalizedTextSchema,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  getLocalizedTextValue,
} from 'src/shared/utils/locales';
import * as yup from 'yup';
import styles from './EditProfileFieldPanel.module.css';

interface IEditProfileFieldPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfile?: IProfileField;
  clientId?: string;
  phoneProvider?: IProvider<IPhoneParams>;
  emailProvider?: IProvider<IEmailParams>;
}

export const EditProfileFieldPanel: FC<IEditProfileFieldPanelProps> = ({
  isOpen,
  onClose,
  selectedProfile,
  clientId,
  phoneProvider,
  emailProvider,
}) => {
  const { t: translate, i18n } = useTranslation();
  const [createProfileField] = useCreateProfileFieldMutation();
  const [updateProfileField] = useUpdateProfileFieldMutation();
  const { data: dataSettings } = useGetSettingsQuery(undefined, {
    skip: selectedProfile?.field !== RuleFieldNames.agreement,
  });
  const [editSettings] = useEditSettingsMutation();
  const [deleteProvider] = useDeleteProviderMutation();
  const { appId = '', clientId: routeClientId = '' } = useParams<{
    appId: string;
    clientId: string;
  }>();
  const profileFieldClientId = clientId || routeClientId || appId;

  const [isEditRuleValidationsOpen, setIsEditRuleValidationsOpen] = useState(false);
  const [isPhoneProviderOpen, setIsPhoneProviderOpen] = useState(false);
  const [isEmailProviderOpen, setIsEmailProviderOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>('');
  const [fileUrlError, setUrlFileUrl] = useState('');
  const { refetch: getUser } = useGetMeInfoQuery();

  const headerText = !selectedProfile
    ? translate('panel.profileFields.createTitle')
    : translate('panel.profileFields.editTitle', {
        fieldName: getLocalizedTextValue(selectedProfile.title, i18n.language),
      });

  const { data: ruleValidations = [] } = useGetRuleValidationsByFieldNameQuery(
    {
      client_id: profileFieldClientId,
      field_name: selectedProfile?.field || '',
    },
    {
      skip: !profileFieldClientId || !selectedProfile?.field,
    },
  );
  const listTitleRuleValidations = selectedProfile
    ? ruleValidations
        .filter((item) => item.active)
        .map((item) => getLocalizedTextValue(item.title, i18n.language)) || []
    : [];

  const schema = yup.object({
    field: yup
      .string()
      .required(translate('errors.requiredField'))
      .matches(/^[a-zA-Z0-9]+(_[a-zA-Z0-9]+)*$/, translate('errors.invalidFieldNameFormat')),
    title: buildLocalizedTextSchema({
      translate,
    }),
    default: yup.string().optional(),
    mapping_vcard: yup.string().optional(),
    editable: yup.boolean().required(),
    required: yup.boolean().required(),
    unique: yup.boolean().required(),
    active: yup.boolean().required(),
    allowed_as_login: yup.boolean().optional(),
    validate_on_authorization: yup.boolean().optional(),
    claim: yup
      .mixed<EClaimPrivacy>()
      .oneOf(Object.values(EClaimPrivacy))
      .required(translate('errors.requiredField')),
    type: yup.mixed<IProfileField['type']>().oneOf(['general', 'custom']).required(),
    id: yup.string().optional(),
    organization_id: yup.string().nullable().optional(),
  });

  const resolver = yupResolver(schema) as unknown as Resolver<IProfileField>;

  const defaultProfileFieldValues: IProfileField = {
    type: 'custom',
    field: '',
    id: undefined,
    organization_id: undefined,
    title: getLocalizedTextMap(undefined, DEFAULT_SYSTEM_LANGUAGE),
    default: undefined,
    mapping_vcard: undefined,
    editable: false,
    required: false,
    unique: false,
    active: false,
    allowed_as_login: undefined,
    validate_on_authorization: false,
    claim: EClaimPrivacy.private,
  };

  const getProfileFieldFormValues = (profile?: IProfileField): IProfileField => {
    if (!profile) {
      return defaultProfileFieldValues;
    }

    return {
      ...defaultProfileFieldValues,
      ...profile,
      title: getLocalizedTextMap(profile.title, DEFAULT_SYSTEM_LANGUAGE),
    };
  };

  const methods = useForm<IProfileField>({
    resolver,
    defaultValues: getProfileFieldFormValues(selectedProfile),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    formState: { dirtyFields, errors },
    setValue,
    control,
  } = methods;

  const claimPrivacy = useWatch({
    control,
    name: 'claim',
  });

  useEffect(() => {
    if (selectedProfile) {
      reset(getProfileFieldFormValues(selectedProfile));
    } else {
      reset(getProfileFieldFormValues());
    }
    setFileUrl('');
  }, [selectedProfile, isOpen, reset]);

  useEffect(() => {
    getUser();
  }, [selectedProfile, createProfileField]);

  useEffect(() => {
    if (dataSettings) {
      setFileUrl(dataSettings?.data_processing_agreement);
    }
  }, [dataSettings]);

  const onSubmit = async (data: IProfileField) => {
    if (Object.keys(errors).length) return;
    const changedFields = getDirtyFieldsValues(data, dirtyFields);

    try {
      if (selectedProfile?.field === RuleFieldNames.agreement) {
        const validUrl = isUrl(fileUrl);
        if (!validUrl) {
          setUrlFileUrl(translate('errors.invalidUrlFormat'));
          return;
        }
        editSettings({
          data_processing_agreement: fileUrl ? fileUrl?.trim() : null,
        });
      }

      if (selectedProfile) {
        await updateProfileField({
          field_name: selectedProfile.field,
          body: {
            ...changedFields,
            ...(profileFieldClientId ? { client_id: profileFieldClientId } : {}),
          },
        }).unwrap();
      } else {
        const createPayload = {
          ...data,
          ...(profileFieldClientId ? { client_id: profileFieldClientId } : {}),
        } as Partial<IProfileField>;
        delete createPayload.type;
        delete createPayload.allowed_as_login;

        await createProfileField(createPayload as ICreateProfileFieldPayload).unwrap();
      }

      onClose();
    } catch (error) {
      console.error('Error updating profile field', error);
    }
  };

  const handleDeleteProvider = async (providerId?: string) => {
    await deleteProvider({
      clientId: profileFieldClientId,
      providerId: providerId || '',
    });
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrlFileUrl('');
    setFileUrl(event.target.value);
  };

  return (
    <SidePanel
      buttonSubmitText={translate('actionButtons.save')}
      customAdditionalText={translate('actionButtons.create')}
      cancelText={translate('actionButtons.cancel')}
      onClose={() => onClose()}
      isOpen={isOpen}
      title={headerText}
      closeButtonDataTestId="btn-modal-close"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className={styles.wrapper}>
        <FormProvider {...methods}>
          <InputField
            dataTestId="txt-settings-user-profile-field-name"
            label={translate('panel.profileFields.labels.field')}
            name="field"
            required
            disabled={selectedProfile?.type === 'general'}
            description={translate('panel.profileFields.descriptions.field')}
          />

          <MultiLanguageModalInputField
            dataTestId="txt-settings-user-profile-field-description"
            label={translate('panel.profileFields.labels.title')}
            name="title"
            required
            disabled={selectedProfile?.type === 'general'}
            description={translate('panel.profileFields.descriptions.title')}
          />

          <SwitchBlock
            dataTestId="chk-settings-user-profile-field-activity"
            name="active"
            label={translate('panel.profileFields.labels.active')}
            disabled={selectedProfile && selectedProfile?.type !== 'custom'}
          />
          <Divider />
          <Typography sx={{ mb: '8px', mt: '32px' }} className="text-17">
            {translate('panel.profileFields.labels.parameters')}
          </Typography>
          <Typography sx={{ mb: '16px' }} className="text-14" color="text.secondary">
            {translate('panel.profileFields.labels.parametersDescription')}
          </Typography>
          <div>
            <SwitchBlock
              dataTestId="chk-settings-user-profile-field-editability"
              name="editable"
              label={translate('panel.profileFields.labels.editable')}
              disabled={
                selectedProfile?.field === RuleFieldNames.agreement ||
                selectedProfile?.field === RuleFieldNames.password
              }
            />
            <SwitchBlock
              dataTestId="chk-settings-user-profile-field-mandatory"
              name="required"
              label={translate('panel.profileFields.labels.required')}
              onChange={(value) => {
                if (value) {
                  setValue('editable', value, { shouldDirty: true });
                } else {
                  setValue('allowed_as_login', false, {
                    shouldDirty: true,
                  });
                }
              }}
              disabled={selectedProfile?.field === RuleFieldNames.picture}
            />
            <SwitchBlock
              dataTestId="chk-settings-user-profile-field-unique"
              name="unique"
              label={translate('panel.profileFields.labels.unique')}
              onChange={(value) => {
                if (!value) {
                  setValue('allowed_as_login', false, {
                    shouldDirty: true,
                  });
                }
              }}
              disabled={selectedProfile?.type !== 'custom' && selectedProfile?.field !== 'email'}
            />
            {selectedProfile &&
              ['login', 'email', 'phone_number'].includes(selectedProfile.field) && (
                <SwitchBlock
                  name="allowed_as_login"
                  label={translate('panel.profileFields.labels.allowedAsLogin')}
                  dataTestId="chk-settings-user-profile-field-login-use"
                  onChange={(value) => {
                    if (selectedProfile?.field === 'email') {
                      setValue('unique', value, {
                        shouldDirty: value,
                      });
                    }
                    if (value) {
                      setValue('required', value, { shouldDirty: true });
                      setValue('editable', value, { shouldDirty: true });
                    }
                  }}
                />
              )}
            {selectedProfile?.field === 'email' && (
              <SwitchBlock
                dataTestId="chk-settings-user-profile-field-validate-on-authorization"
                name="validate_on_authorization"
                label={translate('panel.profileFields.labels.validateOnAuthorization')}
                description={translate(
                  'panel.profileFields.labels.validateOnAuthorizationDescription',
                )}
                onChange={(value) => {
                  if (value) {
                    setValue('editable', true, { shouldDirty: true });
                  }
                }}
              />
            )}
            <Box className={styles.fieldRow}>
              <Box>
                <Typography className={clsx('text-14', styles['info-item-value'])}>
                  {translate('panel.profileFields.labels.public')}
                </Typography>
                <Typography className="text-14" color="text.secondary">
                  {translate('panel.profileFields.labels.publicDescription')}
                </Typography>
              </Box>
              <PublicStatusPopover
                dataTestId="btn-settings-user-profile-settings-available"
                claimPrivacy={claimPrivacy}
                setStatus={(value) =>
                  setValue('claim', value as EClaimPrivacy, {
                    shouldDirty: true,
                  })
                }
                disabled={!selectedProfile || selectedProfile.field === RuleFieldNames.password}
              />
            </Box>
            {(selectedProfile?.type === 'custom' || !selectedProfile) && (
              <InputField
                dataTestId="txt-settings-user-profile-field-vcard"
                label={translate('panel.profileFields.labels.vcardAttribute')}
                name="mapping_vcard"
                disabled={selectedProfile?.type === 'general'}
                description={translate('panel.profileFields.labels.vcardDescription')}
                placeholder={translate('panel.profileFields.labels.vcardPlaceholder')}
              />
            )}
            {(selectedProfile?.type === 'custom' || !selectedProfile) && (
              <InputField
                dataTestId="txt-settings-user-profile-field-default"
                label={translate('panel.profileFields.labels.defaultValue')}
                name="default"
                description={translate('panel.profileFields.labels.defaultDescription')}
                placeholder={translate('panel.profileFields.labels.defaultPlaceholder')}
              />
            )}
          </div>
          {selectedProfile?.field === 'phone_number' && (
            <ProviderCard
              title={translate('panel.profileFields.labels.phoneProviderTitle')}
              provider={phoneProvider}
              onAddClick={() => setIsPhoneProviderOpen(true)}
              onDeleteClick={() => setIsModalDeleteOpen(true)}
              type="phone"
            />
          )}
          {selectedProfile?.field === 'email' && (
            <ProviderCard
              title={translate('panel.profileFields.labels.emailProviderTitle')}
              provider={emailProvider}
              onAddClick={() => setIsEmailProviderOpen(true)}
              onDeleteClick={() => setIsModalDeleteOpen(true)}
              type="email"
            />
          )}

          {![RuleFieldNames.agreement, RuleFieldNames.birthdate, RuleFieldNames.picture].includes(
            selectedProfile?.field as RuleFieldNames,
          ) && (
            <>
              <Box className={styles.fieldRowTitle}>
                <Typography className="text-14">
                  {translate('panel.profileFields.labels.validationRules')}
                </Typography>
                <Button
                  data-test-id="btn-settings-user-profile-field-settings-rule"
                  variant="text"
                  onClick={() => setIsEditRuleValidationsOpen(true)}
                  disabled={!selectedProfile}
                >
                  {translate('actionButtons.configure')}
                </Button>
              </Box>
              <TextField
                placeholder={translate('panel.profileFields.labels.validationRulesPlaceholder')}
                value={listTitleRuleValidations ? listTitleRuleValidations.join(', ') : undefined}
                disabled={true}
                fullWidth
                variant="standard"
                className="custom"
              />
            </>
          )}

          {selectedProfile?.field === RuleFieldNames.agreement && (
            <Box className={styles.agreement}>
              <Typography sx={{ mb: '8px' }} className="text-14">
                {translate('panel.profileFields.labels.agreementLink')}
              </Typography>
              <TextField
                placeholder={translate('panel.profileFields.labels.agreementPlaceholder')}
                value={fileUrl}
                onChange={handleUrlChange}
                className="custom"
                fullWidth
                variant="standard"
                error={!!fileUrlError}
                helperText={fileUrlError}
              />
            </Box>
          )}
        </FormProvider>
      </div>

      <ListRuleValidationsPanel
        onClose={() => setIsEditRuleValidationsOpen(false)}
        fieldName={selectedProfile?.field || ''}
        clientId={profileFieldClientId}
        isOpen={isEditRuleValidationsOpen}
      />

      <PhoneProvider
        isOpen={isPhoneProviderOpen}
        onClose={() => setIsPhoneProviderOpen(false)}
        provider={phoneProvider}
      />
      <EmailProvider
        isOpen={isEmailProviderOpen}
        onClose={() => setIsEmailProviderOpen(false)}
        provider={emailProvider as IProvider<IEmailParams>}
      />

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={isModalDeleteOpen}
        onSubmit={() => {
          handleDeleteProvider(emailProvider?.id || phoneProvider?.id);
          setIsModalDeleteOpen(false);
        }}
        onClose={() => setIsModalDeleteOpen(false)}
        title={translate('panel.profileFields.modals.deleteProvider.title')}
        mainMessage={[translate('panel.profileFields.modals.deleteProvider.message')]}
      />
    </SidePanel>
  );
};
const ProviderCard: FC<{
  title: string;
  provider?: IProvider<IPhoneParams | IEmailParams>;
  onAddClick: () => void;
  onDeleteClick: () => void;
  type: 'email' | 'phone';
}> = ({ title, provider, onAddClick, onDeleteClick, type }) => {
  const { t: translate } = useTranslation();
  return (
    <Box sx={{ marginBottom: '32px' }}>
      <Box className={styles.fieldRowTitle}>
        <Typography className="text-14">{title}</Typography>
        {!provider && (
          <Button
            variant="text"
            onClick={onAddClick}
            data-test-id="btn-settings-user-profile-field-provider-add"
          >
            {translate('actionButtons.add')}
          </Button>
        )}
      </Box>
      {provider && (
        <SurfaceBlock
          data-id={`${type}-provider-card`}
          className={styles.provider}
          onClick={onAddClick}
        >
          <Avatar src={getImageURL(provider.avatar)} className={styles.providerIcon} />
          <Typography className={clsx('text-14', styles.providerName)}>
            {type === 'email'
              ? (provider?.params as IEmailParams)?.root_mail
              : (provider?.params as IPhoneParams)?.issuer}
          </Typography>
          <div className={styles.actions}>
            <Button
              variant="text"
              onClick={onAddClick}
              data-test-id="btn-settings-user-profile-field-provider-setting"
            >
              {translate('actionButtons.configure')}
            </Button>
            <IconsLibrary
              title={translate('toolTips.delete')}
              type="delete"
              onClick={onDeleteClick}
              dataTestId="btn-settings-user-profile-field-provider-delete"
            />
          </div>
        </SurfaceBlock>
      )}
    </Box>
  );
};

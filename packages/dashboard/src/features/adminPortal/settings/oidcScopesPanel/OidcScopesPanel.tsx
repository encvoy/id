import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import { Box, Button, Chip, List, ListItem, MenuItem, Select, Typography } from '@mui/material';
import {
  CSSProperties,
  ElementType,
  FC,
  ReactNode,
  Ref,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  EGetProviderAction,
  IEmailParams,
  IPhoneParams,
  IProvider,
  EProviderType,
  useGetProvidersQuery,
} from 'src/shared/api/provider';
import {
  IOidcScopeGroup,
  IProfileField,
  TOidcScopeText,
  useBindOidcScopeFieldMutation,
  useCreateOidcScopeMutation,
  useDeleteOidcScopeMutation,
  useDeleteOidcScopeFieldMutation,
  useDeleteProfileFieldMutation,
  useGetOidcScopesQuery,
  useGetProfileFieldsQuery,
  useUpdateOidcScopeMutation,
} from 'src/shared/api/settings';
import { setNoticeError, setNoticeInfo } from 'src/shared/slices/noticesSlice';
import { EClaimPrivacy } from 'src/shared/utils/enums';
import {
  buildLocalizedTextSchema,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  getLocalizedTextValue,
  TLocalizedText,
} from 'src/shared/utils/locales';
import { EditProfileFieldPanel } from '../ProfileFieldPanel/EditProfileFieldPanel';
import { IconsLibrary } from '@encvoy-id/components';
import { IconWithTooltip } from '@encvoy-id/components';
import { InputField } from '@encvoy-id/components';
import { MultiLanguageModalInputField } from 'src/shared/ui/components/MultiLanguageModalInputField';
import { SurfaceBlock } from '@encvoy-id/components';
import { SwitchBlock } from '@encvoy-id/components';
import { SubmitModal } from '@encvoy-id/components';
import { SidePanel } from '@encvoy-id/components';
import { SvgIconProps } from '@mui/material/SvgIcon';
import * as yup from 'yup';

type TOidcScopeForm = {
  name: string;
  icon: string;
  title: TLocalizedText;
  description: TLocalizedText;
  active: boolean;
};

const SCOPE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;

const OIDC_SCOPE_ICON_OPTIONS: Array<{
  value: string;
  labelKey: string;
  Icon: ElementType<SvgIconProps>;
}> = [
  {
    value: 'BadgeOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.badge',
    Icon: BadgeOutlinedIcon,
  },
  {
    value: 'WorkOutlineOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.work',
    Icon: WorkOutlineOutlinedIcon,
  },
  {
    value: 'GroupsOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.groups',
    Icon: GroupsOutlinedIcon,
  },
  {
    value: 'SecurityOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.security',
    Icon: SecurityOutlinedIcon,
  },
  {
    value: 'KeyOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.key',
    Icon: KeyOutlinedIcon,
  },
  {
    value: 'FactCheckOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.checklist',
    Icon: FactCheckOutlinedIcon,
  },
  {
    value: 'AccountTreeOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.structure',
    Icon: AccountTreeOutlinedIcon,
  },
  {
    value: 'CategoryOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.category',
    Icon: CategoryOutlinedIcon,
  },
  {
    value: 'SettingsOutlined',
    labelKey: 'pages.settings.oidcScopes.iconOptions.settings',
    Icon: SettingsOutlinedIcon,
  },
];

const getIconOption = (icon?: string | null) =>
  OIDC_SCOPE_ICON_OPTIONS.find((option) => option.value === icon);

const getScopeText = (value: TOidcScopeText | null | undefined, language: string) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[language] || value[language.split('-')[0]] || value.ru || value.en || '';
};

const getScopeInitialValues = (
  scope?: IOidcScopeGroup,
  language: string = DEFAULT_SYSTEM_LANGUAGE,
): TOidcScopeForm => ({
  name: scope?.name || '',
  icon: scope?.icon || OIDC_SCOPE_ICON_OPTIONS[0].value,
  title: getLocalizedTextMap(scope?.title, language),
  description: getLocalizedTextMap(scope?.description, language),
  active: scope?.active ?? true,
});

interface IEditOidcScopePanelProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  scope?: IOidcScopeGroup;
}

const EditOidcScopePanel: FC<IEditOidcScopePanelProps> = ({ clientId, isOpen, onClose, scope }) => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [createOidcScope, createState] = useCreateOidcScopeMutation();
  const [updateOidcScope, updateState] = useUpdateOidcScopeMutation();
  const schema = yup
    .object({
      name: yup.string().required(translate('errors.requiredField')),
      title: buildLocalizedTextSchema({
        translate,
      }),
      description: buildLocalizedTextSchema({
        translate,
        required: false,
      }),
    })
    .required();
  const methods = useForm<TOidcScopeForm>({
    resolver: yupResolver(schema) as any,
    defaultValues: getScopeInitialValues(undefined, i18n.language),
    mode: 'onBlur',
  });
  const { control, handleSubmit, reset, setError } = methods;

  useEffect(() => {
    reset(getScopeInitialValues(scope, i18n.language));
  }, [i18n.language, reset, scope, isOpen]);

  const validate = (data: TOidcScopeForm) => {
    let valid = true;

    if (!data.name.trim()) {
      setError('name', { message: translate('errors.requiredField') });
      valid = false;
    } else if (!SCOPE_NAME_PATTERN.test(data.name.trim())) {
      setError('name', {
        message: translate('pages.settings.oidcScopes.validation.scopeName'),
      });
      valid = false;
    }

    return valid;
  };

  const onSubmit: SubmitHandler<TOidcScopeForm> = async (data) => {
    if (!validate(data)) {
      return;
    }

    const payload = {
      client_id: clientId,
      name: data.name.trim(),
      icon: data.icon || null,
      title: data.title,
      description: Object.values(data.description || {}).some((value) => value?.trim())
        ? data.description
        : null,
      active: data.active,
    };

    try {
      if (scope) {
        await updateOidcScope({ ...payload, id: scope.id }).unwrap();
      } else {
        await createOidcScope(payload).unwrap();
      }
      dispatch(setNoticeInfo(translate('info.infoUpdated')));
      onClose();
    } catch (error) {
      console.error('saveOidcScopeError', error);
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  return (
    <SidePanel
      buttonSubmitText={translate('actionButtons.save')}
      customAdditionalText={translate('actionButtons.create')}
      cancelText={translate('actionButtons.cancel')}
      onClose={onClose}
      isOpen={isOpen}
      title={translate(
        scope
          ? 'pages.settings.oidcScopes.editor.editTitle'
          : 'pages.settings.oidcScopes.editor.createTitle',
      )}
      description={translate('pages.settings.oidcScopes.editor.description')}
      onSubmit={handleSubmit(onSubmit)}
      disabledButtonSubmit={createState.isLoading || updateState.isLoading}
      submitButtonDataTestId="btn-oidc-scope-save"
      closeButtonDataTestId="btn-oidc-scope-close"
    >
      <Box sx={{ padding: '0 24px 24px' }}>
        <FormProvider {...methods}>
          <InputField
            name="name"
            label={translate('pages.settings.oidcScopes.labels.scope')}
            required
            disabled={Boolean(scope)}
            description={translate('pages.settings.oidcScopes.descriptions.scope')}
            dataTestId="txt-oidc-scope-name"
          />
          <MultiLanguageModalInputField
            name="title"
            label={translate('pages.settings.oidcScopes.labels.title')}
            required
            description={translate('pages.settings.oidcScopes.descriptions.title')}
            dataTestId="txt-oidc-scope-title"
          />
          <MultiLanguageModalInputField
            name="description"
            label={translate('pages.settings.oidcScopes.labels.description')}
            description={translate('pages.settings.oidcScopes.descriptions.description')}
            dataTestId="txt-oidc-scope-description"
          />

          <Typography className="text-14" sx={{ marginBottom: '8px' }}>
            {translate('pages.settings.oidcScopes.labels.icon')}
          </Typography>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <Select<string>
                fullWidth
                variant="standard"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                sx={{ marginBottom: '32px' }}
                data-test-id="slc-oidc-scope-icon"
              >
                {OIDC_SCOPE_ICON_OPTIONS.map(({ value, labelKey, Icon }) => (
                  <MenuItem key={value} value={value}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <Icon fontSize="small" color="action" />
                      {translate(labelKey)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
          />

          <SwitchBlock
            name="active"
            label={translate('pages.settings.oidcScopes.labels.active')}
            dataTestId="swt-oidc-scope-active"
          />
        </FormProvider>
      </Box>
    </SidePanel>
  );
};

const PROFILE_SCOPE_DROP_ID = 'profile';
const getScopeDropId = (scopeId: string) => `scope:${scopeId}`;
const parseScopeDropId = (dropId: string) => {
  if (dropId === PROFILE_SCOPE_DROP_ID) {
    return null;
  }

  if (!dropId.startsWith('scope:')) {
    return undefined;
  }

  return dropId.slice('scope:'.length);
};

type TOidcScopeBoardField = {
  id: string;
  field: string;
  title: string;
  active: boolean;
  scopeId: string | null;
  editable: boolean;
  required: boolean;
  unique: boolean;
  claim: EClaimPrivacy;
  allowed_as_login?: boolean;
};

type TOidcScopeFieldCardProps = {
  field: TOidcScopeBoardField;
  rootRef?: Ref<HTMLDivElement>;
  rootStyle?: CSSProperties;
  dragHandle?: ReactNode;
  onClick?: () => void;
  actions?: ReactNode;
};

const OidcScopeFieldCard: FC<TOidcScopeFieldCardProps> = ({
  field,
  rootRef,
  rootStyle,
  dragHandle,
  onClick,
  actions,
}) => {
  const { t: translate } = useTranslation();
  let claimText = translate('privacy.private.title');
  let claimIcon = LockOutlinedIcon;

  switch (field.claim) {
    case EClaimPrivacy.request:
      claimText = translate('privacy.publicOauth.title');
      claimIcon = LockOpenOutlinedIcon;
      break;
    case EClaimPrivacy.public:
      claimText = translate('privacy.publicGravatar.title');
      claimIcon = PublicOutlinedIcon;
      break;
    default:
      break;
  }

  return (
    <SurfaceBlock
      boxRef={rootRef}
      style={rootStyle}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        gap: '12px',
        alignItems: 'center',
        padding: '12px',
        opacity: field.active ? 1 : 0.7,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        {dragHandle}
      </Box>
      <Box
        sx={{
          minWidth: 0,
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
      >
        <Typography className="text-14">{field.title}</Typography>
        <Typography className="text-12" color="text.secondary">
          {field.field}
          {!field.active ? translate('pages.settings.oidcScopes.status.inactiveSuffix') : ''}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {!field.active && (
          <IconWithTooltip
            title={translate('toolTips.notActive')}
            Icon={VisibilityOffOutlinedIcon}
            hideHovered
          />
        )}
        {field.allowed_as_login && (
          <IconsLibrary title={translate('toolTips.id')} type="id" hideHovered />
        )}
        {field.unique && (
          <IconsLibrary title={translate('toolTips.unique')} type="unique" hideHovered />
        )}
        {field.editable && (
          <IconsLibrary title={translate('toolTips.penFilled')} type="penFilled" hideHovered />
        )}
        {field.required && (
          <IconsLibrary type="required" title={translate('toolTips.required')} hideHovered />
        )}
        <IconWithTooltip title={claimText} Icon={claimIcon} hideHovered />
        {actions}
      </Box>
    </SurfaceBlock>
  );
};

const DraggableOidcScopeFieldCard: FC<{
  field: TOidcScopeBoardField;
  disabled?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}> = ({ field, disabled = false, onClick, onDelete }) => {
  const { t: translate } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: { field },
    disabled,
  });

  return (
    <OidcScopeFieldCard
      field={field}
      rootRef={setNodeRef}
      rootStyle={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.45 : undefined,
      }}
      onClick={onClick}
      actions={
        <>
          <IconsLibrary
            title={translate('toolTips.edit')}
            type="edit"
            dataTestId={`btn-oidc-scope-field-edit-${field.field}`}
            onClick={(event) => {
              event?.stopPropagation();
              onClick?.();
            }}
          />
          {onDelete && (
            <IconsLibrary
              title={translate('toolTips.delete')}
              type="delete"
              dataTestId={`btn-oidc-scope-field-delete-${field.field}`}
              onClick={(event) => {
                event?.stopPropagation();
                onDelete();
              }}
            />
          )}
        </>
      }
      dragHandle={
        <DragIndicatorIcon
          sx={{
            cursor: disabled ? 'default' : 'grab',
          }}
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
        />
      }
    />
  );
};

const OidcScopeDropZone: FC<{
  dropId: string;
  title: string;
  subtitle: string;
  fields: TOidcScopeBoardField[];
  emptyText: string;
  disabled?: boolean;
  Icon?: ElementType<SvgIconProps>;
  onEdit?: () => void;
  onDelete?: () => void;
  onFieldClick?: (field: TOidcScopeBoardField) => void;
  onFieldDelete?: (field: TOidcScopeBoardField) => void;
  movingFieldId?: string | null;
}> = ({
  dropId,
  title,
  subtitle,
  fields,
  emptyText,
  disabled = false,
  Icon,
  onEdit,
  onDelete,
  onFieldClick,
  onFieldDelete,
  movingFieldId,
}) => {
  const { t: translate } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    disabled,
  });

  return (
    <SurfaceBlock
      boxRef={setNodeRef}
      sx={{
        padding: '16px',
        display: 'grid',
        gap: '12px',
        minHeight: '152px',
        borderColor: isOver ? 'secondary.main' : 'divider',
        backgroundColor: isOver ? 'action.hover' : undefined,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {Icon ? <Icon color="action" /> : <BadgeOutlinedIcon color="action" />}
        <Box sx={{ minWidth: 0 }}>
          <Typography className="text-15">{title}</Typography>
          <Typography className="text-12" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        {(onEdit || onDelete) && (
          <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {onEdit && (
              <IconsLibrary
                title={translate('toolTips.edit')}
                type="edit"
                dataTestId={`btn-oidc-scope-edit-${title}`}
                onClick={(event) => {
                  event?.stopPropagation();
                  onEdit();
                }}
              />
            )}
            {onDelete && (
              <IconsLibrary
                title={translate('toolTips.delete')}
                type="delete"
                dataTestId={`btn-oidc-scope-delete-${title}`}
                onClick={(event) => {
                  event?.stopPropagation();
                  onDelete();
                }}
              />
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'grid', gap: '8px' }}>
        {fields.map((field) => (
          <DraggableOidcScopeFieldCard
            key={field.id}
            field={field}
            disabled={Boolean(movingFieldId)}
            onClick={onFieldClick ? () => onFieldClick(field) : undefined}
            onDelete={onFieldDelete ? () => onFieldDelete(field) : undefined}
          />
        ))}
        {!fields.length && (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: isOver ? 'secondary.main' : 'divider',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <Typography className="text-14" color="text.secondary">
              {emptyText}
            </Typography>
          </Box>
        )}
      </Box>
    </SurfaceBlock>
  );
};

interface IOidcScopesPanelProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const OidcScopesPanel: FC<IOidcScopesPanelProps> = ({ clientId, isOpen, onClose }) => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { data: scopes = [] } = useGetOidcScopesQuery(clientId, {
    skip: !isOpen || !clientId,
  });
  const [deleteOidcScope, deleteState] = useDeleteOidcScopeMutation();
  const [selectedScope, setSelectedScope] = useState<IOidcScopeGroup | undefined>();
  const [scopeToDelete, setScopeToDelete] = useState<IOidcScopeGroup | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const openCreate = () => {
    setSelectedScope(undefined);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setSelectedScope(undefined);
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    if (!scopeToDelete) {
      return;
    }

    try {
      await deleteOidcScope({
        client_id: clientId,
        id: scopeToDelete.id,
      }).unwrap();
      dispatch(setNoticeInfo(translate('info.infoUpdated')));
      setScopeToDelete(undefined);
    } catch (error) {
      console.error('deleteOidcScopeError', error);
      dispatch(setNoticeError(translate('info.updateError')));
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
        title={translate('pages.settings.oidcScopes.panel.title')}
        description={translate('pages.settings.oidcScopes.panel.description')}
        actionButtonDataTestId="btn-oidc-scope-create"
        closeButtonDataTestId="btn-oidc-scopes-close"
        AdditionalAction={openCreate}
      >
        <List sx={{ padding: '0 24px 24px', display: 'grid', gap: '12px' }}>
          {scopes.map((scope) => {
            const iconOption = getIconOption(scope.icon);
            const Icon = iconOption?.Icon || ErrorOutlineOutlinedIcon;
            const title = getScopeText(scope.title, i18n.language) || scope.name;
            const description = getScopeText(scope.description, i18n.language);

            return (
              <ListItem
                key={scope.id}
                disablePadding
                onClick={() => {
                  setSelectedScope(scope);
                  setIsEditOpen(true);
                }}
              >
                <SurfaceBlock
                  sx={{
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <Icon color="action" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography className="text-15">{title}</Typography>
                      <Typography className="text-14" color="text.secondary">
                        {scope.name}
                      </Typography>
                    </Box>
                    <IconsLibrary
                      title={translate('toolTips.delete')}
                      type="delete"
                      dataTestId={`btn-oidc-scope-delete-${scope.name}`}
                      onClick={(event) => {
                        event?.stopPropagation();
                        setScopeToDelete(scope);
                      }}
                    />
                  </Box>
                  {description && (
                    <Typography className="text-14" color="text.secondary">
                      {description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {scope.fields.map((field) => (
                      <Chip
                        key={field.profile_field_id}
                        size="small"
                        label={getLocalizedTextValue(field.title, i18n.language) || field.field}
                      />
                    ))}
                    {!scope.fields.length && (
                      <Typography className="text-14" color="text.secondary">
                        {translate('pages.settings.oidcScopes.empty.noFields')}
                      </Typography>
                    )}
                  </Box>
                </SurfaceBlock>
              </ListItem>
            );
          })}
          {!scopes.length && (
            <Typography color="text.secondary">
              {translate('pages.settings.oidcScopes.empty.noScopesYet')}
            </Typography>
          )}
        </List>
      </SidePanel>

      <EditOidcScopePanel
        clientId={clientId}
        isOpen={isEditOpen}
        onClose={closeEdit}
        scope={selectedScope}
      />

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={Boolean(scopeToDelete)}
        onSubmit={handleDelete}
        onClose={() => setScopeToDelete(undefined)}
        title={translate('pages.settings.oidcScopes.modals.deleteTitle')}
        mainMessage={[
          translate('pages.settings.oidcScopes.modals.deleteMessage', {
            name: scopeToDelete?.name || '',
          }),
        ]}
        actionButtonText={translate('actionButtons.delete')}
        submitButtonDataTestId="btn-oidc-scope-delete-confirm"
        disabled={deleteState.isLoading}
      />
    </>
  );
};

interface IOidcScopesSettingsProps {
  clientId: string;
}

export const OidcScopesSettings: FC<IOidcScopesSettingsProps> = ({ clientId }) => {
  const { t: translate, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { appId = '' } = useParams<{ appId?: string }>();
  const ownerScopeClientId = appId || clientId;
  const { data: scopes = [] } = useGetOidcScopesQuery(clientId, {
    skip: !clientId,
  });
  const { data: profileFields = [] } = useGetProfileFieldsQuery(
    clientId ? { client_id: clientId } : undefined,
    { skip: !clientId },
  );
  const { data: providers = [] } = useGetProvidersQuery(
    {
      client_id: clientId,
      query: {
        action: EGetProviderAction.all,
      },
    },
    { skip: !clientId },
  );
  const [bindOidcScopeField] = useBindOidcScopeFieldMutation();
  const [deleteOidcScopeField] = useDeleteOidcScopeFieldMutation();
  const [deleteProfileField] = useDeleteProfileFieldMutation();
  const [deleteOidcScope, deleteState] = useDeleteOidcScopeMutation();
  const [selectedScope, setSelectedScope] = useState<IOidcScopeGroup | undefined>();
  const [scopeToDelete, setScopeToDelete] = useState<IOidcScopeGroup | undefined>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProfileField, setSelectedProfileField] = useState<IProfileField | undefined>(
    undefined,
  );
  const [isProfileFieldPanelOpen, setIsProfileFieldPanelOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<TOidcScopeBoardField | null>(null);
  const [phoneProvider, setPhoneProvider] = useState<IProvider<IPhoneParams> | undefined>(
    undefined,
  );
  const [emailProvider, setEmailProvider] = useState<IProvider<IEmailParams> | undefined>(
    undefined,
  );
  const [activeField, setActiveField] = useState<TOidcScopeBoardField | null>(null);
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const customProfileFields = useMemo(
    () =>
      profileFields
        .filter(
          (field): field is IProfileField & { id: string } =>
            field.type === 'custom' &&
            Boolean(field.id) &&
            field.organization_id === ownerScopeClientId,
        )
        .sort((a, b) =>
          getLocalizedTextValue(a.title, i18n.language).localeCompare(
            getLocalizedTextValue(b.title, i18n.language),
            i18n.language,
          ),
        ),
    [i18n.language, ownerScopeClientId, profileFields],
  );

  const customProfileFieldsById = useMemo(
    () => new Map(customProfileFields.map((field) => [field.id, field])),
    [customProfileFields],
  );

  useEffect(() => {
    if (!providers.length) {
      return;
    }

    if (selectedProfileField?.field === 'phone_number') {
      const provider = providers.find((item) => item.type === EProviderType.PHONE);
      setPhoneProvider(
        provider && provider.type === EProviderType.PHONE
          ? (provider as IProvider<IPhoneParams>)
          : undefined,
      );
    }

    if (selectedProfileField?.field === 'email') {
      const provider = providers.find((item) => item.type === EProviderType.EMAIL);
      setEmailProvider(
        provider && provider.type === EProviderType.EMAIL
          ? (provider as IProvider<IEmailParams>)
          : undefined,
      );
    }
  }, [providers, selectedProfileField]);

  const scopeFieldsByScopeId = useMemo(() => {
    const map = new Map<string, TOidcScopeBoardField[]>();

    scopes.forEach((scope) => {
      const fields = scope.fields
        .map((field) => {
          const profileField = customProfileFieldsById.get(field.profile_field_id);

          return {
            id: field.profile_field_id,
            field: field.field,
            title: getLocalizedTextValue(field.title, i18n.language) || field.field,
            active: field.active,
            scopeId: scope.id,
            editable: profileField?.editable ?? false,
            required: profileField?.required ?? false,
            unique: profileField?.unique ?? false,
            claim: profileField?.claim ?? EClaimPrivacy.private,
            allowed_as_login: profileField?.allowed_as_login,
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title, i18n.language));

      map.set(scope.id, fields);
    });

    return map;
  }, [customProfileFieldsById, i18n.language, scopes]);

  const boundFieldIds = useMemo(() => {
    const ids = new Set<string>();

    scopeFieldsByScopeId.forEach((fields) => {
      fields.forEach((field) => {
        ids.add(field.id);
      });
    });

    return ids;
  }, [scopeFieldsByScopeId]);

  const profileScopeFields = useMemo(
    () =>
      customProfileFields
        .filter((field) => !boundFieldIds.has(field.id))
        .map((field) => ({
          id: field.id,
          field: field.field,
          title: getLocalizedTextValue(field.title, i18n.language) || field.field,
          active: field.active,
          scopeId: null,
          editable: field.editable,
          required: field.required,
          unique: field.unique,
          claim: field.claim,
          allowed_as_login: field.allowed_as_login,
        })),
    [boundFieldIds, customProfileFields, i18n.language],
  );

  const openCreate = () => {
    setSelectedScope(undefined);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setSelectedScope(undefined);
    setIsEditOpen(false);
  };

  const openCreateField = () => {
    setSelectedProfileField(undefined);
    setIsProfileFieldPanelOpen(true);
  };

  const openEditField = (field: TOidcScopeBoardField) => {
    const selectedField = customProfileFields.find((item) => item.id === field.id);
    if (!selectedField) {
      return;
    }

    setSelectedProfileField(selectedField);
    setIsProfileFieldPanelOpen(true);
  };

  const handleDeleteField = async () => {
    if (!fieldToDelete) {
      return;
    }

    try {
      await deleteProfileField({
        field_name: fieldToDelete.field,
        client_id: clientId,
      }).unwrap();
      dispatch(setNoticeInfo(translate('info.infoUpdated')));
      setFieldToDelete(null);
    } catch (error) {
      console.error('deleteProfileFieldError', error);
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  const handleDelete = async () => {
    if (!scopeToDelete) {
      return;
    }

    try {
      await deleteOidcScope({
        client_id: clientId,
        id: scopeToDelete.id,
      }).unwrap();
      dispatch(setNoticeInfo(translate('info.infoUpdated')));
      setScopeToDelete(undefined);
    } catch (error) {
      console.error('deleteOidcScopeError', error);
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  const moveFieldToScope = async (field: TOidcScopeBoardField, targetScopeId: string | null) => {
    if (field.scopeId === targetScopeId) {
      return;
    }

    setMovingFieldId(field.id);

    try {
      if (field.scopeId) {
        await deleteOidcScopeField({
          client_id: clientId,
          scope_id: field.scopeId,
          profile_field_id: field.id,
        }).unwrap();
      }

      if (targetScopeId) {
        try {
          await bindOidcScopeField({
            client_id: clientId,
            scope_id: targetScopeId,
            profile_field_id: field.id,
          }).unwrap();
        } catch (error) {
          if (field.scopeId) {
            try {
              await bindOidcScopeField({
                client_id: clientId,
                scope_id: field.scopeId,
                profile_field_id: field.id,
              }).unwrap();
            } catch (rollbackError) {
              console.error('rollbackOidcScopeFieldError', rollbackError);
            }
          }

          throw error;
        }
      }

      dispatch(setNoticeInfo(translate('info.infoUpdated')));
    } catch (error) {
      console.error('moveOidcScopeFieldError', error);
      dispatch(setNoticeError(translate('info.updateError')));
    } finally {
      setMovingFieldId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const nextActiveField = event.active.data.current?.field;

    if (!nextActiveField) {
      return;
    }

    setActiveField(nextActiveField as TOidcScopeBoardField);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const dragField = event.active.data.current?.field as TOidcScopeBoardField | undefined;
    const rawDropId = typeof event.over?.id === 'string' ? event.over.id : undefined;

    setActiveField(null);

    if (!dragField || !rawDropId) {
      return;
    }

    const targetScopeId = parseScopeDropId(rawDropId);

    if (targetScopeId === undefined) {
      return;
    }

    await moveFieldToScope(dragField, targetScopeId);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <Box>
          <Typography className="title-medium" sx={{ marginBottom: '8px' }}>
            {translate('pages.settings.requiredFields.customFields')}
          </Typography>
          <Typography className="text-14" color="text.secondary">
            {translate('pages.settings.profileFieldsSubtitle')}
          </Typography>
        </Box>
        <Button
          variant="text"
          onClick={openCreateField}
          data-test-id="btn-settings-user-profile-field-add"
        >
          {translate('actionButtons.add')}
        </Button>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: 'grid', gap: '12px' }}>
          <OidcScopeDropZone
            dropId={PROFILE_SCOPE_DROP_ID}
            title="profile"
            subtitle={translate('pages.settings.oidcScopes.dropZones.profile.subtitle')}
            fields={profileScopeFields}
            emptyText={translate('pages.settings.oidcScopes.dropZones.profile.empty')}
            Icon={BadgeOutlinedIcon}
            movingFieldId={movingFieldId}
            onFieldClick={openEditField}
            onFieldDelete={(field) => setFieldToDelete(field)}
          />

          {scopes.map((scope) => {
            const iconOption = getIconOption(scope.icon);
            const Icon = iconOption?.Icon || ErrorOutlineOutlinedIcon;
            const title = getScopeText(scope.title, i18n.language) || scope.name;
            const description = getScopeText(scope.description, i18n.language);

            return (
              <OidcScopeDropZone
                key={scope.id}
                dropId={getScopeDropId(scope.id)}
                title={title}
                subtitle={
                  description && description !== title
                    ? `${scope.name} - ${description}`
                    : scope.name
                }
                fields={scopeFieldsByScopeId.get(scope.id) || []}
                emptyText={translate('pages.settings.oidcScopes.dropZones.scope.empty')}
                Icon={Icon}
                movingFieldId={movingFieldId}
                onEdit={() => {
                  setSelectedScope(scope);
                  setIsEditOpen(true);
                }}
                onDelete={() => setScopeToDelete(scope)}
                onFieldClick={openEditField}
                onFieldDelete={(field) => setFieldToDelete(field)}
              />
            );
          })}

          {!scopes.length && (
            <Typography color="text.secondary">
              {translate('pages.settings.oidcScopes.empty.noGroupsYet')}
            </Typography>
          )}

          <Button
            variant="outlined"
            color="secondary"
            onClick={openCreate}
            data-test-id="btn-oidc-scope-create"
            sx={{ justifySelf: 'start' }}
          >
            {translate('pages.settings.oidcScopes.actions.addGroup')}
          </Button>
        </Box>

        <DragOverlay>
          {activeField ? (
            <Box sx={{ width: '100%', maxWidth: '420px', opacity: 0.9 }}>
              <OidcScopeFieldCard
                field={activeField}
                dragHandle={
                  <DragIndicatorIcon
                    sx={{
                      color: 'text.secondary',
                    }}
                  />
                }
              />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      <EditOidcScopePanel
        clientId={clientId}
        isOpen={isEditOpen}
        onClose={closeEdit}
        scope={selectedScope}
      />

      <EditProfileFieldPanel
        onClose={() => {
          setIsProfileFieldPanelOpen(false);
          setSelectedProfileField(undefined);
        }}
        isOpen={isProfileFieldPanelOpen}
        selectedProfile={selectedProfileField}
        clientId={clientId}
        phoneProvider={phoneProvider}
        emailProvider={emailProvider}
      />

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={Boolean(scopeToDelete)}
        onSubmit={handleDelete}
        onClose={() => setScopeToDelete(undefined)}
        title={translate('pages.settings.oidcScopes.modals.deleteTitle')}
        mainMessage={[
          translate('pages.settings.oidcScopes.modals.deleteMessage', {
            name: scopeToDelete?.name || '',
          }),
        ]}
        actionButtonText={translate('actionButtons.delete')}
        submitButtonDataTestId="btn-oidc-scope-delete-confirm"
        disabled={deleteState.isLoading}
      />

      <SubmitModal
        cancelText={translate('actionButtons.cancel')}
        deleteText={translate('actionButtons.delete')}
        isOpen={Boolean(fieldToDelete)}
        onSubmit={handleDeleteField}
        onClose={() => setFieldToDelete(null)}
        title={translate('pages.settings.oidcScopes.modals.deleteFieldTitle')}
        mainMessage={[
          translate('pages.settings.oidcScopes.modals.deleteFieldMessage', {
            name: fieldToDelete?.title || '',
          }),
        ]}
        actionButtonText={translate('actionButtons.delete')}
        submitButtonDataTestId="btn-oidc-scope-field-delete-confirm"
      />
    </>
  );
};

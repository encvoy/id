import { yupResolver } from '@hookform/resolvers/yup';
import {
  Autocomplete,
  Box,
  MenuItem,
  Select,
  TextField,
  Typography,
  debounce,
} from '@mui/material';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  ICreateNotificationPayload,
  INotificationListItem,
  NotificationTargetType,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
} from 'src/shared/api/notifications';
import {
  IUserAutocompleteOption,
  useLazyGetClientAutocompleteUsersQuery,
} from 'src/shared/api/users';
import { setNoticeError } from 'src/shared/slices/noticesSlice';
import { Chip } from '@encvoy-id/components';
import { MultiLanguageModalInputField } from 'src/shared/ui/components/MultiLanguageModalInputField';
import { SidePanel } from '@encvoy-id/components';
import { Order } from 'src/shared/utils/enums';
import {
  buildLocalizedTextSchema,
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextMap,
  TLocalizedText,
} from 'src/shared/utils/locales';
import {
  getUserAutocompletePrimaryLabel,
  getUserAutocompleteSecondaryLabel,
} from 'src/shared/utils/userAutocomplete';
import * as yup from 'yup';

type TUserOption = IUserAutocompleteOption;
type TDebouncedAutocompleteSearch = {
  (value: string): void;
  clear: () => void;
};

const AUTOCOMPLETE_LIMIT = 50;

type TFormValues = {
  title: TLocalizedText;
  content: TLocalizedText;
  target: NotificationTargetType;
  user_ids: TUserOption[];
};

const createFallbackUserOption = (id: string): TUserOption => ({
  id,
});

const mergeSelectedUsers = (selectedUsers: TUserOption[], userOptions: TUserOption[]) => {
  const optionsMap = new Map(userOptions.map((option) => [option.id, option]));

  return selectedUsers.map((selectedUser) => {
    return optionsMap.get(selectedUser.id) || selectedUser;
  });
};

const targetDataTestIdMap: Record<NotificationTargetType, string> = {
  [NotificationTargetType.ALL]: 'btn-notice-all-users',
  [NotificationTargetType.NEW_USERS]: 'btn-notice-new-users',
  [NotificationTargetType.EXISTING_USERS]: 'btn-notice-existing-users',
  [NotificationTargetType.USER_LIST]: 'btn-notice-users-list',
};

interface ICreateNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  notification?: INotificationListItem;
}

export const CreateNotificationPanel: FC<ICreateNotificationPanelProps> = ({
  isOpen,
  onClose,
  clientId,
  notification,
}) => {
  const { t: translate } = useTranslation();
  const dispatch = useDispatch();
  const [getAutocompleteUsers, { isFetching: isUsersAutocompleteLoading }] =
    useLazyGetClientAutocompleteUsersQuery();
  const [userOptions, setUserOptions] = useState<TUserOption[]>([]);
  const [userSearchValue, setUserSearchValue] = useState('');
  const [createNotification] = useCreateNotificationMutation();
  const [updateNotification] = useUpdateNotificationMutation();
  const usersClientId = clientId;
  const autocompleteUsersTriggerRef = useRef(getAutocompleteUsers);
  const activeUserSearchRequestRef = useRef<ReturnType<typeof getAutocompleteUsers> | null>(null);
  const activeHydrationRequestRef = useRef<ReturnType<typeof getAutocompleteUsers> | null>(null);
  const debouncedUserSearchRef = useRef<TDebouncedAutocompleteSearch | null>(null);

  const schema = useMemo(
    () =>
      yup.object({
        title: buildLocalizedTextSchema({
          translate,
          maxLength: 255,
          fallbackLocale: DEFAULT_SYSTEM_LANGUAGE,
        }),
        content: buildLocalizedTextSchema({
          translate,
          maxLength: 5000,
          fallbackLocale: DEFAULT_SYSTEM_LANGUAGE,
        }),
        target: yup
          .mixed<NotificationTargetType>()
          .oneOf(Object.values(NotificationTargetType))
          .required(translate('errors.requiredField')),
        user_ids: yup
          .array()
          .of(
            yup.object({
              id: yup.string().required(),
            }),
          )
          .when('target', {
            is: NotificationTargetType.USER_LIST,
            then: (value) => value.min(1, translate('errors.requiredField')).required(),
            otherwise: (value) => value.default([]),
          }),
      }),
    [translate],
  );

  const methods = useForm<TFormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: getLocalizedTextMap(undefined, DEFAULT_SYSTEM_LANGUAGE),
      content: getLocalizedTextMap(undefined, DEFAULT_SYSTEM_LANGUAGE),
      target: NotificationTargetType.ALL,
      user_ids: [],
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  const selectedTarget = useWatch({ control, name: 'target' });

  const resetUsersAutocompleteState = useCallback(() => {
    activeUserSearchRequestRef.current?.abort();
    activeUserSearchRequestRef.current = null;
    debouncedUserSearchRef.current?.clear();
    setUserSearchValue('');
    setUserOptions([]);
  }, []);

  const requestAutocompleteUsers = useCallback(
    async (rawSearch: string) => {
      const search = rawSearch.trim();

      if (!usersClientId || !search) {
        resetUsersAutocompleteState();
        return;
      }

      activeUserSearchRequestRef.current?.abort();

      const request = autocompleteUsersTriggerRef.current({
        client_id: usersClientId,
        limit: AUTOCOMPLETE_LIMIT,
        offset: 0,
        search,
        sortBy: 'login',
        sortDirection: Order.ASC,
      });

      activeUserSearchRequestRef.current = request;

      try {
        const data = await request.unwrap();

        if (activeUserSearchRequestRef.current !== request) {
          return;
        }

        setUserOptions(data.items);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error(error);
        setUserOptions([]);
        dispatch(setNoticeError(translate('info.updateError')));
      } finally {
        if (activeUserSearchRequestRef.current === request) {
          activeUserSearchRequestRef.current = null;
        }
      }
    },
    [dispatch, resetUsersAutocompleteState, translate, usersClientId],
  );

  const hydrateSelectedUsers = useCallback(
    async (userIds: string[]) => {
      if (!usersClientId || !userIds.length) {
        return;
      }

      activeHydrationRequestRef.current?.abort();

      const request = autocompleteUsersTriggerRef.current({
        client_id: usersClientId,
        user_ids: userIds,
      });

      activeHydrationRequestRef.current = request;

      try {
        const data = await request.unwrap();

        if (activeHydrationRequestRef.current !== request) {
          return;
        }

        setValue(
          'user_ids',
          mergeSelectedUsers(
            userIds.map((id) => createFallbackUserOption(id)),
            data.items,
          ),
        );
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error(error);
        dispatch(setNoticeError(translate('info.updateError')));
      } finally {
        if (activeHydrationRequestRef.current === request) {
          activeHydrationRequestRef.current = null;
        }
      }
    },
    [dispatch, setValue, translate, usersClientId],
  );

  useEffect(() => {
    autocompleteUsersTriggerRef.current = getAutocompleteUsers;
  }, [getAutocompleteUsers]);

  useEffect(() => {
    const debouncedAutocompleteSearch = debounce((value: string) => {
      void requestAutocompleteUsers(value);
    }, 300);

    debouncedUserSearchRef.current = debouncedAutocompleteSearch;

    return () => {
      debouncedAutocompleteSearch.clear();
      activeUserSearchRequestRef.current?.abort();
      activeHydrationRequestRef.current?.abort();
    };
  }, [requestAutocompleteUsers]);

  useEffect(() => {
    if (!isOpen) {
      resetUsersAutocompleteState();
      activeHydrationRequestRef.current?.abort();
      activeHydrationRequestRef.current = null;
      return;
    }

    const selectedUsers = notification?.user_ids.map((id) => createFallbackUserOption(id)) || [];

    reset({
      title: getLocalizedTextMap(notification?.title, DEFAULT_SYSTEM_LANGUAGE),
      content: getLocalizedTextMap(notification?.content, DEFAULT_SYSTEM_LANGUAGE),
      target: notification?.target || NotificationTargetType.ALL,
      user_ids: selectedUsers,
    });
    resetUsersAutocompleteState();

    if (notification?.target === NotificationTargetType.USER_LIST && notification.user_ids.length) {
      void hydrateSelectedUsers(notification.user_ids);
    }
  }, [hydrateSelectedUsers, isOpen, notification, reset, usersClientId]);

  useEffect(() => {
    if (selectedTarget !== NotificationTargetType.USER_LIST) {
      setValue('user_ids', []);
      resetUsersAutocompleteState();
    }
  }, [resetUsersAutocompleteState, selectedTarget, setValue]);

  const onSubmit: SubmitHandler<TFormValues> = async (data) => {
    if (Object.keys(errors).length) return;

    const payload: ICreateNotificationPayload = {
      title: data.title,
      content: data.content,
      target: data.target,
      user_ids: data.user_ids.map((item) => item.id),
    };

    try {
      if (notification) {
        await updateNotification({
          id: notification.id,
          clientId,
          body: payload,
        }).unwrap();
      } else {
        await createNotification({ clientId, body: payload }).unwrap();
      }
      onClose();
    } catch (error) {
      console.error(error);
      dispatch(setNoticeError(translate('info.updateError')));
    }
  };

  const headerText = notification
    ? translate('panel.notifications.edit.editTitle')
    : translate('panel.notifications.edit.createTitle');

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
      submitButtonDataTestId="btn-form-save"
      cancelButtonDataTestId="btn-form-cancel"
    >
      <Box sx={{ padding: '0 24px 24px', overflowY: 'auto' }}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <MultiLanguageModalInputField
              label={translate('panel.notifications.edit.titleLabel')}
              name="title"
              description={translate('panel.notifications.edit.titleDescription')}
              dataTestId="txt-notice-title"
              required
            />
            <MultiLanguageModalInputField
              label={translate('panel.notifications.edit.contentLabel')}
              name="content"
              description={translate('panel.notifications.edit.contentDescription')}
              dataTestId="txt-notice-content"
              multiline
              rows={6}
              required
            />

            <Box sx={{ marginBottom: '20px' }}>
              <Typography sx={{ marginBottom: '8px' }} className="text-14">
                {translate('panel.notifications.edit.targetLabel')}
              </Typography>
              <Controller
                control={control}
                name="target"
                render={({ field }) => (
                  <Select {...field} fullWidth data-test-id="ddl-notice-audience">
                    {Object.values(NotificationTargetType).map((target) => (
                      <MenuItem
                        key={target}
                        value={target}
                        className="custom-select"
                        data-test-id={targetDataTestIdMap[target]}
                      >
                        {translate(`pages.settings.notifications.targets.${target}`)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              <Typography sx={{ mt: '8px' }} className="text-14" color="text.secondary">
                {translate('panel.notifications.edit.targetDescription')}
              </Typography>
            </Box>

            {selectedTarget === NotificationTargetType.USER_LIST && (
              <Box sx={{ marginBottom: '20px' }}>
                <Typography sx={{ marginBottom: '8px' }} className="text-14 asterisk">
                  {translate('panel.notifications.edit.usersLabel')}
                </Typography>
                <Controller
                  control={control}
                  name="user_ids"
                  render={({ field }) => (
                    <Box>
                      {field.value.length ? (
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            marginBottom: '8px',
                          }}
                        >
                          {field.value.map((user) => (
                            <Chip
                              key={user.id}
                              customText={{
                                default: getUserAutocompletePrimaryLabel(user),
                              }}
                              onClickButton={() =>
                                field.onChange(
                                  field.value.filter((selectedUser) => selectedUser.id !== user.id),
                                )
                              }
                            />
                          ))}
                        </Box>
                      ) : null}

                      <Autocomplete
                        data-test-id="ddl-notice-users"
                        multiple
                        options={userOptions}
                        getOptionKey={(option) => option.id}
                        value={field.value}
                        inputValue={userSearchValue}
                        loading={isUsersAutocompleteLoading}
                        loadingText="Loading results..."
                        noOptionsText={
                          userSearchValue.trim()
                            ? translate('helperText.emptyList')
                            : 'Start typing...'
                        }
                        filterOptions={(options) => options}
                        filterSelectedOptions
                        renderTags={() => null}
                        onChange={(_, value) => {
                          field.onChange(mergeSelectedUsers(value, userOptions));
                          setUserSearchValue('');
                          setUserOptions([]);
                        }}
                        onInputChange={(_, value, reason) => {
                          if (reason === 'reset') {
                            setUserSearchValue('');
                            setUserOptions([]);
                            return;
                          }

                          setUserSearchValue(value);

                          if (reason === 'clear' || !value.trim()) {
                            resetUsersAutocompleteState();
                            return;
                          }

                          if (!debouncedUserSearchRef.current) {
                            void requestAutocompleteUsers(value);
                            return;
                          }

                          debouncedUserSearchRef.current(value);
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        getOptionLabel={(option) => getUserAutocompletePrimaryLabel(option)}
                        renderOption={(props, option) => {
                          const secondaryLabel = getUserAutocompleteSecondaryLabel(option);

                          return (
                            <Box
                              component="li"
                              {...props}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 0.25,
                              }}
                            >
                              <Typography
                                className="text-14"
                                noWrap
                                title={getUserAutocompletePrimaryLabel(option)}
                                sx={{ width: '100%' }}
                              >
                                {getUserAutocompletePrimaryLabel(option)}
                              </Typography>
                              {secondaryLabel ? (
                                <Typography
                                  className="text-12"
                                  color="text.secondary"
                                  noWrap
                                  title={secondaryLabel}
                                  sx={{ width: '100%' }}
                                >
                                  {secondaryLabel}
                                </Typography>
                              ) : null}
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            placeholder={translate('panel.notifications.edit.usersPlaceholder')}
                            error={!!errors.user_ids}
                            helperText={errors.user_ids?.message as string}
                          />
                        )}
                      />
                    </Box>
                  )}
                />
                <Typography sx={{ mt: '8px' }} className="text-14" color="text.secondary">
                  {translate('panel.notifications.edit.usersDescription')}
                </Typography>
              </Box>
            )}
          </form>
        </FormProvider>
      </Box>
    </SidePanel>
  );
};

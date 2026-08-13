import { yupResolver } from "@hookform/resolvers/yup";
import { FC, ReactNode, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { IUserClient, useGetUserClientQuery } from "src/shared/api/clients";
import { useLazyCheckPhoneExistsQuery } from "src/shared/api/phone";
import {
  useGetProfileFieldsQuery,
  useGetRulesQuery,
} from "src/shared/api/settings";
import {
  IUserProfile,
  useGetPublicExternalAccountsQuery,
  useLazyCheckUniqueFieldAvailabilityQuery,
  useUpdatePictureMutation,
  useUpdateUserMutation,
} from "src/shared/api/users";
import { useLazyCheckEmailQuery } from "src/shared/api/verification";
import { updateUser } from "src/shared/slices/directorySlice";
import { SurfaceBlock } from "@encvoy-id/components";
import { SubmitModal } from "@encvoy-id/components";
import { ProfileFields } from "src/shared/ui/ProfileFields";
import { SearchAvatarsModal } from "src/shared/ui/modal/SearchAvatarsModal.tsx";
import { checkIdentifier } from "src/shared/utils/auth";
import { RuleFieldNames, tabs } from "src/shared/utils/enums";
import { editProfileSchema } from "src/shared/utils/helpers";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { findUnavailableUniqueCustomField } from "src/shared/utils/uniqueCustomFields";
import { canManageTargetUser } from "src/shared/utils/userAccess";

interface IEditUserProfileFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const EditUserProfileForm: FC<IEditUserProfileFormProps> = ({
  onCancel,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();

  const {
    appId = "",
    clientId = "",
    userId: routeUserId = "",
  } = useParams<{ appId: string; clientId: string; userId: string }>();
  const userId =
    useSelector((state: RootState) => state.directory.currentUserId) ||
    routeUserId;
  const roleInApp = useSelector((state: RootState) => state.user.roleInApp);
  const roles = useSelector((state: RootState) => state.user.roles);
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );
  const isDirectoryUserEdit = Boolean(userId);
  const currentUserId = isDirectoryUserEdit ? userId : routeUserId;
  const currentClientId = clientId || appId;
  const profileFieldScope = currentClientId
    ? { client_id: currentClientId }
    : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSearchModal, setIsOpenSearchModal] = useState(false);
  const [dataList, setDataList] = useState<ReactNode[] | undefined>(undefined);

  const { data: rules } = useGetRulesQuery(profileFieldScope);
  const { data: profileFields } = useGetProfileFieldsQuery(profileFieldScope);
  const {
    data: userClient,
    isLoading: isUserClientLoading,
    isFetching: isUserClientFetching,
  } = useGetUserClientQuery(
    {
      client_id: currentClientId,
      id: currentUserId || "",
    },
    {
      skip: !currentClientId || !currentUserId,
    }
  );
  const { data: externalAccounts } = useGetPublicExternalAccountsQuery(
    {
      id: String(currentUserId),
    },
    {
      skip: !currentClientId || !currentUserId,
    }
  );
  const [checkEmail, { isFetching: checkEmailFetching }] =
    useLazyCheckEmailQuery();
  const [checkPhoneExists, { isFetching: checkPhoneExistsFetching }] =
    useLazyCheckPhoneExistsQuery();
  const [
    checkUniqueFieldAvailability,
    { isFetching: checkUniqueFieldAvailabilityFetching },
  ] = useLazyCheckUniqueFieldAvailabilityQuery();

  const [updateUserFetch] = useUpdateUserMutation();
  const [updatePicture] = useUpdatePictureMutation();
  const canManageEditedUser = canManageTargetUser({
    roleInApp,
    roles,
    targetUserOrgId: userClient?.user?.org_id,
  });

  const accountsWithAvatars = externalAccounts?.filter(
    (account) => !!account.avatar
  );

  const filteredRules = rules
    ?.filter((rule) => rule.field_name !== "password")
    .map((rule) =>
      !(Object.values(RuleFieldNames) as string[]).includes(rule.field_name)
        ? { ...rule, field_name: `custom_fields.${rule.field_name}` }
        : rule
    );

  const methods = useForm<IUserClient>({
    resolver: yupResolver(
      editProfileSchema(filteredRules || [], i18n.language)
    ),
    defaultValues: {
      birthdate: "",
      custom_fields: {},
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const {
    handleSubmit,
    setFocus,
    reset,
    formState: { dirtyFields },
    setError,
    getValues,
  } = methods;

  useEffect(() => {
    reset(userClient?.user as IUserClient);
    reset({
      ...userClient?.user,
      custom_fields: userClient?.user.custom_fields ?? {},
    });
  }, [userClient?.user, reset]);

  useEffect(() => {
    if (!currentUserId || isUserClientLoading || isUserClientFetching) {
      return;
    }

    if (userClient?.user && canManageEditedUser) {
      return;
    }

    if (onCancel) {
      onCancel();
      return;
    }

    if (clientId) {
      navigate(
        `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${currentUserId}`
      );
      return;
    }

    navigate(`/${startRoutePath}/${appId}/${tabs.users}/${currentUserId}`);
  }, [
    appId,
    canManageEditedUser,
    clientId,
    currentUserId,
    isUserClientFetching,
    isUserClientLoading,
    navigate,
    onCancel,
    userClient?.user,
    startRoutePath,
  ]);

  const relocation = () => {
    if (clientId) {
      navigate(
        `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${currentUserId}`
      );
      return;
    }

    navigate(`/${startRoutePath}/${appId}/${tabs.users}/${currentUserId}`);
  };

  const onSubmit: SubmitHandler<IUserClient> = async (data) => {
    const payload: Partial<IUserClient> = (
      Object.keys(dirtyFields) as Array<keyof typeof data>
    ).reduce(
      (acc, field) => ({ ...acc, [field]: data[field] }),
      {} as Partial<IUserClient>
    );

    try {
      if (payload.login) {
        const isExist = await checkIdentifier(payload.login);
        if (isExist) {
          setError("login", {
            message: translate("errors.valueNotAvailable"),
          });
          setFocus("login");
          return;
        }
      }

      if (payload.phone_number) {
        const { isExist } = await checkPhoneExists(
          payload.phone_number
        ).unwrap();
        if (isExist) {
          setError("phone_number", {
            message: translate("errors.valueNotAvailable"),
          });
          setFocus("phone_number");
          return;
        }
      }

      if (payload.email) {
        const { isExist, uniqueRule } = await checkEmail(
          payload.email
        ).unwrap();
        if (isExist && uniqueRule) {
          setError("email", {
            message: translate("errors.valueNotAvailable"),
          });
          setFocus("email");
          return;
        }
      }

      const unavailableUniqueCustomField =
        await findUnavailableUniqueCustomField({
          customFields: payload.custom_fields,
          profileFields,
          userId: currentUserId,
          checkAvailability: async (params) =>
            checkUniqueFieldAvailability({
              ...params,
              ...(profileFieldScope || {}),
            }).unwrap(),
        });

      if (unavailableUniqueCustomField) {
        const fieldPath =
          `custom_fields.${unavailableUniqueCustomField.field}` as const;

        setError(fieldPath, {
          message: translate("errors.valueNotAvailable"),
        });
        setFocus(fieldPath);
        return;
      }

      const updatedUser = await updateUserFetch({
        body: payload as Partial<IUserProfile>,
        userId: currentUserId,
      }).unwrap();

      if (isDirectoryUserEdit) {
        dispatch(
          updateUser({
            userId: currentUserId,
            changes: {
              ...updatedUser,
              picture: null,
            },
          })
        );
      }

      const pictureUserId = data?.id ? String(data.id) : currentUserId;
      await updatePicture({
        picture: payload.picture,
        userId: pictureUserId,
      }).unwrap();

      if (onSuccess) {
        onSuccess();
        return;
      }

      relocation();
    } catch (e) {
      console.error("updateUserError", e);
    }
  };

  const checkRequiredFields = async () => {
    const formData = getValues();
    const excludedFields = ["data_processing_agreement", "password", "sub"];

    const unfilledFields =
      profileFields?.filter((rule) => {
        if (!rule.required || excludedFields.includes(rule.field)) return false;
        let value;
        if (rule.type === "custom") {
          value =
            (formData.custom_fields && formData.custom_fields[rule.field]) ||
            "";
        } else {
          value = formData[rule.field as keyof IUserClient];
        }
        return !value;
      }) || [];

    if (unfilledFields.length > 0) {
      setDataList(
        unfilledFields.map((rule) => (
          <div key={rule.field}>
            • {getLocalizedTextValue(rule.title, i18n.language)}
          </div>
        ))
      );
      setIsOpen(true);
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  const handleModalContinue = () => {
    setIsOpen(false);
    handleSubmit(onSubmit)();
  };

  if (isUserClientLoading || isUserClientFetching) {
    return (
      <SurfaceBlock sx={{ padding: "32px" }}>
        {translate("helperText.loading")}
      </SurfaceBlock>
    );
  }

  if (!userClient?.user || !canManageEditedUser) {
    return null;
  }

  return (
    <>
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkRequiredFields();
          }}
        >
          <SurfaceBlock sx={{ padding: "32px" }}>
            <ProfileFields
              profileFields={profileFields}
              rules={rules}
              isLoading={
                checkEmailFetching ||
                checkPhoneExistsFetching ||
                checkUniqueFieldAvailabilityFetching
              }
              withContacts
              userProfile={userClient?.user}
              onCancel={onCancel}
              onUploadPictureExternalAccounts={
                accountsWithAvatars?.length
                  ? () => setIsOpenSearchModal(true)
                  : undefined
              }
            />
          </SurfaceBlock>
        </form>

        {accountsWithAvatars && (
          <SearchAvatarsModal
            isOpen={isOpenSearchModal}
            onClose={() => setIsOpenSearchModal(false)}
            accountsWithAvatars={accountsWithAvatars}
          />
        )}
      </FormProvider>

      <SubmitModal
        cancelText={translate("actionButtons.cancel")}
        deleteText={translate("actionButtons.delete")}
        isOpen={isOpen}
        onClose={handleModalClose}
        title={translate("modals.confirmSave.title")}
        mainMessage={Object.values(
          translate("modals.confirmSave.mainMessage", {
            returnObjects: true,
          }) as Record<string, string>
        )}
        onSubmit={handleModalContinue}
        actionButtonText={translate("actionButtons.continue")}
      >
        {dataList}
      </SubmitModal>
    </>
  );
};

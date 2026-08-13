import { yupResolver } from "@hookform/resolvers/yup";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import Typography from "@mui/material/Typography";
import { FC, ReactNode, useEffect, useState } from "react";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { useCreateUserToFolderMutation } from "src/shared/api/folders";
import { useLazyCheckPhoneExistsQuery } from "src/shared/api/phone";
import {
  useGetProfileFieldsQuery,
  useGetRulesQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import {
  IUserProfile,
  IUserProfileWithPassword,
  useCreateClientUserMutation,
  useCreateUserMutation,
  useLazyCheckUniqueFieldAvailabilityQuery,
  useUpdatePictureMutation,
} from "src/shared/api/users";
import { useLazyCheckEmailQuery } from "src/shared/api/verification";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { IconWithTooltip } from "@encvoy-id/components";
import { PasswordTextField } from "@encvoy-id/components";
import { SurfaceBlock } from "@encvoy-id/components";
import { SwitchBlock } from "@encvoy-id/components";
import { SubmitModal } from "@encvoy-id/components";
import { getRulesIcon, ProfileFields } from "src/shared/ui/ProfileFields";
import { checkIdentifier } from "src/shared/utils/auth";
import { routes, RuleFieldNames, tabs } from "src/shared/utils/enums";
import { editProfileSchema, generatePassword } from "src/shared/utils/helpers";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { findUnavailableUniqueCustomField } from "src/shared/utils/uniqueCustomFields";

interface ICreateUserProfileFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  folderId?: string;
}

export const CreateUserProfileForm: FC<ICreateUserProfileFormProps> = ({
  onCancel,
  onSuccess,
  folderId,
}) => {
  const navigate = useNavigate();
  const { t: translate, i18n } = useTranslation();
  const { appId = "" } = useParams<{ appId: string }>();
  const systemClientId = useSystemClientId();
  const [searchParams] = useSearchParams();
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );
  const profileFieldScope = appId ? { client_id: appId } : undefined;
  const { currentData: profileFields, isFetching: profileFieldsFetching } =
    useGetProfileFieldsQuery(profileFieldScope);
  const { data: dataSettings } = useGetSettingsQuery();
  const { currentData: rules, isFetching: rulesFetching } =
    useGetRulesQuery(profileFieldScope);

  const [createUser, { isLoading: createUserLoading }] =
    useCreateUserMutation();
  const [createClientUser, { isLoading: createClientUserLoading }] =
    useCreateClientUserMutation();
  const [createUserToFolderFetch, { isLoading: createUserToFolderLoading }] =
    useCreateUserToFolderMutation();
  const [updatePicture] = useUpdatePictureMutation();
  const [checkEmail, { isFetching: checkEmailFetching }] =
    useLazyCheckEmailQuery();
  const [checkPhoneExists, { isFetching: checkPhoneExistsFetching }] =
    useLazyCheckPhoneExistsQuery();
  const [
    checkUniqueFieldAvailability,
    { isFetching: checkUniqueFieldAvailabilityFetching },
  ] = useLazyCheckUniqueFieldAvailabilityQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [dataList, setDataList] = useState<ReactNode[] | undefined>(undefined);
  const passwordField = profileFields?.find(
    (field) => field.field === "password"
  );
  const isPasswordRequired = Boolean(passwordField?.required);

  const filteredRules = rules?.map((rule) =>
    !(Object.values(RuleFieldNames) as string[]).includes(rule.field_name)
      ? { ...rule, field_name: `custom_fields.${rule.field_name}` }
      : rule
  );

  const methods = useForm<IUserProfileWithPassword>({
    resolver: yupResolver(
      editProfileSchema(filteredRules || [], i18n.language)
    ),
    defaultValues: {
      birthdate: "",
      custom_fields: {},
      email_verified: true,
      phone_number_verified: true,
      password_change_required: true,
      send_account_create_email: false,
    },
    mode: "onChange",
  });
  const {
    handleSubmit,
    getValues,
    setError,
    setFocus,
    setValue,
    clearErrors,
    reset,
    formState: { dirtyFields },
  } = methods;
  const watchedEmail = useWatch({
    control: methods.control,
    name: "email",
  });
  const watchedPhoneNumber = useWatch({
    control: methods.control,
    name: "phone_number",
  });
  const watchedPassword = useWatch({
    control: methods.control,
    name: "password",
  });

  useEffect(() => {
    reset({
      birthdate: "",
      custom_fields: {},
      email_verified: true,
      phone_number_verified: true,
      password_change_required: true,
      send_account_create_email: false,
    });
    setDataList(undefined);
    setIsOpen(false);
  }, [appId, reset]);

  useEffect(() => {
    profileFields
      ?.filter(
        (field) =>
          field.type === "custom" &&
          field.active &&
          !field.unique &&
          field.default !== undefined
      )
      .forEach((field) => {
        const fieldName = `custom_fields.${field.field}` as const;
        if (getValues(fieldName) === undefined) {
          setValue(fieldName, field.default, { shouldDirty: false });
        }
      });
  }, [getValues, profileFields, setValue]);

  const checkRequiredFields = async () => {
    const formData = getValues();
    const excludedFields = ["data_processing_agreement", "sub"];

    const unfilledFields =
      profileFields?.filter((rule) => {
        if (!rule.required || excludedFields.includes(rule.field)) return false;
        let value;
        if (rule.type === "custom") {
          value =
            (formData.custom_fields && formData.custom_fields[rule.field]) ||
            "";
        } else {
          value = formData[rule.field as keyof IUserProfile];
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

  const validateLoginFields = (data: IUserProfileWithPassword): boolean => {
    if (!dataSettings) return true;

    const loginFields = dataSettings.allowed_login_fields.split(" ");
    const hasLoginField = loginFields.some(
      (field) => data[field as keyof IUserProfileWithPassword]
    );

    if (!hasLoginField) {
      const message =
        loginFields.length === 1
          ? translate("errors.requiredField")
          : translate("pages.createUser.errors.fillAtLeastOneIdentifier");

      loginFields.forEach((field) =>
        setError(field as keyof IUserProfile, { message })
      );
      setFocus(loginFields[0] as keyof IUserProfile);
      return false;
    }

    return true;
  };

  const createGlobalUser = async (
    payload: Partial<IUserProfileWithPassword>
  ) => {
    const createdUser = await createUser(payload).unwrap();
    const createdUserId = createdUser?.id || "";

    if (payload.picture && createdUserId) {
      await updatePicture({
        picture: payload.picture,
        userId: createdUserId,
      }).unwrap();
    }
    navigate(`/${startRoutePath}/${appId}/${tabs.users}/${createdUserId}`);
  };

  const createOrganizationUser = async (
    payload: Partial<IUserProfileWithPassword>
  ) => {
    const createdUser = await createClientUser({
      client_id: appId,
      ...payload,
    }).unwrap();
    const createdUserId = createdUser?.id || "";

    if (payload.picture && createdUserId) {
      await updatePicture({
        picture: payload.picture,
        userId: createdUserId,
      }).unwrap();
    }

    navigate(`/${startRoutePath}/${appId}/${tabs.users}/${createdUserId}`);
  };

  const createFolderUser = async (
    payload: Partial<IUserProfileWithPassword>,
    targetFolderId: string
  ) => {
    await createUserToFolderFetch({
      client_id: appId,
      body: payload,
      id: targetFolderId,
    }).unwrap();
    onSuccess?.();
  };

  const onSubmit: SubmitHandler<IUserProfileWithPassword> = async (data) => {
    try {
      if (!profileFields) {
        return;
      }

      const isInternalSystemUserCreate =
        startRoutePath === routes.system &&
        appId === systemClientId &&
        searchParams.get("mode") === "internal";
      const payload: Partial<IUserProfileWithPassword> = (
        Object.keys(dirtyFields) as Array<keyof typeof data>
      ).reduce(
        (acc, field) => ({ ...acc, [field]: data[field] }),
        {} as Partial<IUserProfileWithPassword>
      );

      if (payload.custom_fields) {
        const scopedCustomFieldNames = new Set(
          profileFields
            .filter((field) => field.type === "custom" && field.active)
            .map((field) => field.field)
        );

        payload.custom_fields = Object.fromEntries(
          Object.entries(payload.custom_fields).filter(([field]) =>
            scopedCustomFieldNames.has(field)
          )
        );
      }

      if (data.email) {
        payload.email_verified = data.email_verified ?? true;
      }

      if (data.phone_number) {
        payload.phone_number_verified = Boolean(
          data.phone_number_verified ?? true
        );
      }

      if (payload.password === "") {
        delete payload.password;
      }

      payload.password_change_required = payload.password
        ? data.password_change_required ?? true
        : false;

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

      if (!validateLoginFields(payload)) {
        return;
      }

      if (folderId) {
        await createFolderUser(payload, folderId);
        return;
      }

      if (
        (startRoutePath === routes.customer || isInternalSystemUserCreate) &&
        appId
      ) {
        await createOrganizationUser(payload);
        return;
      }

      await createGlobalUser(payload);
    } catch (e) {
      console.error("error:", e);
    }
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  const handleModalContinue = () => {
    setIsOpen(false);
    handleSubmit(onSubmit)();
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setValue("password", newPassword, { shouldDirty: true });
    clearErrors("password");
  };

  const passwordRules = getRulesIcon(
    "password",
    translate,
    i18n.language,
    rules,
    undefined
  );

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
              profileFields={profileFields ?? []}
              rules={rules}
              isLoading={
                createClientUserLoading ||
                createUserToFolderLoading ||
                createUserLoading ||
                checkEmailFetching ||
                checkPhoneExistsFetching ||
                checkUniqueFieldAvailabilityFetching ||
                profileFieldsFetching ||
                rulesFetching
              }
              isCreateUser
              withContacts
              contactFieldOptions={{
                email: (
                  <SwitchBlock
                    name="email_verified"
                    label={translate(
                      "pages.createUser.contactVerification.email.label"
                    )}
                    description={translate(
                      "pages.createUser.contactVerification.email.description"
                    )}
                    disabled={!watchedEmail}
                    dataTestId="swt-create-user-email-verified"
                    sx={{ marginTop: "-16px", marginBottom: "24px" }}
                  />
                ),
                phone_number: (
                  <SwitchBlock
                    name="phone_number_verified"
                    label={translate(
                      "pages.createUser.contactVerification.phone.label"
                    )}
                    description={translate(
                      "pages.createUser.contactVerification.phone.description"
                    )}
                    disabled={!watchedPhoneNumber}
                    dataTestId="swt-create-user-phone-verified"
                    sx={{ marginTop: "-16px", marginBottom: "24px" }}
                  />
                ),
              }}
              onCancel={onCancel}
            >
              <>
                <Typography
                  className={`text-14${isPasswordRequired ? " asterisk" : ""}`}
                  sx={{ marginBottom: "8px" }}
                >
                  {translate("helperText.password")}
                </Typography>
                <PasswordTextField
                  showText={translate("actionButtons.show")}
                  hideText={translate("actionButtons.hide")}
                  copyText={translate("actionButtons.copy")}
                  nameField="password"
                  children={
                    <>
                      <IconWithTooltip
                        title={translate("toolTips.generatePassword")}
                        Icon={SyncOutlinedIcon}
                        onClick={handleGeneratePassword}
                      />
                      {passwordRules}
                    </>
                  }
                />
                <SwitchBlock
                  name="password_change_required"
                  label={translate(
                    "helperText.requirePasswordChangeOnNextAuthorization"
                  )}
                  description={translate(
                    "helperText.requirePasswordChangeOnNextAuthorizationDescription"
                  )}
                  dataTestId="swt-create-user-password-change-required"
                  sx={{ marginTop: "16px", marginBottom: 0 }}
                />
                <SwitchBlock
                  name="send_account_create_email"
                  label={translate("pages.createUser.accountCreateEmail.label")}
                  description={translate(
                    "pages.createUser.accountCreateEmail.description"
                  )}
                  disabled={!watchedEmail || !watchedPassword}
                  dataTestId="swt-create-user-send-account-create-email"
                  sx={{ marginTop: "16px", marginBottom: 0 }}
                />
              </>
            </ProfileFields>
          </SurfaceBlock>
        </form>
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

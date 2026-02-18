import { yupResolver } from "@hookform/resolvers/yup";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import clsx from "clsx";
import { FC, ReactNode, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { RuleFieldNames, tabs } from "src/shared/utils/enums";
import { editProfileSchema, generatePassword } from "src/shared/utils/helpers";
import { useLazyCheckPhoneExistsQuery } from "src/shared/api/phone";
import {
  useGetProfileFieldsQuery,
  useGetRulesQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import {
  IUserProfile,
  IUserProfileWithPassword,
  useCreateUserMutation,
  useUpdatePictureMutation,
} from "src/shared/api/users";
import { useLazyCheckEmailQuery } from "src/shared/api/verification";
import { RootState } from "src/app/store/store";
import { checkIdentifier } from "src/shared/requests/user";
import { PasswordTextField } from "src/shared/ui/components/PasswordTextField";
import styles from "./CreateUserProfile.module.css";
import { getRulesIcon, ProfileFields } from "src/shared/ui/ProfileFields";
import { IconWithTooltip } from "src/shared/ui/components/IconWithTooltip";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import { componentBorderRadius } from "src/shared/theme/Theme";

export const CreateUserProfile: FC = () => {
  const { t: translate } = useTranslation();
  const { appId = "" } = useParams<{ appId: string }>();
  const { data: profileFields } = useGetProfileFieldsQuery();
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );

  const { data: dataSettings } = useGetSettingsQuery();
  const { data: rules } = useGetRulesQuery();

  const filteredRules = rules?.map((rule) =>
    !(Object.values(RuleFieldNames) as string[]).includes(rule.field_name)
      ? { ...rule, field_name: `custom_fields.${rule.field_name}` }
      : rule
  );

  const methods = useForm<IUserProfileWithPassword>({
    resolver: yupResolver(editProfileSchema(filteredRules || [])),
    defaultValues: {
      birthdate: "",
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
    formState: { dirtyFields },
  } = methods;

  const navigate = useNavigate();
  const [createUser, { isLoading: createUserLoading }] =
    useCreateUserMutation();
  const [updatePicture] = useUpdatePictureMutation();
  const [checkEmail, { isFetching: checkEmailFetching }] =
    useLazyCheckEmailQuery();
  const [checkPhoneExists, { isFetching: checkPhoneExistsFetching }] =
    useLazyCheckPhoneExistsQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [dataList, setDataList] = useState<ReactNode[] | undefined>(undefined);

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
          value = formData[rule.field as keyof IUserProfile];
        }
        return !value;
      }) || [];

    if (unfilledFields.length > 0) {
      setDataList(
        unfilledFields.map((rule) => <div key={rule.field}>• {rule.title}</div>)
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

  const onSubmit: SubmitHandler<IUserProfileWithPassword> = async (data) => {
    try {
      const payload: Partial<IUserProfileWithPassword> = (
        Object.keys(dirtyFields) as Array<keyof typeof data>
      ).reduce(
        (acc, field) => ({ ...acc, [field]: data[field] }),
        {} as Partial<IUserProfileWithPassword>
      );

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

      if (!validateLoginFields(payload)) {
        return;
      }

      const createdUser = await createUser(payload).unwrap();
      if (payload.picture) {
        await updatePicture({
          picture: payload.picture,
          userId: createdUser.id,
        }).unwrap();
      }
      navigate(`/${startRoutePath}/${appId}/${tabs.users}/${createdUser.id}`);
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

  const passwordRules = getRulesIcon("password", rules);

  return (
    <div className="page-container">
      <div className="content">
        <FormProvider {...methods}>
          <Box
            sx={{ borderRadius: componentBorderRadius }}
            className={styles.container}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkRequiredFields();
              }}
            >
              <Typography className={clsx("title-medium", styles.title)}>
                {translate("pages.createUser.title")}
              </Typography>
              <ProfileFields
                rules={rules}
                isLoading={
                  createUserLoading ||
                  checkEmailFetching ||
                  checkPhoneExistsFetching
                }
                isCreateUser
                withContacts
              >
                <>
                  <div className={clsx(styles.fieldTitle)}>
                    <Typography className={clsx("text-14", styles.asterisk)}>
                      {translate("helperText.password")}
                    </Typography>
                  </div>
                  <PasswordTextField
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
                </>
              </ProfileFields>
            </form>
          </Box>
        </FormProvider>
      </div>

      <SubmitModal
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
    </div>
  );
};

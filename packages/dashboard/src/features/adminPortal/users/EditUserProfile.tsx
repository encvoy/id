import { yupResolver } from "@hookform/resolvers/yup";
import { FC, ReactNode, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { IUserClient, useGetUserClientQuery } from "src/shared/api/clients";
import {
  IUserProfile,
  useGetPublicExternalAccountsQuery,
  useUpdatePictureMutation,
  useUpdateUserMutation,
} from "src/shared/api/users";
import { useLazyCheckEmailQuery } from "src/shared/api/verification";
import { routes, RuleFieldNames, tabs } from "src/shared/utils/enums";
import { editProfileSchema } from "src/shared/utils/helpers";
import { useLazyCheckPhoneExistsQuery } from "src/shared/api/phone";
import {
  useGetProfileFieldsQuery,
  useGetRulesQuery,
} from "src/shared/api/settings";
import { checkIdentifier } from "src/shared/requests/user";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import styles from "./EditUserProfile.module.css";
import { ProfileFields } from "../../../shared/ui/ProfileFields";
import { SearchAvatarsModal } from "../../../shared/ui/SearchAvatarsModal";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import { componentBorderRadius } from "src/shared/theme/Theme";

export const EditUserProfile: FC = () => {
  const { t: translate } = useTranslation();
  const {
    appId = "",
    clientId = "",
    userId = "",
  } = useParams<{ appId: string; clientId: string; userId: string }>();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSearchModal, setIsOpenSearchModal] = useState(false);
  const [dataList, setDataList] = useState<ReactNode[] | undefined>(undefined);

  const { data: rules } = useGetRulesQuery();
  const { data: profileFields } = useGetProfileFieldsQuery();
  const { data: userClient } = useGetUserClientQuery({
    clientId: clientId || appId,
    userId: userId,
  });
  const { data: externalAccounts } = useGetPublicExternalAccountsQuery({
    user_id: String(userId),
    client_id: clientId || appId,
  });
  const [checkEmail, { isFetching: checkEmailFetching }] =
    useLazyCheckEmailQuery();
  const [checkPhoneExists, { isFetching: checkPhoneExistsFetching }] =
    useLazyCheckPhoneExistsQuery();

  const [updateUser] = useUpdateUserMutation();
  const [updatePicture] = useUpdatePictureMutation();

  const navigate = useNavigate();
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
    resolver: yupResolver(editProfileSchema(filteredRules || [])),
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
  }, [userClient?.user]);

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

      await updateUser({
        body: payload as Partial<IUserProfile>,
        userId,
      }).unwrap();
      await updatePicture({
        picture: payload.picture,
        userId: data?.id.toString() || "",
      }).unwrap();
      relocation();
    } catch (e) {
      console.error("updateUserError", e);
    }
  };

  const relocation = () => {
    if (clientId) {
      navigate(
        `/${routes.system}/${appId}/${tabs.clients}/${clientId}/${tabs.users}/${userId}`
      );
    } else {
      navigate(`/${routes.system}/${appId}/${tabs.users}/${userId}`);
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
        unfilledFields.map((rule) => <div key={rule.field}>• {rule.title}</div>)
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

  return (
    <div className="page-container">
      <div className="content">
        <Typography className="title-medium">
          {translate("pages.editUser.title")}
        </Typography>
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
              <ProfileFields
                rules={rules}
                isLoading={checkEmailFetching || checkPhoneExistsFetching}
                withContacts
                userProfile={userClient?.user}
                onUploadPictureExternalAccounts={
                  accountsWithAvatars?.length
                    ? () => setIsOpenSearchModal(true)
                    : undefined
                }
              />
            </form>

            {accountsWithAvatars && (
              <SearchAvatarsModal
                isOpen={isOpenSearchModal}
                onClose={() => setIsOpenSearchModal(false)}
                accountsWithAvatars={accountsWithAvatars}
              />
            )}
          </Box>
        </FormProvider>

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
    </div>
  );
};

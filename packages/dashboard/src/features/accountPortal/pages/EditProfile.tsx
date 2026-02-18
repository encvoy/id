import { yupResolver } from "@hookform/resolvers/yup";
import { FC, ReactNode, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { routes, RuleFieldNames, tabs } from "src/shared/utils/enums";
import { IUserProfile, useUpdatePictureMutation } from "src/shared/api/users";
import { editProfileSchema } from "src/shared/utils/helpers";
import {
  useGetProfileFieldsQuery,
  useGetRulesQuery,
} from "src/shared/api/settings";
import { useUpdateUserMutation } from "src/shared/api/users";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/lib/userSlice";
import { checkIdentifier } from "src/shared/requests/user";
import { Box, Typography } from "@mui/material";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { ProfileFields } from "src/shared/ui/ProfileFields";
import { SearchAvatarsModal } from "src/shared/ui/SearchAvatarsModal";
import { useGetExternalAccountsQuery } from "src/shared/api/profile";
import { useTranslation } from "react-i18next";
import { componentBorderRadius } from "src/shared/theme/Theme";

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
});

interface IEditProfileProps {
  profile: TUserSlice["profile"];
}

const EditProfileComponent: FC<IEditProfileProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSearchModal, setIsOpenSearchModal] = useState(false);
  const [dataList, setDataList] = useState<ReactNode[] | undefined>(undefined);

  const { t: translate } = useTranslation();

  const { data: rules } = useGetRulesQuery();
  const { data: profileFields } = useGetProfileFieldsQuery();
  const { data: externalAccounts } = useGetExternalAccountsQuery(
    profile.id?.toString() || ""
  );

  const [updateUser] = useUpdateUserMutation();
  const [updatePicture] = useUpdatePictureMutation();

  const navigate = useNavigate();
  const accountsWithAvatars = externalAccounts?.filter(
    (account) => !!account.avatar
  );
  const filteredRules = rules
    ?.filter(
      (rule) => !["password", "email", "phone_number"].includes(rule.field_name)
    )
    .map((rule) =>
      !(Object.values(RuleFieldNames) as string[]).includes(rule.field_name)
        ? { ...rule, field_name: `custom_fields.${rule.field_name}` }
        : rule
    );

  const methods = useForm<IUserProfile>({
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
    getValues,
    reset,
    setError,
    setFocus,
    formState: { dirtyFields },
  } = methods;

  useEffect(() => {
    // fields email and phone_number do not put data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, phone_number, ...data } = profile;
    reset({
      ...data,
      custom_fields: data.custom_fields ?? {},
    });
  }, [profile]);

  const onSubmit: SubmitHandler<IUserProfile> = async (data) => {
    const payload: Partial<IUserProfile> = (
      Object.keys(dirtyFields) as Array<keyof typeof data>
    ).reduce(
      (acc, field) => ({ ...acc, [field]: data[field] }),
      {} as Partial<IUserProfile>
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

      await updateUser({ body: payload, userId: data?.id || "" }).unwrap();
      await updatePicture({
        picture: payload.picture,
        userId: data?.id || "",
      }).unwrap();
      navigate(`/${routes.profile}/${tabs.profile}`);
    } catch (e) {
      console.error(e);
    }
  };

  const checkRequiredFields = async () => {
    const formData = getValues();
    const excludedFields = [
      "data_processing_agreement",
      "password",
      "sub",
      "email",
      "phone_number",
    ];

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
        <Typography className={"title-medium"} sx={{ marginBottom: "24px" }}>
          {translate("pages.editProfile.title")}
        </Typography>
        <FormProvider {...methods}>
          <Box
            sx={{
              borderRadius: componentBorderRadius,
              border: 1,
              borderColor: "divider",
              padding: "32px",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkRequiredFields();
              }}
            >
              <ProfileFields
                userProfile={profile}
                rules={rules}
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

export const EditProfile = connect(mapStateToProps)(EditProfileComponent);

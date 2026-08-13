import { yupResolver } from "@hookform/resolvers/yup";
import { Typography } from "@mui/material";
import { FC, ReactNode, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { useGetExternalAccountsQuery } from "src/shared/api/profile";
import {
  useGetProfileFieldsQuery,
  useGetRulesQuery,
} from "src/shared/api/settings";
import {
  IUserProfile,
  useLazyCheckUniqueFieldAvailabilityQuery,
  useUpdatePictureMutation,
  useUpdateUserMutation,
} from "src/shared/api/users";
import { TAppSlice } from "src/shared/slices/appSlice";
import { TUserSlice } from "src/shared/slices/userSlice";
import { SurfaceBlock } from "@encvoy-id/components";
import { SubmitModal } from "@encvoy-id/components";
import { ProfileFields } from "src/shared/ui/ProfileFields";
import { SearchAvatarsModal } from "src/shared/ui/modal/SearchAvatarsModal.tsx";
import { checkIdentifier } from "src/shared/utils/auth";
import { routes, RuleFieldNames, tabs } from "src/shared/utils/enums";
import { editProfileSchema } from "src/shared/utils/helpers";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { findUnavailableUniqueCustomField } from "src/shared/utils/uniqueCustomFields";

const mapStateToProps = (state: RootState) => ({
  profile: state.user.profile,
  systemClientId: state.app.systemClientId,
});

interface IEditProfileProps {
  profile: TUserSlice["profile"];
  systemClientId: TAppSlice["systemClientId"];
}

const EditProfileComponent: FC<IEditProfileProps> = ({
  profile,
  systemClientId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSearchModal, setIsOpenSearchModal] = useState(false);
  const [dataList, setDataList] = useState<ReactNode[] | undefined>(undefined);

  const { t: translate, i18n } = useTranslation();

  const profileFieldScope = {
    organization_id: profile.org_id || systemClientId || "",
  };
  const { data: rules } = useGetRulesQuery(profileFieldScope);
  const { data: profileFields } = useGetProfileFieldsQuery(profileFieldScope);
  const { data: externalAccounts } = useGetExternalAccountsQuery(
    profile.id?.toString() || ""
  );

  const [updateUser] = useUpdateUserMutation();
  const [updatePicture] = useUpdatePictureMutation();
  const [
    checkUniqueFieldAvailability,
    { isFetching: checkUniqueFieldAvailabilityFetching },
  ] = useLazyCheckUniqueFieldAvailabilityQuery();

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
    const isPictureChanged = Object.prototype.hasOwnProperty.call(
      payload,
      "picture"
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

      const unavailableUniqueCustomField =
        await findUnavailableUniqueCustomField({
          customFields: payload.custom_fields,
          profileFields,
          userId: profile.id,
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

      await updateUser({ body: payload, userId: data?.id || "" }).unwrap();
      if (isPictureChanged) {
        await updatePicture({
          picture: payload.picture,
          userId: data?.id || "",
        }).unwrap();
      }
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

  return (
    <div className="page-container">
      <div className="content">
        <Typography className={"title-medium"} sx={{ margin: "32px 0" }}>
          {translate("pages.editProfile.title")}
        </Typography>
        <FormProvider {...methods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              checkRequiredFields();
            }}
          >
            <SurfaceBlock sx={{ padding: "32px" }}>
              <ProfileFields
                userProfile={profile}
                profileFields={profileFields}
                rules={rules}
                isLoading={checkUniqueFieldAvailabilityFetching}
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
      </div>
    </div>
  );
};

export const EditProfile = connect(mapStateToProps)(EditProfileComponent);

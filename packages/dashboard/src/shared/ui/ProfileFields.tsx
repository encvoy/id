import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { FC, ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { IUserProfile } from "src/shared/api/users";
import {
  IProfileField,
  IRuleWithValidation,
  useGetProfileFieldsQuery,
} from "src/shared/api/settings";
import { Box, Typography } from "@mui/material";
import { ActionButtons } from "@encvoy-id/components";
import { InputField } from "@encvoy-id/components";
import { IconsLibrary } from "@encvoy-id/components";
import { InputDate } from "@encvoy-id/components";
import { IUserClient } from "src/shared/api/clients";
import { useTranslation } from "react-i18next";
import { UploadAndDisplayImage } from "./UploadAndDisplayImage";
import { isOwnerOrEditor } from "src/shared/utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "src/app/store/reducer";
import {
  DEFAULT_SYSTEM_LANGUAGE,
  getLocalizedTextValue,
} from "src/shared/utils/locales";
import { TFunction } from "i18next";

interface IProfileFieldsProps {
  userProfile?: IUserProfile | IUserClient;
  isCreateUser?: boolean;
  withContacts?: boolean;
  contactFieldOptions?: Partial<Record<"email" | "phone_number", ReactNode>>;
  isLoading?: boolean;
  profileFields?: IProfileField[];
  rules?: IRuleWithValidation[];
  onUploadPictureExternalAccounts?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export const getRulesIcon = (
  field: string,
  translate: TFunction<"translation", undefined>,
  locale: string = DEFAULT_SYSTEM_LANGUAGE,
  rules?: IRuleWithValidation[],
  currentList?: string[]
) => {
  if (currentList?.length) {
    return (
      <IconsLibrary
        key="rules-list"
        type="rules"
        title={translate("toolTips.rules")}
        description={currentList}
        hideHovered
      />
    );
  }

  const list = rules
    ?.find((rule) => rule.field_name === field)
    ?.validations?.filter((rule) => rule.active)
    .map((rule) => getLocalizedTextValue(rule.title, locale));

  return list && list.length > 0 ? (
    <IconsLibrary
      key="rules-list"
      type="rules"
      title={translate("toolTips.rules")}
      description={list}
      hideHovered
    />
  ) : undefined;
};

export const ProfileFields: FC<IProfileFieldsProps> = ({
  userProfile,
  withContacts,
  contactFieldOptions,
  isLoading,
  profileFields,
  rules,
  onUploadPictureExternalAccounts,
  onCancel,
  children,
}) => {
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const [editableFieldNames, setEditableFieldNames] = useState<string[]>([]);
  const { data: fetchedProfileFields } = useGetProfileFieldsQuery(undefined, {
    skip: Boolean(profileFields),
  });
  const listProfileFields = profileFields || fetchedProfileFields;
  const roleInApp = useSelector(({ user }: RootState) => user.roleInApp);

  const listCustomProfileFields =
    listProfileFields?.filter(
      (field) =>
        field.type === "custom" &&
        field.active &&
        (field.editable || isOwnerOrEditor(roleInApp))
    ) || [];

  const checkRequiredIndicator = (field_name: string) => {
    return !!listProfileFields?.find(
      (item) => item?.field === field_name && item?.required
    );
  };

  const listCustomFields = listCustomProfileFields.map((field) => (
    <InputField
      key={field.field}
      label={getLocalizedTextValue(field.title, i18n.language)}
      required={checkRequiredIndicator(field?.field)}
      name={`custom_fields.${field.field}`}
      mode="nested"
      errorField="custom_fields"
      errorNestedField={field.field}
      dataTestId={`txt-profile-info-${field.field}`}
    >
      {getRulesIcon(field.field, translate, i18n.language, rules, undefined)}
    </InputField>
  ));

  useEffect(() => {
    if (listProfileFields) {
      setEditableFieldNames(
        listProfileFields
          ? listProfileFields
              .filter((field) => !field?.editable)
              .map((field) => field?.field)
          : []
      );
    }
  }, [listProfileFields]);

  const { setValue } = useFormContext<IUserProfile>();

  useEffect(() => {
    if (userProfile?.picture) {
      setValue("picture", userProfile.picture);
    }
  }, [userProfile?.picture]);

  return (
    <>
      <Box sx={{ marginBottom: "24px" }}>
        <Typography className="text-17" sx={{ marginBottom: "24px" }}>
          {translate("helperText.mainInfo")}
        </Typography>
        <InputField
          label={translate("pages.profile.fields.publicName")}
          required={checkRequiredIndicator("nickname")}
          name="nickname"
          dataTestId="txt-profile-info-nickname"
        >
          {getRulesIcon("nickname", translate, i18n.language, rules, undefined)}
        </InputField>
        <InputField
          label={translate("pages.profile.fields.givenName")}
          required={checkRequiredIndicator("given_name")}
          name="given_name"
          dataTestId="txt-profile-info-firstname"
        >
          {getRulesIcon(
            "given_name",
            translate,
            i18n.language,
            rules,
            undefined
          )}
        </InputField>
        <InputField
          label={translate("pages.profile.fields.familyName")}
          required={checkRequiredIndicator("family_name")}
          name="family_name"
          dataTestId="txt-profile-info-lastname"
        >
          {getRulesIcon(
            "family_name",
            translate,
            i18n.language,
            rules,
            undefined
          )}
        </InputField>
        <InputField
          label={translate("pages.profile.fields.login")}
          required={checkRequiredIndicator("login")}
          name="login"
          dataTestId="txt-profile-info-login"
        >
          {getRulesIcon("login", translate, i18n.language, rules, undefined)}
        </InputField>
      </Box>
      {withContacts && (
        <>
          <InputField
            label={translate("pages.profile.fields.email")}
            required={checkRequiredIndicator("email")}
            name="email"
            dataTestId="txt-profile-email"
          >
            {getRulesIcon("email", translate, i18n.language, rules, undefined)}
          </InputField>
          {contactFieldOptions?.email}
          <InputField
            label={translate("pages.profile.fields.phone")}
            required={checkRequiredIndicator("phone_number")}
            name="phone_number"
            dataTestId="txt-profile-phone"
          >
            {getRulesIcon(
              "phone_number",
              translate,
              i18n.language,
              rules,
              undefined
            )}
          </InputField>
          {contactFieldOptions?.phone_number}
        </>
      )}
      <InputDate
        name={"birthdate"}
        label={translate("pages.profile.fields.birthDate")}
        disabled={editableFieldNames.includes("birthdate")}
        required={checkRequiredIndicator("birthdate")}
        dataTestId="txt-profile-info-birthdate"
      />

      <UploadAndDisplayImage
        title={translate("pages.profile.fields.profilePhoto")}
        required={checkRequiredIndicator("picture")}
        nameFieldForm="picture"
        figure="circle"
        defaultIcon={PersonOutlineOutlinedIcon}
        disabled={editableFieldNames.includes("picture")}
        onAvailableClick={onUploadPictureExternalAccounts}
      />

      {children}

      {listCustomFields.length > 0 && (
        <Box sx={{ marginBottom: "24px" }}>
          <Typography sx={{ marginBottom: "24px" }} className="text-17">
            {translate("helperText.additionalInfo")}
          </Typography>
          {listCustomFields}
        </Box>
      )}

      <ActionButtons
        cancelText={translate("actionButtons.cancel")}
        onCancel={onCancel || (() => navigate(-1))}
        submitText={translate("actionButtons.save")}
        disabled={isLoading}
      />
    </>
  );
};

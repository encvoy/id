import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { FC, ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { IUserProfile } from "src/shared/api/users";
import {
  IRuleWithValidation,
  useGetProfileFieldsQuery,
} from "src/shared/api/settings";
import { Box, Typography } from "@mui/material";
import { ActionButtons } from "./components/ActionButtons";
import { InputField } from "./components/InputBlock";
import { IconsLibrary } from "./components/IconLibrary";
import { InputDate } from "./components/InputDate";
import { IUserClient } from "src/shared/api/clients";
import { useTranslation } from "react-i18next";
import { UploadAndDisplayImage } from "./UploadAndDisplayImage";
import { isOwnerOrEditor } from "src/shared/utils/helpers";
import { useSelector } from "react-redux";
import { RootState } from "src/app/store/reducer";

interface IProfileFieldsProps {
  userProfile?: IUserProfile | IUserClient;
  isCreateUser?: boolean;
  withContacts?: boolean;
  isLoading?: boolean;
  rules?: IRuleWithValidation[];
  onUploadPictureExternalAccounts?: () => void;
  children?: ReactNode;
}

export const getRulesIcon = (
  field: string,
  rules?: IRuleWithValidation[],
  currentList?: string[]
) => {
  if (currentList?.length) {
    return (
      <IconsLibrary
        key="rules-list"
        type="rules"
        description={currentList}
        hideHovered
      />
    );
  }

  const list = rules
    ?.find((rule) => rule.field_name === field)
    ?.validations?.map((rule) => rule.title);

  return list && list.length > 0 ? (
    <IconsLibrary
      key="rules-list"
      type="rules"
      description={list}
      hideHovered
    />
  ) : undefined;
};

export const ProfileFields: FC<IProfileFieldsProps> = ({
  userProfile,
  withContacts,
  isLoading,
  rules,
  onUploadPictureExternalAccounts,
  children,
}) => {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const [editableFieldNames, setEditableFieldNames] = useState<string[]>([]);
  const { data: listProfileFields } = useGetProfileFieldsQuery();
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
      label={field.title}
      required={checkRequiredIndicator(field?.field)}
      name={`custom_fields.${field.field}`}
      mode="nested"
      errorField="custom_fields"
      errorNestedField={field.field}
    >
      {getRulesIcon(field.field, rules)}
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
        >
          {getRulesIcon("nickname", rules)}
        </InputField>
        <InputField
          label={translate("pages.profile.fields.givenName")}
          required={checkRequiredIndicator("given_name")}
          name="given_name"
        >
          {getRulesIcon("given_name", rules)}
        </InputField>
        <InputField
          label={translate("pages.profile.fields.familyName")}
          required={checkRequiredIndicator("family_name")}
          name="family_name"
        >
          {getRulesIcon("family_name", rules)}
        </InputField>
        <InputField
          label={translate("pages.profile.fields.login")}
          required={checkRequiredIndicator("login")}
          name="login"
        >
          {getRulesIcon("login", rules)}
        </InputField>
      </Box>
      {withContacts && (
        <>
          <InputField
            label={translate("pages.profile.fields.email")}
            required={checkRequiredIndicator("email")}
            name="email"
          >
            {getRulesIcon("email", rules)}
          </InputField>
          <InputField
            label={translate("pages.profile.fields.phone")}
            required={checkRequiredIndicator("phone_number")}
            name="phone_number"
          >
            {getRulesIcon("phone_number", rules)}
          </InputField>
        </>
      )}
      <InputDate
        name={"birthdate"}
        label={translate("pages.profile.fields.birthDate")}
        disabled={editableFieldNames.includes("birthdate")}
        required={checkRequiredIndicator("birthdate")}
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
        onCancel={() => navigate(-1)}
        submitText={translate("actionButtons.save")}
        disabled={isLoading}
      />
    </>
  );
};

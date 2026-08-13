import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IPrivateClaims } from "src/shared/api/users";
import { IProfileField, useGetOidcScopesQuery } from "src/shared/api/settings";
import { TCustomFields } from "src/shared/slices/userSlice";
import { CustomIcon } from "@encvoy-id/components";
import { getLocalizedTextValue } from "src/shared/utils/locales";
import { UserProfileField } from "./UserProfileField";

interface IAdditionalProfileFieldsProps {
  profileFields?: IProfileField[];
  customFields?: TCustomFields;
  privateClaims?: IPrivateClaims;
  userId?: string;
  scopeClientId: string;
  showPrivacyStatus?: boolean;
  hideEmptyFields?: boolean;
}

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
};

const formatValue = (value: unknown, notSetLabel: string) => {
  if (!hasValue(value)) {
    return notSetLabel;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
};

export const AdditionalProfileFields: FC<IAdditionalProfileFieldsProps> = ({
  profileFields,
  customFields,
  privateClaims,
  userId,
  scopeClientId,
  showPrivacyStatus = true,
  hideEmptyFields = false,
}) => {
  const { t: translate, i18n } = useTranslation();
  const { data: scopes = [] } = useGetOidcScopesQuery(scopeClientId, {
    skip: !scopeClientId,
  });

  const activeCustomFields = useMemo(
    () =>
      (profileFields || []).filter(
        (field) => field.type === "custom" && field.active
      ),
    [profileFields]
  );

  const fieldById = useMemo(
    () =>
      new Map(
        activeCustomFields
          .filter((field): field is IProfileField & { id: string } =>
            Boolean(field.id)
          )
          .map((field) => [field.id, field])
      ),
    [activeCustomFields]
  );

  const sections = useMemo(() => {
    const boundFieldIds = new Set<string>();

    const grouped = scopes
      .map((scope) => {
        const fields = scope.fields
          .map((scopeField) => {
            const field = fieldById.get(scopeField.profile_field_id);
            if (!field) {
              return null;
            }

            const rawValue = customFields?.[field.field];
            if (hideEmptyFields && !hasValue(rawValue)) {
              return null;
            }

            boundFieldIds.add(scopeField.profile_field_id);

            return {
              id: field.id || field.field,
              title: getLocalizedTextValue(field.title, i18n.language),
              fieldName: field.field,
              value: formatValue(
                rawValue,
                translate("helperText.value.notSet")
              ),
            };
          })
          .filter(Boolean) as Array<{
          id: string;
          title: string;
          fieldName: string;
          value: string;
        }>;

        if (!fields.length) {
          return null;
        }

        const inactiveSuffix = scope.active
          ? ""
          : translate("pages.settings.oidcScopes.status.inactiveSuffix");

        return {
          id: scope.id,
          title:
            getLocalizedTextValue(scope.title, i18n.language) + inactiveSuffix,
          fields,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      title: string;
      fields: Array<{
        id: string;
        title: string;
        fieldName: string;
        value: string;
      }>;
    }>;

    const ungroupedFields = activeCustomFields
      .filter((field) => !field.id || !boundFieldIds.has(field.id))
      .map((field) => {
        const rawValue = customFields?.[field.field];
        if (hideEmptyFields && !hasValue(rawValue)) {
          return null;
        }

        return {
          id: field.id || field.field,
          title: getLocalizedTextValue(field.title, i18n.language),
          fieldName: field.field,
          value: formatValue(rawValue, translate("helperText.value.notSet")),
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      title: string;
      fieldName: string;
      value: string;
    }>;

    return {
      ungroupedFields,
      groupedSections: grouped,
    };
  }, [
    activeCustomFields,
    customFields,
    fieldById,
    hideEmptyFields,
    i18n.language,
    scopes,
    translate,
  ]);

  if (!sections.ungroupedFields.length && !sections.groupedSections.length) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {sections.ungroupedFields.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {sections.ungroupedFields.map((field) => (
            <UserProfileField
              key={field.id}
              title={field.title}
              value={field.value}
              privateClaims={privateClaims}
              fieldName={field.fieldName}
              userId={userId}
              showPrivacyStatus={showPrivacyStatus}
            />
          ))}
        </Box>
      )}
      {sections.groupedSections.map((section) => (
        <Accordion key={section.id} defaultExpanded={false} disableGutters>
          <AccordionSummary
            expandIcon={<CustomIcon Icon={KeyboardArrowDownOutlinedIcon} />}
          >
            <Typography className="text-14">{section.title}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {section.fields.map((field) => (
                <UserProfileField
                  key={field.id}
                  title={field.title}
                  value={field.value}
                  privateClaims={privateClaims}
                  fieldName={field.fieldName}
                  userId={userId}
                  showPrivacyStatus={showPrivacyStatus}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

import { IProfileField } from "src/shared/api/settings";

type TCheckUniqueFieldAvailability = (params: {
  field_name: string;
  value: string;
  user_id?: string;
}) => Promise<boolean>;

export const findUnavailableUniqueCustomField = async ({
  customFields,
  profileFields,
  userId,
  checkAvailability,
}: {
  customFields?: Record<string, unknown>;
  profileFields?: IProfileField[];
  userId?: string;
  checkAvailability: TCheckUniqueFieldAvailability;
}) => {
  if (!customFields || !profileFields?.length) {
    return null;
  }

  const uniqueCustomFields = profileFields.filter(
    (field) => field.type === "custom" && field.active && field.unique
  );

  for (const field of uniqueCustomFields) {
    const rawValue = customFields[field.field];

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    const value =
      typeof rawValue === "string" ? rawValue.trim() : String(rawValue);

    if (!value) {
      continue;
    }

    const isAvailable = await checkAvailability({
      field_name: field.field,
      value,
      ...(userId ? { user_id: userId } : {}),
    });

    if (!isAvailable) {
      return field;
    }
  }

  return null;
};

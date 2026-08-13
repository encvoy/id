import { ReactElement } from "react";
import * as yup from "yup";
import { EClaimPrivacy, ERoles } from "./enums";
import { EProviderType } from "../api/provider";
import { IRuleWithValidation } from "../api/settings";
import { UseFormReturn } from "react-hook-form";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { TFileString } from "src/shared/api/types";
import { DEFAULT_SYSTEM_LANGUAGE, getLocalizedTextValue } from "./locales";
import { APP_PUBLIC_URL, withAppBase } from "./appBasePath";

export const isObjectEmpty = (
  object: Record<string, unknown>,
  excludeKeys: string[] = []
): boolean => {
  return !Object.keys(object).filter((key) => !excludeKeys.includes(key))
    .length;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getDirtyFieldsValues = <T extends Record<string, any>>(
  values: T,
  dirtyFields: Partial<Record<keyof T, unknown>>
): Partial<T> => {
  return Object.keys(dirtyFields).reduce((acc, key) => {
    const field = key as keyof T;
    const dirtyValue = dirtyFields[field];

    if (!dirtyValue) return acc;

    const currentValue = values[field];

    if (isPlainObject(dirtyValue) && isPlainObject(currentValue)) {
      const nestedValues = getDirtyFieldsValues(
        currentValue,
        dirtyValue as Partial<Record<keyof typeof currentValue, unknown>>
      );

      if (Object.keys(nestedValues).length) {
        acc[field] = nestedValues as T[keyof T];
      }

      return acc;
    }

    acc[field] = currentValue;
    return acc;
  }, {} as Partial<T>);
};

export const isOwnerOrEditor = (role?: string): boolean =>
  role === ERoles.OWNER || role === ERoles.EDITOR;

export const isAdministrator = (role?: string): boolean =>
  role === ERoles.OWNER || role === ERoles.EDITOR;

export const getImageURL = (path?: TFileString): string | undefined => {
  if (!path || typeof path !== "string") return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const publicImagesIndex = path.indexOf("public/images/");
  if (publicImagesIndex >= 0) {
    return `${APP_PUBLIC_URL}/${path.slice(publicImagesIndex)}`;
  }
  return `${APP_PUBLIC_URL}/${path.replace(/^\/+/, "")}`;
};

export const exportToJson = (
  objectData: Record<string, unknown>,
  objectName: string
) => {
  const filename = objectName;
  const contentType = "application/json;charset=utf-8;";
  const a = document.createElement("a");
  a.download = filename;
  a.href =
    "data:" +
    contentType +
    "," +
    encodeURIComponent(JSON.stringify(objectData));
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const randomString = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const generatePassword = () => {
  // Simple function to generate a password
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const replaceJSX = (
  str: string,
  find: string,
  replace: ReactElement
) => {
  const arr = str.split(find);
  return arr.flatMap((item, index) => {
    if (index !== arr.length - 1) return [item, replace];
    return item;
  });
};

export type ProviderTypeConfig = {
  [key: string]: string;
};

export const providerTitleMapping: ProviderTypeConfig = {
  [EProviderType.EMAIL]: "",
  [EProviderType.CREDENTIALS]: "",
  [EProviderType.PHONE]: "",
  [EProviderType.ETHEREUM]: "ETHEREUM",
  [EProviderType.MTLS]: "mTLS",
  [EProviderType.WEBAUTHN]: "WebAuthn",
  [EProviderType.EMAIL_CUSTOM]: "Email",
  [EProviderType.TOTP]: "TOTP",
  [EProviderType.HOTP]: "HOTP",
};

export const isValidEmail = (value: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return regex.test(value);
};

export const getProviderTitleByType = (
  type?: string,
  additionalMapping?: ProviderTypeConfig
): string => {
  const mapping: ProviderTypeConfig = {
    ...providerTitleMapping,
    ...(additionalMapping || {}),
  };

  return type && mapping[type] !== undefined
    ? mapping[type]
    : EProviderType.OAUTH;
};

export const isUrl = (value: string | undefined | null) => {
  if (!value) return false;

  const pattern =
    /^(?:([a-z0-9+.-]+):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/;

  return pattern.test(value);
};

export const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result) || "");
    reader.onerror = (error) => reject(error);
  });

export const imagesToFormData = (body: { [key: string]: TFileString }) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "string") {
      formData.append(key, value);
    } else if (value === null) {
      formData.append(key, null as unknown as Blob);
    }
  }

  return formData;
};

export const showDisplay = (): void => {
  document.body.style.display = "unset";
};

const hasClaim = (claimsString: string | undefined, claim: string) => {
  return !!claimsString
    ?.trim()
    .split(" ")
    .find((item) => item === claim);
};

export const getClaimPrivacy = (
  claim: string,
  publicProfileClaimsOauth: string | undefined,
  publicProfileClaimsGravatar: string | undefined
): EClaimPrivacy => {
  if (hasClaim(publicProfileClaimsOauth, claim)) {
    if (hasClaim(publicProfileClaimsGravatar, claim))
      return EClaimPrivacy.public;
    return EClaimPrivacy.request;
  }

  return EClaimPrivacy.private;
};

export const formatPhoneNumber = (phoneNumber: string) => {
  phoneNumber = phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber;
  try {
    const parsed = parsePhoneNumberWithError(phoneNumber);
    if (parsed) {
      // Format the number internationally with spaces.
      return parsed.formatInternational();
    }
  } catch (error) {
    // Return the input unchanged when parsing fails.
    console.error("Failed to parse phone number:", error);
  }
  return phoneNumber;
};

export const editProfileSchema = (
  rules: IRuleWithValidation[],
  locale: string = DEFAULT_SYSTEM_LANGUAGE
): yup.AnyObjectSchema => {
  if (!rules) return yup.object();
  return generateValidationSchema(rules, locale);
};

const generateValidationSchema = (
  rules: IRuleWithValidation[],
  locale: string
) => {
  const schemaFields: any = {};

  rules.forEach((field) => {
    if (!field.active) return;

    let fieldValidations = yup.mixed().nullable().notRequired();

    // Apply all active validation rules for the field
    field.validations.forEach((validation) => {
      if (validation.active) {
        fieldValidations = fieldValidations.test({
          name: `${field.field_name}-regex`,
          message: field.editable
            ? getLocalizedTextValue(validation.error, locale)
            : "Invalid value. Contact your administrator.",
          test: (value) => {
            if (
              field.required &&
              (value === null || value === undefined || value === "")
            ) {
              return true; // Skip validation if the field is required and empty
            }
            // Apply regex only if the field is not empty
            if (value === null || value === undefined || value === "") {
              // Skip validation if the field is empty
              return true;
            }

            let result = true;
            // For create user password can be anything
            if (field.field_name !== "password") {
              result = new RegExp(validation.regex).test(value);
            }

            return result;
          },
        });
      }
    });

    // Support for nested fields (e.g., "custom_fields.City")
    const keys = field.field_name.split(".");
    let current = schemaFields;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = fieldValidations;
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    });
  });

  // Recursively build Yup schema
  const buildSchema = (obj: any): yup.AnyObjectSchema => {
    const shape: any = {};
    for (const key in obj) {
      const value = obj[key];

      if (yup.isSchema(value)) {
        shape[key] = value;
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        shape[key] = buildSchema(value);
      } else {
        shape[key] = value;
      }
    }
    return yup.object().shape(shape);
  };

  return buildSchema(schemaFields).required();
};

export const handleCopy = (value: string) => {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      console.info("copied certificate success");
    })
    .catch((err) => {
      console.error("Error copied:", err);
    });
};

function sanitizeValue(value: any): any {
  // Special handling for boolean fields from strings
  if (typeof value === "string") {
    if (value.toLowerCase() === "false") return false;
    if (value.toLowerCase() === "true") return true;
  }
  return value;
}

// Helper function for recursive traversal of data
function traverseNestedFields(
  data: Record<string, any>,
  callback: (fieldPath: string, value: any) => void,
  parentPath = ""
) {
  Object.entries(data).forEach(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursive traversal for objects
      traverseNestedFields(value, callback, currentPath);
    } else if (Array.isArray(value)) {
      // Processing arrays
      value?.forEach((item, index) => {
        const arrayPath = `${currentPath}[${index}]`;
        if (typeof item === "object" && item !== null) {
          traverseNestedFields(item, callback, arrayPath);
        } else {
          callback(arrayPath, item);
        }
      });
    } else {
      // Processing simple values
      callback(currentPath, value);
    }
  });
}

// List of fields to ignore when pasting into the provider form
const listIgnore = ["id", "type", "is_active", "is_public"];

export async function handlePasteToForm(
  methods: UseFormReturn<any>,
  data?: any
): Promise<void> {
  try {
    let parsedData = data;
    if (!parsedData) {
      const text = await navigator.clipboard.readText();
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        throw new Error("Invalid data format in clipboard");
      }
    }

    // Getting current form values
    const formValues = methods.getValues();

    // Getting all registered field paths
    const registeredPaths = new Set<string>();
    traverseNestedFields(formValues, (path) => registeredPaths.add(path));

    // Updating form values
    traverseNestedFields(parsedData, (path, value) => {
      if (registeredPaths.has(path)) {
        if (listIgnore.includes(path)) {
          return;
        }
        methods.setValue(path, sanitizeValue(value), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });
  } catch (err) {
    console.error("Error to paste:", err);
    throw err;
  }
}

// Different function compares strings in an array and returns the last duplicate index
export const findDuplicateIndex = (arr: string[]): number => {
  const seen = new Set<string>();
  let result = -1;
  arr.forEach((item, index) => {
    if (seen.has(item)) {
      result = index;
    }
    seen.add(item);
  });
  return result;
};

export const refreshDashboardFavicon = async () => {
  const response = await fetch(withAppBase("/api/v1/public/branding/icon/32"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load the dashboard favicon");
  }

  let favicon = document.querySelector<HTMLLinkElement>(
    "link#dashboard-favicon"
  );

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.id = "dashboard-favicon";
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.sizes = "32x32";
    document.head.appendChild(favicon);
  }

  favicon.href = response.url;
};

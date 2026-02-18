import { ICustomStyles } from "../theme/Theme";
import { WidgetConfig } from "src/packages/authWidget";

const getEnvVar = (
  key: keyof NonNullable<Window["ENV_CONFIG"]>,
  fallback = ""
): string => {
  if (typeof window !== "undefined" && window.ENV_CONFIG) {
    const value = window.ENV_CONFIG[key];
    if (
      value &&
      value.trim() !== "" &&
      !value.startsWith("${") &&
      !value.startsWith("%VITE_")
    ) {
      return value;
    }
  }

  return import.meta.env[`VITE_${key}`] || fallback;
};

export const DOMAIN = getEnvVar("DOMAIN");

export const MANUAL_URL = getEnvVar("MANUAL_URL");

export const GRAVATAR_URL = "https://www.gravatar.com/avatar";

// Auth
export const CLIENT_ID = getEnvVar("CLIENT_ID");

const copyrightJSON = getEnvVar("COPYRIGHT");
export const COPYRIGHT = copyrightJSON ? JSON.parse(copyrightJSON) : {};

export const CUSTOM_STYLES: ICustomStyles = (() => {
  try {
    const customStyles = getEnvVar("CUSTOM_STYLES");
    return customStyles ? JSON.parse(customStyles) : {};
  } catch (error) {
    console.error("Error parsing CUSTOM_STYLES:", error);
    console.error("Raw value:", getEnvVar("CUSTOM_STYLES"));
    return {};
  }
})();

// Metrics
export const GOOGLE_METRICA_ID = getEnvVar("GOOGLE_METRICA_ID");

export const BASE_CONFIG: WidgetConfig = {
  appId: CLIENT_ID,
  issuer: DOMAIN,
  redirectUrl: DOMAIN + "/login",
  withOutHomePage: true,
};

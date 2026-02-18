import { BaseWidgetConfig, EBaseColors } from "../types";

export const getImageURL = (
  path?: string,
  backendURL?: string
): string | undefined => {
  if (!path || typeof path !== "string") return undefined;
  return path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${backendURL}/${path}`;
};

export const generateStyles = ({
  customStyles: customStyles,
}: BaseWidgetConfig) => {
  return {
    text: customStyles?.global?.color?.text || EBaseColors.primary,
    background: customStyles?.global?.color?.background || EBaseColors.main,
    borderRadius: customStyles?.global?.borderRadius || "8px",
    accountButton: {
      color: {
        text:
          customStyles?.components?.accountButton?.color.text ||
          EBaseColors.primary,
        background:
          customStyles?.components?.accountButton?.color.background ||
          EBaseColors.background,
        hover:
          customStyles?.components?.accountButton?.color.hover || undefined,
      },
      position: customStyles?.components?.accountButton?.position || "left",
    },
    primaryButton: {
      color: {
        text:
          customStyles?.components?.primaryButton?.color.text ||
          EBaseColors.main,
        background:
          customStyles?.components?.primaryButton?.color.background ||
          EBaseColors.accent,
        hover:
          customStyles?.components?.primaryButton?.color.hover || undefined,
      },
      position: customStyles?.components?.primaryButton?.position || "center",
    },
    secondaryButton: {
      color: {
        text:
          customStyles?.components?.secondaryButton?.color.text ||
          customStyles?.components?.primaryButton?.color.text ||
          EBaseColors.main,
        background:
          customStyles?.components?.secondaryButton?.color.background ||
          customStyles?.components?.primaryButton?.color.background ||
          EBaseColors.accent,
        hover:
          customStyles?.components?.secondaryButton?.color.hover ||
          customStyles?.components?.primaryButton?.color.hover ||
          undefined,
      },
      position:
        customStyles?.components?.secondaryButton?.position ||
        customStyles?.components?.primaryButton?.position ||
        "center",
    },
  };
};

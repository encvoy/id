import type {
  ThemeContentPosition,
  SystemStyle,
  ThemeConfig,
  ThemePalette,
} from "./types";

export const DEFAULT_SYSTEM_STYLE: SystemStyle = {
  component: {
    borderRadius: "0px",
  },
  button: {
    borderRadius: "0px",
  },
  contentPosition: "start",
  surfaceBlock: {
    borderWidth: "1px",
    hideBorder: false,
    boxShadow: "none",
  },
};

export const DEFAULT_THEME_PALETTE: ThemePalette = {
  primary: {
    main: "#4C6AD4",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#ECEDF0",
    contrastText: "#0B1641",
  },
  text: {
    primary: "#0B1641",
    secondary: "#858BA0",
  },
  background: {
    default: "#FFFFFF",
    paper: "#F9FAFB",
  },
  action: {
    hover: "#F1F1F4",
    disabled: "#ECEDF0",
    selected: "#CDCED3",
  },
  divider: "#E7E8EC",
  error: {
    main: "#E7000B",
  },
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  systemStyle: DEFAULT_SYSTEM_STYLE,
  themeLight: DEFAULT_THEME_PALETTE,
  themeDark: DEFAULT_THEME_PALETTE,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const normalizeString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const normalizeContentPosition = (value: unknown): ThemeContentPosition =>
  value === "start" || value === "center" || value === "end"
    ? value
    : DEFAULT_SYSTEM_STYLE.contentPosition;

export const normalizeSystemStyle = (value: unknown): SystemStyle => {
  const systemStyle = getRecord(value);
  const component = getRecord(systemStyle.component);
  const button = getRecord(systemStyle.button);
  const surfaceBlock = getRecord(systemStyle.surfaceBlock);

  return {
    component: {
      borderRadius: normalizeString(
        component.borderRadius,
        DEFAULT_SYSTEM_STYLE.component.borderRadius
      ),
    },
    button: {
      borderRadius: normalizeString(
        button.borderRadius,
        DEFAULT_SYSTEM_STYLE.button.borderRadius
      ),
    },
    contentPosition: normalizeContentPosition(systemStyle.contentPosition),
    surfaceBlock: {
      borderWidth: normalizeString(
        surfaceBlock.borderWidth,
        DEFAULT_SYSTEM_STYLE.surfaceBlock.borderWidth
      ),
      hideBorder:
        typeof surfaceBlock.hideBorder === "boolean"
          ? surfaceBlock.hideBorder
          : DEFAULT_SYSTEM_STYLE.surfaceBlock.hideBorder,
      boxShadow: normalizeString(
        surfaceBlock.boxShadow,
        DEFAULT_SYSTEM_STYLE.surfaceBlock.boxShadow
      ),
    },
  };
};

export const normalizeThemePalette = (
  value: unknown,
  fallback: ThemePalette = DEFAULT_THEME_PALETTE
): ThemePalette => {
  const palette = getRecord(value);
  const primary = getRecord(palette.primary);
  const secondary = getRecord(palette.secondary);
  const text = getRecord(palette.text);
  const background = getRecord(palette.background);
  const action = getRecord(palette.action);
  const error = getRecord(palette.error);

  return {
    primary: {
      main: normalizeString(primary.main, fallback.primary.main),
      contrastText: normalizeString(
        primary.contrastText,
        fallback.primary.contrastText
      ),
    },
    secondary: {
      main: normalizeString(secondary.main, fallback.secondary.main),
      contrastText: normalizeString(
        secondary.contrastText,
        fallback.secondary.contrastText
      ),
    },
    text: {
      primary: normalizeString(text.primary, fallback.text.primary),
      secondary: normalizeString(text.secondary, fallback.text.secondary),
    },
    background: {
      default: normalizeString(background.default, fallback.background.default),
      paper: normalizeString(background.paper, fallback.background.paper),
    },
    action: {
      hover: normalizeString(action.hover, fallback.action.hover),
      disabled: normalizeString(action.disabled, fallback.action.disabled),
      selected: normalizeString(action.selected, fallback.action.selected),
    },
    divider: normalizeString(palette.divider, fallback.divider),
    error: {
      main: normalizeString(error.main, fallback.error.main),
    },
  };
};

export const normalizeThemeConfig = (value: unknown): ThemeConfig => {
  const config = getRecord(value);

  return {
    systemStyle: normalizeSystemStyle(config.systemStyle),
    themeLight: normalizeThemePalette(config.themeLight),
    themeDark: normalizeThemePalette(config.themeDark),
  };
};

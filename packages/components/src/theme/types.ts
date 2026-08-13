export type ThemeContentPosition = "start" | "center" | "end";

export interface SurfaceBlockStyle {
  borderWidth: string;
  hideBorder: boolean;
  boxShadow: string;
}

export interface SystemStyle {
  component: {
    borderRadius: string;
  };
  button: {
    borderRadius: string;
  };
  contentPosition: ThemeContentPosition;
  surfaceBlock: SurfaceBlockStyle;
}

export interface ThemePalette {
  primary: {
    main: string;
    contrastText: string;
  };
  secondary: {
    main: string;
    contrastText: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  background: {
    default: string;
    paper: string;
  };
  action: {
    hover: string;
    disabled: string;
    selected: string;
  };
  divider: string;
  error: {
    main: string;
  };
}

export interface ThemeConfig {
  systemStyle: SystemStyle;
  themeLight: ThemePalette;
  themeDark: ThemePalette;
}

export interface ThemeTokens {
  componentBorderRadius: string;
  buttonBorderRadius: string;
  contentPosition: ThemeContentPosition;
  surfaceBlock: SurfaceBlockStyle;
}

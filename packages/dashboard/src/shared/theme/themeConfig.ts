import {
  normalizeThemeConfig,
  type ThemeConfig,
} from "@encvoy-id/components/theme";
import type { ISettings } from "src/shared/api/settings";

export const parseDashboardThemeConfig = (
  settings: Pick<ISettings, "system_style" | "theme_light" | "theme_dark">,
): ThemeConfig =>
  normalizeThemeConfig({
    systemStyle: JSON.parse(settings.system_style),
    themeLight: JSON.parse(settings.theme_light),
    themeDark: JSON.parse(settings.theme_dark),
  });

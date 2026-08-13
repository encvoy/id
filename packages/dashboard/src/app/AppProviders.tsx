import { ReactNode, useEffect, useMemo } from "react";
import { SnackbarProvider } from "notistack";
import { StyledEngineProvider, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { createAppTheme } from "@encvoy-id/components/theme";
import { parseDashboardThemeConfig } from "src/shared/theme/themeConfig";
import { ErrorBoundary } from "./ErrorBoundary";
import { Snackbar } from "./Snackbar";
import { useGetSettingsQuery } from "src/shared/api/settings";
import i18n from "src/locales/i18n";
import {APP_BASE_PATH} from "src/shared/utils/appBasePath";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const { data: settings } = useGetSettingsQuery();
  const themeConfig = useMemo(() => {
    if (!settings) {
      return null;
    }

    try {
      return parseDashboardThemeConfig(settings);
    } catch (error) {
      console.error("Error parsing theme settings:", error);
      return null;
    }
  }, [settings]);

  const appTheme = useMemo(() => {
    if (!themeConfig) {
      return null;
    }

    return createAppTheme(themeConfig);
  }, [themeConfig]);

  useEffect(() => {
    if (!themeConfig) {
      return;
    }

    document.documentElement.style.setProperty(
      "--content-position",
      themeConfig.systemStyle.contentPosition
    );
    document.documentElement.style.setProperty(
      "--mui-shape-borderRadius",
      themeConfig.systemStyle.component.borderRadius
    );
  }, [themeConfig]);

  if (!appTheme) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={appTheme} defaultMode="system">
        <StyledEngineProvider injectFirst>
          <ErrorBoundary>
            <SnackbarProvider
              anchorOrigin={{
                horizontal: "right",
                vertical: "bottom",
              }}
              Components={{
                customSnackbar: Snackbar,
              }}
            >
              <CssBaseline />
              <BrowserRouter basename={APP_BASE_PATH || undefined}>
                {children}
              </BrowserRouter>
            </SnackbarProvider>
          </ErrorBoundary>
        </StyledEngineProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

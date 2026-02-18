import { ReactNode, useEffect } from "react";
import { SnackbarProvider } from "notistack";
import {
  ThemeProvider,
  StyledEngineProvider,
  CssBaseline,
} from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import {
  componentBorderRadius,
  contentPosition,
  theme,
} from "src/shared/theme/Theme";
import { ErrorBoundary } from "./ErrorBoundary";
import { Snackbar } from "./Snackbar";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--content-position",
      contentPosition
    );
    document.documentElement.style.setProperty(
      "--mui-shape-borderRadius",
      componentBorderRadius
    );
  }, []);

  return (
    <ThemeProvider theme={theme()}>
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
            <BrowserRouter>{children}</BrowserRouter>
          </SnackbarProvider>
        </ErrorBoundary>
      </StyledEngineProvider>
    </ThemeProvider>
  );
};

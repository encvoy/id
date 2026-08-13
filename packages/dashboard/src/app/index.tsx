import { createRoot } from "react-dom/client";
import "@encvoy-id/components/styles.css";
import { Provider } from "react-redux";
import { AppProviders } from "src/app/AppProviders";
import { store } from "src/app/store/store";
import { getUrlParams, login } from "src/packages/authWidget/helpers/auth";
import { setSystemClientId } from "src/shared/slices/appSlice";
import {
  clearAccessToken,
  fetchAuthConfig,
  getAccessToken,
  isAccessTokenExpired,
} from "src/shared/utils/auth";
import { createBaseConfig } from "src/shared/utils/constants";
import "../locales/i18n";
import { ENoticeType } from "../shared/utils/enums";
import { App } from "./App";

declare module "notistack" {
  interface VariantOverrides {
    customSnackbar: {
      snackbarVariant: ENoticeType;
    };
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}
const root = createRoot(container);

async function bootstrapSystemClientId(): Promise<string> {
  const { system_client_id } = await fetchAuthConfig();
  store.dispatch(setSystemClientId(system_client_id));
  return system_client_id;
}

async function initAuth() {
  try {
    const systemClientId = await bootstrapSystemClientId();
    const code = getUrlParams();
    if (!code) {
      const token = getAccessToken();
      const expiresIn = localStorage.getItem("expiresIn");

      if (!token || !expiresIn || isAccessTokenExpired()) {
        clearAccessToken();
        login(createBaseConfig(systemClientId));
        return;
      }
    }

    root.render(
      <Provider store={store}>
        <AppProviders>
          <App />
        </AppProviders>
      </Provider>
    );
  } catch (error) {
    console.error("Dashboard bootstrap error:", error);
  }
}

initAuth().catch((error) => {
  console.error("Dashboard initialization error:", error);
});

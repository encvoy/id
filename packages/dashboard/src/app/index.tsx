import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ENoticeType } from "../shared/utils/enums";
import "../locales/i18n";
import { getUrlParams, login } from "src/packages/authWidget/helpers/auth";
import { getAccessToken } from "src/shared/utils/auth";
import { BASE_CONFIG } from "src/shared/utils/constants";
import { AppProviders } from "src/app/AppProviders";
import { Provider } from "react-redux";
import { store } from "src/app/store/store";

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

async function initAuth() {
  const code = getUrlParams();
  const token = getAccessToken();

  if (!token && !code) {
    login(BASE_CONFIG);
    return;
  }

  root.render(
    <Provider store={store}>
      <AppProviders>
        <App />
      </AppProviders>
    </Provider>
  );
}

initAuth().catch(console.error);

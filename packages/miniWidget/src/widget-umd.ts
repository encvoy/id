import { WidgetAPI } from "./index";
import { WidgetConfig } from "./types";

declare global {
  interface Window {
    Widget: typeof WidgetAPI;
  }
}

(function () {
  if (!WidgetAPI || !WidgetAPI.create) {
    console.error("Widget: Failed to initialize API, WidgetAPI is not defined");
    return;
  }

  window.Widget = WidgetAPI;

  const getConfigFromDataAttributes = (
    element: HTMLElement,
  ): Partial<WidgetConfig> => {
    const config: Partial<WidgetConfig> = {};

    const appId = element.getAttribute("data-app-id");
    const redirectUrl = element.getAttribute("data-redirect-url");
    const issuer = element.getAttribute("data-issuer");
    const withOutHomePage = element.getAttribute("data-without-homepage");

    if (appId) config.appId = appId;
    if (redirectUrl) config.redirectUrl = redirectUrl;
    if (issuer) config.issuer = issuer;
    if (withOutHomePage) config.withOutHomePage = withOutHomePage === "true";

    return config;
  };

  const autoMount = () => {
    const container = document.getElementById("auth-widget");
    if (container) {
      const dataConfig = getConfigFromDataAttributes(container);

      if (!dataConfig.appId || !dataConfig.issuer || !dataConfig.redirectUrl) {
        console.error(
          "Required configuration parameters are missing. Specify the data-app-id, data-backend-url, and data-redirect-url attributes on the auth-widget element.",
        );
        return;
      }

      try {
        const config = dataConfig as WidgetConfig;
        const instance = WidgetAPI.create(config);
        instance.mount("auth-widget");
      } catch (error) {
        console.error("Widget: Error mounting widget:", error);
      }
    } else {
      console.error("Widget: Element with id 'auth-widget' not found");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
})();

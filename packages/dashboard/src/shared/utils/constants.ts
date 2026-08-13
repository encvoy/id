import { TrustedWidgetConfig } from "src/packages/authWidget";
import {APP_PUBLIC_URL} from "./appBasePath";

export const createBaseConfig = (
  systemClientId: string
): TrustedWidgetConfig => ({
  appId: systemClientId,
  issuer: APP_PUBLIC_URL,
  redirectUrl: `${APP_PUBLIC_URL}/login`,
  withOutHomePage: true,
});

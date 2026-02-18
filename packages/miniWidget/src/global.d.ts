import { WidgetConfig, WidgetInstance } from "./types";

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

interface WidgetAPI {
  create(config: WidgetConfig): WidgetInstance;
}

declare global {
  interface Window {
    Widget: WidgetAPI;
  }
}

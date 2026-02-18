import React from "react";
import { createRoot } from "react-dom/client";
import { Widget } from "../../dashboard/src/packages/authWidget/components/Widget";
import { WidgetConfig, WidgetInstance } from "./types";

export const create = (config: WidgetConfig): WidgetInstance => {
  let root: any = null;
  let container: HTMLElement | null = null;

  const mount = (containerId: string) => {
    container = document.getElementById(containerId);
    if (!container) {
      console.error(`Widget: Element with id "${containerId}" not found`);
      return;
    }

    root = createRoot(container);
    root.render(React.createElement(Widget, { config }));
  };

  const unmount = () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };

  const destroy = () => {
    unmount();
    container = null;
  };

  return {
    mount,
    unmount,
    destroy,
  };
};

export const WidgetAPI = {
  create,
};

export type { WidgetInstance, WidgetConfig };

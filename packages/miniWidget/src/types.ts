export * from "../../dashboard/src/packages/authWidget";

export interface WidgetInstance {
  mount: (containerId: string) => void;
  unmount: () => void;
  destroy: () => void;
}

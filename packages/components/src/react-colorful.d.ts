declare module "react-colorful" {
  import type { ComponentType } from "react";

  export const HexColorPicker: ComponentType<{
    color: string;
    onChange: (color: string) => void;
    className?: string;
  }>;
}

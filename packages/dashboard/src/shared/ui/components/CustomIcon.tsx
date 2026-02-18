import { CSSProperties, ElementType, FC } from "react";
import { SxProps, Theme, useTheme } from "@mui/material/styles";
import { SvgIconProps } from "@mui/material/SvgIcon";

type ThemeColors =
  | "textPrimary"
  | "textSecondary"
  | "primaryMain"
  | "secondaryContrast"
  | "error"
  | "custom";

interface ICustomIconProps {
  Icon: ElementType<SvgIconProps>;
  color?: ThemeColors;
  colorHex?: string;
  className?: string;
  style?: CSSProperties;
  sx?: SxProps<Theme>;
}

/**
 * Component that displays an MUI icon with pre-prepared color variants from the theme.
 * @component
 * @param Icon - Icon component (e.g., Material UI Icon).
 * @param color - Additional color (grey, error, link, etc.).
 * @param colorHex
 * @param className - Custom CSS class for styling.
 * @param style
 * @param sx - Custom sx for component styling.
 */
export const CustomIcon: FC<ICustomIconProps> = ({
  Icon,
  color,
  colorHex,
  className,
  style,
  sx,
}) => {
  const theme = useTheme();

  const getColor = () => {
    if (color === "textPrimary") return theme.palette.text.primary;
    if (color === "textSecondary") return theme.palette.text.secondary;
    if (color === "primaryMain") return theme.palette.primary.main;
    if (color === "secondaryContrast")
      return theme.palette.secondary.contrastText;
    if (color === "error") return theme.palette.error.main;
    if (color === "custom") return colorHex;
    return theme.palette.text.primary;
  };

  return (
    <Icon
      className={className}
      sx={{ color: getColor(), ...sx }}
      style={style}
    />
  );
};

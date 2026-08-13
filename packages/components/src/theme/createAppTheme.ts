import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import {
  alpha,
  createTheme,
  PaletteOptions,
  Theme,
} from "@mui/material/styles";
import "@mui/material/styles";
import { createElement } from "react";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import { DEFAULT_THEME_CONFIG } from "./config";
import type { ThemeConfig, ThemePalette, ThemeTokens } from "./types";

declare module "@mui/material/styles" {
  interface TypeBackground {
    hover?: string;
  }

  interface Theme {
    encvoy: ThemeTokens;
  }

  interface ThemeOptions {
    encvoy?: Partial<ThemeTokens>;
  }
}

const toPaletteOptions = (palette: ThemePalette): PaletteOptions => ({
  primary: {
    main: palette.primary.main,
    contrastText: palette.primary.contrastText,
  },
  secondary: {
    main: palette.secondary.main,
    contrastText: palette.secondary.contrastText,
  },
  text: {
    primary: palette.text.primary,
    secondary: palette.text.secondary,
  },
  background: {
    default: palette.background.default,
    paper: palette.background.paper,
  },
  action: {
    hover: palette.action.hover,
    disabled: palette.action.disabled,
    selected: palette.action.selected,
  },
  divider: palette.divider,
  error: {
    main: palette.error.main,
  },
});

const parseRadiusValue = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const darkenHex = (hex: string, percent: number): string => {
  const normalizedHex = hex.startsWith("#") ? hex.slice(1) : hex;

  let r = parseInt(normalizedHex.slice(0, 2), 16);
  let g = parseInt(normalizedHex.slice(2, 4), 16);
  let b = parseInt(normalizedHex.slice(4, 6), 16);

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

const lightenHex = (hex: string, percent: number): string => {
  const normalizedHex = hex.startsWith("#") ? hex.slice(1) : hex;

  let r = parseInt(normalizedHex.slice(0, 2), 16);
  let g = parseInt(normalizedHex.slice(2, 4), 16);
  let b = parseInt(normalizedHex.slice(4, 6), 16);

  r = Math.max(0, Math.min(255, Math.floor(r + (255 - r) * (percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g + (255 - g) * (percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b + (255 - b) * (percent / 100))));

  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

const getSoftChipColorStyles = (
  theme: Theme,
  color: "success" | "warning" | "error"
) => {
  const mainColor = theme.palette[color].main;
  const backgroundOpacity = theme.palette.mode === "dark" ? 0.24 : 0.12;
  const hoverOpacity = theme.palette.mode === "dark" ? 0.32 : 0.18;

  return {
    backgroundColor: alpha(mainColor, backgroundOpacity),
    color: mainColor,
    "& .MuiChip-icon": {
      color: `${mainColor} !important`,
    },
    "& .MuiChip-deleteIcon": {
      color: alpha(mainColor, 0.72),
      "&:hover": {
        color: mainColor,
      },
    },
    "&.MuiChip-clickable:hover": {
      backgroundColor: alpha(mainColor, hoverOpacity),
    },
    "&.Mui-focusVisible": {
      backgroundColor: alpha(mainColor, hoverOpacity),
    },
  };
};

export const createAppTheme = ({
  systemStyle,
  themeLight,
  themeDark,
}: ThemeConfig = DEFAULT_THEME_CONFIG) => {
  return createTheme({
    cssVariables: true,
    shape: {
      borderRadius: parseRadiusValue(systemStyle.component.borderRadius),
    },
    encvoy: {
      componentBorderRadius: systemStyle.component.borderRadius,
      buttonBorderRadius: systemStyle.button.borderRadius,
      contentPosition: systemStyle.contentPosition,
      surfaceBlock: {
        borderWidth: systemStyle.surfaceBlock.borderWidth,
        hideBorder: systemStyle.surfaceBlock.hideBorder,
        boxShadow: systemStyle.surfaceBlock.boxShadow,
      },
    },
    colorSchemes: {
      light: {
        palette: toPaletteOptions(themeLight),
      },
      dark: {
        palette: toPaletteOptions(themeDark),
      },
    },
    components: {
      MuiPopover: {
        styleOverrides: {
          paper: ({ theme }) => ({
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            padding: "8px",
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.encvoy.componentBorderRadius,
          }),
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiButtonBase-root": {
              color: theme.palette.text.primary,
            },
          }),
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: ({ theme }) => ({
            fontSize: 14,
            color: theme.palette.text.secondary,
          }),
        },
      },
      MuiPickersOutlinedInput: {
        styleOverrides: {
          notchedOutline: ({ theme }) => ({
            borderColor: theme.palette.divider,
            "&:hover": {
              borderColor: theme.palette.primary.main,
            },
          }),
          root: ({ theme }) => ({
            "&:hover": {
              "& .MuiPickersOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
            },
            "&.Mui-focused": {
              "& .MuiPickersOutlinedInput-notchedOutline": {
                borderColor: "secondary.main",
                borderWidth: "2px",
              },
            },
          }),
        },
      },
      MuiTextField: {
        variants: [
          {
            props: { variant: "standard" },
            style: ({ theme }) => ({
              "& .MuiInput-root": {
                borderRadius: theme.encvoy.componentBorderRadius,
                border: `1px solid ${theme.palette.divider}`,
                outlineColor: theme.palette.divider,
                minHeight: 40,
                boxSizing: "border-box",
                color: theme.palette.text.primary,
                padding: "0px 0px 0px 16px",
                transition: "outline 0.3s",
                "&:hover": {
                  outlineStyle: "solid",
                  outlineWidth: 2,
                  outlineColor: theme.palette.divider,
                },
                "&.Mui-focused": {
                  border: `1px solid ${lightenHex(
                    theme.palette.primary.main,
                    50
                  )}`,
                  outline: `1px solid ${lightenHex(
                    theme.palette.primary.main,
                    50
                  )}`,
                },
                "&.Mui-disabled": {
                  background: theme.palette.action.disabled,
                  color: theme.palette.text.secondary,
                  outlineWidth: 0,
                  "&.MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                },
                "&.Mui-disabled .MuiInputBase-input": {
                  border: "none",
                },
                "&::before": {
                  display: "none",
                },
                "&::after": {
                  display: "none",
                },
                "& textarea": {
                  "&.MuiInput-input": {
                    outline: "none",
                    resize: "none",
                    fontFamily: "Inter",
                  },
                },
                "&.Mui-error.Mui-focused": {
                  border: `1px solid ${theme.palette.error.main}`,
                  outline: `1px solid ${theme.palette.error.main}`,
                },
                "&.Mui-error .MuiInputBase-input": {
                  borderColor: theme.palette.error.main,
                },
              },
              "& .MuiFormHelperText-root": {
                marginTop: 8,
              },
              "& .Mui-error": {
                borderColor: theme.palette.error.main,
                borderWidth: "1px",
              },
            }),
          },
        ],
      },
      MuiSwitch: {
        styleOverrides: {
          root: ({ theme }) => ({
            width: 41,
            height: 20,
            padding: 0,
            "& .MuiSwitch-switchBase": {
              padding: 0,
              transitionDuration: "300ms",
              transform: "translateX(2px) translateY(2px)",
              "&.Mui-disabled": {
                opacity: 0.5,
              },
              "&.Mui-checked": {
                transform: "translateX(23px) translateY(2px)",
                color: theme.palette.text.secondary,
                "& + .MuiSwitch-track": {
                  backgroundColor: theme.palette.primary.main,
                  opacity: 1,
                  border: 0,
                },
                "& .MuiSwitch-thumb": {
                  backgroundColor: theme.palette.primary.contrastText,
                },
                "&.Mui-disabled + .MuiSwitch-track": {
                  opacity: 0.5,
                },
              },
              "&.Mui-disabled + .MuiSwitch-track": {
                opacity: 0.2,
              },
            },
            "& .MuiSwitch-thumb": {
              boxSizing: "border-box",
              width: 16,
              height: 16,
              backgroundColor: theme.palette.primary.contrastText,
            },
            "& .MuiSwitch-track": {
              border: "1px solid #9DA2B3",
              borderRadius: "10px",
              backgroundColor: theme.palette.text.secondary,
              opacity: 1,
            },
          }),
        },
      },
      MuiAutocomplete: {
        defaultProps: {
          popupIcon: createElement(KeyboardArrowDownOutlinedIcon),
        },
      },
      MuiSelect: {
        defaultProps: {
          IconComponent: KeyboardArrowDownOutlinedIcon,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            width: "100%",
            borderRadius: theme.encvoy.componentBorderRadius,
            transition: "outline 0.3s",
            outlineColor: theme.palette.divider,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.divider,
              borderRadius: theme.encvoy.componentBorderRadius,
            },
            "&:hover": {
              outlineStyle: "solid",
              outlineWidth: 2,
              outlineColor: theme.palette.divider,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
            },
            "&.Mui-focused": {
              outlineWidth: 1,
              borderColor: lightenHex(theme.palette.primary.main, 50),
              outlineColor: lightenHex(theme.palette.primary.main, 50),
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: lightenHex(theme.palette.primary.main, 50),
              },
            },
            "&.Mui-disabled": {
              background: theme.palette.action.disabled,
              color: theme.palette.text.secondary,
              borderRadius: theme.encvoy.componentBorderRadius,
              outlineWidth: 0,
              "& .MuiOutlinedInput-notchedOutline": {
                borderWidth: 0,
              },
            },
          }),
          select: ({ theme }) => ({
            padding: "8px 14px",
            borderRadius: theme.encvoy.componentBorderRadius,
          }),
          icon: ({ theme }) => ({
            color: theme.palette.text.secondary,
          }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.encvoy.componentBorderRadius,
            "&.Mui-selected": {
              backgroundColor: `${theme.palette.action.selected} !important`,
            },
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: "transparent",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState, theme }) => ({
            padding: "7px 24px",
            fontSize: 14,
            borderRadius: theme.encvoy.buttonBorderRadius,
            textTransform: "none",
            "& .MuiButton-endIcon": {
              margin: 0,
            },
            "& .MuiButton-startIcon": {
              margin: 0,
            },
            minWidth: 0,
            "&.MuiButton-contained": {
              ...(ownerState.startIcon && {
                padding: "7px 8px",
                flexShrink: 0,
              }),
            },
          }),
        },
        variants: [
          {
            props: { variant: "text" },
            style: ({ theme }) => ({
              width: "auto",
              padding: 0,
              color: theme.palette.primary.main,
              backgroundColor: "transparent",
              "&:hover": {
                textDecoration: "underline",
              },
              "&.Mui-focusVisible": {
                outline: `2px solid ${theme.palette.text.primary}`,
              },
              "&:disabled": {
                opacity: 0.6,
              },
            }),
          },
          {
            props: { variant: "text", color: "secondary" },
            style: ({ theme }) => ({
              color: theme.palette.text.primary,
              width: "100%",
              justifyContent: "flex-start",
              padding: "8px",
              ":hover": {
                backgroundColor: theme.palette.action.hover,
                textDecoration: "none",
              },
            }),
          },
          {
            props: { variant: "contained" },
            style: ({ theme }) => ({
              border: `1px solid ${theme.palette.primary.main}`,
              transition: "background-color 0.4s ease",
              color: theme.palette.primary.contrastText,
              backgroundColor: theme.palette.primary.main,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: darkenHex(theme.palette.primary.main, 20),
                boxShadow: "none",
              },
              "&.Mui-focusVisible": {
                outline: `2px solid ${theme.palette.text.primary}`,
              },
              "&:disabled": {
                opacity: 0.5,
                color: theme.palette.primary.contrastText,
                backgroundColor: theme.palette.primary.main,
              },
            }),
          },
          {
            props: { variant: "contained", color: "secondary" },
            style: ({ theme }) => ({
              border: `1px solid ${theme.palette.secondary.main}`,
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
              "&.MuiButtonBase-root:hover": {
                backgroundColor: darkenHex(theme.palette.secondary.main, 20),
              },
              "& .MuiButton-endIcon path": {
                fill: theme.palette.secondary.contrastText,
              },
              "& .MuiButton-startIcon path": {
                fill: theme.palette.secondary.contrastText,
              },
              "&:disabled": {
                opacity: 0.5,
                color: theme.palette.secondary.contrastText,
                backgroundColor: theme.palette.secondary.main,
              },
            }),
          },
          {
            props: { variant: "outlined" },
            style: ({ theme }) => ({
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.contrastText,
              borderColor: theme.palette.primary.main,
              "&.MuiButtonBase-root:hover": {
                backgroundColor: lightenHex(theme.palette.primary.main, 60),
                color: theme.palette.primary.main,
              },
              "&.Mui-disabled": {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                opacity: 0.6,
              },
            }),
          },
        ],
      },
      MuiAccordion: {
        styleOverrides: {
          root: ({ theme }) => ({
            "&.Mui-expanded": {
              margin: 0,
            },
            backgroundColor: theme.palette.background.default,
            boxShadow: "none",
          }),
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          expandIconWrapper: ({ theme }) => ({
            padding: "2px",
            borderRadius: "20px",
            backgroundColor: "transparent",
            "&.MuiAccordionSummary-expandIconWrapper:hover": {
              "&::after": {
                content: '""',
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.main,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                zIndex: -1,
              },
            },
            "&.MuiAccordionSummary-expandIconWrapper > svg": {
              fill: theme.palette.text.secondary,
              transition: "none",
            },
            "&.MuiAccordionSummary-expandIconWrapper:hover > svg": {
              fill: theme.palette.primary.contrastText,
            },
          }),
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            cursor: "pointer",
            color: theme.palette.primary.main,
            fontSize: 14,
            textDecoration: "none",
            ":hover": {
              textDecoration: "underline",
            },
          }),
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&[data-variant="segmented"]': {
              display: "inline-flex",
              width: "fit-content",
              "& .MuiTabs-flexContainer": {
                height: "auto",
                gap: 8,
                padding: "6px",
                borderRadius: theme.encvoy.componentBorderRadius,
                backgroundColor: theme.palette.background.paper,
                overflow: "hidden",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root": {
                minWidth: 0,
                padding: "14px 22px",
                borderRadius: theme.encvoy.componentBorderRadius,
                color: theme.palette.text.secondary,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.2,
                gap: 12,
                transition:
                  "background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                "& .MuiSvgIcon-root": {
                  Height: 24,
                  Width: 24,
                },
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
                "&.Mui-selected": {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 24px rgba(0, 0, 0, 0.28)"
                      : "0 4px 20px rgba(0, 0, 0, 0.1)",
                },
              },
            },
          }),
          flexContainer: ({ theme }) => ({
            height: "56px",
            backgroundColor: theme.palette.background.default,
            gap: 32,
            alignItems: "center",
          }),
          indicator: ({ theme }) => ({
            backgroundColor: theme.palette.text.primary,
          }),
        },
      },
      MuiTab: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            color: theme.palette.text.secondary,
            minHeight: 0,
            textTransform: "none",
            "&.Mui-selected": {
              color: theme.palette.text.primary,
            },
            "& .MuiTab-iconWrapper, & .MuiTab-icon": {
              marginBottom: 0,
              marginRight: 0,
            },
            fontSize: 14,
          }),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            background: theme.palette.text.primary,
            color: theme.palette.background.default,
          }),
          arrow: ({ theme }) => ({
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiCheckbox: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.divider,
            backgroundColor: "transparent",
            borderRadius: "2px",
            transition: "color 0.4s ease",
            ":hover": {
              color: theme.palette.primary.main,
              backgroundColor: "transparent",
            },
            "&.Mui-checked": {
              color: theme.palette.primary.main,
            },
            "&.Mui-disabled": {
              opacity: 0.4,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.encvoy.componentBorderRadius,
            fontWeight: 500,
            transition:
              "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease,",
            "&.MuiChip-filled.MuiChip-colorSuccess": getSoftChipColorStyles(
              theme,
              "success"
            ),
            "&.MuiChip-filled.MuiChip-colorWarning": getSoftChipColorStyles(
              theme,
              "warning"
            ),
            "&.MuiChip-filled.MuiChip-colorError": getSoftChipColorStyles(
              theme,
              "error"
            ),
            "&.MuiChip-clickable:hover": {
              boxShadow: "none",
            },
          }),
          label: {
            paddingLeft: 12,
            paddingRight: 12,
          },
        },
      },
    },
  });
};

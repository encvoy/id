import { createTheme, PaletteOptions } from "@mui/material/styles";
import { CUSTOM_STYLES } from "../utils/constants";
import "@mui/material/styles";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";

declare module "@mui/material/styles" {
  interface TypeBackground {
    hover?: string;
  }
}

import type {} from "@mui/x-date-pickers/themeAugmentation";

export interface IPalette {
  white?: Partial<IColors>;
  dark?: Partial<IColors>;
}

export interface IColors {
  accent: string;
  accentHover: string;
  onAccentColor: string;
  secondaryAccent: string;
  secondaryAccentHover: string;
  onSecondaryAccentColor: string;
  outlinedColor: string;
  outlinedBackgroundColor: string;
  borderColor: string;
  outlinedHoverBackgroundColor: string;
  outlinedHoverBorderColor: string;
  mainColor: string;
  secondaryColor: string;
  errorColor: string;
  mainGreyColor: string;
  secondaryGreyColor: string;
  linkColor: string;
  backgroundColor: string;
  buttonBackgroundColor: string;
  buttonColor: string;
  backgroundSelectedColor: string;
  backgroundDisabledColor: string;
  backgroundHoverColor: string;
  backgroundDarkenedColor: string;
}

export interface ICustomStyles {
  contentPosition?: "start" | "center" | "end";
  isAccordionIconColored?: boolean;
  palette?: IPalette;
  button?: {
    borderRadius?: string;
  };
  component?: {
    borderRadius?: string;
  };
  widget: {
    backgroundColor?: string;
    color?: string;
    displayText?: boolean;
    button: {
      background?: string;
      hover?: string;
      color?: string;
    };
  };
}

export const buttonBorderRadius = CUSTOM_STYLES.button?.borderRadius
  ? CUSTOM_STYLES.button?.borderRadius
  : "0px";

export const componentBorderRadius = CUSTOM_STYLES.component?.borderRadius
  ? CUSTOM_STYLES.component?.borderRadius
  : "0px";

export const isAccordionIconColored = CUSTOM_STYLES.isAccordionIconColored
  ? CUSTOM_STYLES.isAccordionIconColored
  : false;
export const contentPosition = CUSTOM_STYLES.contentPosition
  ? CUSTOM_STYLES.contentPosition
  : "start";

const lightPalette = CUSTOM_STYLES?.palette?.white;

export const themeColors: { light: PaletteOptions; dark: PaletteOptions } = {
  light: {
    primary: {
      main: lightPalette?.accent || "#4C6AD4",
      contrastText: lightPalette?.onAccentColor || "#fff",
    },
    secondary: {
      main: lightPalette?.secondaryAccent || "#ecedf0",
      contrastText: lightPalette?.onSecondaryAccentColor || "#0B1641",
    },
    text: {
      primary: lightPalette?.mainColor || "#0B1641",
      secondary: lightPalette?.mainGreyColor || "#858BA0",
    },
    background: {
      default: lightPalette?.backgroundColor || "#FFFFFF",
      paper: lightPalette?.buttonBackgroundColor || "#F9FAFB",
      hover: lightPalette?.buttonBackgroundColor || "#f1f1f4",
    },
    action: {
      hover: lightPalette?.backgroundHoverColor || "#f1f1f4",
      disabled: lightPalette?.backgroundDisabledColor || "#ECEDF0",
      selected: lightPalette?.backgroundSelectedColor || "#cdced3",
    },
    divider: lightPalette?.secondaryGreyColor || "#E7E8EC",
    error: { main: lightPalette?.errorColor || "#E7000B" },
  },
  dark: {
    primary: { main: "#ff6f00", contrastText: "#ffffff" },
    secondary: { main: "#fae9de", contrastText: "#5c2927" },
    text: {
      primary: "#0B1641",
      secondary: "#858BA0",
    },
    action: {
      hover: "#f1f1f4",
      disabled: "#ECEDF0",
      selected: "#cdced3",
    },
    background: {
      default: "#FFFFFF",
      paper: "#F9FAFB",
      hover: "#f1f1f4",
    },
    divider: "#E7E8EC",
    error: { main: "#E7000B" },
  },
};

function darkenHex(hex: string, percent: number): string {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

  const darkenedHex =
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

  return darkenedHex;
}

function lightenHex(hex: string, percent: number): string {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  r = Math.max(0, Math.min(255, Math.floor(r + (255 - r) * (percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g + (255 - g) * (percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b + (255 - b) * (percent / 100))));

  const lightenedHex =
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

  return lightenedHex;
}

export const theme = () => {
  return createTheme({
    cssVariables: true,
    colorSchemes: {
      light: {
        palette: themeColors.light,
      },
      dark: {
        palette: themeColors.dark,
      },
    },
    components: {
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
                borderRadius: componentBorderRadius,
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
                "&.Mui-disabled .MuiInputBase-input": { border: "none" },
                "&::before": { display: "none" },
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
      MuiSelect: {
        defaultProps: {
          IconComponent: KeyboardArrowDownOutlinedIcon,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            width: "100%",
            borderRadius: componentBorderRadius,
            transition: "outline 0.3s",
            outlineColor: theme.palette.divider,

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.divider,
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
              borderRadius: componentBorderRadius,
              outlineWidth: 0,

              "& .MuiOutlinedInput-notchedOutline": {
                borderWidth: 0,
              },
            },
          }),
          select: {
            padding: "8px 14px",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            "&.Mui-selected": {
              backgroundColor: `${theme.palette.action.selected} !important`,
            },
          }),
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
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
          root: ({ ownerState }) => ({
            padding: "7px 24px",
            fontSize: 14,
            borderRadius: buttonBorderRadius,
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
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: componentBorderRadius,
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
                backgroundColor: isAccordionIconColored
                  ? theme.palette.primary.main
                  : "transparent",
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
              fill:
                isAccordionIconColored && theme.palette.primary.contrastText,
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
          flexContainer: ({ theme }) => ({
            height: "56px",
            backgroundColor: theme.palette.background.default,
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
            color: theme.palette.text.secondary,
            minHeight: 0,
            "&.Mui-selected": {
              color: theme.palette.text.primary,
            },
            ":not(:first-child)": {
              marginLeft: 32,
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
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
            backgroundColor: "transparent",
            opacity: 0.8,
            borderRadius: "2px",
            ":hover": {
              opacity: 0.6,
              backgroundColor: "transparent",
            },
            "&.Mui-checked": {
              color: theme.palette.primary.main,
            },
            "&.Mui-disabled": {
              color: theme.palette.action.disabled,
            },
          }),
        },
      },
    },
  });
};

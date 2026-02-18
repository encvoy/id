import { Components, createTheme } from '@mui/material/styles';
import { Theme } from '@mui/system';
import '@mui/material/Avatar';
import { WIDGET } from '@/lib/constant';

declare module '@mui/material/Avatar' {
  interface AvatarPropsVariantOverrides {
    custom: true;
  }
}

export const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#E7000B', secondary: '#FFFFFF' },
  text: {
    primary: '#000000',
    secondary: '#98A1AE',
    contrastText: '#FFFFFF',
  },
  action: {
    hover: '#E9EBEF',
  },
  background: {
    default: '#ffffff',
    paper: '#F9FAFB',
    level1: '#E2E1E5',
  },
  divider: '#0000001f',
  error: { main: '#E7000B' },
};

// export const darkPalette = lightPalette;

const sharedComponents: Components<Theme> = {
  MuiList: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiTypography: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        fontSize: 14,
        color: theme.palette.text.primary,
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        color: theme.palette.text.primary,
        padding: '10px 12px',
        borderRadius: 20,
        boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
        width: '100%',
        minWidth: 'unset',
        maxWidth: 400,
        fontSize: 14,
        transition: 'background-color 0.2s ease',
        backgroundColor: theme.palette.primary.secondary,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-disabled': {
          opacity: 0.6,
        },
        '.MuiButton-startIcon': {
          '& .MuiAvatar-root': {
            width: 30,
            height: 30,
          },
        },
      }),
      contained: ({ theme }: { theme: Theme }) => ({
        boxShadow: 'none',
        color: theme.palette.text.contrastText,
        backgroundColor: theme.palette.primary.main,
        transition: 'filter 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          filter: 'brightness(80%)',
          boxShadow: 'none',
        },
      }),
    },
  },
  MuiAvatar: {
    variants: [
      {
        props: { variant: 'custom' },
        style: ({ theme }: { theme: Theme }) => ({
          backgroundColor: theme.palette.background.default,
          padding: '2px',
        }),
      },
    ],
  },

  //#region Input
  MuiOutlinedInput: {
    styleOverrides: {
      input: {
        padding: '10px 14px',
        outline: 'none',
      },
      root: ({ theme }: { theme: Theme }) => ({
        borderRadius: 20,
        backgroundColor: theme.palette.background.paper,
        transition: 'outline 0.1s',
        outlineColor: theme.palette.action.hover,

        '&:hover': {
          outlineStyle: 'solid',
          outlineWidth: 2,
          outlineColor: theme.palette.action.hover,
        },
        '&.Mui-focused': {
          outlineWidth: 4,
          outlineColor: theme.palette.action.hover,
          outlineStyle: 'solid',
        },
        '&.Mui-disabled': {
          outlineWidth: 0,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: 0,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 0,
        },
      }),
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        width: '100%',
        '.MuiInputBase-adornedEnd': {
          paddingRight: 0,
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        minHeight: 42,

        '&.Mui-expanded': {
          minHeight: 42,
        },
      },
      content: {
        '&.Mui-expanded': {
          margin: '12px 0',
        },
      },
    },
  },
  //#endregion Input
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        padding: 0,
        margin: 0,
        width: 42,
        height: 42,
        borderRadius: '50%',
        backgroundColor: theme.palette.background.paper,
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.background.level1,
        },
      }),
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: ({ theme }: { theme: Theme }) => ({
        borderRadius: 20,
        boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
        padding: 16,
        backgroundColor: theme.palette.background.default,
      }),
    },
  },
  MuiCheckbox: {
    defaultProps: {
      disableRipple: true,
    },
  },
};

const themeWithVars = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        ...lightPalette,
        primary: {
          main: WIDGET?.COLORS?.button_color
            ? WIDGET.COLORS.button_color
            : lightPalette.primary.main,
        },
      },
    },
  },
  components: sharedComponents,
});

export default themeWithVars;

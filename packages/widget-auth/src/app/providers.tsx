'use client';

import { StyledEngineProvider } from '@mui/system';
import themeWithVars from '@/theme/theme';
import { FC, ReactNode, useEffect } from 'react';
import { ThemeProvider, useColorScheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ContrastIcon from '@mui/icons-material/Contrast';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import i18next from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';
import { PROJECT_NAME, WIDGET } from '@/lib/constant';

function DynamicFavicon() {
  useEffect(() => {
    if (!WIDGET?.LOGO) return;

    document
      .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.remove());
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = link.href = `${window.location.origin}/${WIDGET.LOGO}`;

    if (PROJECT_NAME) {
      document.title = PROJECT_NAME;
    } else {
      document.title = 'Auth widget';
    }
  }, [WIDGET?.LOGO]);

  return null;
}

interface IThemeToggleProps {
  customButtonStyles?: string;
  customIconStyles?: string;
}

export const ThemeToggle: FC<IThemeToggleProps> = ({ customButtonStyles, customIconStyles }) => {
  const { mode, setMode } = useColorScheme();

  const toggle = () => {
    //const newMode = mode === 'light' ? 'dark' : 'light';
    setMode('light');
    localStorage.setItem('mui-mode', 'light');
    document.documentElement.classList.replace(mode!, 'light');
  };

  return (
    <IconButton className={customButtonStyles} onClick={toggle}>
      <ContrastIcon className={customIconStyles} />
    </IconButton>
  );
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={themeWithVars}>
        <StyledEngineProvider injectFirst>
          <DynamicFavicon />
          <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </Provider>
  );
}

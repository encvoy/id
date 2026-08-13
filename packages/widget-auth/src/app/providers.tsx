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
import { I18nextProvider, useTranslation } from 'react-i18next';
import { PROJECT_NAME, WIDGET } from '@/lib/constant';
import { getImageURL, getLocalizedTextValue } from '@/lib/utils';

function DynamicFavicon() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const localizedProjectName = getLocalizedTextValue(PROJECT_NAME, i18n.language);

    document.title = localizedProjectName || 'Auth widget';

    const faviconUrl = getImageURL(WIDGET?.FAVICON);
    if (!faviconUrl) {
      return;
    }

    let link = document.querySelector<HTMLLinkElement>('#widget-favicon');

    if (!link) {
      link = document.createElement('link');
      link.id = 'widget-favicon';
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = faviconUrl;
  }, [i18n.language]);

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
          <I18nextProvider i18n={i18next}>
            <DynamicFavicon />
            {children}
          </I18nextProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </Provider>
  );
}

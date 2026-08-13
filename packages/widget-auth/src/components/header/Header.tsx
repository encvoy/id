import { FC, MouseEvent, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import styles from './Header.module.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageIcon from '@mui/icons-material/Language';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Popover } from '@/components/popover/Popover';
import { INTERACTION_URL, PROJECT_NAME, WIDGET } from '@/lib/constant';
import {
  formatWidgetTitle,
  getImageURL,
  getLocalizedTextValue,
  navigateToHash,
  normalizeWidgetLocale,
} from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { TLocalizedTextCompatible } from '@/types/types';

interface IHeaderProps {
  title?: TLocalizedTextCompatible;
  isCancelAction?: boolean;
  backPath?: string;
}

export const Header: FC<IHeaderProps> = ({ title, backPath, isCancelAction }) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const src = getImageURL(WIDGET?.LOGO);
  const localizedTitle = getLocalizedTextValue(title, i18n.language);
  const clientName = formatWidgetTitle(WIDGET?.TITLE, PROJECT_NAME, i18n.language);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Box className={styles.header}>
        {!!src && (
          <Box className={styles.logo}>
            <Image className={styles.logoIcon} alt={'logo'} src={src} />
          </Box>
        )}
        <div className={styles.headerButtonLeft}>
          {isCancelAction ? (
            <form action={`${INTERACTION_URL}/clean`}>
              <IconButton type="submit" data-test-id="btn-modal-close">
                <CloseIcon className={styles.icon} />
              </IconButton>
            </form>
          ) : backPath ? (
            <IconButton
              className={styles.button}
              onClick={() => navigateToHash(backPath)}
              data-test-id="btn-modal-back"
            >
              <ArrowBackIcon className={styles.icon} />
            </IconButton>
          ) : (
            // <ThemeToggle customButtonStyles={styles.button} customIconStyles={styles.icon} />
            <div></div>
          )}
        </div>
        <Box className={styles.titleContainer}>
          <Typography className={styles.title} variant="h1">
            {clientName || localizedTitle}
          </Typography>
          {!!localizedTitle && !!clientName && (
            <Typography
              variant="h2"
              sx={{ fontWeight: 'normal', marginTop: '14px', textAlign: 'center' }}
            >
              {localizedTitle}
            </Typography>
          )}
        </Box>
        <IconButton
          className={clsx(styles.button, styles.headerButtonRight)}
          onClick={handleClick}
          data-test-id="btn-lang-select"
        >
          <LanguageIcon className={styles.icon} />
        </IconButton>
      </Box>
      <Popover anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <ul className={styles.listLocales}>
          {[
            { code: 'en-US', label: 'en' },
            { code: 'ru-RU', label: 'ru' },
            { code: 'de-DE', label: 'de' },
            { code: 'fr-FR', label: 'fr' },
            { code: 'es-ES', label: 'es' },
            { code: 'it-IT', label: 'it' },
          ].map((lang, index) => (
            <li
              key={index}
              className={styles.itemLocale}
              onClick={() => {
                setAnchorEl(null);
                const normalizedLocale = normalizeWidgetLocale(lang.code);

                localStorage.setItem('i18nextLng', normalizedLocale);
                void i18n.changeLanguage(normalizedLocale);
              }}
              style={{ cursor: 'pointer' }}
            >
              <Typography>{lang.label}</Typography>
            </li>
          ))}
        </ul>
      </Popover>
    </>
  );
};

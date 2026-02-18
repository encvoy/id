import { FC, MouseEvent, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import styles from './Header.module.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageIcon from '@mui/icons-material/Language';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Popover } from '@/components/popover/Popover';
import { useRouter } from 'next/navigation';
import { INTERACTION_ID, WIDGET } from '@/lib/constant';
import { getImageURL } from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface IHeaderProps {
  title?: string;
  isCancelAction?: boolean;
  backPath?: string;
}

export const Header: FC<IHeaderProps> = ({ title, backPath, isCancelAction }) => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [src, setSrc] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (WIDGET?.LOGO) {
      setSrc(getImageURL(WIDGET?.LOGO) || '');
    }
    if (WIDGET?.TITLE) {
      setClientName(WIDGET?.TITLE || '');
    }
  }, []);

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
            <form action={`/api/interaction/${INTERACTION_ID}/clean`}>
              <IconButton className={styles.button} type="submit">
                <CloseIcon className={styles.icon} />
              </IconButton>
            </form>
          ) : backPath ? (
            <IconButton className={styles.button} onClick={() => router.replace(backPath)}>
              <ArrowBackIcon className={styles.icon} />
            </IconButton>
          ) : (
            // <ThemeToggle customButtonStyles={styles.button} customIconStyles={styles.icon} />
            <div></div>
          )}
        </div>
        <Box className={styles.titleContainer}>
          <Typography className={styles.title} variant="h1">
            {clientName || title}
          </Typography>
          {!!title && !!clientName && (
            <Typography variant="h2" sx={{ fontWeight: 'normal' }}>
              {title}
            </Typography>
          )}
        </Box>
        <IconButton className={clsx(styles.button, styles.headerButtonRight)} onClick={handleClick}>
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
                i18n.changeLanguage(lang.code);
                setAnchorEl(null);
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

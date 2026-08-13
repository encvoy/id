'use client';

import { FC } from 'react';
import styles from './Footer.module.css';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { COPYRIGHT, WIDGET } from '@/lib/constant';
import { useTranslation } from 'react-i18next';

const getLocalizedCopyright = (copyright: Record<string, string>, locale: string): string => {
  if (copyright[locale]) return copyright[locale];

  const shortLocale = locale.split('-')[0];
  const matchedValue = Object.entries(copyright).find(
    ([key, value]) => value && (key === shortLocale || key.startsWith(`${shortLocale}-`)),
  )?.[1];

  if (matchedValue) return matchedValue;

  return copyright['ru-RU'] || Object.values(copyright).find((value) => value.trim().length) || '';
};

export const Footer: FC = () => {
  const { i18n } = useTranslation();
  const copyright = getLocalizedCopyright(COPYRIGHT, i18n.language);

  if (WIDGET?.HIDE_FOOTER) {
    return null;
  }

  if (!copyright) {
    return null;
  }

  return (
    <>
      <Box className={styles.footer}>
        <div className={styles.divider}></div>
        <Typography color="text.secondary" className={styles.text}>
          {copyright}
        </Typography>
      </Box>
    </>
  );
};

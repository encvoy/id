'use client';

import { FC, useEffect, useState } from 'react';
import styles from './Footer.module.css';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { COPYRIGHT, WIDGET } from '@/lib/constant';
import { useTranslation } from 'react-i18next';

export const Footer: FC = () => {
  const { i18n } = useTranslation();
  const [isHide, setIsHide] = useState(false);
  const [copyright, setCopyright] = useState();

  useEffect(() => {
    setIsHide(WIDGET?.HIDE_FOOTER);
    setCopyright(COPYRIGHT);
  }, []);

  if (isHide) {
    return null;
  }

  if (copyright && !copyright[i18n.language]) {
    return null;
  }

  return (
    <>
      <Box className={styles.footer}>
        <div className={styles.divider}></div>
        <Typography color="text.secondary" className={styles.text}>
          {copyright && copyright[i18n.language]}
        </Typography>
      </Box>
    </>
  );
};

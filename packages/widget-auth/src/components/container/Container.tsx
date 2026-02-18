'use client';

import Box from '@mui/material/Box';
import { FC, ReactNode, useEffect, useState } from 'react';
import styles from './Container.module.css';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { motion } from 'framer-motion';
import { WIDGET } from '@/lib/constant';
import { HtmlContent } from '@/lib/hooks';

interface IContainerProps {
  title?: string;
  backPath?: string;
  isCancelAction?: boolean;
  children: ReactNode;
  withoutFooter?: boolean;
}

export const Container: FC<IContainerProps> = ({
  title,
  backPath,
  children,
  isCancelAction,
  withoutFooter,
}) => {
  const [outInfo, setOutInfo] = useState('');
  const [info, setInfo] = useState('');
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 440px)');
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    setInfo(WIDGET.INFO);
    setOutInfo(WIDGET.INFO_OUT);
  }, []);

  const motionWrapper = (children: ReactNode) => {
    if (!matches)
      return (
        <motion.div layout transition={{ duration: 0.2 }} style={{ width: '100%' }}>
          {children}
        </motion.div>
      );

    return children;
  };

  return (
    <>
      {motionWrapper(
        <div>
          <Box className={styles.container}>
            <Header title={title} backPath={backPath} isCancelAction={isCancelAction} />
            <Box className={styles.main}>{children}</Box>
            {info && <HtmlContent html={info} />}
            {!withoutFooter && <Footer />}
          </Box>
          {outInfo && (
            <Box sx={{ marginBottom: '12px' }}>
              <HtmlContent html={outInfo} />
            </Box>
          )}
        </div>,
      )}
    </>
  );
};

import { FC, ReactNode, useEffect, useState } from 'react';
import styles from './Section.module.css';
import Box from '@mui/material/Box';
import { getImageURL } from '@/lib/utils';
import { WIDGET } from '@/lib/constant';

interface ISectionProps {
  children: ReactNode;
}

export const Section: FC<ISectionProps> = ({ children }) => {
  const [cover, setCover] = useState<string>('');

  useEffect(() => {
    if (WIDGET?.COVER) {
      setCover(WIDGET?.COVER);
    }
  }, []);

  return (
    <Box
      className={styles.section}
      sx={{
        backgroundImage: cover ? `url(${getImageURL(cover)})` : 'none',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </Box>
  );
};

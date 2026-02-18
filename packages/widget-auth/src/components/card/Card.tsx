import { FC } from 'react';
import styles from './Card.module.css';
import Box from '@mui/material/Box';
import { Avatar } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';

interface ICardProps {
  title?: string;
  srcAvatar?: string;
  description?: string;
  onButtonClick?: () => void;
  onClick?: () => void;
}

export const Card: FC<ICardProps> = ({ title, srcAvatar, description, onButtonClick, onClick }) => {
  return (
    <Box className={styles.card} onClick={onClick}>
      <Avatar src={srcAvatar} />
      <Box sx={{ overflow: 'hidden' }}>
        <Typography className={styles.text}>{description}</Typography>
        <Typography className={styles.text}>{title}</Typography>
      </Box>
      <IconButton
        className={styles.button}
        onClick={(event) => {
          event.stopPropagation();
          if (onButtonClick) {
            onButtonClick();
          }
        }}
      >
        <LogoutIcon />
      </IconButton>
    </Box>
  );
};

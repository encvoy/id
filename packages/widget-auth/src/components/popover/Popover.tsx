'use client'
import {Dispatch, FC, ReactNode, SetStateAction} from 'react';
import MuiPopover from '@mui/material/Popover';
import styles from './Popover.module.css';

interface IPopoverProps {
  anchorEl: HTMLButtonElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLButtonElement | null>>;
  children: ReactNode;
}

export const Popover: FC<IPopoverProps> = (
  {
    anchorEl,
    setAnchorEl,
    children
  }) => {
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const isOpen = Boolean(anchorEl);
  const id = isOpen ? 'simple-popover' : undefined;
  
  return (
    <MuiPopover
      id={id}
      open={isOpen}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      className={styles.popover}
    >
      {children}
    </MuiPopover>
  );
}
import React, { ReactNode, useEffect, useState } from 'react';
import MuiButton, { ButtonProps } from '@mui/material/Button';
import { WIDGET } from '@/lib/constant';

export interface IButtonProps extends ButtonProps {
  label: string | ReactNode;
}

export const Button = ({ label, ...rest }: IButtonProps) => {
  const [color, setColor] = useState<string>('');
  const [backColor, setBackColor] = useState<string>('');

  useEffect(() => {
    setColor(WIDGET.COLORS.font_color);
    setBackColor(WIDGET.COLORS.button_color);
  }, []);

  return (
    <MuiButton
      style={{
        backgroundColor: rest.variant === 'contained' ? backColor : '',
        color: rest.variant === 'contained' ? color : '',
      }}
      {...rest}
    >
      {label}
    </MuiButton>
  );
};

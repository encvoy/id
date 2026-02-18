'use client';
import { FC, useState } from 'react';
import TextField from '@mui/material/TextField';
import { useFormContext } from 'react-hook-form';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface IInputPasswordProps {
  fieldName: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const InputPassword: FC<IInputPasswordProps> = ({ fieldName, autoFocus, placeholder }) => {
  const { t: translate } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <TextField
      {...register(fieldName, {
        required: {
          value: true,
          message: translate('errors.requiredField'),
        },
      })}
      error={!!errors[fieldName]}
      helperText={errors[fieldName]?.message as string}
      placeholder={placeholder}
      autoFocus={autoFocus}
      type={showPassword ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((show) => !show)} edge="end">
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

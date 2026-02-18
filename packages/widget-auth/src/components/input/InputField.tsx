import { FC, ReactNode } from 'react';
import TextField from '@mui/material/TextField';
import { useFormContext } from 'react-hook-form';
import { InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface IInputFieldProps {
  fieldName: string;
  placeholder?: string;
  disabled?: boolean;
  endPosition?: ReactNode;
  autoFocus?: boolean;
  requiredFiled?: boolean;
}

export const InputField: FC<IInputFieldProps> = ({
  fieldName,
  placeholder,
  disabled,
  endPosition,
  autoFocus,
  requiredFiled = true,
}) => {
  const { t: translate } = useTranslation();
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <TextField
      {...register(fieldName, {
        required: {
          value: requiredFiled,
          message: translate('errors.requiredField'),
        },
      })}
      autoFocus={autoFocus}
      error={!!errors[fieldName]}
      helperText={errors[fieldName]?.message as string}
      placeholder={placeholder}
      disabled={disabled}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">{endPosition}</InputAdornment>,
        },
      }}
    />
  );
};

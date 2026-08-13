import { FC, HTMLInputTypeAttribute, ReactNode } from 'react';
import TextField from '@mui/material/TextField';
import { useFormContext } from 'react-hook-form';
import { InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PASSWORD_MANAGER_IGNORE_ATTRIBUTES } from '@/components/autofill';

interface IInputFieldProps {
  fieldName: string;
  placeholder?: string;
  disabled?: boolean;
  endPosition?: ReactNode;
  autoFocus?: boolean;
  requiredFiled?: boolean;
  dataTestId?: string;
  autoComplete?: string;
  ignorePasswordManagers?: boolean;
  type?: HTMLInputTypeAttribute;
}

export const InputField: FC<IInputFieldProps> = ({
  fieldName,
  placeholder,
  disabled,
  endPosition,
  autoFocus,
  requiredFiled = true,
  dataTestId,
  autoComplete,
  ignorePasswordManagers = false,
  type,
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
      type={type}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">{endPosition}</InputAdornment>,
        },
        htmlInput: {
          autoComplete,
          ...(ignorePasswordManagers ? PASSWORD_MANAGER_IGNORE_ATTRIBUTES : {}),
          'data-test-id': dataTestId,
        },
      }}
    />
  );
};

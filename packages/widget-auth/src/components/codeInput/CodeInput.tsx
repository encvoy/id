'use client';

import { Box, FormHelperText, TextField } from '@mui/material';
import {
  ChangeEvent,
  ClipboardEvent,
  FC,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PASSWORD_MANAGER_IGNORE_ATTRIBUTES } from '@/components/autofill';

interface ICodeInputProps {
  fieldName: string;
  length: number;
  disabled?: boolean;
  autoFocus?: boolean;
  requiredFiled?: boolean;
  dataTestId?: string;
  onComplete?: (value: string) => void;
  autoComplete?: string;
}

const getDigitsOnlyValue = (value: string, length: number) =>
  value.replace(/\D/g, '').slice(0, length);

const getDigitRows = (length: number) => {
  if (length === 7) {
    return [
      Array.from({ length: 4 }, (_, index) => index),
      Array.from({ length: 3 }, (_, index) => index + 4),
    ];
  }

  if (length === 8) {
    return [
      Array.from({ length: 4 }, (_, index) => index),
      Array.from({ length: 4 }, (_, index) => index + 4),
    ];
  }

  return [Array.from({ length }, (_, index) => index)];
};

export const CodeInput: FC<ICodeInputProps> = ({
  fieldName,
  length,
  disabled = false,
  autoFocus = false,
  requiredFiled = true,
  dataTestId,
  onComplete,
  autoComplete = 'one-time-code',
}) => {
  const { t: translate } = useTranslation();
  const { clearErrors, control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({
    name: fieldName,
    control,
    rules: {
      required: requiredFiled
        ? {
            value: true,
            message: translate('errors.requiredField'),
          }
        : undefined,
    },
    defaultValue: '',
  });

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastCompletedValueRef = useRef<string | null>(null);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const normalizedValue = getDigitsOnlyValue(String(field.value || ''), length);
  const maxInteractiveIndex = Math.min(normalizedValue.length, length - 1);
  const digits = Array.from({ length }, (_, index) => normalizedValue[index] ?? '');
  const digitRows = getDigitRows(length);

  const getSafeIndex = (index: number) => Math.max(0, Math.min(index, length - 1));

  const focusInput = (index: number) => {
    const nextIndex = getSafeIndex(index);
    const nextInput = inputRefs.current[nextIndex];

    if (!nextInput) return;

    nextInput.focus();
    nextInput.select();
  };

  const focusAllowedInput = (index: number) => {
    focusInput(Math.min(getSafeIndex(index), maxInteractiveIndex));
  };

  const queueFocus = (index: number) => {
    pendingFocusIndexRef.current = index;
  };

  const setFieldValue = (value: string) => {
    if (error?.type === 'server') {
      clearErrors(fieldName);
    }

    field.onChange(value);
  };

  const replaceDigits = (index: number, nextDigits: string) => {
    if (!nextDigits) return;

    const safeIndex = Math.min(index, normalizedValue.length);
    const updatedValue = normalizedValue.split('');

    nextDigits.split('').forEach((digit, offset) => {
      updatedValue[safeIndex + offset] = digit;
    });

    return updatedValue.join('').slice(0, length);
  };

  const handleChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextDigits = getDigitsOnlyValue(event.target.value, length);

    if (!nextDigits) {
      const updatedValue =
        normalizedValue[index] !== undefined
          ? `${normalizedValue.slice(0, index)}${normalizedValue.slice(index + 1)}`
          : normalizedValue;

      setFieldValue(updatedValue);
      return;
    }

    const updatedValue =
      nextDigits.length >= length
        ? nextDigits
        : (replaceDigits(index, nextDigits) ?? normalizedValue);

    setFieldValue(updatedValue);

    const nextFocusIndex =
      nextDigits.length >= length ? length - 1 : Math.min(index + nextDigits.length, length - 1);

    queueFocus(nextFocusIndex);
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAllowedInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAllowedInput(index + 1);
      return;
    }

    if (event.key !== 'Backspace') return;

    if (normalizedValue[index] !== undefined) {
      event.preventDefault();
      setFieldValue(`${normalizedValue.slice(0, index)}${normalizedValue.slice(index + 1)}`);
      return;
    }

    if (index === 0) return;

    event.preventDefault();
    setFieldValue(`${normalizedValue.slice(0, index - 1)}${normalizedValue.slice(index)}`);
    queueFocus(index - 1);
  };

  const handlePointerDown = (index: number) => (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || index <= maxInteractiveIndex) return;

    event.preventDefault();
    focusAllowedInput(index);
  };

  const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedDigits = getDigitsOnlyValue(event.clipboardData.getData('text'), length);

    if (!pastedDigits) return;

    if (pastedDigits.length >= length) {
      setFieldValue(pastedDigits);
      queueFocus(length - 1);
      return;
    }

    const updatedValue = replaceDigits(index, pastedDigits) ?? normalizedValue;

    setFieldValue(updatedValue);
    queueFocus(Math.min(index + pastedDigits.length, length - 1));
  };

  const handleFocus = (index: number) => () => {
    if (disabled) return;

    inputRefs.current[index]?.select();
  };

  useEffect(() => {
    if (!autoFocus || disabled || length < 1) return;

    focusAllowedInput(normalizedValue.length);
  }, [autoFocus, disabled, length]);

  useEffect(() => {
    if (normalizedValue.length !== length) {
      lastCompletedValueRef.current = null;
      return;
    }

    if (disabled || !onComplete || lastCompletedValueRef.current === normalizedValue) {
      return;
    }

    lastCompletedValueRef.current = normalizedValue;
    onComplete(normalizedValue);
  }, [disabled, length, normalizedValue, onComplete]);

  useLayoutEffect(() => {
    if (disabled) {
      pendingFocusIndexRef.current = null;
      return;
    }

    const nextFocusIndex = pendingFocusIndexRef.current;

    if (nextFocusIndex === null) return;

    pendingFocusIndexRef.current = null;
    focusAllowedInput(nextFocusIndex);
  }, [disabled, maxInteractiveIndex, normalizedValue]);

  if (length < 1) return null;

  return (
    <Box sx={{ width: '100%' }}>
      <input type="hidden" name={field.name} value={normalizedValue} readOnly />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {digitRows.map((row, rowIndex) => {
          const isSixDigitRow = row.length === 6;

          return (
            <Box
              key={rowIndex}
              sx={{
                display: 'grid',
                gap: 1,
                justifyContent: 'center',
                width: isSixDigitRow ? '100%' : 'auto',
                gridTemplateColumns: isSixDigitRow
                  ? 'repeat(6, minmax(0, 1fr))'
                  : `repeat(${row.length}, 52px)`,
              }}
            >
              {row.map((index) => (
                <TextField
                  key={index}
                  value={digits[index]}
                  onChange={handleChange(index)}
                  onKeyDown={handleKeyDown(index)}
                  onPaste={handlePaste(index)}
                  onPointerDown={handlePointerDown(index)}
                  onFocus={handleFocus(index)}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  error={!!error}
                  inputRef={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  sx={{
                    width: isSixDigitRow ? '100%' : 52,
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      paddingX: 0,
                      fontSize: isSixDigitRow ? 16 : 18,
                      fontWeight: 500,
                      border: '1px solid #D7DEE7',
                      borderRadius: '20px',
                    },
                  }}
                  slotProps={{
                    htmlInput: {
                      ...PASSWORD_MANAGER_IGNORE_ATTRIBUTES,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 1,
                      autoComplete: index === 0 ? autoComplete : 'off',
                      tabIndex: index <= maxInteractiveIndex ? 0 : -1,
                      'data-test-id': dataTestId ? `${dataTestId}-${index}` : undefined,
                    },
                  }}
                />
              ))}
            </Box>
          );
        })}
      </Box>
      {error?.message && <FormHelperText error>{error.message}</FormHelperText>}
    </Box>
  );
};

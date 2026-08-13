'use client';

import { CLIENT_ID, USER_ID } from '@/lib/constant';
import { checkUniqueFieldAvailability } from '@/lib/uniqueField';
import { useCallback, useEffect, useRef } from 'react';
import {
  FieldValues,
  Path,
  PathValue,
  UseFormClearErrors,
  UseFormGetFieldState,
  UseFormSetError,
} from 'react-hook-form';

const UNIQUE_ERROR_TYPE = 'unique';
const UNIQUE_CHECK_DELAY_MS = 500;

type TUniqueFieldValidationParams<T extends FieldValues> = {
  fieldName?: Path<T>;
  unique?: boolean;
  value?: PathValue<T, Path<T>>;
  errorMessage: string;
  setError: UseFormSetError<T>;
  clearErrors: UseFormClearErrors<T>;
  getFieldState: UseFormGetFieldState<T>;
};

export const useUniqueFieldValidation = <T extends FieldValues>({
  fieldName,
  unique,
  value,
  errorMessage,
  setError,
  clearErrors,
  getFieldState,
}: TUniqueFieldValidationParams<T>) => {
  const validationSequenceRef = useRef(0);

  const validateUniqueValue = useCallback(
    async (rawValue: unknown, signal?: AbortSignal) => {
      if (!unique || !fieldName) {
        return true;
      }

      const normalizedValue =
        typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim();

      if (!normalizedValue) {
        clearErrors(fieldName);
        return true;
      }

      const validationSequence = ++validationSequenceRef.current;
      const available = await checkUniqueFieldAvailability({
        fieldName,
        value: normalizedValue,
        clientId: CLIENT_ID,
        userId: USER_ID,
        signal,
      });

      if (validationSequence !== validationSequenceRef.current || signal?.aborted) {
        return false;
      }

      if (!available) {
        setError(fieldName, {
          type: UNIQUE_ERROR_TYPE,
          message: errorMessage,
        });
        return false;
      }

      if (getFieldState(fieldName).error) {
        clearErrors(fieldName);
      }
      return true;
    },
    [clearErrors, errorMessage, fieldName, getFieldState, setError, unique],
  );

  useEffect(() => {
    if (!unique || !fieldName) {
      return;
    }

    validationSequenceRef.current += 1;
    if (getFieldState(fieldName).error) {
      clearErrors(fieldName);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void validateUniqueValue(value, controller.signal).catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Unique field availability check failed:', error);
      });
    }, UNIQUE_CHECK_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [fieldName, unique, validateUniqueValue, value]);

  return validateUniqueValue;
};

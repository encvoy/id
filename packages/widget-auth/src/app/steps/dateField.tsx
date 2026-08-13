'use client';

import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Form } from '@/components/form/Form';
import { Button } from '@/components/button/Button';
import { useForm } from 'react-hook-form';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FIELD, INTERACTION_URL, MESSAGE } from '@/lib/constant';
import { IFieldEnv } from '@/types/types';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { getLocalizedTextValue } from '@/lib/utils';
import { useUniqueFieldValidation } from '@/hooks/useUniqueFieldValidation';
import { useWatch } from 'react-hook-form';

export const DateField: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const actionUrl = `${INTERACTION_URL}/steps`;
  const [currentField, setCurrentField] = useState<IFieldEnv>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  useEffect(() => {
    setCurrentField(FIELD);
  }, []);

  const methods = useForm();
  const {
    setValue,
    setError,
    clearErrors,
    control,
    getFieldState,
    formState: { errors },
  } = methods;
  const fieldName = currentField?.field_name || '';
  const fieldValue = useWatch({ control, name: fieldName });
  const validateUniqueValue = useUniqueFieldValidation({
    fieldName,
    unique: currentField?.unique,
    value: fieldValue,
    errorMessage: translate('errors.valueNotAvailable'),
    setError,
    clearErrors,
    getFieldState,
  });

  useEffect(() => {
    if (currentField?.field_name) {
      if (currentField.default_value !== undefined) {
        setValue(currentField.field_name, currentField.default_value);
      }

      const resolvedMessage = getLocalizedTextValue(MESSAGE, i18n.language);

      if (resolvedMessage) {
        setError(currentField?.field_name, { message: resolvedMessage });
      }
    }
  }, [currentField?.default_value, currentField?.field_name, i18n.language, setError, setValue]);

  const onSubmit = async () => {
    try {
      if (!(await validateUniqueValue(fieldValue))) {
        return;
      }
    } catch (error) {
      console.error('Unique field availability check failed:', error);
      if (currentField?.field_name) {
        setError(currentField.field_name, {
          message: translate('errors.errorOccurred'),
        });
      }
      return;
    }

    setModeForm('action');
  };

  return (
    <Box>
      {currentField?.field_name && (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            sx={{ width: '100%' }}
            value={fieldValue ? new Date(fieldValue) : null}
            onChange={(newValue) => {
              clearErrors();
              setValue(currentField?.field_name, newValue ? newValue.toISOString() : '', {
                shouldDirty: true,
              });
            }}
            slotProps={{
              textField: {
                inputProps: {
                  'data-test-id': `txt-auth-add-${currentField?.field_name}`,
                },
              },
            }}
          />
        </LocalizationProvider>
      )}

      <Form
        mode={modeForm}
        fnSubmit={onSubmit}
        methodsForm={methods}
        action={actionUrl}
        method="POST"
      >
        <Typography color="text.secondary">
          {getLocalizedTextValue(currentField?.title, i18n.language)}
        </Typography>
        {currentField?.field_name && errors[currentField?.field_name] && (
          <Typography color="error.main">
            {errors[currentField?.field_name]?.message as string}
          </Typography>
        )}
        <input
          hidden
          name={currentField?.field_name}
          value={fieldValue || ''}
        />
        <Button
          variant="contained"
          label={translate('actionButtons.save')}
          type="submit"
          data-test-id="btn-auth-form-save"
        />
      </Form>
    </Box>
  );
};

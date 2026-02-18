'use client';

import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Form } from '@/components/form/Form';
import { Button } from '@/components/button/Button';
import { useForm } from 'react-hook-form';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FIELD, INTERACTION_ID, MESSAGE } from '@/lib/constant';
import { IFieldEnv } from '@/types/types';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export const DateField: FC = () => {
  const { t: translate } = useTranslation();
  const actionUrl = `/api/interaction/${INTERACTION_ID}/steps`;
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
    watch,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (currentField?.field_name && MESSAGE) {
      setError(currentField?.field_name, { message: MESSAGE });
    }
  }, [currentField?.field_name]);

  const onSubmit = () => {
    setModeForm('action');
  };

  return (
    <Box>
      {currentField?.field_name && (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            sx={{ width: '100%' }}
            value={
              watch(currentField?.field_name) ? new Date(watch(currentField?.field_name)) : null
            }
            onChange={(newValue) => {
              clearErrors();
              setValue(currentField?.field_name, newValue ? newValue.toISOString() : '', {
                shouldDirty: true,
              });
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
        <Typography color="text.secondary">{currentField?.title}</Typography>
        {currentField?.field_name && errors[currentField?.field_name] && (
          <Typography color="error.main">
            {errors[currentField?.field_name]?.message as string}
          </Typography>
        )}
        <input
          hidden
          name={currentField?.field_name}
          value={watch(currentField?.field_name || '')}
        />
        <Button variant="contained" label={translate('actionButtons.save')} type="submit" />
      </Form>
    </Box>
  );
};

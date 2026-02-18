'use client';

import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Form } from '@/components/form/Form';
import { Button } from '@/components/button/Button';
import { Controller, useForm } from 'react-hook-form';
import { Checkbox, FormControlLabel, Link } from '@mui/material';
import { DATA_PROCESSING_POLICY_URL, FIELD, INTERACTION_ID, MESSAGE, WIDGET } from '@/lib/constant';
import { IFieldEnv } from '@/types/types';
import { useTranslation } from 'react-i18next';

export const CheckBoxField: FC = () => {
  const { t: translate } = useTranslation();
  const actionUrl = `/api/interaction/${INTERACTION_ID}/steps`;
  const [currentField, setCurrentField] = useState<IFieldEnv>();
  const [link, setLink] = useState('');
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');
  const [backColor, setBackColor] = useState<string>('');

  useEffect(() => {
    setCurrentField(FIELD);
    setLink(DATA_PROCESSING_POLICY_URL);
    setBackColor(WIDGET.COLORS.button_color);
  }, []);

  const methods = useForm();
  const { setError, control } = methods;

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
      <Form
        methodsForm={methods}
        fnSubmit={onSubmit}
        mode={modeForm}
        method="POST"
        action={actionUrl}
      >
        {currentField?.field_name && (
          <Controller
            name={currentField?.field_name}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    sx={{
                      color: backColor,
                      '& .MuiSvgIcon-root': { color: backColor },
                    }}
                  />
                }
                label={
                  <Link href={link} target="_blank" rel="noreferrer">
                    {currentField?.title}
                  </Link>
                }
              />
            )}
          />
        )}
        <Button variant="contained" label={translate('actionButtons.save')} type="submit" />
      </Form>
    </Box>
  );
};

'use client';

import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Form } from '@/components/form/Form';
import { Button } from '@/components/button/Button';
import { Controller, useForm } from 'react-hook-form';
import { Checkbox, FormControlLabel, Link } from '@mui/material';
import { DATA_PROCESSING_POLICY_URL, FIELD, INTERACTION_URL, MESSAGE, WIDGET } from '@/lib/constant';
import { IFieldEnv } from '@/types/types';
import { useTranslation } from 'react-i18next';
import { getLocalizedTextValue } from '@/lib/utils';

export const CheckBoxField: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const actionUrl = `${INTERACTION_URL}/steps`;
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
    if (currentField?.field_name) {
      const resolvedMessage = getLocalizedTextValue(MESSAGE, i18n.language);

      if (resolvedMessage) {
        setError(currentField?.field_name, { message: resolvedMessage });
      }
    }
  }, [currentField?.field_name, i18n.language, setError]);

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
            defaultValue={currentField.default_value === 'true'}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    data-test-id={`chk-auth-add-${currentField?.field_name}`}
                    sx={{
                      color: backColor,
                      '& .MuiSvgIcon-root': { color: backColor },
                    }}
                  />
                }
                label={
                  <Link href={link} target="_blank" rel="noreferrer">
                    {getLocalizedTextValue(currentField?.title, i18n.language)}
                  </Link>
                }
              />
            )}
          />
        )}
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

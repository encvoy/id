'use client';

import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { InputField } from '@/components/input/InputField';
import { Form } from '@/components/form/Form';
import { Button } from '@/components/button/Button';
import Typography from '@mui/material/Typography';
import { FIELD, INTERACTION_URL, MESSAGE } from '@/lib/constant';
import { useForm } from 'react-hook-form';
import { IFieldEnv } from '@/types/types';
import { useTranslation } from 'react-i18next';
import { getLocalizedTextValue, isNotValidValue } from '@/lib/utils';
import { ValidationRuleList } from '@/components/listItem/listItem';
import { InputPassword } from '@/components/inputPassword/InputPassword';

const TextField: FC = () => {
  const actionUrl = `${INTERACTION_URL}/steps`;
  const { t: translate, i18n } = useTranslation();
  const [currentField, setCurrentField] = useState<IFieldEnv>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  useEffect(() => {
    setCurrentField(FIELD);
  }, []);

  const methods = useForm();
  const { setError, setValue } = methods;

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

  const onSubmit = async (data: any) => {
    if (
      currentField?.field_name &&
      isNotValidValue(
        data[currentField?.field_name],
        currentField?.field_name,
        setError,
        currentField,
        i18n.language,
      )
    ) {
      return;
    }

    setModeForm('action');
  };

  return (
    <Box>
      <Form
        fnSubmit={onSubmit}
        mode={modeForm}
        action={actionUrl}
        method="POST"
        methodsForm={methods}
      >
        <Typography color="text.secondary">
          {getLocalizedTextValue(currentField?.title, i18n.language)}
        </Typography>
        {currentField?.field_name &&
          (currentField?.field_name === 'password' ? (
            <InputPassword
              autoFocus
              fieldName={currentField?.field_name}
              placeholder={translate('helperText.password')}
              dataTestId={`txt-auth-add-${currentField?.field_name}`}
              autoComplete="section-registration new-password"
            />
          ) : (
            <InputField
              autoFocus
              fieldName={currentField?.field_name}
              dataTestId={`txt-auth-add-${currentField?.field_name}`}
            />
          ))}
        <Button
          variant="contained"
          label={translate('actionButtons.save')}
          type="submit"
          data-test-id="btn-auth-form-save"
        />
        <ValidationRuleList />
      </Form>
    </Box>
  );
};

export default TextField;

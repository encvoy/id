'use client';

import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { InputField } from '@/components/input/InputField';
import { Form } from '@/components/form/Form';
import { Button } from '@/components/button/Button';
import Typography from '@mui/material/Typography';
import { FIELD, INTERACTION_ID, MESSAGE } from '@/lib/constant';
import { useForm } from 'react-hook-form';
import { IFieldEnv } from '@/types/types';
import { useTranslation } from 'react-i18next';
import { isNotValidValue } from '@/lib/utils';
import { ValidationRuleList } from '@/components/listItem/listItem';
import { InputPassword } from '@/components/inputPassword/InputPassword';

const TextField: FC = () => {
  const actionUrl = `/api/interaction/${INTERACTION_ID}/steps`;
  const { t: translate } = useTranslation();
  const [currentField, setCurrentField] = useState<IFieldEnv>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  useEffect(() => {
    setCurrentField(FIELD);
  }, []);

  const methods = useForm();
  const { setError } = methods;

  useEffect(() => {
    if (currentField?.field_name && MESSAGE) {
      setError(currentField?.field_name, { message: MESSAGE });
    }
  }, [currentField?.field_name]);

  const onSubmit = (data: any) => {
    if (
      currentField?.field_name &&
      isNotValidValue(
        data[currentField?.field_name],
        currentField?.field_name,
        setError,
        currentField,
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
        <Typography color="text.secondary">{currentField?.title}</Typography>
        {currentField?.field_name &&
          (currentField?.field_name === 'password' ? (
            <InputPassword
              autoFocus
              fieldName={currentField?.field_name}
              placeholder={translate('helperText.password')}
            />
          ) : (
            <InputField autoFocus fieldName={currentField?.field_name} />
          ))}
        <Button variant="contained" label={translate('actionButtons.save')} type="submit" />
        <ValidationRuleList />
      </Form>
    </Box>
  );
};

export default TextField;

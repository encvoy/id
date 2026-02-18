'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID, LOGIN, MESSAGE } from '@/lib/constant';
import { FC, useLayoutEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import { ValidationRuleList } from '@/components/listItem/listItem';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const actionUrl = `/api/interaction/${INTERACTION_ID}/recover-password`;
  const [message, setMessage] = useState('');
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  const methods = useForm();
  const { reset, control } = methods;
  const login = useWatch({ name: 'identifier', control });

  useLayoutEffect(() => {
    reset({
      identifier: LOGIN,
    });
    setMessage(MESSAGE);
  }, []);

  const onSubmit = () => {
    setModeForm('action');
  };

  return (
    <Section>
      <Container title={translate('pages.recover.password')} isCancelAction>
        <Form
          fnSubmit={onSubmit}
          methodsForm={methods}
          mode={modeForm}
          action={actionUrl}
          method="POST"
        >
          <Typography color="text.secondary">
            {translate('pages.recover.sendMessage', { value: message })}
          </Typography>
          <InputField fieldName="identifier" placeholder={translate('helperText.login')} disabled />
          <InputField fieldName="code" placeholder={translate('helperText.code')} />
          <InputPassword fieldName="password" placeholder={translate('pages.recover.new')} />
          <input type="hidden" name="identifier" value={login} />
          <Button variant="contained" label={translate('actionButtons.save')} type="submit" />
          <ValidationRuleList />
        </Form>
      </Container>
    </Section>
  );
};

export default Page;

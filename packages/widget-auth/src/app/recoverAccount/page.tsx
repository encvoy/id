'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { INTERACTION_URL, LOGIN } from '@/lib/constant';
import { EHashPages } from '@/types/types';
import { FC, useLayoutEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { InputField } from '@/components/input/InputField';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const actionUrl = `${INTERACTION_URL}/recover`;
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  const methods = useForm();
  const { reset, control } = methods;
  const login = useWatch({ name: 'identifier', control });

  useLayoutEffect(() => {
    reset({
      identifier: LOGIN,
    });
  }, []);

  const onSubmit = () => {
    setModeForm('action');
  };

  return (
    <Section>
      <Container title={translate('pages.recover.account')} backPath={EHashPages.LOGIN}>
        <Form
          fnSubmit={onSubmit}
          methodsForm={methods}
          mode={modeForm}
          action={actionUrl}
          method="POST"
        >
          <InputField
            fieldName="identifier"
            placeholder={translate('helperText.login')}
            autoComplete="section-recover-account username"
            disabled
          />
          <InputPassword
            autoFocus
            fieldName="password"
            placeholder={translate('helperText.password')}
            dataTestId="txt-auth-password"
            autoComplete="section-recover-account current-password"
          />
          <input
            type="hidden"
            name="identifier"
            value={login}
            autoComplete="section-recover-account username"
          />
          <input type="hidden" name="prompt" value="login" />
          <Button
            variant="contained"
            label={translate('actionButtons.recover')}
            type="submit"
            data-test-id="btn-auth-account-recover"
          />
        </Form>
      </Container>
    </Section>
  );
};

export default Page;

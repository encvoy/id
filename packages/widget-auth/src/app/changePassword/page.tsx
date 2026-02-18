'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID, LOGIN, PROVIDERS } from '@/lib/constant';
import { useHashParams } from '@/lib/hooks';
import { IProvider } from '@/types/types';
import { FC, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const hashParams = useHashParams();
  const actionUrl = `/api/interaction/${INTERACTION_ID}/change-password`;
  const [provider, setProvider] = useState<IProvider>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  const methods = useForm();
  const { reset, control, setError } = methods;
  const login = useWatch({ name: 'identifier', control });

  useLayoutEffect(() => {
    reset({
      identifier: LOGIN,
    });

    if (PROVIDERS.length) {
      setProvider(PROVIDERS[0]);
    }
  }, [hashParams?.id]);

  const onSubmit = (data: any) => {
    if (data.current_password === data.new_password) {
      setError('new_password', {
        type: 'manual',
        message: translate('errors.passwordsMatch'),
      });
      return;
    }
    setModeForm('action');
  };

  return (
    <Section>
      <Container title={translate('pages.changePassword.title')} isCancelAction>
        <Form
          methodsForm={methods}
          fnSubmit={onSubmit}
          mode={modeForm}
          action={actionUrl}
          method="POST"
        >
          <InputField fieldName="identifier" placeholder={translate('helperText.login')} disabled />
          <InputPassword
            fieldName="current_password"
            placeholder={translate('pages.changePassword.current')}
          />
          <InputPassword
            fieldName="new_password"
            placeholder={translate('pages.changePassword.new')}
          />
          <input type="hidden" name="provider_id" value={provider?.id} />
          <input type="hidden" name="identifier" value={login} />
          <Button variant="contained" label={translate('actionButtons.change')} type="submit" />
        </Form>
      </Container>
    </Section>
  );
};

export default Page;

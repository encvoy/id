'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import {
  clearMessageDetail,
  getMessageDetail,
  INTERACTION_URL,
  PROVIDERS,
  USERNAME,
} from '@/lib/constant';
import { useHashParams } from '@/lib/hooks';
import { IProvider } from '@/types/types';
import { FC, useEffect, useLayoutEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const hashParams = useHashParams();
  const [provider, setProvider] = useState<IProvider>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  useLayoutEffect(() => {
    setProvider(PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id));
  }, [hashParams?.id]);

  const methods = useForm<{ identifier: string; password: string }>({
    defaultValues: {
      identifier: USERNAME,
    },
  });
  const {
    control,
    setError,
    clearErrors,
    formState: { dirtyFields },
  } = methods;

  useEffect(() => {
    const messageDetail = getMessageDetail();
    if (messageDetail) {
      setError('password', { type: 'server', message: messageDetail });
    }
    return () => {
      clearErrors('password');
      clearMessageDetail();
    };
  }, [setError, clearErrors]);

  useEffect(() => {
    if (!dirtyFields.identifier && !dirtyFields.password) return;
    clearErrors('password');
    clearMessageDetail();
  }, [dirtyFields.identifier, dirtyFields.password, clearErrors]);

  const onSubmit = () => {
    setModeForm('action');
  };

  const watchIdentifier = useWatch({ control, name: 'identifier' });

  return (
    <Section>
      <Container title={provider?.name || ''} isCancelAction>
        <Form
          fnSubmit={onSubmit}
          methodsForm={methods}
          mode={modeForm}
          action={`${INTERACTION_URL}/auth?type=${provider?.type}`}
          method="POST"
        >
          <InputField
            fieldName="identifier"
            placeholder={translate('helperText.login')}
            dataTestId="txt-auth-login"
            autoComplete="section-login username"
          />
          <InputPassword
            fieldName="password"
            placeholder={translate('helperText.password')}
            dataTestId="txt-auth-password"
            autoComplete="section-login current-password"
          />
          <input type="hidden" name="provider_id" value={provider?.id} />
          <input type="hidden" name="prompt" value="login" />
          <Button
            variant="contained"
            label={translate('actionButtons.logIn')}
            type="submit"
            data-test-id="btn-auth-login-submit"
          />
        </Form>
        <form action={`${INTERACTION_URL}/recover-password`} method="POST">
          <input type="hidden" name="identifier" value={watchIdentifier} />
          <input type="hidden" name="provider_id" value={provider?.id} />
          <Button
            label={translate('actionButtons.recoverPassword')}
            type="submit"
            disabled={!watchIdentifier}
            data-test-id="btn-auth-password-recovery"
          />
        </form>
      </Container>
    </Section>
  );
};

export default Page;

'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { clearMessageDetail, getMessageDetail, INTERACTION_URL, USERNAME } from '@/lib/constant';
import { useAppSelector } from '@/store/hooks';
import { FormState } from '@/store/slices/formSlice';
import { EHashPages } from '@/types/types';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const login = useAppSelector(({ form }: { form: FormState }) => form.login);
  const loginValue = login || USERNAME;
  const actionUrl = `${INTERACTION_URL}/auth?type=login`;
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  const methods = useForm<{ password: string }>();
  const {
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
    if (!dirtyFields.password) return;
    clearErrors('password');
    clearMessageDetail();
  }, [dirtyFields.password, clearErrors]);

  const onSubmit = () => {
    setModeForm('action');
  };

  return (
    <Section>
      <Container title={translate('helperText.password')} backPath={EHashPages.LOGIN}>
        <Form
          methodsForm={methods}
          mode={modeForm}
          fnSubmit={onSubmit}
          action={actionUrl}
          method="POST"
        >
          <InputPassword
            autoFocus
            fieldName="password"
            placeholder={translate('helperText.password')}
            dataTestId="txt-auth-password"
            autoComplete="section-login current-password"
          />
          <input
            type="hidden"
            name="identifier"
            value={loginValue}
            autoComplete="section-login username"
          />
          <input type="hidden" name="prompt" value="login" />
          <Button
            variant="contained"
            label={translate('actionButtons.logIn')}
            type="submit"
            data-test-id="btn-auth-login-submit"
          />
        </Form>
        <form action={`${INTERACTION_URL}/recover-password`} method="POST">
          <input type="hidden" name="identifier" value={loginValue} />
          <Button
            label={translate('actionButtons.recoverPassword')}
            type="submit"
            data-test-id="btn-auth-password-recovery"
          />
        </form>
      </Container>
    </Section>
  );
};

export default Page;

'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID } from '@/lib/constant';
import { useAppSelector } from '@/store/hooks';
import { FormState } from '@/store/slices/formSlice';
import { EHashPages } from '@/types/types';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const login = useAppSelector(({ form }: { form: FormState }) => form.login);
  const actionUrl = `/api/interaction/${INTERACTION_ID}/auth?type=login`;
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  const methods = useForm();

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
          />
          <input type="hidden" name="identifier" value={login} />
          <input type="hidden" name="prompt" value="login" />
          <Button variant="contained" label={translate('actionButtons.logIn')} type="submit" />
        </Form>
        <form action={`/api/interaction/${INTERACTION_ID}/recover-password`} method="POST">
          <input type="hidden" name="identifier" value={login} />
          <Button label={translate('actionButtons.recoverPassword')} type="submit" />
        </form>
      </Container>
    </Section>
  );
};

export default Page;

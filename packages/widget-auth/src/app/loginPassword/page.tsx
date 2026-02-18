'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID, PROVIDERS } from '@/lib/constant';
import { useHashParams } from '@/lib/hooks';
import { EHashPages, IProvider } from '@/types/types';
import { FC, useLayoutEffect, useState } from 'react';
import { useWatch, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const hashParams = useHashParams();
  const [provider, setProvider] = useState<IProvider>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  useLayoutEffect(() => {
    setProvider(PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id));
  }, [hashParams?.id]);

  const methods = useForm();
  const { control } = methods;

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
          action={`/api/interaction/${INTERACTION_ID}/auth?type=${provider?.type}`}
          method="POST"
        >
          <InputField fieldName="identifier" placeholder={translate('helperText.login')} />
          <InputPassword fieldName="password" placeholder={translate('helperText.password')} />
          <input type="hidden" name="provider_id" value={provider?.id} />
          <input type="hidden" name="prompt" value="login" />
          <Button variant="contained" label={translate('actionButtons.logIn')} type="submit" />
        </Form>
        <form action={`/api/interaction/${INTERACTION_ID}/recover-password`} method="POST">
          <input type="hidden" name="identifier" value={watchIdentifier} />
          <input type="hidden" name="provider_id" value={provider?.id} />
          <Button
            label={translate('actionButtons.recoverPassword')}
            type="submit"
            disabled={!watchIdentifier}
          />
        </form>
      </Container>
    </Section>
  );
};

export default Page;

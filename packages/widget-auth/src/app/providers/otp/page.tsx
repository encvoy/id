'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID, PROVIDERS } from '@/lib/constant';
import { useHashParams, usePlaceholder } from '@/lib/hooks';
import { IProvider } from '@/types/types';
import { FC, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

const Page: FC = () => {
  const hashParams = useHashParams();
  const placeholder = usePlaceholder();
  const { t: translate } = useTranslation();
  const [provider, setProvider] = useState<IProvider>();
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  useLayoutEffect(() => {
    setProvider(PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id));
  }, [hashParams?.id]);

  const methods = useForm();

  const onSubmit = () => {
    setModeForm('action');
  };

  return (
    <Section>
      <Container title={provider?.type || ''}>
        <Form
          fnSubmit={onSubmit}
          mode={modeForm}
          methodsForm={methods}
          action={'/api/interaction/' + INTERACTION_ID + '/auth?type=' + provider?.type}
          method="POST"
        >
          <InputField autoFocus fieldName="identifier" placeholder={placeholder} />
          <InputField fieldName="code" placeholder={translate('helperText.code')} />
          <input type="hidden" name="provider_id" value={provider?.id.toString()} />
          <Button variant="contained" label={translate('actionButtons.confirm')} type={'submit'} />
        </Form>
      </Container>
    </Section>
  );
};

export default Page;

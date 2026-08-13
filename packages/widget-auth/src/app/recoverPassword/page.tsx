'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { InputPassword } from '@/components/inputPassword/InputPassword';
import { Section } from '@/components/section/Section';
import { FIELD, INTERACTION_URL, LOGIN, MESSAGE, MESSAGE_DETAIL } from '@/lib/constant';
import { getLocalizedTextValue, isNotValidValue } from '@/lib/utils';
import { FC, useLayoutEffect, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import { ValidationRuleList } from '@/components/listItem/listItem';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface IRecoverPasswordFormData {
  identifier: string;
  code: string;
  password: string;
}

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const actionUrl = `${INTERACTION_URL}/recover-password`;
  const [modeForm, setModeForm] = useState<'hookForm' | 'action'>('hookForm');

  const methods = useForm<IRecoverPasswordFormData>();
  const { reset, control, setError } = methods;
  const login = useWatch({ name: 'identifier', control });

  useLayoutEffect(() => {
    reset({
      identifier: LOGIN,
    });
  }, []);

  const resolvedMessage = useMemo(
    () => getLocalizedTextValue(MESSAGE, i18n.language),
    [i18n.language],
  );

  const onSubmit = ({ password }: IRecoverPasswordFormData) => {
    if (FIELD && isNotValidValue(password, 'password', setError, FIELD, i18n.language)) {
      return;
    }

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
            {translate('pages.recover.sendMessage', { value: resolvedMessage })}
          </Typography>
          {MESSAGE_DETAIL ? <Typography color="text.secondary">{MESSAGE_DETAIL}</Typography> : null}
          <InputField
            fieldName="identifier"
            placeholder={translate('helperText.login')}
            autoComplete="section-recover-password username"
            disabled
          />
          <InputField
            fieldName="code"
            placeholder={translate('helperText.code')}
            dataTestId="txt-auth-code"
            autoComplete="section-recover-password one-time-code"
            ignorePasswordManagers
          />
          <InputPassword
            fieldName="password"
            placeholder={translate('pages.recover.new')}
            dataTestId="txt-auth-new-password"
            autoComplete="section-recover-password new-password"
          />
          <input
            type="hidden"
            name="identifier"
            value={login}
            autoComplete="section-recover-password username"
          />
          <Button
            variant="contained"
            label={translate('actionButtons.save')}
            type="submit"
            data-test-id="btn-auth-form-save"
          />
          <ValidationRuleList />
        </Form>
      </Container>
    </Section>
  );
};

export default Page;

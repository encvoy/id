'use client';

import { Button } from '@/components/button/Button';
import { Section } from '@/components/section/Section';
import { Container } from '@/components/container/Container';
import { FC, useEffect, useRef, useState } from 'react';
import { Form } from '@/components/form/Form';
import { INTERACTION_ID, PROVIDERS, MESSAGE, FIELD, CLIENT_ID } from '@/lib/constant';
import { EHashPages, IFieldEnv, IProvider } from '@/types/types';
import { useForm, useWatch } from 'react-hook-form';
import { useHashParams, useTimer } from '@/lib/hooks';
import { useTranslation } from 'react-i18next';
import { InputField } from '@/components/input/InputField';
import Box from '@mui/material/Box';
import { getTimezoneOffsetInHours, isNotValidValue, isValidEmail } from '@/lib/utils';
import { ValidationRuleList } from '@/components/listItem/listItem';

interface IEmailFormData {
  email: string;
  code?: string;
}

export enum EMailCodeTypes {
  confirmEmail = 'confirmEmail',
  recoverPassword = 'recoverPassword',
}

interface IEmailPageProps {
  isStep?: boolean;
}

const Page: FC<IEmailPageProps> = ({ isStep }) => {
  const { t: translate } = useTranslation();
  const hashParams = useHashParams();
  const { minute, second, setTime } = useTimer();
  const [provider, setProvider] = useState<IProvider>();
  const [isConfirmedLink, setIsConfirmedLink] = useState<boolean>(false);
  const [modeForm, setModeForm] = useState<string>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [mailUsed, setMailUsed] = useState('');
  const [currentField, setCurrentField] = useState<IFieldEnv>();

  useEffect(() => {
    setCurrentField(FIELD);
  }, []);

  const methods = useForm<IEmailFormData>({
    defaultValues: {
      email: '',
    },
  });
  const { setError, getValues, control } = methods;
  const watchEmail = useWatch({ control, name: 'email' });

  useEffect(() => {
    setError('code', { message: MESSAGE });
  }, []);

  useEffect(() => {
    setProvider(PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id));
  }, [hashParams?.id]);

  const checkStatusVerification = (email?: string): Promise<{ status: boolean }> => {
    return fetch('/api/v1/verification/status?email=' + (email || ''))
      .then((response) => response.json())
      .then((data) => ({ status: data.status }));
  };

  useEffect(() => {
    if (modeForm === 'request') return;

    setInterval(() => {
      const value = getValues('email');
      checkStatusVerification(value).then(({ status }) => {
        if (status) {
          setIsConfirmedLink(true);
        }
      });
    }, 3000);
  }, [modeForm]);

  useEffect(() => {
    if (isConfirmedLink) {
      setModeForm('action');
    }
  }, [isConfirmedLink]);

  const requestVerificationCode = async ({ email }: IEmailFormData) => {
    const isNotValid = isValidEmail(email);
    if (!isNotValid) {
      setError('email', { message: translate('errors.invalidEmailFormat') });
      return;
    }

    if (isStep && isNotValidValue(email, 'email', setError, currentField)) {
      return;
    }
    setMailUsed(email);

    setIsLoading(true);
    try {
      const response = await fetch(window.location.origin + '/api/v1/verification/code', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          type: isStep ? 'EMAIL' : provider?.type,
          email,
          code_type: EMailCodeTypes.confirmEmail,
          uid: INTERACTION_ID,
          timezone_offset: getTimezoneOffsetInHours(),
          resend: true,
          client_id: CLIENT_ID,
          provider_id: provider?.id.toString(),
        }),
      });

      if (!response?.ok) {
        const responseJson = await response?.json();
        setError('email', { message: responseJson?.message || response?.statusText });
        throw new Error(responseJson.errorCode);
      }

      setModeForm('');
      setTime([0, 20]);
    } catch (e) {
      console.error('requestVerificationCode error: ', e);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmVerificationCode = async ({ email, code }: IEmailFormData) => {
    try {
      const response = await fetch(
        `/api/interaction/${INTERACTION_ID}/email/confirm?email=${email}&code=${code || ''}`,
      );

      if (!response?.ok) {
        const responseJson = await response?.json();
        setError('code', { message: responseJson.message || response?.statusText });
        throw new Error(responseJson.errorCode);
      }

      setModeForm('action');
    } catch (e) {
      console.error('confirmVerificationCode error: ', e);
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return <div className="loader"></div>;
    }

    if (minute !== 0 || second !== 0) {
      return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    } else if (modeForm === 'request') {
      return translate('actionButtons.get');
    } else {
      return translate('actionButtons.repeat');
    }
  };

  return (
    <Section>
      <Container title="Email" isCancelAction={isStep} backPath={EHashPages.LOGIN}>
        <Form<IEmailFormData>
          methodsForm={methods}
          fnSubmit={modeForm === 'request' ? requestVerificationCode : confirmVerificationCode}
          mode={modeForm === 'action' ? 'action' : 'hookForm'}
          action={`/api/interaction/${INTERACTION_ID}/${isStep ? 'steps' : `auth?type=${provider?.type}&provider_id=${provider?.id}`}`}
          method="POST"
        >
          <InputField autoFocus fieldName="email" placeholder={translate('helperText.email')} />
          <Box sx={{ display: 'flex', gap: 8 }}>
            <InputField
              fieldName="code"
              disabled={modeForm === 'request'}
              placeholder={translate('helperText.code')}
              requiredFiled={!(mailUsed !== watchEmail || modeForm === 'request')}
              endPosition={
                <Button
                  disabled={minute !== 0 || second !== 0}
                  label={getButtonText()}
                  onClick={() => {
                    if (modeForm !== 'request') {
                      requestVerificationCode(getValues());
                    }
                  }}
                  type={mailUsed !== watchEmail || modeForm === 'request' ? 'submit' : undefined}
                />
              }
            />
          </Box>
          <Button
            variant="contained"
            label={translate('actionButtons.confirm')}
            disabled={mailUsed !== watchEmail || modeForm === 'request'}
            type={mailUsed === watchEmail && modeForm !== 'request' ? 'submit' : undefined}
          />
          {isStep && <ValidationRuleList />}
        </Form>
      </Container>
    </Section>
  );
};

export default Page;

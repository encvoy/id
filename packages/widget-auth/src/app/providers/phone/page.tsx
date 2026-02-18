'use client';

import { Button } from '@/components/button/Button';
import { Section } from '@/components/section/Section';
import { Container } from '@/components/container/Container';
import { FC, useEffect, useState } from 'react';
import { Form } from '@/components/form/Form';
import { CLIENT_ID, INTERACTION_ID, MESSAGE, PROVIDERS } from '@/lib/constant';
import { EHashPages, IProvider } from '@/types/types';
import { InputPhone } from '@/components/input/InpuFieldPhone';
import { InputField } from '@/components/input/InputField';
import { useHashParams, useTimer } from '@/lib/hooks';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import { ValidationRuleList } from '@/components/listItem/listItem';

interface IPhoneFormData {
  phone_number: string;
  code?: string;
}

type TCodeInfo = {
  success: boolean;
  code_type: 'number' | 'voice' | '';
  code?: string;
};

interface IPhonePageProps {
  isStep?: boolean;
}

const Page: FC<IPhonePageProps> = ({ isStep }) => {
  const { t: translate } = useTranslation();
  const hashParams = useHashParams();
  const { minute, second, setTime } = useTimer();
  const [clientId, setClientId] = useState<string>('');
  const [codeInfo, setCodeInfo] = useState<TCodeInfo>({ code_type: '', success: false });
  const [provider, setProvider] = useState<IProvider>();
  const [modeForm, setModeForm] = useState<string>('request');
  const [phoneUsed, setPhoneUsed] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<IPhoneFormData>({
    defaultValues: {
      phone_number: '',
    },
  });
  const { setError, control, getValues } = methods;
  const watchPhone = useWatch({ control, name: 'phone_number' });

  useEffect(() => {
    setProvider(PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id));
    setClientId(CLIENT_ID);
  }, [hashParams?.id]);

  useEffect(() => {
    if (MESSAGE) {
      setError('phone_number', { message: MESSAGE });
    }
  }, [MESSAGE]);

  const showMessage = (codeType: string) => {
    switch (codeType) {
      case 'number':
        return translate('pages.phone.codeNumber', { length: codeInfo?.code?.length || 4 });
      case 'voice':
        return translate('pages.phone.codeVoice');
    }
  };

  const requestVerificationCode = async ({ phone_number }: IPhoneFormData) => {
    setPhoneUsed(phone_number);
    setIsLoading(true);
    try {
      const response = await fetch(window.location.origin + '/api/v1/verification/code', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          type: 'PHONE',
          phone_number,
          provider_id: provider?.id.toString(),
          client_id: clientId,
        }),
      });

      if (!response?.ok) {
        const responseJson = await response?.json();
        setError('phone_number', { message: responseJson?.message || response?.statusText });
        throw new Error(responseJson.errorCode);
      }

      const responseJson = await response?.json();
      setCodeInfo(responseJson);
      setModeForm('');
      setTime([0, 20]);
    } catch (e) {
      console.error('requestVerificationCode error: ', e);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmVerificationCode = async ({ phone_number, code }: IPhoneFormData) => {
    try {
      const response = await fetch(
        window.location.origin + `/api/interaction/${INTERACTION_ID}/phone/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: phone_number || '',
            code: code || '',
          }),
        },
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
      <Container title={translate('helperText.phone')} backPath={EHashPages.LOGIN}>
        <Form<IPhoneFormData>
          fnSubmit={modeForm === 'request' ? requestVerificationCode : confirmVerificationCode}
          methodsForm={methods}
          mode={modeForm === 'action' ? 'action' : 'hookForm'}
          action={`/api/interaction/${INTERACTION_ID}/${isStep ? 'steps' : `auth?type=${provider?.type}`}`}
          method="POST"
        >
          <InputPhone fieldName="phone_number" />
          <Box sx={{ display: 'flex', gap: 8 }}>
            <InputField
              fieldName="code"
              disabled={modeForm === 'request'}
              requiredFiled={!(phoneUsed !== watchPhone || modeForm === 'request')}
              placeholder={translate('helperText.code')}
              endPosition={
                <Button
                  disabled={minute !== 0 || second !== 0}
                  label={getButtonText()}
                  onClick={() => {
                    if (modeForm !== 'request') {
                      requestVerificationCode(getValues());
                    }
                  }}
                  type={phoneUsed !== watchPhone || modeForm === 'request' ? 'submit' : undefined}
                />
              }
            />
          </Box>

          {codeInfo.code_type && (
            <Typography color="text.secondary">{showMessage(codeInfo.code_type)}</Typography>
          )}
          <input type="hidden" name="provider_id" value={provider?.id.toString()} />
          <Button
            variant="contained"
            label={translate('actionButtons.confirm')}
            disabled={phoneUsed !== watchPhone || modeForm === 'request'}
            type={phoneUsed === watchPhone && modeForm !== 'request' ? 'submit' : undefined}
          />
        </Form>
        {isStep && <ValidationRuleList />}
      </Container>
    </Section>
  );
};

export default Page;

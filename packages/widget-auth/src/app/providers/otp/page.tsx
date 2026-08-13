'use client';

import { Button } from '@/components/button/Button';
import { CodeInput } from '@/components/codeInput/CodeInput';
import { Container } from '@/components/container/Container';
import { Form } from '@/components/form/Form';
import { InputField } from '@/components/input/InputField';
import { Section } from '@/components/section/Section';
import {
  AUTH_STAGE,
  consumeFormError,
  INITIAL_ROUTE,
  INTERACTION_URL,
  LOGIN,
  PROVIDERS,
} from '@/lib/constant';
import { useHashParams, usePlaceholder } from '@/lib/hooks';
import { EHashPages, EProviderTypes, IOtpSetup, IProvider, isOtpProvider } from '@/types/types';
import { Box, Paper, Typography } from '@mui/material';
import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, type UseFormReturn } from 'react-hook-form';

const DEFAULT_OTP_LENGTH = 6;

type TOtpFormMode = 'hookForm' | 'action';

interface IOtpFormValues {
  identifier?: string;
  code: string;
}

interface IOtpFormProps {
  provider?: IProvider;
  methods: UseFormReturn<IOtpFormValues>;
  mode: TOtpFormMode;
  otpLength: number;
  onCodeComplete: () => void;
  onSubmit: () => void;
}

interface IOtpConnectFormProps extends IOtpFormProps {
  otpSetup: IOtpSetup | null;
  otpSetupError: string;
}

interface IOtpAuthFormProps extends IOtpFormProps {
  isSecondFactorChallenge: boolean;
  placeholder: string;
  shouldFocusCode: boolean;
}

const getOtpLength = (provider?: IProvider) => {
  if (!provider || !isOtpProvider(provider)) return DEFAULT_OTP_LENGTH;

  const digits = Number(provider.params?.digits);

  return digits === 6 || digits === 7 || digits === 8 ? digits : DEFAULT_OTP_LENGTH;
};

const OtpConnectForm: FC<IOtpConnectFormProps> = ({
  provider,
  methods,
  mode,
  otpLength,
  otpSetup,
  otpSetupError,
  onCodeComplete,
  onSubmit,
}) => {
  const { t: translate } = useTranslation();

  if (otpSetupError && !otpSetup) {
    return (
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 2.5,
          borderRadius: 4,
          border: '1px solid rgba(239, 68, 68, 0.18)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, #fff5f5 100%)',
        }}
      >
        <Typography sx={{ textAlign: 'center' }} color="error">
          {otpSetupError}
        </Typography>
      </Paper>
    );
  }

  if (!otpSetup) {
    return null;
  }

  return (
    <>
      <Box>
        <Box>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Connect the account in your authenticator app
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: '8px',
            }}
          >
            <Box
              sx={{
                p: '8px',
                borderRadius: '16px',
                backgroundColor: '#fff',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
              }}
            >
              <img
                src={otpSetup.qrCode}
                alt="OTP QR code"
                style={{
                  width: 184,
                  height: 184,
                  display: 'block',
                  borderRadius: 16,
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      <Form
        fnSubmit={onSubmit}
        mode={mode}
        methodsForm={methods}
        action={`${INTERACTION_URL}/auth?type=${provider?.type}`}
        method="POST"
      >
        <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Enter the code from the app
        </Typography>
        <CodeInput
          autoFocus
          disabled={mode === 'action'}
          fieldName="code"
          length={otpLength}
          onComplete={onCodeComplete}
          dataTestId="txt-auth-code-confirm"
          autoComplete="section-otp one-time-code"
        />
        <input type="hidden" name="otp_setup" value="true" />
        <input type="hidden" name="state" value={otpSetup.state} />
        <input type="hidden" name="provider_id" value={provider?.id.toString()} />
        <Button
          variant="contained"
          label={translate('actionButtons.confirm')}
          type="submit"
          disabled={mode === 'action'}
          data-test-id="btn-auth-login-submit"
        />
      </Form>
    </>
  );
};

const OtpAuthForm: FC<IOtpAuthFormProps> = ({
  provider,
  methods,
  mode,
  otpLength,
  isSecondFactorChallenge,
  placeholder,
  shouldFocusCode,
  onCodeComplete,
  onSubmit,
}) => {
  const { t: translate } = useTranslation();

  return (
    <Form
      fnSubmit={onSubmit}
      mode={mode}
      methodsForm={methods}
      action={`${INTERACTION_URL}/auth?type=${provider?.type}`}
      method="POST"
    >
      {!isSecondFactorChallenge && (
        <InputField
          autoFocus
          fieldName="identifier"
          placeholder={placeholder}
          dataTestId="txt-auth-trusted-provider-login"
          autoComplete="section-otp username"
        />
      )}
      <CodeInput
        autoFocus={shouldFocusCode}
        disabled={mode === 'action'}
        fieldName="code"
        length={otpLength}
        onComplete={onCodeComplete}
        dataTestId="txt-auth-code-confirm"
        autoComplete="section-otp one-time-code"
      />
      <input type="hidden" name="provider_id" value={provider?.id.toString()} />
      <Button
        variant="contained"
        label={translate('actionButtons.confirm')}
        type="submit"
        disabled={mode === 'action'}
        data-test-id="btn-auth-login-submit"
      />
    </Form>
  );
};

const Page: FC = () => {
  const hashParams = useHashParams();
  const placeholder = usePlaceholder();
  const { t: translate } = useTranslation();
  const [provider, setProvider] = useState<IProvider>();
  const [modeForm, setModeForm] = useState<TOtpFormMode>('hookForm');
  const [otpSetup, setOtpSetup] = useState<IOtpSetup | null>(null);
  const [otpSetupError, setOtpSetupError] = useState('');
  const [shouldFocusCode, setShouldFocusCode] = useState(false);
  const isSetup =
    INITIAL_ROUTE === 'missing-identifiers' || AUTH_STAGE === 'second-factor-enrollment';

  useLayoutEffect(() => {
    setProvider(PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id));
  }, [hashParams?.id]);

  useEffect(() => {
    const loadOtpSetup = async () => {
      if (!provider || !isOtpProvider(provider) || otpSetup || !isSetup) {
        return;
      }

      setOtpSetupError('');

      try {
        const response = await fetch(`${INTERACTION_URL}/otp/setup?provider_id=${provider.id}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setOtpSetup(data);
      } catch {
        setOtpSetupError(translate('errors.errorOccurred'));
      }
    };

    loadOtpSetup();
  }, [isSetup, otpSetup, provider, translate]);

  const isSetupMode = Boolean(otpSetup);
  const isSecondFactorChallenge = AUTH_STAGE === 'second-factor-challenge';
  const methods = useForm<IOtpFormValues>({
    defaultValues: {
      identifier: LOGIN || '',
      code: '',
    },
  });
  const otpLength = useMemo(
    () => (isSetupMode ? otpSetup?.digits || getOtpLength(provider) : getOtpLength(provider)),
    [isSetupMode, otpSetup, provider],
  );

  const onSubmit = () => {
    setModeForm('action');
  };

  const handleCodeComplete = () => {
    void methods.handleSubmit(onSubmit)();
  };

  useEffect(() => {
    const codeError = consumeFormError('code');
    if (!codeError) {
      return;
    }

    methods.setValue('code', '');
    methods.setError('code', {
      type: 'server',
      message: codeError,
    });
    setShouldFocusCode(true);
  }, [methods]);

  return (
    <Section>
      <Container title={provider?.name || ''} isCancelAction>
        {isSetup ? (
          <OtpConnectForm
            provider={provider}
            methods={methods}
            mode={modeForm}
            otpLength={otpLength}
            otpSetup={otpSetup}
            otpSetupError={otpSetupError}
            onCodeComplete={handleCodeComplete}
            onSubmit={onSubmit}
          />
        ) : (
          <OtpAuthForm
            provider={provider}
            methods={methods}
            mode={modeForm}
            otpLength={otpLength}
            isSecondFactorChallenge={isSecondFactorChallenge}
            placeholder={placeholder}
            shouldFocusCode={shouldFocusCode}
            onCodeComplete={handleCodeComplete}
            onSubmit={onSubmit}
          />
        )}
      </Container>
    </Section>
  );
};

export default Page;

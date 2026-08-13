'use client';

import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { Button } from '@/components/button/Button';
import {
  AUTH_STAGE,
  buildPublicUrl,
  INTERACTION_ID,
  INTERACTION_URL,
  PROVIDERS,
} from '@/lib/constant';
import { useHashParams } from '@/lib/hooks';
import { FC, useEffect, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import Typography from '@mui/material/Typography/Typography';
import { useTranslation } from 'react-i18next';

const getRequestError = async (response: Response): Promise<string> => {
  try {
    const result = await response.json();
    return result?.message || result?.error || 'Request failed';
  } catch {
    return 'Request failed';
  }
};

const submitWebAuthnResult = (
  providerId: number,
  fieldName: 'authenticationResponse' | 'registrationResponse',
  value: unknown,
  state?: string,
) => {
  const authForm = document.createElement('form');
  authForm.action = `${INTERACTION_URL}/auth?type=WEBAUTHN`;
  authForm.method = 'POST';
  authForm.style.display = 'none';

  const providerIdInput = document.createElement('input');
  providerIdInput.type = 'hidden';
  providerIdInput.name = 'provider_id';
  providerIdInput.value = providerId.toString();
  authForm.appendChild(providerIdInput);

  const responseInput = document.createElement('input');
  responseInput.type = 'hidden';
  responseInput.name = fieldName;
  responseInput.value = JSON.stringify(value);
  authForm.appendChild(responseInput);

  if (state) {
    const stateInput = document.createElement('input');
    stateInput.type = 'hidden';
    stateInput.name = 'state';
    stateInput.value = state;
    authForm.appendChild(stateInput);
  }

  document.body.appendChild(authForm);
  authForm.submit();
};

const submitPasskeyNotAvailable = (providerId: number) => {
  const authForm = document.createElement('form');
  authForm.action = `${INTERACTION_URL}/auth?type=WEBAUTHN`;
  authForm.method = 'POST';
  authForm.style.display = 'none';

  const providerIdInput = document.createElement('input');
  providerIdInput.type = 'hidden';
  providerIdInput.name = 'provider_id';
  providerIdInput.value = providerId.toString();
  authForm.appendChild(providerIdInput);

  const passkeyNotAvailableInput = document.createElement('input');
  passkeyNotAvailableInput.type = 'hidden';
  passkeyNotAvailableInput.name = 'passkey_not_available';
  passkeyNotAvailableInput.value = 'true';
  authForm.appendChild(passkeyNotAvailableInput);

  document.body.appendChild(authForm);
  authForm.submit();
};

const isNoAvailablePasskeyError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const webAuthnError = error as {
    code?: string;
    cause?: { name?: string };
    name?: string;
  };

  return (
    webAuthnError.code === 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY' &&
    webAuthnError.cause?.name === 'NotAllowedError'
  );
};

const authRequest = async (providerId: number) => {
  const responseAuth = await fetch(
    buildPublicUrl(`/api/webauthn/authenticate?provider_id=${providerId}`),
    { method: 'GET' },
  );
  if (!responseAuth.ok) {
    throw new Error(await getRequestError(responseAuth));
  }

  const options = await responseAuth.json();
  const authenticationResponse = await startAuthentication(options);
  submitWebAuthnResult(providerId, 'authenticationResponse', authenticationResponse);
};

const bindRequest = async (providerId: number) => {
  const responseRegister = await fetch(
    buildPublicUrl(
      `/api/webauthn/register?provider_id=${providerId}&interaction_id=${INTERACTION_ID}`,
    ),
    {
      method: 'GET',
    },
  );
  if (!responseRegister.ok) {
    throw new Error(await getRequestError(responseRegister));
  }

  const { state, ...options } = await responseRegister.json();
  const registrationResponse = await startRegistration(options);
  submitWebAuthnResult(providerId, 'registrationResponse', registrationResponse, state);
};

interface PageProps {
  mode?: 'auth' | 'bind';
}

const Page: FC<PageProps> = ({ mode = 'auth' }) => {
  const hashParams = useHashParams();
  const { t: translate } = useTranslation();
  const [errorMessage, setErrorMessage] = useState('');
  const [passkeyUnavailableProviderId, setPasskeyUnavailableProviderId] = useState<number | null>(
    null,
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const run = async () => {
      const provider = PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id);
      if (!provider) {
        return;
      }

      try {
        setErrorMessage('');
        setPasskeyUnavailableProviderId(null);
        if (mode === 'bind') {
          await bindRequest(provider.id);
          return;
        }

        await authRequest(provider.id);
      } catch (error) {
        console.error('WebAuthn request error:', error);
        if (mode === 'auth' && isNoAvailablePasskeyError(error)) {
          if (AUTH_STAGE === 'second-factor-challenge') {
            setErrorMessage(translate('webauthn.noPasskeyDescription'));
            return;
          }
          setPasskeyUnavailableProviderId(provider.id);
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : translate('errors.errorOccurred'),
        );
      }
    };
    run();
  }, [hashParams.id, mode, retryKey, translate]);

  return (
    <Section>
      <Container title="Webauthn" isCancelAction>
        {passkeyUnavailableProviderId ? (
          <>
            <Typography sx={{ textAlign: 'center' }} color="text.secondary">
              {translate('webauthn.noPasskeyDescription')}
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              label={translate('webauthn.continueAddingPasskey')}
              onClick={() => submitPasskeyNotAvailable(passkeyUnavailableProviderId)}
              data-test-id="btn-auth-webauthn-add-passkey"
            />
            <Button
              sx={{ mt: 1 }}
              label={translate('webauthn.tryAgain')}
              onClick={() => setRetryKey((value) => value + 1)}
              data-test-id="btn-auth-webauthn-try-again"
            />
          </>
        ) : (
          <Typography sx={{ textAlign: 'center' }} color="text.secondary">
            {translate('helperText.serviceInstructions', { value: 'Webauthn' })}
          </Typography>
        )}
        {!!errorMessage && (
          <Typography sx={{ mt: 2, textAlign: 'center' }} color="error">
            {errorMessage}
          </Typography>
        )}
      </Container>
    </Section>
  );
};

export default Page;

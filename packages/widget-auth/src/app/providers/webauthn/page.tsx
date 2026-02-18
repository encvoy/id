'use client';

import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { DOMAIN, INTERACTION_ID, PROVIDERS } from '@/lib/constant';
import { useHashParams } from '@/lib/hooks';
import { FC, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import Typography from '@mui/material/Typography/Typography';
import { useTranslation } from 'react-i18next';

const authRequest = async (provider_id: number) => {
  try {
    // 1. Get authentication options
    const responseAuth = await fetch(`/api/webauthn/authenticate?provider_id=${provider_id}`, {
      method: 'GET',
    });
    const result = await responseAuth.json();
    const authOptions = await startAuthentication(result);

    // 2. Create a form for POST request (as in other providers)
    const authForm = document.createElement('form');
    authForm.action = DOMAIN + '/api/interaction/' + INTERACTION_ID + `/auth?type=WEBAUTHN`;
    authForm.method = 'POST';
    authForm.style.display = 'none';

    // 3. Add data to the form
    const providerIdInput = document.createElement('input');
    providerIdInput.type = 'hidden';
    providerIdInput.name = 'provider_id';
    providerIdInput.value = provider_id.toString();
    authForm.appendChild(providerIdInput);

    const authResponseInput = document.createElement('input');
    authResponseInput.type = 'hidden';
    authResponseInput.name = 'authenticationResponse';
    authResponseInput.value = JSON.stringify(authOptions);
    authForm.appendChild(authResponseInput);

    // 4. Submit the form (this allows the server to make a redirect)
    document.body.appendChild(authForm);
    authForm.submit();
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
  }
};

const Page: FC = () => {
  const hashParams = useHashParams();
  const { t: translate } = useTranslation();

  useEffect(() => {
    const run = async () => {
      const provider = PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id);
      if (provider) {
        await authRequest(provider.id);
      }
    };
    run();
  }, [hashParams.id]);

  return (
    <Section>
      <Container title="Webauthn" isCancelAction>
        <Typography sx={{ textAlign: 'center' }} color="text.secondary">
          {translate('helperText.serviceInstructions', { value: 'Webauthn' })}
        </Typography>
      </Container>
    </Section>
  );
};

export default Page;

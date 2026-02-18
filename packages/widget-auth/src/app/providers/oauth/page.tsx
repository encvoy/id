'use client';

import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { CLIENT_ID, DOMAIN, INTERACTION_ID, PROVIDERS } from '@/lib/constant';
import { Cookie } from '@/lib/cookie';
import { useHashParams } from '@/lib/hooks';
import { Typography } from '@mui/material';
import { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const randomString = (length: number) => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// PKCE: SHA256 + base64url
async function pkceChallengeFromVerifier(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

export const authRequest = async (provider_id: number, opts?: { pkce?: boolean }) => {
  const antiForgeryStateToken = randomString(30);
  window.localStorage.setItem('antiForgeryStateToken', antiForgeryStateToken);

  const url = new URL('/api/v1/auth/oauth', DOMAIN);
  const params: Record<string, string> = {
    provider_id: provider_id.toString(),
    state: antiForgeryStateToken,
    client_id: CLIENT_ID,
    interaction_id: INTERACTION_ID,
  };

  // For PKCE
  if (opts?.pkce) {
    const codeVerifier = window.sessionStorage.getItem(`pkce_code_verifier_${provider_id}`);
    if (codeVerifier) {
      params.code_verifier = codeVerifier;
      params.code_challenge = await pkceChallengeFromVerifier(codeVerifier);
      params.code_challenge_method = 'S256';
      // Put PKCE parameters in cookie
      document.cookie = `pkce_code_verifier_${provider_id}=${codeVerifier}; path=/; max-age=300`;
      document.cookie = `pkce_code_challenge_${provider_id}=${params.code_challenge}; path=/; max-age=300`;
      document.cookie = `pkce_code_challenge_method_${provider_id}=S256; path=/; max-age=300`;
    }
  }

  url.search = new URLSearchParams(params).toString();
  window.location.href = url.toString();
};

// PKCE utils for OAuth (RFC 7636)
export function generateCodeVerifier(length = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

export function setPkceCookies(providerId: string | number) {
  // 5 minutes = 1/288 day
  const days = 1 / 288;
  // code_verifier
  const codeVerifier = generateCodeVerifier(64);
  window.sessionStorage.setItem(`pkce_code_verifier_${providerId}`, codeVerifier);
  Cookie.create(`pkce_code_verifier_${providerId}`, codeVerifier, days);
  // state
  const state = generateCodeVerifier(30);
  Cookie.create(`pkce_state_${providerId}`, state, days);
  // device_id
  let deviceId = '';
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('device_id')) {
    deviceId = urlParams.get('device_id') || '';
  } else {
    deviceId = generateCodeVerifier(24);
  }
  Cookie.create(`pkce_device_id_${providerId}`, deviceId, days);
}

interface IOAuthPageProps {
  pkce?: boolean;
}

const Page: FC<IOAuthPageProps> = ({ pkce }) => {
  const hashParams = useHashParams();
  const { t: translate } = useTranslation();

  useEffect(() => {
    const run = async () => {
      const provider = PROVIDERS.find((provider) => provider.id.toString() === hashParams?.id);
      if (provider) {
        if (pkce) {
          setPkceCookies(provider.id);
        }
        await authRequest(provider.id, { pkce });
      }
    };
    run();
  }, [hashParams.id]);

  return (
    <Section>
      <Container title="Oauth" isCancelAction>
        <Typography sx={{ textAlign: 'center' }} color="text.secondary">
          {translate('helperText.serviceInstructions', { value: 'Oauth' })}
        </Typography>
      </Container>
    </Section>
  );
};

export default Page;

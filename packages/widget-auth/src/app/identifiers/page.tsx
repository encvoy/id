'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID, PROVIDERS } from '@/lib/constant';
import {
  getImageURL,
  getLocalizedTextValue,
  navigateToHash,
  redirectToProvider,
} from '@/lib/utils';
import { EProviderTypes, IProvider, isMTLSProvider } from '@/types/types';
import { Avatar } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PageProps {
  title?: string;
  mode?: 'auth' | 'bind';
}

const Page: FC<PageProps> = ({ mode = 'auth' }) => {
  const { t: translate, i18n } = useTranslation();
  const [providers, setProviders] = useState<IProvider[]>([]);
  useEffect(() => {
    setProviders(PROVIDERS);
  }, []);

  return (
    <Section>
      <Container
        title={
          mode === 'auth'
            ? translate('pages.identifiers.title')
            : translate('pages.missingIdentifiers.title')
        }
        dataAttribute="page-identifiers"
      >
        {providers.map((provider) => {
          const providerName = getLocalizedTextValue(provider.name, i18n.language);

          return (
            <Button
              label={providerName}
              key={provider.id}
              startIcon={<Avatar src={getImageURL(provider.avatar)} />}
              onClick={() => {
                if (mode === 'bind' && provider.type === EProviderTypes.WEBAUTHN) {
                  navigateToHash(`#webauthn-bind/${provider.id}`);
                  return;
                }
                if (mode === 'bind' && isMTLSProvider(provider) && provider.params?.issuer) {
                  window.location.assign(
                    `${
                      provider.params.issuer
                    }/api/mtls/bind?uid=${INTERACTION_ID}&provider_id=${provider.id.toString()}`,
                  );
                  return;
                }
                redirectToProvider(provider);
              }}
              data-test-id={`btn-auth-provider-${providerName}`}
            />
          );
        })}
      </Container>
    </Section>
  );
};

export default Page;

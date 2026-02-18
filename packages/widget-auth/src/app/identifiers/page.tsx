'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { PROVIDERS } from '@/lib/constant';
import { getImageURL, redirectToProvider } from '@/lib/utils';
import { IProvider } from '@/types/types';
import { Avatar } from '@mui/material';
import { useRouter } from 'next/dist/client/components/navigation';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PageProps {
  title?: string;
}

const Page: FC<PageProps> = ({ title }) => {
  const { t: translate } = useTranslation();
  const [providers, setProviders] = useState<IProvider[]>([]);
  const router = useRouter();
  useEffect(() => {
    setProviders(PROVIDERS);
  }, []);

  return (
    <Section>
      <Container title={title || translate('pages.identifiers.title')}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            label={provider.name}
            startIcon={<Avatar src={getImageURL(provider.avatar)} />}
            onClick={() => {
              redirectToProvider(provider, router);
            }}
          />
        ))}
      </Container>
    </Section>
  );
};

export default Page;

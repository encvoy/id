'use client';

import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { ImageField } from '@/app/steps/imageField';
import { DateField } from '@/app/steps/dateField';
import { CheckBoxField } from '@/app/steps/checkBoxField';
import { EHashPages, IFieldEnv } from '@/types/types';
import dynamic from 'next/dynamic';
import { FIELD } from '@/lib/constant';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
const TextField = dynamic(() => import('./textField'), { ssr: false });

const Page: FC = () => {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const [fieldType, setFieldType] = useState<IFieldEnv['type']>('');

  useEffect(() => {
    if (FIELD?.type === 'email') {
      router.replace(EHashPages.EMAILSTEP);
      return;
    }
    if (FIELD?.type === 'phone') {
      router.replace(EHashPages.PHONESTEP);
      return;
    }
    setFieldType(FIELD?.type ?? '');
  }, []);

  const renderField = (type: string) => {
    switch (type) {
      case 'string':
        return <TextField />;
      case 'image':
        return <ImageField />;
      case 'date':
        return <DateField />;
      case 'boolean':
        return <CheckBoxField />;
    }
  };

  return (
    <Section>
      <Container title={translate('pages.steps.title')} isCancelAction>
        <Box>{renderField(fieldType)}</Box>
      </Container>
    </Section>
  );
};

export default Page;

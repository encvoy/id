'use client';

import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ImageField } from '@/app/steps/imageField';
import { DateField } from '@/app/steps/dateField';
import { CheckBoxField } from '@/app/steps/checkBoxField';
import { EHashPages, IFieldEnv } from '@/types/types';
import dynamic from 'next/dynamic';
import { FIELD } from '@/lib/constant';
import { getLocalizedTextValue, navigateToHash } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
const TextField = dynamic(() => import('./textField'), { ssr: false });

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const [fieldType, setFieldType] = useState<IFieldEnv['type'] | null>(null);
  const [fieldTitle, setFieldTitle] = useState('');

  useEffect(() => {
    setFieldTitle(getLocalizedTextValue(FIELD?.title, i18n.language));

    if (FIELD?.type === 'email') {
      navigateToHash(EHashPages.EMAILSTEP);
      setFieldType('email');
      return;
    }
    if (FIELD?.type === 'phone') {
      navigateToHash(EHashPages.PHONESTEP);
      setFieldType('phone');
      return;
    }
    setFieldType(FIELD?.type ?? '');
  }, [i18n.language]);

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
      case 'email':
      case 'phone':
        return (
          <Typography color="text.secondary">
            {fieldTitle || translate('pages.steps.title')}
          </Typography>
        );
      default:
        return <Typography color="text.secondary">{translate('errors.errorOccurred')}</Typography>;
    }
  };

  return (
    <Section>
      <Container title={translate('pages.steps.title')} isCancelAction>
        <Box>{fieldType === null ? null : renderField(fieldType)}</Box>
      </Container>
    </Section>
  );
};

export default Page;

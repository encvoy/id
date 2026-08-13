'use client';

import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { MESSAGE } from '@/lib/constant';
import { Typography } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedTextValue } from '@/lib/utils';

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const resolvedMessage = getLocalizedTextValue(MESSAGE, i18n.language);

  return (
    <Section>
      <Container title={translate('helperText.success')} isCancelAction withoutFooter>
        <Typography sx={{ textAlign: 'center' }} color="text.secondary">
          {resolvedMessage || translate('helperText.operationSuccess')}
        </Typography>
      </Container>
    </Section>
  );
};

export default Page;

'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { INTERACTION_ID, WIDGET } from '@/lib/constant';
import Typography from '@mui/material/Typography/Typography';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const [hideCreateAccount, setHideCreateAccount] = useState<boolean>(false);
  const [hideBindAccount, setHideBindAccount] = useState<boolean>(false);
  useEffect(() => {
    setHideCreateAccount(WIDGET.HIDE_CREATE_ACCOUNT);
    setHideBindAccount(WIDGET.HIDE_BIND_ACCOUNT);
  }, []);
  return (
    <Section>
      <Container title={translate('pages.bind.title')} isCancelAction>
        <form action={'/api/interaction/' + INTERACTION_ID + '/steps'} method="POST">
          {!hideCreateAccount && (
            <>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {translate('pages.bind.createAccount')}
              </Typography>
              <Button
                sx={{ marginTop: '8px' }}
                label={translate('actionButtons.create')}
                type="submit"
              />
            </>
          )}
        </form>
        <form action={'/api/interaction/' + INTERACTION_ID + '/bind'} method="POST">
          {!hideBindAccount && (
            <>
              <Typography color="text.secondary" sx={{ textAlign: 'center', paddingTop: '8px' }}>
                {translate('pages.bind.bindToAccount')}
              </Typography>
              <Button
                sx={{ marginTop: '8px' }}
                label={translate('actionButtons.bind')}
                type="submit"
              />
            </>
          )}
        </form>
      </Container>
    </Section>
  );
};

export default Page;

'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { INTERACTION_URL, MESSAGE, WIDGET } from '@/lib/constant';
import { getLocalizedTextValue } from '@/lib/utils';
import Typography from '@mui/material/Typography/Typography';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const [hideCreateAccount, setHideCreateAccount] = useState<boolean>(false);
  const [hideBindAccount, setHideBindAccount] = useState<boolean>(false);
  const message = getLocalizedTextValue(MESSAGE, i18n.language);

  useEffect(() => {
    setHideCreateAccount(WIDGET.HIDE_CREATE_ACCOUNT);
    setHideBindAccount(WIDGET.HIDE_BIND_ACCOUNT);
  }, []);
  return (
    <Section>
      <Container title={translate('pages.bind.title')} isCancelAction>
        {!!message && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', marginBottom: '8px' }}>
            {message}
          </Typography>
        )}
        <form action={`${INTERACTION_URL}/steps`} method="POST">
          {!hideCreateAccount && (
            <>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {translate('pages.bind.createAccount')}
              </Typography>
              <Button
                sx={{ marginTop: '8px' }}
                label={translate('actionButtons.create')}
                type="submit"
                data-test-id="btn-auth-create-account-identifier"
              />
            </>
          )}
        </form>
        <form action={`${INTERACTION_URL}/bind`} method="POST">
          {!hideBindAccount && (
            <>
              <Typography color="text.secondary" sx={{ textAlign: 'center', paddingTop: '8px' }}>
                {translate('pages.bind.bindToAccount')}
              </Typography>
              <Button
                sx={{ marginTop: '8px' }}
                label={translate('actionButtons.bind')}
                type="submit"
                data-test-id="btn-auth-bind-identifier"
              />
            </>
          )}
        </form>
      </Container>
    </Section>
  );
};

export default Page;

'use client';

import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { FC } from 'react';
import { INTERACTION_URL, PRIVATE_REQUIRED_FIELDS } from '@/lib/constant';
import Typography from '@mui/material/Typography';
import { ListItem } from '@/components/listItem/listItem';
import { List } from '@mui/material';
import Box from '@mui/material/Box';
import { Button } from '@/components/button/Button';
import { useTranslation } from 'react-i18next';
import { getLocalizedTextValue } from '@/lib/utils';

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();

  return (
    <Section>
      <Container title={translate('pages.changeStatusFields.title')} isCancelAction>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {PRIVATE_REQUIRED_FIELDS.map((item, index) => (
            <ListItem key={`${index}-${getLocalizedTextValue(item, i18n.language)}`}>
              <Box sx={{ display: 'flex', marginRight: '12px' }}>
                <LockOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />
                <ArrowForwardOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />
                <LockOpenOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />
              </Box>
              <Typography color="text.secondary">
                {getLocalizedTextValue(item, i18n.language)}
              </Typography>
            </ListItem>
          ))}
        </List>
        <form action={`${INTERACTION_URL}/steps`} method="POST">
          <input type="hidden" name="public_profile_consent" value="true" />
          <Button
            sx={{ paddingTop: '8px' }}
            label={translate('actionButtons.next')}
            variant="contained"
            type="submit"
          />
        </form>
      </Container>
    </Section>
  );
};

export default Page;

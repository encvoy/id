'use client';

import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import BookmarksOutlinedIcon from '@mui/icons-material/BookmarksOutlined';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { FC, useEffect, useState } from 'react';
import { DETAILS, INTERACTION_ID } from '@/lib/constant';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { List } from '@mui/material';
import { Button } from '@/components/button/Button';
import { ListItem } from '@/components/listItem/listItem';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const [scopes, setScopes] = useState<string[]>([]);

  useEffect(() => {
    if (DETAILS?.missingOIDCScope) setScopes(DETAILS?.missingOIDCScope?.split(','));
  }, []);

  const scopesData = {
    profile: {
      description: 'pages.scopes.profile',
      icon: <BadgeOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    email: {
      description: 'pages.scopes.email',
      icon: <AlternateEmailOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    phone: {
      description: 'pages.scopes.phone',
      icon: <PhoneIphoneOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    offline_access: {
      description: 'pages.scopes.offlineAccess',
      icon: <HistoryOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    accounts: {
      description: 'pages.scopes.accounts',
      icon: <GroupsOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    openid: {
      description: 'pages.scopes.openid',
      icon: <PersonOutlineOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    lk: {
      description: 'pages.scopes.lk',
      icon: <BiotechOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    catalog: {
      description: 'pages.scopes.catalog',
      icon: <BookmarksOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
    locale: {
      description: 'pages.scopes.locale',
      icon: <LanguageOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
    },
  };

  return (
    <Section>
      <Container title={translate('pages.scopes.title')} isCancelAction>
        <form action={`/api/interaction/${INTERACTION_ID}/confirm`} method="POST">
          <List sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scopes.map((item) => (
              <ListItem key={item}>
                {scopesData[item as keyof typeof scopesData].icon}
                <Typography sx={{ marginLeft: '12px' }} color="text.secondary">
                  {translate(scopesData[item as keyof typeof scopesData].description)}
                </Typography>
              </ListItem>
            ))}
          </List>
          {scopes.map((scope) => (
            <input key={scope} name={`scope.${scope}`} hidden readOnly value="true" />
          ))}
          <input key="prompt" name="prompt" defaultValue="consent" hidden />
          <Button
            sx={{ paddingTop: '8px' }}
            variant="contained"
            label={translate('actionButtons.next')}
            type="submit"
          />
        </form>
      </Container>
    </Section>
  );
};

export default Page;

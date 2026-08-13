'use client';

import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import BookmarksOutlinedIcon from '@mui/icons-material/BookmarksOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { ElementType, FC, useEffect, useState } from 'react';
import { DETAILS, INTERACTION_URL } from '@/lib/constant';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { List } from '@mui/material';
import { Button } from '@/components/button/Button';
import { ListItem } from '@/components/listItem/listItem';

const resolveLocalizedText = (
  value: string | Record<string, string> | null | undefined,
  language: string,
) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[language] || value[language.split('-')[0]] || value.ru || value.en;
};

const dynamicScopeIconMap: Record<string, ElementType> = {
  BadgeOutlined: BadgeOutlinedIcon,
  WorkOutlineOutlined: WorkOutlineOutlinedIcon,
  GroupsOutlined: GroupsOutlinedIcon,
  SecurityOutlined: SecurityOutlinedIcon,
  KeyOutlined: KeyOutlinedIcon,
  FactCheckOutlined: FactCheckOutlinedIcon,
  AccountTreeOutlined: AccountTreeOutlinedIcon,
  CategoryOutlined: CategoryOutlinedIcon,
  SettingsOutlined: SettingsOutlinedIcon,
};

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const [scopes, setScopes] = useState<string[]>([]);
  const dynamicScopeData = new Map(
    (DETAILS.missingCustomOIDCScope || []).map((scope) => [scope.name, scope]),
  );

  useEffect(() => {
    if (DETAILS?.missingBaseOIDCScope) {
      setScopes(
        DETAILS.missingBaseOIDCScope
          .split(',')
          .map((scope) => scope.trim())
          .filter(Boolean),
      );
    }
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
    internal: {
      description: 'pages.scopes.internal',
      icon: <SettingsOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
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
  const getScopeData = (scope: string) => {
    const dynamicScope = dynamicScopeData.get(scope);
    if (dynamicScope) {
      const Icon =
        dynamicScope.icon &&
        (dynamicScopeIconMap[dynamicScope.icon] ||
          dynamicScopeIconMap[`${dynamicScope.icon}Icon`]);

      return {
        description:
          resolveLocalizedText(dynamicScope.description, i18n.language) ||
          resolveLocalizedText(dynamicScope.title, i18n.language) ||
          scope,
        icon: Icon ? (
          <Icon sx={{ color: 'var(--mui-palette-text-secondary)' }} />
        ) : (
          <ErrorOutlineOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />
        ),
      };
    }

    return (
      scopesData[scope as keyof typeof scopesData] ?? {
        description: scope,
        icon: <ErrorOutlineOutlinedIcon sx={{ color: 'var(--mui-palette-text-secondary)' }} />,
      }
    );
  };

  return (
    <Section>
      <Container title={translate('pages.scopes.title')} isCancelAction>
        <form action={`${INTERACTION_URL}/confirm`} method="POST">
          <List sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scopes.map((item) => {
              const scopeData = getScopeData(item);
              const isKnownScope = item in scopesData;

              return (
                <ListItem key={item}>
                  {scopeData.icon}
                  <Typography sx={{ marginLeft: '12px' }} color="text.secondary">
                    {isKnownScope ? translate(scopeData.description) : scopeData.description}
                  </Typography>
                </ListItem>
              );
            })}
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

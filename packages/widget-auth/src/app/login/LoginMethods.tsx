import { FC, MouseEvent, ReactNode, useLayoutEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/button/Button';
import { InputField } from '@/components/input/InputField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import SwapHorizontalCircleOutlinedIcon from '@mui/icons-material/SwapHorizontalCircleOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import styles from './page.module.css';
import { Popover } from '@/components/popover/Popover';
import { Avatar, Tooltip } from '@mui/material';
import { Form } from '@/components/form/Form';
import { useAppDispatch } from '@/store/hooks';
import { setLogin } from '@/store/slices/formSlice';
import { EHashPages, EProviderGroups, EProviderTypes, TProviders } from '@/types/types';
import {
  buildPublicUrl,
  INTERACTION_URL,
  PROVIDERS,
  WIDGET,
} from '@/lib/constant';
import {
  getImageURL,
  getLocalizedTextValue,
  navigateToHash,
  normalizeWidgetLocale,
  redirectToProvider,
} from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { usePlaceholder } from '@/lib/hooks';

type TLoginFormData = {
  login: string;
};

interface ILoginFormProps {
  children?: ReactNode;
}

export const LoginMethods: FC<ILoginFormProps> = () => {
  const { t: translate, i18n } = useTranslation();
  const placeholder = usePlaceholder();
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [providers, setProviders] = useState<TProviders>([]);
  const [hideCreateAccount, setHideCreateAccount] = useState<boolean>(false);
  const [hideAvatarsOfBigProviders, setHideAvatarsOfBigProviders] = useState<boolean>(false);

  useLayoutEffect(() => {
    setHideAvatarsOfBigProviders(WIDGET.HIDE_AVATARS_OF_BIG_PROVIDERS);
    setProviders(PROVIDERS);
    setHideCreateAccount(WIDGET.HIDE_CREATE_ACCOUNT);
  }, []);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const methods = useForm<TLoginFormData>();
  const { setError } = methods;
  const registrationLocale = normalizeWidgetLocale(i18n.resolvedLanguage || i18n.language);

  const onSubmit = async ({ login }: TLoginFormData) => {
    const body = new URLSearchParams({
      identifier: login,
      login: login,
    });
    try {
      const response = await fetch(buildPublicUrl('/api/v1/auth/check_identifier'), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded ',
        },
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const res = await response.json();
        setError('login', { message: res.message });
        throw new Error(res.message);
      }

      dispatch(setLogin(login));
      navigateToHash(EHashPages.PASSWORD);
    } catch (error) {
      console.error('checkIdentifier error: ', error);
    }
  };

  const bigProviders = providers.filter((p) => p.groupe === EProviderGroups.BIG);
  const smallProviders = providers.filter((p) => p.groupe === EProviderGroups.SMALL);
  const smallProvidersLine = smallProviders.slice(0, smallProviders.length > 5 ? 4 : 5);
  const smallProvidersList = smallProviders.slice(4);

  return (
    <>
      {!!providers.find((provider) => provider.type === EProviderTypes.CREDENTIALS) && (
        <Form<TLoginFormData> fnSubmit={onSubmit} mode="hookForm" methodsForm={methods}>
          <InputField
            dataTestId="txt-auth-login"
            fieldName="login"
            placeholder={placeholder}
            autoComplete="section-login username"
          />
          <Button
            variant="contained"
            label={translate('actionButtons.logIn')}
            type="submit"
            data-test-id="btn-auth-login-submit"
          />
        </Form>
      )}

      {!hideCreateAccount && (
        <form action={`${INTERACTION_URL}/steps`} method="POST">
          <input type="hidden" name="locale" value={registrationLocale} />
          <Button
            label={translate('actionButtons.createAccount')}
            type="submit"
            data-test-id="btn-auth-registration-submit"
          />
        </form>
      )}

      {bigProviders.map((provider) => {
        const providerName = getLocalizedTextValue(provider.name, i18n.language);

        return (
          <Button
            data-test-id={`btn-auth-provider-${providerName}`}
            data-id={providerName}
            key={provider.id}
            variant="contained"
            label={providerName}
            startIcon={
              hideAvatarsOfBigProviders ? undefined : (
                <>
                  {provider.avatar ? (
                    <Avatar variant="custom" src={getImageURL(provider.avatar)} />
                  ) : (
                    <SwapHorizontalCircleOutlinedIcon
                      sx={{
                        width: '30px',
                        height: '30px',
                        fill: '#000',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </>
              )
            }
            onClick={() => {
              redirectToProvider(provider);
            }}
          />
        );
      })}
      {!!smallProvidersLine.length && (
        <>
          {providers.find(
            (provider) =>
              provider.type === EProviderTypes.CREDENTIALS ||
              provider.groupe === EProviderGroups.BIG,
          ) && (
            <Typography
              data-test-id="btn-auth-other-providers"
              color="text.secondary"
              className={styles.additionText}
            >
              {translate('pages.login.otherProvider')}
            </Typography>
          )}
          <Box className={styles.actions}>
            {smallProvidersLine.map((provider) => {
              const providerName = getLocalizedTextValue(provider.name, i18n.language);

              return (
                <Tooltip title={providerName} key={provider.id}>
                  <IconButton
                    data-test-id={`btn-auth-provider-${providerName}`}
                    data-id={providerName}
                    key={provider.id}
                    onClick={() => {
                      redirectToProvider(provider);
                    }}
                  >
                    {provider.avatar ? (
                      <Avatar src={getImageURL(provider.avatar)} />
                    ) : (
                      <SwapHorizontalCircleOutlinedIcon />
                    )}
                  </IconButton>
                </Tooltip>
              );
            })}
            {smallProviders.length > 5 && (
              <IconButton onClick={handleClick} data-test-id="btn-auth-more-providers">
                <MoreHorizIcon />
              </IconButton>
            )}
          </Box>
        </>
      )}
      <Popover anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <ul className={styles.listProviders}>
          {smallProvidersList.map((provider) => {
            const providerName = getLocalizedTextValue(provider.name, i18n.language);

            return (
              <li
                className={styles.itemProvider}
                key={provider.id}
                data-id={providerName}
                data-test-id={`btn-auth-provider-${providerName}`}
                onClick={() => {
                  redirectToProvider(provider);
                }}
              >
                {(provider.avatar && <Avatar src={getImageURL(provider.avatar)} />) || (
                  <SwapHorizontalCircleOutlinedIcon />
                )}
                <Typography>{providerName}</Typography>
              </li>
            );
          })}
        </ul>
      </Popover>
    </>
  );
};

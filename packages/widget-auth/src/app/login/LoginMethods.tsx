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
import { useRouter } from 'next/navigation';
import { Form } from '@/components/form/Form';
import { useAppDispatch } from '@/store/hooks';
import { setLogin } from '@/store/slices/formSlice';
import { EHashPages, EProviderGroups, EProviderTypes, TProviders } from '@/types/types';
import { WIDGET, PROVIDERS, INTERACTION_ID, LOGGED_USERS_PARSED } from '@/lib/constant';
import { getImageURL, redirectToProvider } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { usePlaceholder } from '@/lib/hooks';

type TLoginFormData = {
  login: string;
};

interface ILoginFormProps {
  children?: ReactNode;
}

export const LoginMethods: FC<ILoginFormProps> = () => {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const placeholder = usePlaceholder();
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [providers, setProviders] = useState<TProviders>([]);
  const [hideCreateAccount, setHideCreateAccount] = useState<boolean>(false);
  const [interactionId, setInteractionId] = useState<boolean>(false);
  const [hideAvatarsOfBigProviders, setHideAvatarsOfBigProviders] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (
      PROVIDERS.length === 1 &&
      PROVIDERS[0].type !== EProviderTypes.CREDENTIALS &&
      LOGGED_USERS_PARSED.length === 0
    ) {
      redirectToProvider(PROVIDERS[0], router);
    }
    setHideAvatarsOfBigProviders(WIDGET.HIDE_AVATARS_OF_BIG_PROVIDERS);
    setProviders(PROVIDERS);
    setHideCreateAccount(WIDGET.HIDE_CREATE_ACCOUNT);
    setInteractionId(INTERACTION_ID);
  }, []);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const methods = useForm<TLoginFormData>();
  const { setError } = methods;

  const onSubmit = async ({ login }: TLoginFormData) => {
    const body = new URLSearchParams({
      identifier: login,
      login: login,
    });
    try {
      const response = await fetch(window.location.origin + '/api/v1/auth/check_identifier', {
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
      router.replace(EHashPages.PASSWORD);
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
          <InputField fieldName="login" placeholder={placeholder} />
          <Button variant="contained" label={translate('actionButtons.logIn')} type="submit" />
        </Form>
      )}

      {!hideCreateAccount && (
        <form action={'/api/interaction/' + interactionId + '/steps'} method="POST">
          <Button label={translate('actionButtons.createAccount')} type="submit" />
        </form>
      )}

      {bigProviders.map((provider) => (
        <Button
          data-id={provider.name}
          key={provider.id}
          variant="contained"
          label={provider.name}
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
            redirectToProvider(provider, router);
          }}
        />
      ))}
      {!!smallProvidersLine.length && (
        <>
          <Typography color="text.secondary" className={styles.additionText}>
            {translate('pages.login.otherProvider')}
          </Typography>
          <Box className={styles.actions}>
            {smallProvidersLine.map((provider) => (
              <Tooltip title={provider.name} key={provider.id}>
                <IconButton
                  data-id={provider.name}
                  key={provider.id}
                  onClick={() => {
                    redirectToProvider(provider, router);
                  }}
                >
                  {provider.avatar ? (
                    <Avatar src={getImageURL(provider.avatar)} />
                  ) : (
                    <SwapHorizontalCircleOutlinedIcon />
                  )}
                </IconButton>
              </Tooltip>
            ))}
            {smallProviders.length > 5 && (
              <IconButton onClick={handleClick}>
                <MoreHorizIcon />
              </IconButton>
            )}
          </Box>
        </>
      )}
      <Popover anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
        <ul className={styles.listProviders}>
          {smallProvidersList.map((provider) => (
            <li
              className={styles.itemProvider}
              key={provider.id}
              data-id={provider.name}
              onClick={() => {
                redirectToProvider(provider, router);
              }}
            >
              {(provider.avatar && <Avatar src={getImageURL(provider.avatar)} />) || (
                <SwapHorizontalCircleOutlinedIcon />
              )}
              <Typography>{provider.name}</Typography>
            </li>
          ))}
        </ul>
      </Popover>
    </>
  );
};

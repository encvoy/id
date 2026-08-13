'use client';

import BindPage from '@/app/bind/page';
import ChangePasswordPage from '@/app/changePassword/page';
import ErrorPage from '@/app/error/page';
import IdentifiersPage from '@/app/identifiers/page';
import LoginPage from '@/app/login/page';
import LoginPasswordPage from '@/app/loginPassword/page';
import NotificationsPage from '@/app/notifications/page';
import PasswordPage from '@/app/password/page';
import EmailPage from '@/app/providers/email/page';
import OAuthPage from '@/app/providers/oauth/page';
import OtpPage from '@/app/providers/otp/page';
import PhonePage from '@/app/providers/phone/page';
import WebauthnPage from '@/app/providers/webauthn/page';
import RecoverAccountPage from '@/app/recoverAccount/page';
import RecoverPasswordPage from '@/app/recoverPassword/page';
import ReplaceEmailPage from '@/app/replaceEmail/page';
import ScopesPage from '@/app/scopes/page';
import StatusFieldsPages from '@/app/statusFields/page';
import StepsPage from '@/app/steps/page';
import SuccessPage from '@/app/success/page';
import {
  INITIAL_ROUTE,
  INTERACTION_ID,
  INTERACTION_URL,
  LOGGED_USERS_PARSED,
  PROVIDERS,
} from '@/lib/constant';
import { redirectToProvider } from '@/lib/utils';
import { EProviderTypes } from '@/types/types';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const getRouteFromHash = (): string => {
  if (typeof window === 'undefined') return 'login';
  const hash = window.location.hash.slice(1);
  return hash.split('/')[0] ?? hash;
};

const getAutoRedirectProvider = (initialRoute: string) => {
  if (
    initialRoute !== 'login' ||
    PROVIDERS.length !== 1 ||
    PROVIDERS[0].type === EProviderTypes.CREDENTIALS ||
    LOGGED_USERS_PARSED.length > 0
  ) {
    return undefined;
  }

  return PROVIDERS[0];
};

const cleanupUrl = () => {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  const interactionId = INTERACTION_ID;
  const initialRoute = INITIAL_ROUTE;

  if (!interactionId) return;

  const expectedPath = new URL(INTERACTION_URL, window.location.origin).pathname;

  // If current path is longer than expected (contains /step/reg, /auth, /confirm, etc.)
  if (currentPath !== expectedPath && currentPath.startsWith(expectedPath)) {
    // Use existing hash or create a new one from initialRoute
    const hash = currentHash || (initialRoute ? `#${initialRoute}` : '');
    const cleanUrl = `${expectedPath}${hash}`;
    window.history.replaceState(null, '', cleanUrl);
  }
};

export default function HomePage() {
  const { t: translate } = useTranslation();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    // Initialize with INITIAL_ROUTE if available, otherwise from hash
    if (typeof window !== 'undefined' && INITIAL_ROUTE) {
      return INITIAL_ROUTE;
    }
    return getRouteFromHash();
  });

  useLayoutEffect(() => {
    // Clean URL before any rendering
    cleanupUrl();

    const initialRoute = INITIAL_ROUTE || getRouteFromHash();
    const autoRedirectProvider = getAutoRedirectProvider(initialRoute);

    if (autoRedirectProvider) {
      redirectToProvider(autoRedirectProvider);
      setCurrentRoute(getRouteFromHash());
      return;
    }

    // Set initial route if needed
    if (INITIAL_ROUTE && INITIAL_ROUTE !== getRouteFromHash()) {
      window.location.hash = `#${INITIAL_ROUTE}`;
      setCurrentRoute(INITIAL_ROUTE);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setCurrentRoute(getRouteFromHash());
    };

    window.addEventListener('hashchange', handler);
    handler();
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  switch (currentRoute) {
    case 'error':
      return <ErrorPage />;
    case 'success':
      return <SuccessPage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'password':
      return <PasswordPage />;
    case 'phone':
    case 'kloud':
      return <PhonePage />;
    case 'email':
    case EProviderTypes.EMAIL_CUSTOM.toLowerCase():
      return <EmailPage />;
    case EProviderTypes.GITHUB.toLowerCase():
    case EProviderTypes.GOOGLE.toLowerCase():
    case EProviderTypes.CUSTOM.toLowerCase():
      return <OAuthPage pkce={true} />;
    case EProviderTypes.WEBAUTHN.toLowerCase():
      return <WebauthnPage />;
    case 'webauthn-bind':
      return <WebauthnPage mode="bind" />;
    case EProviderTypes.TOTP.toLowerCase():
    case EProviderTypes.HOTP.toLowerCase():
      return <OtpPage />;
    case 'login':
      return <LoginPage />;
    case 'credentials':
      return <LoginPasswordPage />;
    case 'recover-account':
      return <RecoverAccountPage />;
    case 'recover-password':
      return <RecoverPasswordPage />;
    case 'change-password':
      return <ChangePasswordPage />;
    case 'bind':
      return <BindPage />;
    case 'identifiers':
      return <IdentifiersPage />;
    case 'missing-identifiers':
      return <IdentifiersPage mode="bind" />;
    case 'steps':
      return <StepsPage />;
    case 'email-step':
      return <EmailPage isStep={true} />;
    case 'phone-step':
      return <PhonePage isStep={true} />;
    case 'replace-email':
      return <ReplaceEmailPage />;
    case 'access':
      return <ScopesPage />;
    case 'publicity':
      return <StatusFieldsPages />;
    default:
      return <ErrorPage />;
  }
}

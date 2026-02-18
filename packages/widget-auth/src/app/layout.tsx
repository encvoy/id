import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  description: 'SSO authorization — protected login with providers',
  keywords: 'sso, auth, login, oauth, trusted',
};

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html>
      <head></head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

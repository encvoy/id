'use client';

import { FC } from 'react';
import EmailPage from '@/app/providers/email/page';

const Page: FC = () => {
  return <EmailPage isReplaceEmail={true} />;
};

export default Page;

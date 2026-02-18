import { Provider } from '@prisma/client';

export type TPhoneProvider = Omit<Provider, 'params'> & {
  params: {
    issuer: string;
    external_client_id: string;
    external_client_secret: string;
  };
};

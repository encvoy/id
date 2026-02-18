declare global {
  interface Window {
    ENV_CONFIG?: {
      CLIENT_ID?: string;
      DOMAIN?: string;
      CUSTOM_STYLES?: string;
      MANUAL_URL?: string;
      COPYRIGHT?: string;
      GOOGLE_METRICA_ID?: string;
    };
    ethereum?: TEthereum;
  }
}

export type TEthereum = {
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;
  send?: (arg: any) => Promise<any>;
  sendAsync: (arg: any) => Promise<any>;
  request: (request: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<any>;
};

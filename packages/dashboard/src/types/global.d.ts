declare global {
  interface Window {
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

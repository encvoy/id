interface IWidgetData {
  envVars: any;
  initialRoute: string;
  authStage?: 'second-factor-challenge' | 'second-factor-enrollment';
  interactionId: string;
  externalAccountInfo: any;
  publicProfileClaims: string;
  loggedUsers: any;
  login: string;
  details: any;
  version: string;
}

declare global {
  interface Window {
    __WIDGET_DATA__?: IWidgetData;
  }
}

export {};

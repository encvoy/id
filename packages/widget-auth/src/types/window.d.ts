interface IWidgetData {
  envVars: any;
  initialRoute: string;
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

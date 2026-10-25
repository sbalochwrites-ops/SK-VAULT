/// <reference types="vite/client" />

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
      maps?: any;
    };
    gapi?: {
      load: (apiName: string, callback: () => void) => void;
      client?: any;
    };
  }
}

export {};

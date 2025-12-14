declare global {
  interface Window {
    clarity: (
      command: string,
      key?: string,
      value?: string | number | boolean,
    ) => void;
    gtag?: (
      command: string,
      action: string,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];

    nitroAds?: {
      loaded?: boolean;
      queue?: unknown[];
      createAd?: (
        id: string,
        options: Record<string, unknown>,
      ) => Promise<NitroAdInstance>;
      addUserToken?: (...args: unknown[]) => void;
      onNavigate?: (href?: string) => void;
    };

    // Nitro Ads instance type
    NitroAdInstance: {
      onNavigate?: (href?: string) => void;
      [key: string]: unknown;
    };
  }
}

export {};

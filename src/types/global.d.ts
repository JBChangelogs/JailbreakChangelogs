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

    umami?: {
      track: {
        (): void; // Track pageview
        (payload: object): void; // Custom payload
        (event_name: string): void; // Custom event
        (event_name: string, data: object): void; // Custom event with data
      };
      identify: {
        (unique_id: string): void; // Assign ID to current session
        (unique_id: string, data: object): void; // Session data with ID
        (data: object): void; // Session data without ID
      };
    };
  }
}

export {};

declare global {
  interface Window {
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

    rybbit?: {
      pageview: () => void;
      event: (
        name: string,
        properties?: Record<string, string | number | boolean>,
      ) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      setTraits: (traits: Record<string, unknown>) => void;
      clearUserId: () => void;
      getUserId: () => string | null;
      trackOutbound: (url: string, text?: string, target?: string) => void;
    };
  }
}

export {};

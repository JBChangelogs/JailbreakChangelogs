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
  }
}

export {};

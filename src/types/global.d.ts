declare global {
  interface Window {
    clarity: (
      command: string,
      key?: string,
      value?: string | number | boolean,
    ) => void;
  }
}

export {};

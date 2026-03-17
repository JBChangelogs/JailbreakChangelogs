declare module "he" {
  export interface DecodeOptions {
    isAttributeValue?: boolean;
    strict?: boolean;
  }

  export function decode(text: string, options?: DecodeOptions): string;
}

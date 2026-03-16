export const sanitizeText = (input: string): string => {
  return input.replace(/\p{M}+/gu, "");
};

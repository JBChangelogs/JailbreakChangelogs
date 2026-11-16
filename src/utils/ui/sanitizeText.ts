export const sanitizeText = (input: string): string => {
  return input.replace(/(?![\uFE0E\uFE0F\u20E3])\p{M}/gu, "");
};

import { jaroWinklerDistance } from "@/utils/helpers/fuzzySearch";

export const FUZZY_MATCH_THRESHOLD = 0.85;
export const FUZZY_MIN_TOKEN_LENGTH = 3;

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
const tokenize = (str: string) => str.toLowerCase().match(/[a-z0-9]+/g) || [];
const splitAlphaNum = (str: string) =>
  (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());

function isTokenSubsequence(searchTokens: string[], fieldTokens: string[]) {
  let i = 0,
    j = 0;
  while (i < searchTokens.length && j < fieldTokens.length) {
    if (fieldTokens[j].includes(searchTokens[i])) i++;
    j++;
  }
  return i === searchTokens.length;
}

function hasFuzzyTokenMatch(
  searchTokens: string[],
  fieldTokens: string[],
  threshold = FUZZY_MATCH_THRESHOLD,
) {
  return searchTokens.every((searchToken) =>
    fieldTokens.some((fieldToken) => {
      if (fieldToken.includes(searchToken)) return true;
      if (searchToken.length < FUZZY_MIN_TOKEN_LENGTH) return false;
      return jaroWinklerDistance(searchToken, fieldToken) >= threshold;
    }),
  );
}

function matchesField(
  fieldValue: string,
  searchNormalized: string,
  searchTokens: string[],
  searchAlphaNum: string[],
) {
  const fieldTokens = tokenize(fieldValue);
  return (
    normalize(fieldValue).includes(searchNormalized) ||
    isTokenSubsequence(searchTokens, fieldTokens) ||
    isTokenSubsequence(searchAlphaNum, splitAlphaNum(fieldValue)) ||
    hasFuzzyTokenMatch(searchTokens, fieldTokens)
  );
}

export function matchesTextSearch(
  fields: Array<string | null | undefined>,
  searchTerm: string,
): boolean {
  if (!searchTerm.trim()) return true;

  const searchNormalized = normalize(searchTerm);
  const searchTokens = tokenize(searchTerm);
  const searchAlphaNum = splitAlphaNum(searchTerm);

  return fields.some((field) =>
    matchesField(field ?? "", searchNormalized, searchTokens, searchAlphaNum),
  );
}

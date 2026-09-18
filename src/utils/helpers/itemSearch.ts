import { jaroWinklerDistance } from "@/utils/helpers/fuzzySearch";

export const FUZZY_MATCH_THRESHOLD = 0.85;
export const FUZZY_MIN_TOKEN_LENGTH = 3;

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
const tokenize = (str: string) => str.toLowerCase().match(/[a-z0-9]+/g) || [];
const splitAlphaNum = (str: string) =>
  (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());

function getDamerauLevenshteinDistance(left: string, right: string) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  let previousPrevious = previous;

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );

      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        current[rightIndex] = Math.min(
          current[rightIndex],
          previousPrevious[rightIndex - 2] + 1,
        );
      }
    }

    previousPrevious = previous;
    previous = current;
  }

  return previous[right.length];
}

export function isFuzzyTokenMatch(
  searchToken: string,
  fieldToken: string,
  threshold: number = FUZZY_MATCH_THRESHOLD,
) {
  if (fieldToken.includes(searchToken)) return true;
  if (searchToken.length < FUZZY_MIN_TOKEN_LENGTH) return false;

  // Cap edit distance to prevent shared prefixes from producing false matches.
  const maxEdits = searchToken.length >= 8 ? 2 : 1;
  return (
    getDamerauLevenshteinDistance(searchToken, fieldToken) <= maxEdits &&
    jaroWinklerDistance(searchToken, fieldToken) >= threshold
  );
}

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
    fieldTokens.some((fieldToken) =>
      isFuzzyTokenMatch(searchToken, fieldToken, threshold),
    ),
  );
}

// Lower is more relevant. null means no match at all.
function getFieldMatchRank(
  fieldValue: string,
  searchNormalized: string,
  searchTokens: string[],
  searchAlphaNum: string[],
): number | null {
  const fieldNormalized = normalize(fieldValue);
  if (fieldNormalized === searchNormalized) return 0;
  if (fieldNormalized.startsWith(searchNormalized)) return 1;
  if (fieldNormalized.includes(searchNormalized)) return 2;

  const fieldTokens = tokenize(fieldValue);
  if (isTokenSubsequence(searchTokens, fieldTokens)) return 3;
  if (isTokenSubsequence(searchAlphaNum, splitAlphaNum(fieldValue))) return 4;
  if (hasFuzzyTokenMatch(searchTokens, fieldTokens)) return 5;

  return null;
}

// Lower is more relevant. Infinity means no match across any field.
export function getTextSearchRank(
  fields: Array<string | null | undefined>,
  searchTerm: string,
): number {
  if (!searchTerm.trim()) return 0;

  const searchNormalized = normalize(searchTerm);
  const searchTokens = tokenize(searchTerm);
  const searchAlphaNum = splitAlphaNum(searchTerm);

  let best = Infinity;
  for (const field of fields) {
    const rank = getFieldMatchRank(
      field ?? "",
      searchNormalized,
      searchTokens,
      searchAlphaNum,
    );
    if (rank !== null && rank < best) best = rank;
  }
  return best;
}

export function matchesTextSearch(
  fields: Array<string | null | undefined>,
  searchTerm: string,
): boolean {
  return getTextSearchRank(fields, searchTerm) !== Infinity;
}

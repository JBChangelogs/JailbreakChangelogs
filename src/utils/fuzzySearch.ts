// Jaro-Winkler distance function for better username matching
export const jaroWinklerDistance = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // If strings are identical, return 1.0
  if (s1 === s2) return 1.0;
  
  // If either string is empty, return 0.0
  if (!s1.length || !s2.length) return 0.0;
  
  // Calculate Jaro distance
  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(s2.length, i + matchDistance + 1);
    
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  
  // Calculate Jaro distance
  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
  
  // Calculate common prefix length (up to 4 characters)
  let prefixLength = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefixLength++;
    else break;
  }
  
  // Calculate Jaro-Winkler distance
  const winkler = jaro + (prefixLength * 0.1 * (1 - jaro));
  
  return winkler;
};

// Function to find similar strings using Jaro-Winkler distance
export const findSimilarStrings = <T extends string | { [key: string]: string | number }>(
  input: string,
  items: T[],
  options: {
    key?: string;
    minSimilarity?: number;
    maxResults?: number;
  } = {}
): T[] => {
  const {
    key,
    minSimilarity = 0.7,
    maxResults = 5
  } = options;

  return items
    .map(item => {
      const compareString = typeof item === 'string' ? item : item[key as keyof typeof item] as string;
      return {
        item,
        similarity: jaroWinklerDistance(input, compareString)
      };
    })
    .filter(({ similarity }) => similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
    .map(({ item }) => item);
};

// Function to calculate similarity percentage
export const calculateSimilarity = (str1: string, str2: string): number => {
  return jaroWinklerDistance(str1, str2) * 100;
}; 
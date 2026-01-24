/**
 * Total number of available background images
 */
export const TOTAL_BACKGROUND_IMAGES = 42;

/**
 * Base URL for background images
 */
export const BACKGROUNDS_BASE_URL = "/backgrounds/v2";

/**
 * Get a specific background image URL by index (1-based or 0-based mapped to 1-based)
 * @param index - The index of the background image
 * @param baseUrl - Base URL for the background images
 * @returns The background image URL
 */
export function getBackgroundImageByIndex(
  index: number,
  baseUrl: string = BACKGROUNDS_BASE_URL,
): string {
  // Ensure index is within 1-count range (using modulo if zero-based or large number passed)
  // If we just want simple access mapped to file names:
  const normalizedIndex = (index % TOTAL_BACKGROUND_IMAGES) + 1;
  return `${baseUrl}/background${normalizedIndex}.webp`;
}

/**
 * Fisher-Yates shuffle algorithm implementation
 * This algorithm provides an unbiased way to shuffle an array
 * @param array - The array to shuffle
 * @returns A new shuffled array (doesn't mutate the original)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  // Create a copy of the array to avoid mutating the original
  const shuffled = [...array];

  // Start from the last element and work backwards
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i (inclusive)
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Swap elements at positions i and randomIndex
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

/**
 * Generate a shuffled array of background image URLs
 * @param count - Number of background images available (default: TOTAL_BACKGROUND_IMAGES)
 * @param baseUrl - Base URL for the background images
 * @returns Array of shuffled background image URLs
 */
export function generateShuffledBackgroundImages(
  count: number = TOTAL_BACKGROUND_IMAGES,
  baseUrl: string = BACKGROUNDS_BASE_URL,
): string[] {
  // Generate array of image URLs
  const imageUrls = Array.from(
    { length: count },
    (_, i) => `${baseUrl}/background${i + 1}.webp`,
  );

  // Shuffle the array using Fisher-Yates algorithm
  return fisherYatesShuffle(imageUrls);
}

/**
 * Get a single random background image URL
 * @param count - Number of background images available (default: TOTAL_BACKGROUND_IMAGES)
 * @param baseUrl - Base URL for the background images
 * @returns A single random background image URL
 */
export function getRandomBackgroundImage(
  count: number = TOTAL_BACKGROUND_IMAGES,
  baseUrl: string = BACKGROUNDS_BASE_URL,
): string {
  const randomIndex = Math.floor(Math.random() * count) + 1;
  return `${baseUrl}/background${randomIndex}.webp`;
}

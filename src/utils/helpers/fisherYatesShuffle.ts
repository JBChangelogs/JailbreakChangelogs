/**
 * Total number of available background images
 */
export const TOTAL_BACKGROUND_IMAGES = 36;

/**
 * Base URL for background images
 */
export const BACKGROUNDS_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/backgrounds/v2";

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

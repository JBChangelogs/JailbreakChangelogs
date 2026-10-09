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
 * @returns The background image URL
 */
export function getBackgroundImageByIndex(index: number): string {
  // Ensure index is within 1-count range (using modulo if zero-based or large number passed)
  // If we just want simple access mapped to file names:
  const normalizedIndex = (index % TOTAL_BACKGROUND_IMAGES) + 1;
  return `${BACKGROUNDS_BASE_URL}/background${normalizedIndex}.webp`;
}

/**
 * Get a single random background image URL
 * @returns A single random background image URL
 */
export function getRandomBackgroundImage(): string {
  const randomIndex = Math.floor(Math.random() * TOTAL_BACKGROUND_IMAGES) + 1;
  return `${BACKGROUNDS_BASE_URL}/background${randomIndex}.webp`;
}

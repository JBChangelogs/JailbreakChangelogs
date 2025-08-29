// Image path constants
export const IMAGE_PATHS = {
  BASE: "https://assets.jailbreakchangelogs.xyz/assets/images/items",
  VALUES: "https://assets.jailbreakchangelogs.xyz/assets/images/items/480p",
  PLACEHOLDER: "/assets/images/Placeholder.webp",
} as const;

// Type mappings for image paths
export const TYPE_MAPPINGS: Record<string, string> = {
  "body color": "body colors",
  drift: "drifts",
  furniture: "furnitures",
  hyperchrome: "hyperchromes",
  rim: "rims",
  spoiler: "spoilers",
  texture: "textures",
  "tire sticker": "tire stickers",
  "tire style": "tire styles",
  vehicle: "vehicles",
  "weapon skin": "weapon skins",
} as const;

/**
 * Check if an item should use a video instead of an image
 * @param name - The item name
 * @returns boolean indicating if the item should use a video
 */
export const isVideoItem = (name: string): boolean => {
  return name === "HyperShift" || name === "Gamer TV Set" || name === "Arcade Racer";
};

/**
 * Check if an item is a horn
 * @param type - The item type
 * @returns boolean indicating if the item is a horn
 */
export const isHornItem = (type: string): boolean => {
  return type.toLowerCase() === "horn";
};

/**
 * Check if an item is a drift
 * @param type - The item type
 * @returns boolean indicating if the item is a drift
 */
export const isDriftItem = (type: string): boolean => {
  return type.toLowerCase() === "drift";
};

/**
 * Get the audio path for a horn
 * @param name - The horn name
 * @returns The full path to the horn's audio file
 */
export const getHornAudioPath = (name: string): string => {
  return `https://assets.jailbreakchangelogs.xyz/assets/audios/horns/${name}.mp3`;
};

/**
 * Get the drift video path
 * @param name - The drift name
 * @returns The full path to the drift's video file
 */
export const getDriftVideoPath = (name: string): string => {
  return `https://assets.jailbreakchangelogs.xyz/assets/images/items/drifts/${name}.webm`;
};

/**
 * Get the drift thumbnail path
 * @param name - The drift name
 * @returns The full path to the drift's thumbnail image
 */
export const getDriftThumbnailPath = (name: string): string => {
  return `https://assets.jailbreakchangelogs.xyz/assets/images/items/drifts/thumbnails/${name}.webp`;
};

/**
 * Get the thumbnail path for a video item
 * @param type - The item type
 * @param name - The item name
 * @returns The full path to the video's thumbnail image
 */
export const getVideoThumbnailPath = (type: string, name: string): string => {
  const normalizedType = type.toLowerCase();
  const mappedType = TYPE_MAPPINGS[normalizedType] || normalizedType;
  return `${IMAGE_PATHS.VALUES}/${mappedType}/${name}.webp`;
};

/**
 * Get the video path for a video item
 * @param type - The item type
 * @param name - The item name
 * @returns The full path to the video file
 */
export const getVideoPath = (type: string, name: string): string => {
  if (name === "HyperShift") {
    return "https://assets.jailbreakchangelogs.xyz/assets/images/items/hyperchromes/HyperShift_optimized.mp4";
  }
  if (name === "Gamer TV Set") {
    return "https://assets.jailbreakchangelogs.xyz/assets/images/items/videos/furnitures/Gamer TV Set.webm";
  }
  if (name === "Arcade Racer") {
    return "https://assets.jailbreakchangelogs.xyz/assets/images/items/videos/spoilers/Arcade Racer.webm";
  }
  throw new Error(`No video path found for ${name}`);
};

/**
 * Get the media path for an item (image or video)
 * @param type - The item type (e.g., "Rim", "Weapon")
 * @param name - The item name
 * @param isValuesPage - Whether this is for the values page (default: false)
 * @param isSocialEmbed - Whether this is for a social media embed (default: false)
 * @param hornBackground - Background variant for horn thumbnails ("dark" | "light", default: "dark")
 * @returns The full path to the item's media
 */
export const getItemImagePath = (type: string, name: string, isValuesPage: boolean = false, isSocialEmbed: boolean = false, hornBackground: "dark" | "light" = "dark"): string => {
  if (isVideoItem(name)) {
    if (isSocialEmbed) {
      // Return different paths for social media embeds
      if (name === "HyperShift") {
        return "https://assets.jailbreakchangelogs.xyz/assets/images/items/hyperchromes/HyperShift_optimized.mp4";
      }
      if (name === "Gamer TV Set") {
        return "https://assets.jailbreakchangelogs.xyz/assets/images/items/furnitures/Gamer TV Set_optimized.gif";
      }
      if (name === "Arcade Racer") {
        return "https://assets.jailbreakchangelogs.xyz/assets/images/items/spoilers/Arcade Racer_optimized.gif";
      }
    }
    // For non-video elements (like thumbnails), return the thumbnail path
    return getVideoThumbnailPath(type, name);
  }

  if (isHornItem(type)) {
    const backgroundVariant = hornBackground === "light" ? "light_bg" : "dark_bg";
    return `https://assets.jailbreakchangelogs.xyz/assets/audios/horn_thumbnail_${backgroundVariant}.webp`;
  }

  if (isDriftItem(type)) {
    return getDriftThumbnailPath(name);
  }

  const normalizedType = type.toLowerCase();
  const mappedType = TYPE_MAPPINGS[normalizedType] || normalizedType;
  const basePath = isValuesPage ? IMAGE_PATHS.VALUES : IMAGE_PATHS.BASE;
  return `${basePath}/${mappedType}/${name}.webp`;
};

/**
 * Handle image loading errors by replacing with placeholder
 * @param e - The image error event
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  // Only set placeholder if it's not already the placeholder
  if (img.src !== IMAGE_PATHS.PLACEHOLDER) {
    img.src = IMAGE_PATHS.PLACEHOLDER;
    // Remove the error handler to prevent infinite loops
    img.onerror = null;
  }
};

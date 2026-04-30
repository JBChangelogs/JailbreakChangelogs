export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB in bytes
  MAX_FILE_SIZE_MB: 20, // 20MB for display purposes
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
} as const;

export const getAllowedFileExtensions = (): string => {
  const extensions = UPLOAD_CONFIG.ALLOWED_FILE_TYPES.map((type) => {
    switch (type) {
      case "image/jpeg":
      case "image/jpg":
        return "JPG";
      case "image/png":
        return "PNG";
      case "image/gif":
        return "GIF";
      default:
        return (type as string).split("/")[1]?.toUpperCase() || type;
    }
  });

  return [...new Set(extensions)].join(", ");
};

export const formatSettingName = (name: string): string =>
  name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

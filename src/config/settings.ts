const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB in bytes
  MAX_FILE_SIZE_MB: 20, // 20MB for display purposes
  ALLOWED_FILE_TYPES: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ],
} as const;

export const getAllowedFileExtensions = (): string => {
  const extensions = UPLOAD_CONFIG.ALLOWED_FILE_TYPES.map((type) => {
    switch (type) {
      case "image/jpeg":
      case "image/jpg":
        return "JPG";
      case "image/png":
        return "PNG";
      case "image/webp":
        return "WebP";
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

export const APP_ONLY_SETTINGS = new Set(["hide_roblox_activity"]);

interface FrontendSetting {
  title: string;
  description?: string;
  target?: string;
  requiresAccount?: boolean;
}

export const FRONTEND_SETTINGS: Record<string, FrontendSetting> = {
  themes: { title: "Themes" },
  display: { title: "Display" },
  "custom-themes": {
    title: "Custom themes",
    description: "Make your own, or import one someone shared.",
  },
  "theme-cursor": {
    title: "Use theme cursor",
    description:
      "Match your cursor to your selected theme. Saved on this browser.",
    target: "themes",
  },
  "theme-shortcut": {
    title: "Theme button in header",
    description:
      "Show a button in the header that opens these settings. Saved on this browser.",
    target: "themes",
  },
  "navigation-layout": {
    title: "Desktop navigation",
    description: "Choose between sidebar and top bar navigation.",
  },
  "tab-style": {
    title: "Tab style",
    description: "Choose how tabs appear across the site.",
  },
  "navigation-shortcut": {
    title: "Layout button in header",
    description:
      "Show the “Change navigation layout” button next to your notifications. Saved on this browser.",
    target: "navigation-layout",
  },
  twemoji_enabled: {
    title: "Twemoji Emojis",
    description:
      "Use Twemoji for emojis instead of your browser's native emoji set",
    target: "display",
  },
  "accent-color": { title: "Accent color", requiresAccount: true },
  notifications: { title: "Notification Preferences", requiresAccount: true },
  "desktop-notifications": {
    title: "Desktop Notifications",
    description:
      "Show browser notifications when the browser tab is not in view.",
    target: "notifications",
    requiresAccount: true,
  },
  "email-notifications": {
    title: "Email Notifications",
    target: "notifications",
    requiresAccount: true,
  },
  connections: { title: "Connections", requiresAccount: true },
  export: { title: "Export Data", requiresAccount: true },
  "supporter-history": {
    title: "Supporter History",
    description: "Previous supporter tiers recorded on your account.",
    requiresAccount: true,
  },
  gifts: {
    title: "Purchased Gifts",
    description: "Supporter gifts purchased on your account.",
    requiresAccount: true,
  },
  danger: { title: "Danger Zone", requiresAccount: true },
};

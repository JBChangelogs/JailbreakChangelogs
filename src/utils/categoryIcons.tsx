import { Icon } from "../components/ui/IconWrapper";

interface CategoryIcon {
  Icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
}

// Enhanced Iconify icon mapping following best practices
// Memoize icon components to prevent stuttering during virtualization
const iconCache = new Map<
  string,
  React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>
>();

const createIconifyIcon = (iconName: string) => {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  const IconComponent = ({
    className,
    style,
  }: {
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <Icon icon={iconName} className={className} style={style} inline={true} />
  );
  IconComponent.displayName = `IconifyIcon(${iconName})`;

  iconCache.set(iconName, IconComponent);
  return IconComponent;
};

export const getCategoryIcon = (type: string): CategoryIcon | null => {
  const normalizedType = type.toLowerCase().trim();
  switch (normalizedType) {
    case "vehicles":
    case "vehicle":
      return { Icon: createIconifyIcon("mdi:car") };
    case "hyperchromes":
    case "hyperchrome":
      return { Icon: createIconifyIcon("fa6-solid:jar") };
    case "rims":
    case "rim":
      return { Icon: createIconifyIcon("solar:wheel-bold") };
    case "spoilers":
    case "spoiler":
      return { Icon: createIconifyIcon("mdi:rocket-launch") };
    case "body colors":
    case "body color":
      return { Icon: createIconifyIcon("mdi:format-paint") };
    case "textures":
    case "texture":
      return { Icon: createIconifyIcon("mdi:layers") };
    case "tire stickers":
    case "tire sticker":
      return { Icon: createIconifyIcon("mdi:sticker") };
    case "tire styles":
    case "tire style":
      return { Icon: createIconifyIcon("ph:tire-bold") };
    case "drifts":
    case "drift":
      return { Icon: createIconifyIcon("mdi:fire") };
    case "furniture":
      return { Icon: createIconifyIcon("mdi:home") };
    case "horns":
    case "horn":
      return { Icon: createIconifyIcon("mdi:bullhorn") };
    case "weapon skins":
    case "weapon skin":
      return { Icon: createIconifyIcon("fa7-solid:gun") };
    default:
      return null;
  }
};

export const getCategoryColor = (type: string): string => {
  const normalizedType = type.toLowerCase().trim();
  switch (normalizedType) {
    case "vehicles":
    case "vehicle":
      return "#c82c2c";
    case "hyperchromes":
    case "hyperchrome":
      return "#e91e63";
    case "rims":
    case "rim":
      return "#6335b1";
    case "spoilers":
    case "spoiler":
      return "#c18800";
    case "body colors":
    case "body color":
      return "#8a2be2";
    case "textures":
    case "texture":
      return "#708090";
    case "tire stickers":
    case "tire sticker":
      return "#1ca1bd";
    case "tire styles":
    case "tire style":
      return "#4caf50";
    case "drifts":
    case "drift":
      return "#ff4500";
    case "furniture":
      return "#9c6644";
    case "horns":
    case "horn":
      return "#4a90e2";
    case "weapon skins":
    case "weapon skin":
      return "#4a6741";
    default:
      return "#708090"; // Default gray
  }
};

export const CategoryIconBadge = ({
  type,
  isLimited,
  isSeasonal,
  hasChildren,
  showCategoryForVariants = false,
  preferItemType = false,
  className = "h-5 w-5",
}: {
  type: string;
  isLimited: boolean;
  isSeasonal: boolean;
  hasChildren: boolean;
  showCategoryForVariants?: boolean;
  preferItemType?: boolean;
  className?: string;
}) => {
  // If preferItemType is true, show item type icon first
  if (preferItemType) {
    if (!hasChildren || showCategoryForVariants) {
      const categoryIcon = getCategoryIcon(type);
      if (categoryIcon) {
        return (
          <div className="bg-primary-bg/50 rounded-full p-1.5">
            <categoryIcon.Icon
              className={`${className}`}
              style={{ color: getCategoryColor(type) }}
            />
          </div>
        );
      }
    }

    // Fall back to limited/seasonal if no item type icon
    if (isSeasonal) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <Icon
            icon="noto-v1:snowflake"
            className={`${className}`}
            style={{ color: "#40c0e7" }}
          />
        </div>
      );
    }

    if (isLimited) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <Icon
            className={`${className}`}
            style={{ color: "#ffd700" }}
            icon="mdi:clock"
          />
        </div>
      );
    }
  } else {
    // Default behavior: prioritize limited/seasonal badges
    if (isSeasonal) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <Icon
            icon="noto-v1:snowflake"
            className={`${className}`}
            style={{ color: "#40c0e7" }}
          />
        </div>
      );
    }

    if (isLimited) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <Icon
            className={`${className}`}
            style={{ color: "#ffd700" }}
            icon="mdi:clock"
          />
        </div>
      );
    }

    // Show category icon based on showCategoryForVariants prop
    if (!hasChildren || showCategoryForVariants) {
      const categoryIcon = getCategoryIcon(type);
      if (categoryIcon) {
        return (
          <div className="bg-primary-bg/50 rounded-full p-1.5">
            <categoryIcon.Icon
              className={`${className}`}
              style={{ color: getCategoryColor(type) }}
            />
          </div>
        );
      }
    }
  }

  return null;
};

import {
  FaClock,
  FaRegSnowflake,
  FaCarAlt,
  FaFire,
  FaLayerGroup,
  FaHome,
  FaBullhorn,
} from "react-icons/fa";
import { FaJar, FaGun } from "react-icons/fa6";
import { GiCarWheel } from "react-icons/gi";
import { RiPaintFill } from "react-icons/ri";
import { PiStickerFill } from "react-icons/pi";
import { CircleStackIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

interface CategoryIcon {
  Icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
}

export const getCategoryIcon = (type: string): CategoryIcon | null => {
  const normalizedType = type.toLowerCase().trim();
  switch (normalizedType) {
    case "vehicles":
    case "vehicle":
      return { Icon: FaCarAlt };
    case "hyperchromes":
    case "hyperchrome":
      return { Icon: FaJar };
    case "rims":
    case "rim":
      return { Icon: GiCarWheel };
    case "spoilers":
    case "spoiler":
      return { Icon: RocketLaunchIcon };
    case "body colors":
    case "body color":
      return { Icon: RiPaintFill };
    case "textures":
    case "texture":
      return { Icon: FaLayerGroup };
    case "tire stickers":
    case "tire sticker":
      return { Icon: PiStickerFill };
    case "tire styles":
    case "tire style":
      return { Icon: CircleStackIcon };
    case "drifts":
    case "drift":
      return { Icon: FaFire };
    case "furniture":
      return { Icon: FaHome };
    case "horns":
    case "horn":
      return { Icon: FaBullhorn };
    case "weapon skins":
    case "weapon skin":
      return { Icon: FaGun };
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
          <FaRegSnowflake
            className={`${className}`}
            style={{ color: "#40c0e7" }}
          />
        </div>
      );
    }

    if (isLimited) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <FaClock className={`${className}`} style={{ color: "#ffd700" }} />
        </div>
      );
    }
  } else {
    // Default behavior: prioritize limited/seasonal badges
    if (isSeasonal) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <FaRegSnowflake
            className={`${className}`}
            style={{ color: "#40c0e7" }}
          />
        </div>
      );
    }

    if (isLimited) {
      return (
        <div className="bg-primary-bg/50 rounded-full p-1.5">
          <FaClock className={`${className}`} style={{ color: "#ffd700" }} />
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

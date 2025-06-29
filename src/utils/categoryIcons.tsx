import { FaClock, FaRegSnowflake, FaCarAlt, FaFire, FaLayerGroup, FaHome, FaBullhorn } from "react-icons/fa";
import { FaJar, FaGun } from "react-icons/fa6";
import { GiCarWheel } from "react-icons/gi";
import { RiPaintFill } from "react-icons/ri";
import { PiStickerFill } from "react-icons/pi";
import { CircleStackIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

interface CategoryIcon {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const getCategoryIcon = (type: string): CategoryIcon | null => {
  const normalizedType = type.toLowerCase().trim();
  switch (normalizedType) {
    case 'vehicles':
    case 'vehicle':
      return { Icon: FaCarAlt, color: '#c82c2c' };
    case 'hyperchromes':
    case 'hyperchrome':
      return { Icon: FaJar, color: '#e91e63' };
    case 'rims':
    case 'rim':
      return { Icon: GiCarWheel, color: '#6335b1' };
    case 'spoilers':
    case 'spoiler':
      return { Icon: RocketLaunchIcon, color: '#c18800' };
    case 'body colors':
    case 'body color':
      return { Icon: RiPaintFill, color: '#8a2be2' };
    case 'textures':
    case 'texture':
      return { Icon: FaLayerGroup, color: '#708090' };
    case 'tire stickers':
    case 'tire sticker':
      return { Icon: PiStickerFill, color: '#1ca1bd' };
    case 'tire styles':
    case 'tire style':
      return { Icon: CircleStackIcon, color: '#4caf50' };
    case 'drifts':
    case 'drift':
      return { Icon: FaFire, color: '#ff4500' };
    case 'furniture':
      return { Icon: FaHome, color: '#9c6644' };
    case 'horns':
    case 'horn':
      return { Icon: FaBullhorn, color: '#4a90e2' };
    case 'weapon skins':
    case 'weapon skin':
      return { Icon: FaGun, color: '#4a6741' };
    default:
      return null;
  }
};

export const CategoryIconBadge = ({ 
  type, 
  isLimited, 
  isSeasonal, 
  hasChildren,
  showCategoryForVariants = false,
  className = "h-5 w-5"
}: { 
  type: string;
  isLimited: boolean;
  isSeasonal: boolean;
  hasChildren: boolean;
  showCategoryForVariants?: boolean;
  className?: string;
}) => {
  if (isSeasonal) {
    return (
      <div className="rounded-full bg-black/50 p-1.5">
        <FaRegSnowflake className={className} style={{ color: "#40c0e7" }} />
      </div>
    );
  }
  
  if (isLimited) {
    return (
      <div className="rounded-full bg-black/50 p-1.5">
        <FaClock className={className} style={{ color: "#ffd700" }} />
      </div>
    );
  }

  // Show category icon based on showCategoryForVariants prop
  if (!hasChildren || showCategoryForVariants) {
    const categoryIcon = getCategoryIcon(type);
    if (categoryIcon) {
      return (
        <div className="rounded-full bg-black/50 p-1.5">
          <categoryIcon.Icon className={className} style={{ color: categoryIcon.color }} />
        </div>
      );
    }
  }

  return null;
}; 
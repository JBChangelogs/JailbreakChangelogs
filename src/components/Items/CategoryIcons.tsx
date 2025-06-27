import { FilterSort, ValueSort } from "@/types";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  CircleStackIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { 
  FaCarAlt,
  FaFire,
  FaLayerGroup,
  FaHome,
  FaClock,
  FaRegSnowflake
 } from "react-icons/fa";
import { GiCarWheel } from "react-icons/gi";
import { RiPaintFill } from "react-icons/ri";
import { PiStickerFill } from "react-icons/pi";
import { 
  FaGun,
  FaJar,
  FaBullhorn
 } from "react-icons/fa6";
import { toast } from "react-hot-toast";

interface CategoryIconsProps {
  onSelect: (filter: FilterSort) => void;
  selectedFilter: FilterSort;
  onValueSort: (sort: ValueSort) => void;
}

export default function CategoryIcons({ onSelect, selectedFilter, onValueSort }: CategoryIconsProps) {
  const handleCategoryClick = (categoryId: string) => {
    onSelect(categoryId as FilterSort);
    onValueSort("cash-desc");
  };

  const categories = [
    {
      id: "favorites",
      name: "My Favorites",
      icon: StarIcon,
      bgColor: "rgba(255, 215, 0, 0.1)",
      iconColor: "#ffd700",
      onClick: () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          toast.error('Please log in to view your favorites');
          return;
        }
        handleCategoryClick("favorites");
      }
    },
    {
      id: "name-limited-items",
      name: "Limited",
      icon: FaClock,
      bgColor: "rgba(18, 78, 102, 0.1)",
      iconColor: "#ffd700",
    },
    {
      id: "name-seasonal-items",
      name: "Seasonal",
      icon: FaRegSnowflake,
      bgColor: "rgba(64, 192, 231, 0.1)",
      iconColor: "#40c0e7",
    },
    {
      id: "name-vehicles",
      name: "Vehicles",
      icon: FaCarAlt,
      bgColor: "rgba(200, 44, 44, 0.1)",
      iconColor: "#c82c2c",
    },
    {
      id: "name-hyperchromes",
      name: "HyperChromes",
      icon: FaJar,
      bgColor: "rgba(233, 30, 99, 0.1)",
      iconColor: "#e91e63",
    },
    {
      id: "name-rims",
      name: "Rims",
      icon: GiCarWheel,
      bgColor: "rgba(99, 53, 177, 0.1)",
      iconColor: "#6335b1",
    },
    {
      id: "name-spoilers",
      name: "Spoilers",
      icon: RocketLaunchIcon,
      bgColor: "rgba(193, 136, 0, 0.1)",
      iconColor: "#c18800",
    },
    {
      id: "name-body-colors",
      name: "Body Colors",
      icon: RiPaintFill,
      bgColor: "rgba(138, 43, 226, 0.1)",
      iconColor: "#8a2be2",
    },
    {
      id: "name-textures",
      name: "Textures",
      icon: FaLayerGroup,
      bgColor: "rgba(112, 128, 144, 0.1)",
      iconColor: "#708090",
    },
    {
      id: "name-tire-stickers",
      name: "Tire Stickers",
      icon: PiStickerFill,
      bgColor: "rgba(28, 161, 189, 0.1)",
      iconColor: "#1ca1bd",
    },
    {
      id: "name-tire-styles",
      name: "Tire Styles",
      icon: CircleStackIcon,
      bgColor: "rgba(76, 175, 80, 0.1)",
      iconColor: "#4caf50",
    },
    {
      id: "name-drifts",
      name: "Drifts",
      icon: FaFire,
      bgColor: "rgba(255, 69, 0, 0.1)",
      iconColor: "#ff4500",
    },
    {
      id: "name-furnitures",
      name: "Furniture",
      icon: FaHome,
      bgColor: "rgba(156, 102, 68, 0.1)",
      iconColor: "#9c6644",
    },
    {
      id: "name-horns",
      name: "Horns",
      icon: FaBullhorn,
      bgColor: "rgba(74, 144, 226, 0.1)",
      iconColor: "#4a90e2",
    },
    {
      id: "name-weapon-skins",
      name: "Weapon Skins",
      icon: FaGun,
      bgColor: "rgba(74, 103, 65, 0.1)",
      iconColor: "#4a6741",
    },
  ];

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xl font-semibold text-muted">Categories</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedFilter === category.id;
          return (
            <button
              key={category.id}
              onClick={category.onClick || (() => handleCategoryClick(category.id))}
              className={`flex items-center gap-2 rounded-lg p-2 sm:p-3 transition-all hover:scale-105 ${
                isSelected ? "ring-2 ring-[#5865F2]" : ""
              }`}
              style={{ backgroundColor: category.bgColor }}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: category.iconColor }} />
              <span className="text-xs sm:text-sm font-medium text-muted">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
} 
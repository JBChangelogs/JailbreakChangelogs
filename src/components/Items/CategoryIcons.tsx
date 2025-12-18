import { FilterSort, ValueSort } from "@/types";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";

import { Icon } from "../ui/IconWrapper";

interface CategoryIconsProps {
  onSelect: (filter: FilterSort) => void;
  selectedFilter: FilterSort;
  onValueSort: (sort: ValueSort) => void;
}

export default function CategoryIcons({
  onSelect,
  selectedFilter,
  onValueSort,
}: CategoryIconsProps) {
  const { isAuthenticated } = useAuthContext();
  const handleCategoryClick = (categoryId: string) => {
    onSelect(categoryId as FilterSort);
    onValueSort("cash-desc");
  };

  // Helper function to get category data using the centralized utility
  const getCategoryData = (type: string, id: string, name: string) => {
    const categoryIcon = getCategoryIcon(type);
    const iconColor = getCategoryColor(type);

    return {
      id,
      name,
      icon: categoryIcon?.Icon ? "dynamic" : "mdi:help-circle", // fallback icon
      iconComponent: categoryIcon?.Icon,
      iconColor,
      bgColor: `${iconColor}1A`, // Convert hex to rgba with 10% opacity
      onClick: undefined, // No custom onClick for these categories
    };
  };

  const categories = [
    {
      id: "favorites",
      name: "My Favorites",
      icon: "mdi:star",
      iconComponent: null,
      bgColor: "rgba(255, 215, 0, 0.1)",
      iconColor: "#ffd700",
      onClick: () => {
        if (!isAuthenticated) {
          toast.error("Please log in to view your favorites");
          return;
        }
        handleCategoryClick("favorites");
      },
    },
    {
      id: "name-limited-items",
      name: "Limited",
      icon: "mdi:clock",
      iconComponent: null,
      bgColor: "rgba(18, 78, 102, 0.1)",
      iconColor: "#ffd700",
    },
    {
      id: "name-seasonal-items",
      name: "Seasonal",
      icon: "noto-v1:snowflake",
      iconComponent: null,
      bgColor: "rgba(64, 192, 231, 0.1)",
      iconColor: "#40c0e7",
    },
    getCategoryData("vehicles", "name-vehicles", "Vehicles"),
    getCategoryData("hyperchromes", "name-hyperchromes", "HyperChromes"),
    getCategoryData("rims", "name-rims", "Rims"),
    getCategoryData("spoilers", "name-spoilers", "Spoilers"),
    getCategoryData("body colors", "name-body-colors", "Body Colors"),
    getCategoryData("textures", "name-textures", "Textures"),
    getCategoryData("tire stickers", "name-tire-stickers", "Tire Stickers"),
    getCategoryData("tire styles", "name-tire-styles", "Tire Styles"),
    getCategoryData("drifts", "name-drifts", "Drifts"),
    getCategoryData("furniture", "name-furnitures", "Furniture"),
    getCategoryData("horns", "name-horns", "Horns"),
    getCategoryData("weapon skins", "name-weapon-skins", "Weapon Skins"),
  ];

  return (
    <div className="mb-8">
      <h3 className="text-primary-text mb-6 text-2xl font-bold">Categories</h3>
      <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus grid max-h-96 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => {
          const isSelected = selectedFilter === category.id;
          return (
            <button
              key={category.id}
              onClick={
                category.onClick || (() => handleCategoryClick(category.id))
              }
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all sm:p-4 ${
                isSelected
                  ? "bg-primary-bg ring-border-focus ring-2"
                  : "bg-primary-bg"
              }`}
              style={
                {
                  borderColor: category.iconColor,
                  "--tw-ring-color": isSelected
                    ? category.iconColor
                    : undefined,
                } as React.CSSProperties
              }
            >
              {category.iconComponent ? (
                <category.iconComponent
                  className="text-tertiary-text h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: category.iconColor }}
                />
              ) : (
                <Icon
                  icon={category.icon}
                  className="text-tertiary-text h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: category.iconColor }}
                />
              )}
              <span className="text-primary-text text-sm font-semibold sm:text-base">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

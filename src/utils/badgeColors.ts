export const getItemTypeColor = (type: string): string => {
  // Normalize the type string to match the expected format
  const normalizedType = type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  switch (normalizedType) {
    case "Vehicle":
      return "hsl(0, 64%, 48%)";
    case "Spoiler":
      return "#8B5A00";
    case "Rim":
      return "#6335B1";
    case "Tire Sticker":
      return "#1CA1BD";
    case "Tire Style":
      return "#2E7D32";
    case "Drift":
      return "#CC3700";
    case "Body Color":
      return "#8A2BE2";
    case "Texture":
      return "#4A5568";
    case "Hyperchrome":
      return "#C2185B";
    case "Furniture":
      return "#8B4513";
    case "Horn":
      return "#1976D2";
    case "Weapon Skin":
      return "#2E7D32";
    default:
      return "#124e66"; // Default color
  }
};

export const getDemandColor = (demand: string): string => {
  // Normalize the demand string to handle case variations
  const normalizedDemand = demand
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  switch (normalizedDemand) {
    case "Close To None":
      return "bg-gray-600 text-white";
    case "Very Low":
      return "bg-red-600 text-white";
    case "Low":
      return "bg-orange-700 text-white";
    case "Medium":
      return "bg-yellow-700 text-white";
    case "Decent":
      return "bg-green-700 text-white";
    case "High":
      return "bg-blue-600 text-white";
    case "Very High":
      return "bg-purple-600 text-white";
    case "Extremely High":
      return "bg-pink-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
};

export const getTrendColor = (trend: string): string => {
  // Normalize the trend string to handle case variations
  const normalizedTrend =
    trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();

  switch (normalizedTrend) {
    case "Avoided":
      return "bg-red-600 text-white";
    case "Dropping":
      return "bg-rose-600 text-white";
    case "Unstable":
      return "bg-amber-600 text-white";
    case "Hoarded":
      return "bg-violet-600 text-white";
    case "Manipulated":
      return "bg-amber-300 text-white";
    case "Stable":
      return "bg-gray-500 text-white";
    case "Recovering":
      return "bg-orange-600 text-white";
    case "Rising":
      return "bg-blue-700 text-white";
    case "Hyped":
      return "bg-pink-500 text-white";
    default:
      return "bg-gray-600 text-white";
  }
};

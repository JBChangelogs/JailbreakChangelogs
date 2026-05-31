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

export const getDemandHexColor = (demand: string): string => {
  const normalizedDemand = demand
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  switch (normalizedDemand) {
    case "Close To None":
      return "#4b5563";
    case "Very Low":
      return "#dc2626";
    case "Low":
      return "#b45309";
    case "Below Average":
      return "#b45309";
    case "Average":
      return "#facc15";
    case "Decent":
      return "#16a34a";
    case "High":
      return "#2563eb";
    case "Very High":
      return "#9333ea";
    default:
      return "#4b5563";
  }
};

export const getTrendHexColor = (trend: string): string => {
  const normalizedTrend =
    trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();

  switch (normalizedTrend) {
    case "Dropping":
      return "#e11d48";
    case "Unstable":
      return "#b45309";
    case "Hoarded":
      return "#7c3aed";
    case "Manipulated":
      return "#ca8a04";
    case "Stable":
      return "#6b7280";
    case "Recovering":
      return "#ea580c";
    case "Rising":
      return "#1d4ed8";
    case "Hyped":
      return "#ec4899";
    default:
      return "#6b7280";
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
    case "Below Average":
      return "bg-orange-700 text-white";
    case "Average":
      return "bg-yellow-400 text-black";
    case "Decent":
      return "bg-green-600 text-white";
    case "High":
      return "bg-blue-600 text-white";
    case "Very High":
      return "bg-purple-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
};

export const getTrendColor = (trend: string): string => {
  // Normalize the trend string to handle case variations
  const normalizedTrend =
    trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();

  switch (normalizedTrend) {
    case "Dropping":
      return "bg-rose-600 text-white";
    case "Unstable":
      return "bg-amber-600 text-white";
    case "Hoarded":
      return "bg-violet-600 text-white";
    case "Manipulated":
      return "bg-yellow-600 text-black";
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

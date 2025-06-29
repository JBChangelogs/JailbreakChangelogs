export const getItemTypeColor = (type: string): string => {
  // Normalize the type string to match the expected format
  const normalizedType = type.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  switch (normalizedType) {
    case "Vehicle":
      return "#c82c2c";
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
export const getItemTypeColor = (type: string): string => {
  // Normalize the type string to match the expected format
  const normalizedType = type.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  switch (normalizedType) {
    case "Vehicle":
      return "#c82c2c";
    case "Spoiler":
      return "#C18800";
    case "Rim":
      return "#6335B1";
    case "Tire Sticker":
      return "#1CA1BD";
    case "Tire Style":
      return "#4CAF50";
    case "Drift":
      return "#FF4500";
    case "Body Color":
      return "#8A2BE2";
    case "Texture":
      return "#708090";
    case "Hyperchrome":
      return "#E91E63";
    case "Furniture":
      return "#9C6644";
    case "Horn":
      return "#4A90E2";
    case "Weapon Skin":
      return "#4a6741";
    default:
      return "#124e66"; // Default color
  }
}; 
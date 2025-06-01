const VALID_SORTS = [
  "vehicles",
  "spoilers",
  "rims",
  "body-colors",
  "textures",
  "tire-stickers",
  "tire-styles",
  "drifts",
  "hyperchromes",
  "furnitures",
  "limited-items",
  "horns",
  "weapon-skins",
];

function showLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();
}

function getDemandBadgeClass(demand) {
  switch(demand) {
    case 'Close to none':
      return 'bg-gray-500'; // Gray for almost no demand
    case 'Very Low':
      return 'bg-red-500'; // Red for very low demand (critical)
    case 'Low':
      return 'bg-orange-500'; // Orange for low demand (warning)
    case 'Medium':
      return 'bg-yellow-500'; // Yellow for moderate demand
    case 'Decent':
      return 'bg-green-500'; // Green for decent demand (good)
    case 'High':
      return 'bg-blue-500'; // Blue for high demand (strong)
    case 'Very High':
      return 'bg-purple-500'; // Purple for very high demand (premium)
    case 'Extremely High':
      return 'bg-pink-500'; // Pink for extremely high demand
    default:
      return 'bg-gray-500'; // Default to gray for undefined cases
  }
}


// Initialize allItems globally
window.allItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 24;
let isLoading = false;
let sort = "";

// Global variable to store sub-items
// let subItems = {};

// Function to fetch sub-items
// async function fetchSubItems() { ... }
// document.addEventListener('DOMContentLoaded', fetchSubItems);

function formatTimeAgo(timestamp) {
  if (!timestamp) return null;

  // Check and convert timestamp format
  const timestampInMs =
    timestamp.toString().length > 10
      ? timestamp // Already in milliseconds
      : timestamp * 1000; // Convert seconds to milliseconds

  const now = Date.now();
  const diff = now - timestampInMs;

  // Time intervals in milliseconds
  const intervals = {
    year: 31536000000,
    month: 2592000000,
    week: 604800000,
    day: 86400000,
    hour: 3600000,
    minute: 60000,
  };

  // Only show "just now" if less than a minute ago
  if (diff < 60000) return "just now";

  // Calculate the appropriate time interval
  for (const [unit, ms] of Object.entries(intervals)) {
    const interval = Math.floor(diff / ms);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }

  return null;
}

// Global debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showLoadingOverlay() {
  document.querySelector("#loading-overlay").classList.add("show");
}

function hideLoadingOverlay() {
  document.querySelector("#loading-overlay").classList.remove("show");
}

// Add these helper functions at the top of the file
function getBadgeHtml(item) {
  if (item.is_seasonal) {
    return `<div class="seasonal-badge">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <rect width="128" height="128" fill="none"/>
        <path fill="#40c0e7" d="M126.01 59.7h-13.46l10.57-10.57c.26-.26.41-.62.41-.98c0-.37-.15-.73-.41-.99L119 43.04a1.4 1.4 0 0 0-1.97 0L100.38 59.7H74.39l18.38-18.38h23.55c.77 0 1.39-.62 1.39-1.39V34.1c0-.36-.14-.72-.41-.98c-.26-.27-.61-.41-.98-.41h-14.95l9.52-9.51c.26-.26.41-.62.41-.98c0-.37-.15-.73-.41-.99l-4.12-4.12a1.4 1.4 0 0 0-1.97 0l-9.52 9.53V11.68c0-.36-.14-.72-.41-.98c-.26-.27-.61-.41-.98-.41h-5.82c-.77 0-1.39.62-1.39 1.39v23.55L68.3 53.61V27.62l16.66-16.65a1.4 1.4 0 0 0 0-1.97l-4.12-4.12c-.26-.26-.61-.41-.98-.41s-.73.15-.98.41L68.3 15.45V1.99c0-.77-.62-1.39-1.39-1.39h-5.82c-.77 0-1.39.62-1.39 1.39v13.46L49.13 4.88c-.52-.53-1.45-.53-1.97 0L43.04 9a1.4 1.4 0 0 0 0 1.97l16.65 16.65v25.99L41.32 35.23V11.68c0-.77-.62-1.39-1.39-1.39H34.1c-.37 0-.72.14-.98.41c-.26.26-.41.61-.41.98v14.94L23.2 17.1a1.4 1.4 0 0 0-1.97 0l-4.12 4.12a1.4 1.4 0 0 0 0 1.97l9.52 9.51H11.68c-.77 0-1.39.62-1.39 1.39v5.83c0 .37.14.72.41.98c.26.27.62.41.98.41h23.55L53.61 59.7H27.62L10.97 43.04a1.4 1.4 0 0 0-1.97 0l-4.12 4.12a1.39 1.39 0 0 0 0 1.97L15.45 59.7H1.99c-.77 0-1.39.63-1.39 1.39v5.82c0 .77.62 1.39 1.39 1.39h13.46L4.88 78.86c-.26.27-.41.61-.41.99c0 .36.14.72.41.98L9 84.95c.27.28.63.41.98.41s.71-.13.98-.41L27.62 68.3h25.99L35.23 86.68H11.68c-.77 0-1.39.62-1.39 1.39v5.82c0 .37.14.72.41.99s.61.4.98.4h14.95l-9.52 9.51a1.4 1.4 0 0 0 0 1.97l4.12 4.12a1.38 1.38 0 0 0 1.96 0l9.52-9.52v14.95c0 .37.14.72.41.98c.26.26.61.41.98.41l5.82-.01c.77 0 1.39-.62 1.39-1.39V92.77l18.37-18.38v25.99l-16.65 16.65a1.4 1.4 0 0 0 0 1.97l4.12 4.12c.26.26.61.4.98.4s.73-.14.98-.4l10.57-10.57v13.46c0 .77.62 1.39 1.39 1.39h5.82c.77 0 1.39-.63 1.39-1.39v-13.46l10.57 10.57c.26.26.61.4.98.4s.72-.14.98-.4l4.12-4.12a1.4 1.4 0 0 0 0-1.97L68.3 100.38v-26l18.38 18.38v23.55c0 .77.62 1.39 1.39 1.39h5.82c.37 0 .73-.14.98-.4c.26-.26.41-.61.41-.99v-14.94l9.52 9.52a1.38 1.38 0 0 0 1.96 0l4.11-4.12a1.385 1.385 0 0 0 0-1.97l-9.52-9.51h14.94c.77 0 1.39-.63 1.39-1.39v-5.82c0-.77-.62-1.39-1.39-1.39H92.77L74.39 68.3h25.99l16.65 16.65c.27.28.63.41.98.41s.71-.13.98-.41l4.12-4.12a1.385 1.385 0 0 0 0-1.97L112.55 68.3h13.46c.77 0 1.39-.62 1.39-1.39v-5.82c0-.77-.62-1.39-1.39-1.39"/>
      </svg>
    </div>`;
  } else if (item.is_limited) {
    return `<div class="seasonal-badge limited-badge">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <rect width="24" height="24" fill="none"/>
        <path fill="#ffbb00" fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m11-5a1 1 0 1 0-2 0v3.764a3 3 0 0 0 1.658 2.683l2.895 1.447a1 1 0 1 0 .894-1.788l-2.894-1.448a1 1 0 0 1-.553-.894z" clip-rule="evenodd"/>
      </svg>
    </div>`;
  }
  return "";
}

function getItemMediaElement(item, options = {}) {
  const {
    containerClass = "",
    imageClass = "",
    showFavoriteIcon = true,
    size = "original",
    aspectRatio = "16/9",
  } = options;

  
  const mediaBadge = getBadgeHtml(item);

  // Special case for Gamer TV Set
  if (item.name === "Gamer TV Set" && item.type === "Furniture") {
    return `
      <div class="media-container position-relative ${containerClass}">
        ${showFavoriteIcon ? getFavoriteIconHtml(item) : ""}
        <video class="${imageClass || "card-img-top"}"
               style="width: 100%; height: 100%; object-fit: contain;"
               autoplay loop muted playsinline>
          <source src="/assets/images/items/furnitures/Gamer TV Set.webm" type="video/webm">
          <source src="/assets/images/items/furnitures/Gamer TV Set.mp4" type="video/mp4">
        </video>
        ${mediaBadge}
      </div>`;
  }

  // Special case for HyperShift - moved up before default case
  if (item.name === "HyperShift" && item.type === "HyperChrome") {
    return `
      <div class="media-container position-relative ${containerClass}">
        ${showFavoriteIcon ? getFavoriteIconHtml(item) : ""}
        <video class="${imageClass || "card-img-top"}"
               style="width: 100%; height: 100%; object-fit: contain;"
               autoplay loop muted playsinline>
          <source src="/assets/images/items/hyperchromes/HyperShift.webm" type="video/webm">
          <source src="/assets/images/items/hyperchromes/HyperShift.mp4" type="video/mp4">
        </video>
      </div>`;
  }

  // Special case for Arcade Racer spoiler
  if (item.name === "Arcade Racer" && item.type === "Spoiler") {
    return `
      <div class="media-container position-relative ${containerClass}">
        ${showFavoriteIcon ? getFavoriteIconHtml(item) : ""}
        <video class="${imageClass || "card-img-top"}"
               style="width: 100%; height: 100%; object-fit: contain;"
               autoplay loop muted playsinline>
          <source src="/assets/images/items/spoilers/Arcade Racer.webm" type="video/webm">
          <source src="/assets/images/items/spoilers/Arcade Racer.mp4" type="video/mp4">
        </video>
        ${mediaBadge}
      </div>`;
  }

  // Special case for horns
  if (item.type.toLowerCase() === "horn") {
    return `
      <div class="media-container position-relative" onclick="handleHornClick('${
        item.name
      }', event)">
        ${showFavoriteIcon ? getFavoriteIconHtml(item) : ""}
        <div class="horn-player-wrapper" data-horn="${item.name}">
          <img src="/assets/audios/horn_thumbnail.webp" 
               class="${imageClass || "card-img-top"}" 
               alt="Horn Thumbnail" 
               style="opacity: 0.8;">
          <audio class="horn-audio" preload="none">
            <source src="/assets/audios/horns/${
              item.name
            }.mp3" type="audio/mp3">
          </audio>
        </div>
        ${mediaBadge}
      </div>`;
  }

  // Special case for drifts
  if (item.type === "Drift") {
    return `
      <div class="media-container position-relative ${containerClass}">
        ${showFavoriteIcon ? getFavoriteIconHtml(item) : ""}
        <img src="/assets/images/items/480p/drifts/${item.name}.webp"
             width="854" 
             height="480"
             class="drift-thumbnail ${imageClass || "card-img-top"}" 
             alt="${item.name}" 
             onerror="handleimage(this)">
        <video class="${imageClass || "card-img-top video-player"}" 
               style="opacity: 0;" 
               playsinline 
               muted 
               loop>
          <source src="/assets/images/items/drifts/${
            item.name
          }.webm" type="video/webm">
          <source src="/assets/images/items/drifts/${
            item.name
          }.mp4" type="video/mp4">
        </video>
        ${mediaBadge}
      </div>`;
  }

  // Default case for all other items
  const itemType = item.type.toLowerCase();
  const imagePath = `/assets/images/items/480p/${itemType}s/${item.name}.webp`;

  return `
    <div class="media-container position-relative ${containerClass}">
      ${showFavoriteIcon ? getFavoriteIconHtml(item) : ""}
      <img src="${imagePath}"
           id="${item.name}" 
           width="854"
           height="480" 
           class="${imageClass || "card-img-top"}"
           alt="${item.name}"
           onerror="handleimage(this)">
      ${mediaBadge}
    </div>`;
}

// Make sure escapeHtml function exists at the top of the file
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFavoriteIconHtml(item) {
  // Get the current year for comparison
  const currentYear = new Date().getFullYear().toString();
  
  // Check if this is a variant item
  const hasVariants = item.children && item.children.length > 0;
  
  // If item has variants, check if current variant is favorited
  let isFavorited = item.is_favorite;
  if (hasVariants) {
    // Default to current year variant
    const selectedVariant = currentYear;
    // Check if the current variant is favorited
    isFavorited = item.children.some(child => 
      child.sub_name === selectedVariant && 
      child.is_favorite
    );
  }

  return `
    <div class="favorite-icon position-absolute top-0 start-0 p-2" 
         style="z-index: 1000;"
         onclick="handleFavorite(event, ${item.id})">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
           style="filter: drop-shadow(0 0 2px rgba(0,0,0,0.7));">
        <rect width="24" height="24" fill="none" />
        <path fill="${isFavorited ? "#f8ff00" : "none"}" 
              stroke="${isFavorited ? "none" : "#f8ff00"}"
              stroke-width="1.5"
              d="M12.954 1.7a1 1 0 0 0-1.908-.001l-2.184 6.92l-6.861-.005a1 1 0 0 0-.566 1.826l5.498 3.762l-2.067 6.545A1 1 0 0 0 6.4 21.86l5.6-4.006l5.594 4.007a1 1 0 0 0 1.536-1.114l-2.067-6.545l5.502-3.762a1 1 0 0 0-.566-1.826l-6.866.005z" />
      </svg>
    </div>`;
}

// Add handleFavorite function near the top with other helper functions
window.handleFavorite = async function (event, itemId) {
  event.preventDefault();
  event.stopPropagation();

  const token = getCookie("token");
  if (!token) {
    notyf.error("Please login to favorite items", {
      position: "bottom-right",
      duration: 2000,
    });
    return;
  }

  const svgPath = event.currentTarget.querySelector("path");
  const isFavorited = svgPath.getAttribute("fill") === "#f8ff00";

  // Get the card element and check for selected variant
  const card = event.currentTarget.closest('.card');
  const dropdown = card?.querySelector('.dropdown');
  const selectedVariant = dropdown?.querySelector('.dropdown-item.active')?.dataset.variant;
  const currentYear = new Date().getFullYear().toString();

  // Get the item from allItems
  const item = allItems.find(item => item.id === itemId);
  if (!item) return;

  // If we have a selected variant that's not the current year, use the variant's ID
  let favoriteItemId = itemId.toString(); // Convert to string
  if (selectedVariant && selectedVariant !== currentYear && item.children) {
    const variant = item.children.find(child => child.sub_name === selectedVariant);
    if (variant) {
      favoriteItemId = `${itemId}-${variant.id}`;
      // Update the variant's favorite status
      variant.is_favorite = !isFavorited;
      // Update parent item's favorite status based on any variant being favorited
      item.is_favorite = item.children.some(child => child.is_favorite);
    }
  } else {
    // For non-variant items or current year variant
    item.is_favorite = !isFavorited;
    // If this is a parent item with variants, also update current year variant
    if (item.children && item.children.length > 0) {
      const currentYearVariant = item.children.find(child => child.sub_name === currentYear);
      if (currentYearVariant) {
        currentYearVariant.is_favorite = !isFavorited;
      }
    }
  }

  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/favorites/${
        isFavorited ? "remove" : "add"
      }`,
      {
        method: isFavorited ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
        body: JSON.stringify({
          item_id: favoriteItemId,
          owner: token,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Update SVG appearance
    svgPath.setAttribute("fill", isFavorited ? "none" : "#f8ff00");
    svgPath.setAttribute("stroke", isFavorited ? "#f8ff00" : "none");

    notyf.success(
      isFavorited ? "Item removed from favorites" : "Item added to favorites",
      {
        position: "bottom-right",
        duration: 2000,
      }
    );
  } catch (error) {
    console.error("Error updating favorite:", error);
    notyf.error("Failed to update favorite status", {
      position: "bottom-right",
      duration: 2000,
    });
  }
};

// Global shareCurrentView function
window.shareCurrentView = debounce(function () {
  const sortDropdown = document.getElementById("sort-dropdown");
  const valueSortDropdown = document.getElementById("value-sort-dropdown");
  const searchBar = document.getElementById("search-bar");

  // Build URL parameters - This was missing
  const params = new URLSearchParams();
  if (sortDropdown.value !== "name-all-items") {
    params.append("sort", sortDropdown.value.split("-").slice(1).join("-"));
  }
  if (valueSortDropdown.value !== "random") {
    params.append("valueSort", valueSortDropdown.value);
  }
  if (searchBar.value.trim()) {
    params.append("search", searchBar.value.trim());
  }

  // Construct full URL
  const baseUrl = `${window.location.origin}/values`;
  const shareUrl = params.toString()
    ? `${baseUrl}?${params.toString()}`
    : baseUrl;

  // Copy to clipboard
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      notyf.success("Link copied to clipboard!", "Share", {
        timeOut: 2000,
        closeButton: true,
        positionClass: "toast-bottom-right",
      });
    })
    .catch(() => {
      notyf.error("Failed to copy link", "Share Error", {
        timeOut: 2000,
        closeButton: true,
        positionClass: "toast-bottom-right",
      });
    });
}, 1000);

const searchBar = document.getElementById("search-bar");
const clearButton = document.getElementById("clear-search");

document.addEventListener("DOMContentLoaded", async () => {
  // Add CSS for favorite icon hover behavior
  const style = document.createElement("style");
  style.textContent = `
    .media-container {
      position: relative;
    }
    .favorite-icon {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    .media-container:hover .favorite-icon {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // Fetch sub-items when the page loads
  // async function fetchSubItems() { ... }
  // document.addEventListener('DOMContentLoaded', fetchSubItems);

  const categoryItems = document.querySelectorAll(".category-item");

  categoryItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Map directly to sort dropdown values
      const categoryClasses = {
        "category-limited-items": "name-limited-items",
        "category-seasonal-items": "name-seasonal-items",
        "category-vehicles": "name-vehicles",
        "category-rims": "name-rims",
        "category-spoilers": "name-spoilers",
        "category-body-colors": "name-body-colors",
        "category-textures": "name-textures",
        "category-hyperchromes": "name-hyperchromes",
        "category-tire-stickers": "name-tire-stickers",
        "category-tire-styles": "name-tire-styles",
        "category-drifts": "name-drifts",
        "category-furnitures": "name-furnitures",
        "category-favorites": "name-all-items",
        "category-horns": "name-horns",
        "category-weapon-skins": "name-weapon-skins",
      };

      // Find the matching category class
      const categoryClass = Array.from(this.classList).find((cls) =>
        Object.keys(categoryClasses).includes(cls)
      );

      if (!categoryClass) {
        console.error("No specific category class found");
        return;
      }

      // Get the corresponding sort value
      const sortValue = categoryClasses[categoryClass];

      // Update sort dropdown and value sort dropdown
      const sortDropdown = document.getElementById("sort-dropdown");
      const valueSortDropdown = document.getElementById("value-sort-dropdown");

      if (sortDropdown && valueSortDropdown) {
        sortDropdown.value = sortValue;

        // Set value sort dropdown based on category
        if (categoryClass === "category-favorites") {
          valueSortDropdown.value = "favorites";
        } else {
          // Reset to default cash-desc for all other categories
          valueSortDropdown.value = "cash-desc";
        }

        window.sortItems();

        // Updated selector to use the unique class
        const itemsSection = document.querySelector(".items-section-container");
        if (itemsSection) {
          setTimeout(() => {
            itemsSection.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } else {
        console.error("Dropdowns not found");
      }
    });
  });

  window.filterItems = debounce(function () {
    const searchTerm = document.getElementById("search-bar").value.toLowerCase();
    const searchBar = document.getElementById("search-bar");
    const sortValue = document.getElementById("sort-dropdown").value;
    const valueSortType = document.getElementById("value-sort-dropdown").value;

    const itemsContainer = document.querySelector("#items-container");
    const searchMessages = document.getElementById("search-messages");

    // Save search term
    if (searchTerm) {
      localStorage.setItem("searchTerm", searchTerm);
    } else {
      localStorage.removeItem("searchTerm");
    }

    if (searchMessages) {
      searchMessages.innerHTML = "";
    }

    // First, apply category filter
    let categoryFilteredItems = [...allItems];
    if (sortValue !== "name-all-items") {
      const parts = sortValue.split("-");
      const sortType = parts[0]; // Extract sort type from first part
      const itemType = parts.slice(1).join("-");
      categoryFilteredItems = allItems.filter((item) => {
        if (itemType === "limited-items") {
          return item.is_limited;
        } else if (itemType === "seasonal-items") {
          return item.is_seasonal === 1;
        } else if (sortType === "name" && itemType === "hyperchromes") {
          return item.type === "HyperChrome";
        }
        const normalizedItemType = item.type.toLowerCase().replace(" ", "-");
        const normalizedFilterType = itemType.slice(0, -1);
        return normalizedItemType === normalizedFilterType;
      });
    }

    // Apply the current sort before search filtering
    if (valueSortType === "random") {
      categoryFilteredItems = shuffleArray([...categoryFilteredItems]);
    } else if (valueSortType.startsWith("cash-")) {
      categoryFilteredItems.sort((a, b) => {
        const valueA = formatValue(a.cash_value).numeric;
        const valueB = formatValue(b.cash_value).numeric;
        return valueSortType === "cash-asc" ? valueA - valueB : valueB - valueA;
      });
    } else if (valueSortType.startsWith("duped-")) {
      categoryFilteredItems.sort((a, b) => {
        const valueA = formatValue(a.duped_value).numeric;
        const valueB = formatValue(b.duped_value).numeric;
        return valueSortType === "duped-asc"
          ? valueA - valueB
          : valueB - valueA;
      });
    } else if (valueSortType.startsWith("alpha-")) {
      categoryFilteredItems.sort((a, b) => {
        return valueSortType === "alpha-asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    } else if (valueSortType.startsWith("demand-")) {
      const demandOrder = [
        "Close to none",
        "Very Low",
        "Low",
        "Medium",
        "Decent",
        "High",
        "Very High",
        "Extremely High"
      ];
      categoryFilteredItems.sort((a, b) => {
        let demandA = a.demand === "N/A" ? "-" : a.demand || "-";
        let demandB = b.demand === "N/A" ? "-" : b.demand || "-";

        if (demandA === "-" && demandB === "-") return 0;
        if (demandA === "-") return 1;
        if (demandB === "-") return -1;

        const indexA = demandOrder.findIndex(
          (d) => d.toLowerCase() === demandA.toLowerCase()
        );
        const indexB = demandOrder.findIndex(
          (d) => d.toLowerCase() === demandB.toLowerCase()
        );

        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return valueSortType === "demand-asc"
          ? indexA - indexB
          : indexB - indexA;
      });
    } else if (valueSortType.startsWith("last-updated-")) {
      categoryFilteredItems.sort((a, b) => {
        if (!a.last_updated && !b.last_updated) return 0;
        if (!a.last_updated) return 1;
        if (!b.last_updated) return -1;

        return valueSortType === "last-updated-asc"
          ? a.last_updated - b.last_updated
          : b.last_updated - a.last_updated;
      });
    }

    // Apply search filter after sorting
    if (searchTerm.length > 0) {
      filteredItems = categoryFilteredItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm)
      );
    } else {
      filteredItems = categoryFilteredItems;
    }

    // Update UI
    const itemType = sortValue.split("-").slice(1).join("-");
    updateTotalItemsLabel(itemType);
    updateTotalItemsCount();

    // Display no results message if needed
    if (filteredItems.length === 0 && searchTerm.length > 0) {
      let itemsRow = itemsContainer.querySelector(".row");
      if (!itemsRow) {
        itemsRow = document.createElement("div");
        itemsRow.classList.add("row");
        itemsContainer.appendChild(itemsRow);
      }

      const categoryMessage =
        sortValue !== "name-all-items"
          ? ` under category "${escapeHtml(itemType.replace(/-/g, " "))}"`
          : "";

      itemsRow.innerHTML = `
      <div class="col-12 d-flex justify-content-center" style="min-height: 300px;">
        <div class="no-results">
          <h4>No items found for "${escapeHtml(searchTerm)}"${categoryMessage}</h4>
          <p class="text-muted">Try different keywords or check the spelling</p>
        </div>
      </div>
    `;
      return;
    }

    currentPage = 1;
    displayItems();
  }, 300);

  const itemsContainer = document.querySelector("#items-container");
  if (!itemsContainer) return;

  window.sortItems = function () {
    if (isLoading) {
      return;
    }
    if (!window.allItems || window.allItems.length === 0) {
      console.log("No items to sort");
      return;
    }

    const sortDropdown = document.getElementById("sort-dropdown");
    const valueSortDropdown = document.getElementById("value-sort-dropdown");
    const sortValue = sortDropdown?.value || "name-all-items";
    const valueSortType = valueSortDropdown?.value || "cash-desc";

    const currentSort = sortValue.split("-").slice(1).join("-");

    // Save current filter states
    sessionStorage.setItem("sortDropdown", sortValue);
    sessionStorage.setItem("valueSortDropdown", valueSortType);
    sort = sortValue;

    // IMPORTANT: Do filtering BEFORE updating UI
    const parts = sortValue.split("-");
    const sortType = parts[0];
    const itemType = parts.slice(1).join("-");

    // First filter by category
    if (itemType === "all-items") {
      filteredItems = [...allItems];
      localStorage.removeItem("lastSort");
    } else if (itemType === "limited-items") {
      filteredItems = allItems.filter((item) => item.is_limited);
    } else if (itemType === "seasonal-items") {
      filteredItems = allItems.filter((item) => item.is_seasonal === 1);
    } else if (sortType === "name" && itemType === "hyperchromes") {
      filteredItems = allItems.filter((item) => item.type === "HyperChrome");
    } else {
      filteredItems = allItems.filter((item) => {
        const normalizedItemType = item.type.toLowerCase().replace(" ", "-");
        const normalizedFilterType = itemType.slice(0, -1);
        return normalizedItemType === normalizedFilterType;
      });
      localStorage.setItem("lastSort", sortValue);
    }

    // Apply value sorting
    if (valueSortType === "random") {
      filteredItems = shuffleArray([...filteredItems]);
    } else if (valueSortType === "seasonal") {
      // Filter seasonal items after category filter
      filteredItems = filteredItems.filter((item) => item.is_seasonal === 1);
    } else if (valueSortType === "favorites") {
      const token = getCookie("token");
      if (!token) {
        // Show login message if not logged in
        filteredItems = [];
        let itemsRow = itemsContainer.querySelector(".row");
        if (!itemsRow) {
          itemsRow = document.createElement("div");
          itemsRow.classList.add("row");
          itemsContainer.appendChild(itemsRow);
        }
        itemsRow.innerHTML = `
          <div class="col-12">
            <div class="no-favorites-message">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="#f8ff00" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25" />
</svg>
              <h4>Login Required</h4>
              <p>You need to be logged in to view your favorite items</p>
              <div class="login-prompt">
                <button class="btn btn-primary" onclick="showLoginModal()">Login now</button>
              </div>
            </div>
          </div>
        `;
        updateTotalItemsCount();
        updateTotalItemsLabel("favorites");
        return;
      }

      // Get only favorited items
      let favoriteItems = allItems.filter((item) => item.is_favorite);

      // Apply category filter if not on all-items
      if (itemType !== "all-items") {
        if (itemType === "limited-items") {
          favoriteItems = favoriteItems.filter((item) => item.is_limited);
        } else if (itemType === "hyperchromes") {
          favoriteItems = favoriteItems.filter(
            (item) => item.type === "HyperChrome"
          );
        } else {
          const normalizedFilterType = itemType.slice(0, -1); // Remove 's' from end
          favoriteItems = favoriteItems.filter((item) => {
            const normalizedItemType = item.type
              .toLowerCase()
              .replace(" ", "-");
            return normalizedItemType === normalizedFilterType;
          });
        }
      }

      filteredItems = favoriteItems;

      if (filteredItems.length === 0) {
        let itemsRow = itemsContainer.querySelector(".row");
        if (!itemsRow) {
          itemsRow = document.createElement("div");
          itemsRow.classList.add("row");
          itemsContainer.appendChild(itemsRow);
        }
        const categoryName =
          itemType === "all-items"
            ? ""
            : ` in ${escapeHtml(itemType
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "))}`;

        itemsRow.innerHTML = `
          <div class="col-12">
            <div class="no-favorites-message">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="#f8ff00" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25" />
</svg>
              <h4>No Favorites Yet${escapeHtml(categoryName)}</h4>
              <p>You haven't added any ${
                categoryName
                  ? `favorite items${escapeHtml(categoryName)}`
                  : "items to your favorites"
              }</p>
            </div>
          </div>
        `;
        return;
      }

      currentPage = 1;
      displayItems();
      updateTotalItemsLabel("favorites");
      return;
    } else if (valueSortType !== "none") {
      const [valueType, direction] = valueSortType.split("-");
      filteredItems.sort((a, b) => {
        const rawValueA = valueType === "cash" ? a.cash_value : a.duped_value;
        const rawValueB = valueType === "cash" ? b.cash_value : b.duped_value;

        // Check for N/A or empty values
        const isInvalidA =
          !rawValueA || rawValueA === "N/A" || rawValueA === "'N/A'";
        const isInvalidB =
          !rawValueB || rawValueB === "N/A" || rawValueB === "'N/A'";

        // If both are invalid, sort alphabetically by name
        if (isInvalidA && isInvalidB) {
          return a.name.localeCompare(b.name);
        }
        // Invalid values go to the end
        if (isInvalidA) return 1;
        if (isInvalidB) return -1;

        // For valid values, use numeric sorting
        const valueA =
          valueType === "cash"
            ? formatValue(rawValueA).numeric
            : formatValue(rawValueA).numeric;
        const valueB =
          valueType === "cash"
            ? formatValue(rawValueB).numeric
            : formatValue(rawValueB).numeric;

        return direction === "asc" ? valueA - valueB : valueB - valueA;
      });
    }

    // Apply alphabetical sorting
    if (valueSortType === "alpha-asc" || valueSortType === "alpha-desc") {
      filteredItems.sort((a, b) => {
        return valueSortType === "alpha-asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }

    // Apply demand sorting
    if (valueSortType === "demand-asc" || valueSortType === "demand-desc") {
      const demandOrder = [
        "Close to none",
        "Very Low",
        "Low",
        "Medium",
        "Decent",
        "High",
        "Very High",
        "Extremely High",
      ];

      filteredItems.sort((a, b) => {
        let demandA = a.demand === "N/A" ? "-" : a.demand || "-";
        let demandB = b.demand === "N/A" ? "-" : b.demand || "-";

        if (demandA === "-" && demandB === "-") return 0;
        if (demandA === "-") return 1;
        if (demandB === "-") return -1;

        const indexA = demandOrder.findIndex(
          (d) => d.toLowerCase() === demandA.toLowerCase()
        );
        const indexB = demandOrder.findIndex(
          (d) => d.toLowerCase() === demandB.toLowerCase()
        );

        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return valueSortType === "demand-asc"
          ? indexA - indexB
          : indexB - indexA;
      });
    }

    // Apply last updated sorting
    else if (
      valueSortType === "last-updated-desc" ||
      valueSortType === "last-updated-asc"
    ) {
      filteredItems.sort((a, b) => {
        // Handle null/undefined timestamps
        if (!a.last_updated && !b.last_updated) return 0;
        if (!a.last_updated) return 1;
        if (!b.last_updated) return -1;

        // Convert timestamps to milliseconds if they're in seconds
        const timestampA =
          a.last_updated.toString().length <= 10
            ? a.last_updated * 1000
            : a.last_updated;
        const timestampB =
          b.last_updated.toString().length <= 10
            ? b.last_updated * 1000
            : b.last_updated;

        // Sort by timestamp
        return valueSortType === "last-updated-desc"
          ? timestampB - timestampA
          : timestampA - timestampB;
      });
    }

    // Now update UI after all filtering and sorting is done
    updateSearchPlaceholder();
    updateTotalItemsLabel(itemType);

    // Apply current search if exists
    if (searchBar && searchBar.value.trim()) {
      filterItems();
    } else {
      currentPage = 1;
      displayItems();
    }

    // Update breadcrumb
    const categoryNameElement = document.querySelector(".category-name");
    const valuesBreadcrumb = document.getElementById("values-breadcrumb");

    if (sortValue === "name-all-items") {
      categoryNameElement.style.display = "none";
      valuesBreadcrumb.classList.add("active");
      valuesBreadcrumb.setAttribute("aria-current", "page");
      valuesBreadcrumb.innerHTML = "Value List";
    } else {
      let categoryName;
      if (currentSort === "hyperchromes") {
        categoryName = "Hyperchromes";
      } else {
        categoryName = currentSort
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      const escapedCurrentSort = escapeHtml(currentSort);
      const escapedCategoryName = escapeHtml(categoryName);
      
      categoryNameElement.innerHTML = `<a href="/values?sort=name-${escapedCurrentSort}" onclick="handleCategoryClick(event, '${escapedCurrentSort}')">${escapedCategoryName}</a>`;
      categoryNameElement.style.display = "list-item";
      categoryNameElement.classList.add("active");
      categoryNameElement.setAttribute("aria-current", "page");

      valuesBreadcrumb.classList.remove("active");
      valuesBreadcrumb.removeAttribute("aria-current");
      valuesBreadcrumb.innerHTML = '<a href="/values">Value List</a>';
    }

    displayItems();
  };

  // Now check for saved sort and value sort
  const savedSort = sessionStorage.getItem("sortDropdown");
  const savedValueSort =
    sessionStorage.getItem("valueSortDropdown") || "cash-desc";

  if (savedSort || savedValueSort) {
    const sortDropdown = document.getElementById("sort-dropdown");
    const valueSortDropdown = document.getElementById("value-sort-dropdown");

    if (sortDropdown && valueSortDropdown) {
      try {
        if (savedSort) sortDropdown.value = savedSort;
        if (savedValueSort) valueSortDropdown.value = savedValueSort;
        sort = savedSort; // Set global sort variable
        // Safely call sortItems only after setting both dropdowns
        if (typeof window.sortItems === "function") {
          window.sortItems();
        } else {
          console.error("sortItems function not properly initialized");
        }
      } catch (err) {
        console.error("Error restoring sort:", err);
      }
    }
  }

  document.getElementById("sort-dropdown").addEventListener("change", () => {
    window.sortItems();
  });

  document
    .getElementById("value-sort-dropdown")
    .addEventListener("change", () => {
      window.sortItems();
    });

  // Create and append spinner
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.innerHTML = `
     <div class="spinner-border" role="status">
       <span class="visually-hidden">Loading...</span>
     </div>
   `;
  itemsContainer.appendChild(spinner);

  const observer = new IntersectionObserver(
    (entries) => {
      const lastEntry = entries[0];
      if (lastEntry.isIntersecting && !isLoading) {
        loadMoreItems();
      }
    },
    {
      rootMargin: "100px", // Start loading 100px before reaching bottom
    }
  );

  const backToTopButton = document.getElementById("back-to-top");
  // Show button when scrolling down 300px
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = "flex";
    } else {
      backToTopButton.style.display = "none";
    }
  });

  // Scroll to top when button is clicked
  backToTopButton.addEventListener("click", () => {
    const itemsSection = document.querySelector(".items-section-container");
    if (itemsSection) {
      itemsSection.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Restore filters from sessionStorage
  function restoreFilters() {
    const savedSortDropdown = sessionStorage.getItem("sortDropdown");
    const savedValueSort = sessionStorage.getItem("valueSortDropdown");

    if (savedSortDropdown) {
      document.getElementById("sort-dropdown").value = savedSortDropdown;
    }
    if (savedValueSort) {
      const valueSortDropdown = document.getElementById("value-sort-dropdown");

      valueSortDropdown.value = savedValueSort;
    }
    const savedSearch = localStorage.getItem("searchTerm");

    if (savedSortDropdown) {
      document.getElementById("sort-dropdown").value = savedSortDropdown;
    }
    if (savedValueSort) {
      document.getElementById("value-sort-dropdown").value = savedValueSort;
    }
    if (savedSearch) {
      const searchBar = document.getElementById("search-bar");
      searchBar.value = savedSearch;
      const clearButton = document.getElementById("clear-search");
      if (clearButton) {
        clearButton.style.display =
          searchBar.value.length > 0 ? "block" : "none";
      }
    }

    // Restore breadcrumb
    if (savedSortDropdown && savedSortDropdown !== "name-all-items") {
      const categoryName = savedSortDropdown
        .split("-")
        .slice(1)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const categoryNameElement = document.querySelector(".category-name");
      categoryNameElement.textContent = categoryName;
      categoryNameElement.style.display = "list-item";
    }
  }

  // Call restoreFilters after elements are loaded
  restoreFilters();

  // Function to load more items
  // Function to load more items
  async function loadMoreItems() {
    if (isLoading) return;

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Check if there are more items to load
    if (startIndex >= filteredItems.length) {
      return; // No more items to load
    }

    isLoading = true;

    // Show spinner when loading starts
    const spinner = document.querySelector(".loading-spinner");
    if (spinner) {
      spinner.classList.add("active");
    }

    // Add artificial delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 800));

    currentPage++;
    const itemsRow = document.querySelector("#items-container .row");
    const newItems = filteredItems.slice(startIndex, endIndex);

    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();

    // Add each new item to the fragment
    newItems.forEach((item) => {
      const cardDiv = createItemCard(item);
      fragment.appendChild(cardDiv); // Append to fragment instead of directly to itemsRow
    });

    // Append the fragment to the row (single DOM update)
    itemsRow.appendChild(fragment);

    // Hide spinner after loading completes
    if (spinner) {
      spinner.classList.remove("active");
    }
    isLoading = false;
  }

  updateSearchPlaceholder();

  // Clear search input
  if (searchBar) {
    searchBar.value = "";
    // Add event listener for showing/hiding clear button
    searchBar.addEventListener("input", function () {
      if (clearButton) {
        clearButton.style.display = this.value.length > 0 ? "block" : "none";
      }
    });
  }

  async function loadItems() {
    showLoadingOverlay();
    try {
      const response = await fetch("https://api.jailbreakchangelogs.xyz/items/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      });

      window.allItems = await response.json();

      // Helper function to normalize timestamp to milliseconds
      const normalizeTimestamp = (timestamp) => {
        if (!timestamp) return 0;
        // If timestamp is in seconds (10 digits), convert to milliseconds
        return timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
      };

      // Find the item with the highest last_updated timestamp, including sub-items
      const mostRecentItem = window.allItems.reduce((latest, current) => {
        // Get the latest timestamp from the main item and all its variants
        const mainTimestamp = normalizeTimestamp(current.last_updated);
        const variantTimestamps = current.children?.map(child => normalizeTimestamp(child.data?.last_updated)) || [];
        const latestVariantTimestamp = Math.max(...variantTimestamps, 0);
        
        // Compare with the current latest item's timestamps
        const latestMainTimestamp = normalizeTimestamp(latest.last_updated);
        const latestVariantTimestamps = latest.children?.map(child => normalizeTimestamp(child.data?.last_updated)) || [];
        const latestItemVariantTimestamp = Math.max(...latestVariantTimestamps, 0);
        
        // Get the highest timestamp for both items
        const currentHighest = Math.max(mainTimestamp, latestVariantTimestamp);
        const latestHighest = Math.max(latestMainTimestamp, latestItemVariantTimestamp);
        
        // For debugging
        console.log('Current item:', current.name, 'Highest timestamp:', currentHighest);
        console.log('Latest item:', latest.name, 'Highest timestamp:', latestHighest);
        
        return currentHighest > latestHighest ? current : latest;
      });

      // Get the actual highest timestamp from the most recent item
      const mainTimestamp = normalizeTimestamp(mostRecentItem.last_updated);
      const variantTimestamps = mostRecentItem.children?.map(child => normalizeTimestamp(child.data?.last_updated)) || [];
      const highestTimestamp = Math.max(mainTimestamp, ...variantTimestamps);

      // For debugging
      console.log('Most recent item:', mostRecentItem.name);
      console.log('Main timestamp:', mainTimestamp);
      console.log('Variant timestamps:', variantTimestamps);
      console.log('Highest timestamp:', highestTimestamp);

      if (highestTimestamp) {
        updateLastUpdatedTimestamp(highestTimestamp);
      }

      // Add favorite status to items if user is logged in and we have user data
      const token = getCookie("token");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      if (token && userData.id) {
        try {
          const favoritesResponse = await fetch(
            `https://api.jailbreakchangelogs.xyz/favorites/get?user=${userData.id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Origin: "https://jailbreakchangelogs.xyz",
              },
            }
          );
          if (favoritesResponse.ok) {
            const favorites = await favoritesResponse.json();
            // Extract item data from the new favorites format
            const favoriteItems = favorites.map(fav => {
              // Split the item_id to check if it's a variant
              const [parentId, variantId] = fav.item_id.toString().split('-').map(Number);
              return {
                parentId,
                variantId,
                item: fav.item
              };
            });

            // Mark items as favorite
            window.allItems = window.allItems.map((item) => {
              const itemFavorites = favoriteItems.filter(fav => fav.parentId === item.id);
              
              // If the item has variants
              if (item.children && item.children.length > 0) {
                // Mark each variant as favorite if it's in the favorites list
                item.children = item.children.map(child => ({
                  ...child,
                  is_favorite: itemFavorites.some(fav => fav.variantId === child.id)
                }));
                // For parent item, check if the current year variant is favorited
                const currentYear = new Date().getFullYear().toString();
                const currentYearVariant = item.children.find(child => child.sub_name === currentYear);
                item.is_favorite = currentYearVariant?.is_favorite || false;
              } else {
                // For items without variants, just check if the item is favorited
                // Only mark as favorite if there's no variant ID (simple item favorite)
                item.is_favorite = itemFavorites.some(fav => !fav.variantId);
              }
              return item;
            });
          }
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      }

      // Initialize filteredItems
      filteredItems = [...window.allItems];

      // Check for saved preferences
      const savedSort = sessionStorage.getItem("sortDropdown");
      const savedValueSort = sessionStorage.getItem("valueSortDropdown");
      const searchValue = searchBar?.value?.trim() || "";

      // Set dropdown values
      const sortDropdown = document.getElementById("sort-dropdown");
      const valueSortDropdown = document.getElementById("value-sort-dropdown");

      if (sortDropdown && savedSort) {
        sortDropdown.value = savedSort;
      }
      if (valueSortDropdown) {
        valueSortDropdown.value = savedValueSort || "cash-desc";
      }

      // Instead of applying default sort, call sortItems() to apply saved preferences
      window.sortItems();

      // Start preloading images in background
      setTimeout(() => {
        preloadItemImages();
        const driftItems = window.allItems.filter(
          (item) => item.type === "Drift"
        );
        preloadDriftThumbnails(driftItems);
      }, 0);

      updateTotalItemsCount();
      hideLoadingOverlay();
    } catch (error) {
      console.error("Error in loadItems:", error);
      hideLoadingOverlay();
    }
  }

  function updateLastUpdatedTimestamp(timestamp) {
    const lastUpdatedElement = document.getElementById("values-last-updated");
    if (!lastUpdatedElement || !timestamp) return;

    // Convert timestamp to milliseconds if it's in seconds
    const timestampInMs = timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
    
    // Create a Date object
    const date = new Date(timestampInMs);
    
    // Format the date as "Month Day, Year at HH:MM AM/PM (Timezone)"
    const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short'
    });

    lastUpdatedElement.textContent = formattedDate;
  }

  function updateTotalItemsCount() {
    const totalItemsElement = document.getElementById("total-items");
    if (totalItemsElement) {
      totalItemsElement.textContent = filteredItems.length;
    }
  }

  function addSentinel() {
    const sentinel = document.createElement("div");
    sentinel.className = "sentinel";
    sentinel.style.height = "1px";
    const itemsContainer = document.querySelector("#items-container");
    itemsContainer.appendChild(sentinel);
    return sentinel;
  }

  function displayItems() {
    const itemsContainer = document.querySelector("#items-container");
    if (!itemsContainer) {
      console.error("Items container not found");
      return;
    }

    // Clear existing content if on first page
    if (currentPage === 1) {
      itemsContainer.innerHTML = `
            <div class="row g-3"></div>
            <div class="loading-spinner">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }

    const itemsRow = itemsContainer.querySelector(".row");
    if (!itemsRow) {
      console.error("Items row not found");
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    const fragment = document.createDocumentFragment();
    itemsToDisplay.forEach((item) => {
      const cardDiv = createItemCard(item);
      fragment.appendChild(cardDiv);
    });

    itemsRow.appendChild(fragment);

    // Update sentinel for infinite scroll
    const oldSentinel = itemsContainer.querySelector(".sentinel");
    if (oldSentinel) {
      oldSentinel.remove();
    }

    if (endIndex < filteredItems.length) {
      const sentinel = addSentinel();
      observer.observe(sentinel);
    }

    updateTotalItemsCount();
    // Observe any new videos
    observeCardVideos();
  }

  function loadimage(image_url) {
    if (image_url) {
      const image = new Image();
      image.src = image_url;
    }
  }

  function formatValue(value) {
    // Return default object if value is null, undefined, or empty string
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "N/A"
    ) {
      return {
        display: "None",
        numeric: 0,
      };
    }

    // Convert string values like "7.5m" or "75k" to numbers
    let numericValue = value;
    if (typeof value === "string") {
      // Normalize the string: replace comma with period for decimal numbers
      value = value.toLowerCase().replace(",", ".");
      if (value.endsWith("m")) {
        numericValue = parseFloat(value) * 1000000;
      } else if (value.endsWith("k")) {
        numericValue = parseFloat(value) * 1000;
      } else {
        numericValue = parseFloat(value);
      }
    }

    // Return default object if conversion resulted in NaN
    if (isNaN(numericValue)) {
      return {
        display: "-",
        numeric: 0,
      };
    }

    // Format display value in shorthand (K/M)
    let displayValue;
    if (numericValue >= 1000000) {
      displayValue = (numericValue / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
    } else if (numericValue >= 1000) {
      displayValue = (numericValue / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
    } else {
      displayValue = numericValue.toString();
    }

    return {
      display: displayValue,
      numeric: numericValue,
    };
  }

  function createItemCard(item) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "col-6 col-md-4 col-lg-3";

    // Get type color
    let color = "#124e66"; // Default color
    if (item.type === "Vehicle") color = "#c82c2c";
    if (item.type === "Spoiler") color = "#C18800";
    if (item.type === "Rim") color = "#6335B1";
    if (item.type === "Tire Sticker") color = "#1CA1BD";
    if (item.type === "Tire Style") color = "#4CAF50";
    if (item.type === "Drift") color = "#FF4500";
    if (item.type === "Body Color") color = "#8A2BE2";
    if (item.type === "Texture") color = "#708090";
    if (item.type === "HyperChrome") color = "#E91E63";
    if (item.type === "Furniture") color = "#9C6644";
    if (item.type === "Horn") color = "#4A90E2";
    if (item.type === "Weapon Skin") color = "#4a6741";

    let borderClasses = "border";
    if (item.is_seasonal) {
      borderClasses = "border-3 border-info";
    } else if (item.is_limited) {
      borderClasses = "border-3 border-warning";
    }

    const cardClasses = ["card", "items-card", "shadow-sm", borderClasses];

    const isHyperChrome = item.type === "HyperChrome";
    const typeBadgeHtml = isHyperChrome
      ? `<span class="badge hyperchrome-badge">HyperChrome</span>`
      : `<span class="badge item-type-badge" style="background-color: ${color};">
           ${item.type}
         </span>`;

    const mediaElement = getItemMediaElement(item, {
      containerClass: "",
      imageClass: "card-img-top",
      showFavoriteIcon: true,
      size: "480p",
    });

    // Format values
    const cashValue = formatValue(item.cash_value);
    const dupedValue = formatValue(item.duped_value);

    // Check if item has sub-items
    const hasSubItems = item.children && item.children.length > 0;
    const currentYear = new Date().getFullYear();

    // Find the most recent variant with both cash and duped values
    let defaultVariant = currentYear.toString();
    let defaultVariantId = item.id;
    if (hasSubItems) {
      // Sort children by year in descending order
      const sortedChildren = [...item.children].sort((a, b) => 
        parseInt(b.sub_name) - parseInt(a.sub_name)
      );
      
      // Find the first variant that has both cash and duped values
      const variantWithValues = sortedChildren.find(child => 
        child.data.cash_value && 
        child.data.cash_value !== "N/A" && 
        child.data.duped_value && 
        child.data.duped_value !== "N/A"
      );

      if (variantWithValues) {
        defaultVariant = variantWithValues.sub_name;
        defaultVariantId = variantWithValues.id;
      }
    }

    const subItemsDropdown = hasSubItems ? `
      <div class="sub-items-dropdown position-absolute top-0 end-0">
        <div class="dropdown">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-selected-variant="${defaultVariant}">
            ${defaultVariant}
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item ${defaultVariant === currentYear.toString() ? 'active' : ''}" href="#" data-item-id="${item.id}" data-variant="${currentYear}">${currentYear}</a></li>
            ${item.children.map(child => `
              <li><a class="dropdown-item ${child.sub_name === defaultVariant ? 'active' : ''}" href="#" data-item-id="${child.id}" data-variant="${child.sub_name}">${child.sub_name}</a></li>
            `).join('')}
          </ul>
        </div>
      </div>
    ` : '';

    // Create card HTML
    const cardHtml = `
      <div class="${cardClasses.join(' ')}">
        <div class="position-relative">
          ${mediaElement}
          ${subItemsDropdown}
          <div class="card-body text-center">
            <div class="badges-container">
              ${typeBadgeHtml}
            </div>
            <h5 class="card-title">
              <a href="/item/${item.type.toLowerCase()}/${encodeURIComponent(item.name.replace(/\s+/g, "-"))}" 
                 class="text-decoration-none item-name-link" 
                 style="color: var(--text-primary);"
                 data-variant="${defaultVariant}">
                ${item.name}
              </a>
            </h5>
            <div class="card-text">
              <div class="list-group list-group-flush">
                <!-- Cash Value Card -->
                <div class="list-group-item bg-dark-subtle rounded mb-2 p-2">
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-body-secondary">Cash Value</small>
                    <span class="badge bg-primary rounded-pill" data-value="${cashValue.numeric}">
                      ${cashValue.display}
                    </span>
                  </div>
                </div>
                
                <!-- Duped Value Card -->
                <div class="list-group-item bg-dark-subtle rounded mb-2 p-2">
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-body-secondary">Duped Value</small>
                    <span class="badge rounded-pill" style="background-color: var(--text-muted);" data-value="${dupedValue.numeric}">
                      ${dupedValue.display}
                    </span>
                  </div>
                </div>
              
                <!-- Demand Card -->
                <div class="list-group-item bg-dark-subtle rounded p-2">
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-body-secondary">Demand</small>
                    <span class="badge ${getDemandBadgeClass(item.demand)} rounded-pill">
                      ${item.demand === "'N/A'" || item.demand === "N/A" ? "No Demand" : item.demand || "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ${item.last_updated ? `
            <div class="card-footer">
              <div class="d-flex align-items-center gap-1">
                <small class="text-body-secondary">Last updated ${formatTimeAgo(item.last_updated)}</small>
              </div>
            </div>`
            :`
            <div class="card-footer">
              <div class="d-flex align-items-center gap-1">
                <small class="text-body-secondary">Last updated Unknown</small>
              </div>
            </div>
          `}
        </div>
      </div>`;

    cardDiv.innerHTML = cardHtml;

    // Add click handler for all cards
    const card = cardDiv.querySelector(".card");
    card.addEventListener("click", (e) => {
      // Ignore favorite icon clicks and dropdown clicks
      if (e.target.closest(".favorite-icon") || e.target.closest(".sub-items-dropdown")) {
        return;
      }

      // For horns, only navigate if clicking card-body
      if (item.type === "Horn") {
        const isCardBody = e.target.closest(".card-body");
        if (!isCardBody) {
          return;
        }
      }

      // For drift items, check if clicking video/thumbnail
      if (item.type === "Drift" && e.target.closest(".media-container")) {
        return;
      }

      // Get the currently selected variant if it exists
      const dropdown = cardDiv.querySelector('.dropdown');
      const activeItem = dropdown?.querySelector('.dropdown-item.active');
      const selectedVariant = activeItem?.dataset.variant;

      // Navigate to item page
      const formattedType = item.type.toLowerCase();
      const formattedName = encodeURIComponent(item.name.replace(/\s+/g, "-"));
      const url = selectedVariant && selectedVariant !== currentYear.toString()
        ? `/item/${formattedType}/${formattedName}?variant=${encodeURIComponent(selectedVariant)}`
        : `/item/${formattedType}/${formattedName}`;
      window.location.href = url;
    });

    // Add event listeners for sub-items dropdown if it exists
    if (hasSubItems) {
      const dropdown = cardDiv.querySelector('.dropdown');
      const dropdownButton = dropdown.querySelector('.dropdown-toggle');
      const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
      const itemLink = cardDiv.querySelector('.item-name-link');
      
      // Update card values with default variant data if not current year
      if (defaultVariant !== currentYear.toString()) {
        const defaultVariantData = item.children.find(child => child.sub_name === defaultVariant);
        if (defaultVariantData) {
          const variantData = {
            ...defaultVariantData.data,
            is_favorite: defaultVariantData.is_favorite
          };
          updateCardValues(cardDiv, variantData);
        }
      }
      
      dropdownItems.forEach(dropdownItem => {
        dropdownItem.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove active class from all items
          dropdownItems.forEach(item => item.classList.remove('active'));
          
          // Add active class to clicked item
          dropdownItem.classList.add('active');
          
          // Update dropdown button text and data attribute
          const selectedVariant = dropdownItem.dataset.variant;
          dropdownButton.textContent = selectedVariant;
          dropdownButton.dataset.selectedVariant = selectedVariant;
          
          // Update the link URL
          if (itemLink) {
            const baseUrl = itemLink.href.split('?')[0];
            // Only add variant parameter if it's not the current year
            itemLink.href = selectedVariant === currentYear.toString() 
              ? baseUrl 
              : `${baseUrl}?variant=${encodeURIComponent(selectedVariant)}`;
            itemLink.dataset.variant = selectedVariant;
          }
          
          // Get the item ID and variant
          const itemId = parseInt(dropdownItem.dataset.itemId);
          const variant = dropdownItem.textContent;
          
          // If it's the original item, use the parent item
          if (itemId === item.id) {
            // For current year variant, use the parent item's data
            updateCardValues(cardDiv, item);
          } else {
            // Find the sub-item
            const subItem = item.children.find(sub => sub.id === itemId);
            if (subItem) {
              // For other variants, use the variant's data with parent item's properties
              const variantData = {
                ...subItem.data,
                is_favorite: subItem.is_favorite // Include the variant's favorite status
              };
              updateCardValues(cardDiv, variantData);
            }
          }
        });
      });
    }

    // Add hover handlers for drift videos
    if (item.type === "Drift") {
      const video = cardDiv.querySelector("video");
      const thumbnail = cardDiv.querySelector(".drift-thumbnail");
      const mediaContainer = cardDiv.querySelector(".media-container");

      if (video && thumbnail && mediaContainer) {
        mediaContainer.addEventListener("mouseenter", () => {
          video.style.opacity = "1";
          thumbnail.style.opacity = "0";
          video.play();
        });

        mediaContainer.addEventListener("mouseleave", () => {
          video.style.opacity = "0";
          thumbnail.style.opacity = "1";
          video.pause();
          video.currentTime = 0;
        });
      }
    }

    return cardDiv;
  }

  // Helper function to update card values
  function updateCardValues(cardDiv, item) {
    const cashValue = formatValue(item.cash_value);
    const dupedValue = formatValue(item.duped_value);
    
    // Update cash value
    const cashValueBadge = cardDiv.querySelector('.list-group-item:nth-child(1) .badge');
    cashValueBadge.textContent = cashValue.display;
    cashValueBadge.dataset.value = cashValue.numeric;
    
    // Update duped value
    const dupedValueBadge = cardDiv.querySelector('.list-group-item:nth-child(2) .badge');
    dupedValueBadge.textContent = dupedValue.display;
    dupedValueBadge.dataset.value = dupedValue.numeric;
    
    // Update demand
    const demandBadge = cardDiv.querySelector('.list-group-item:nth-child(3) .badge');
    demandBadge.textContent = item.demand === "'N/A'" || item.demand === "N/A" ? "No Demand" : item.demand || "None";
    demandBadge.className = `badge ${getDemandBadgeClass(item.demand)} rounded-pill`;
    
    // Update last updated timestamp
    const lastUpdatedText = cardDiv.querySelector('.card-footer small');
    if (item.last_updated) {
      lastUpdatedText.textContent = `Last updated ${formatTimeAgo(item.last_updated)}`;
    } else {
      lastUpdatedText.textContent = 'Last updated Unknown';
    }

    // Update favorite icon
    const favoriteIcon = cardDiv.querySelector('.favorite-icon path');
    if (favoriteIcon) {
      const isFavorited = item.is_favorite;
      favoriteIcon.setAttribute('fill', isFavorited ? "#f8ff00" : "none");
      favoriteIcon.setAttribute('stroke', isFavorited ? "none" : "#f8ff00");
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function preloadItemImages() {
    if (!allItems || allItems.length === 0) return;

    // Create a loading queue to prevent overwhelming the browser
    const imageQueue = allItems
      .filter(
        (item) =>
          // Exclude drifts, horns, and HyperShift
          !["drift", "horn"].includes(item.type.toLowerCase()) &&
          !(item.name === "HyperShift" && item.type === "HyperChrome")
      )
      .map((item) => {
        const itemType = item.type.toLowerCase();
        // Get image path directly instead of parsing HTML
        return `/assets/images/items/480p/${itemType}s/${item.name}.webp`;
      })
      .filter(Boolean); // Remove any undefined/null values

    // Load images in batches of 10
    const batchSize = 10;
    let currentBatch = 0;

    function loadBatch() {
      const batch = imageQueue.slice(currentBatch, currentBatch + batchSize);
      if (batch.length === 0) return;

      batch.forEach((url) => {
        const img = new Image();
        img.src = url;
      });

      currentBatch += batchSize;
      if (currentBatch < imageQueue.length) {
        setTimeout(loadBatch, 100);
      }
    }

    loadBatch();
  }

  function preloadDriftThumbnails(driftItems) {
    if (!driftItems || driftItems.length === 0) return;

    driftItems.forEach((item) => {
      // Use getItemMediaElement to get the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = getItemMediaElement(item, {
        showFavoriteIcon: false,
        size: "480p",
      });

      // Find the drift thumbnail image
      const thumbnailImg = tempDiv.querySelector(".drift-thumbnail");
      if (thumbnailImg && thumbnailImg.src) {
        const img = new Image();
        img.src = thumbnailImg.src;
      }
    });
  }

  // Update clearFilters function
  window.clearFilters = debounce(function () {
    // Clear sessionStorage
    sessionStorage.removeItem("sortDropdown");
    sessionStorage.removeItem("valueSortDropdown");

    // Reset dropdowns
    document.getElementById("sort-dropdown").value = "name-all-items";
    document.getElementById("value-sort-dropdown").value = "cash-desc"; // Match initial load state

    // Reset items display
    currentPage = 1;
    filteredItems = [...allItems];
    // Sort by cash value descending to match the dropdown value
    filteredItems.sort((a, b) => {
      const valueA = formatValue(a.cash_value).numeric;
      const valueB = formatValue(b.cash_value).numeric;
      return valueB - valueA;
    });

    // If there's a search term, perform the search
    const searchValue = searchBar?.value?.trim() || "";
    if (searchValue) {
      filterItems();
    } else {
      displayItems();
      updateTotalItemsCount();
      updateTotalItemsLabel("all-items");
    }

    updateSearchPlaceholder();

    notyf.success("Filters have been reset", "Filters Reset");
  }, 500);

  const sortDropdown = document.getElementById("sort-dropdown");
  if (sortDropdown) {
    sortDropdown.innerHTML = `
    <option value="name-all-items">All Items</option>
    <option value="name-limited-items">Limited Items</option>
    <option value="name-seasonal-items">Seasonal Items</option>
    <option value="name-vehicles">Vehicles</option>
    <option value="name-spoilers">Spoilers</option>
    <option value="name-rims">Rims</option>
    <option value="name-body-colors">Body Colors</option>
    <option value="name-hyperchromes">HyperChromes</option>
    <option value="name-textures">Body Textures</option>
    <option value="name-tire-stickers">Tire Stickers</option>
    <option value="name-tire-styles">Tire Styles</option>
    <option value="name-drifts">Drifts</option>
    <option value="name-furnitures">Furniture</option>
    <option value="name-horns">Horns</option>
    <option value="name-weapon-skins">Weapon Skins</option>  <!-- Add this line -->
    `;
  }

  const valueSortDropdown = document.getElementById("value-sort-dropdown");
  if (valueSortDropdown) {
    valueSortDropdown.innerHTML = `
    <option value="random">Random</option>
    <option value="favorites">My Favorites</option>
    <option value="seasonal">Seasonal Items</option>
    <option value="separator" disabled>───── Alphabetically ─────</option>
    <option value="alpha-asc">Name (A to Z)</option>
    <option value="alpha-desc">Name (Z to A)</option>
    <option value="separator" disabled>───── Values ─────</option>
    <option value="cash-desc">Cash Value (High to Low)</option>
    <option value="cash-asc">Cash Value (Low to High)</option>
    <option value="duped-desc">Duped Value (High to Low)</option>
    <option value="duped-asc">Duped Value (Low to High)</option>
    <option value="separator" disabled>───── Demand ─────</option>
    <option value="demand-desc">Demand (High to Low)</option>
    <option value="demand-asc">Demand (Low to High)</option>
    <option value="separator" disabled>───── Last Updated ─────</option>
    <option value="last-updated-desc">Last Updated (Newest to Oldest)</option>
    <option value="last-updated-asc">Last Updated (Oldest to Newest)</option>
    `;

    // Check sessionStorage first, fallback to random
    const savedValueSort = sessionStorage.getItem("valueSortDropdown");

    valueSortDropdown.value = savedValueSort || "cash-desc";
    sortItems(); // Apply initial sort
  }

  loadItems(); // Initial load

  // Handle URL parameters and clean up URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("sort")) {
    const sortValue = urlParams.get("sort");
    // Validate sort parameter
    if (VALID_SORTS.includes(sortValue)) {
      const dropdown = document.getElementById("sort-dropdown");
      dropdown.value = `name-${sortValue}`;
      sessionStorage.setItem("sortDropdown", dropdown.value);
    }
  }
  if (urlParams.has("valueSort")) {
    const valueSort = urlParams.get("valueSort");
    const valueSortDropdown = document.getElementById("value-sort-dropdown");
    valueSortDropdown.value = valueSort;
    sessionStorage.setItem("valueSortDropdown", valueSort);
  }

  // Clean up URL after storing parameters
  window.history.replaceState({}, "", window.location.pathname);

  // Apply the sort
  sortItems();

  // Restore contributors section state on mobile
  if (window.innerWidth <= 768) {
    const grid = document.querySelector(".contributors-grid");
    const icon = document.querySelector(".toggle-icon");
    const expanded = localStorage.getItem("contributorsExpanded") === "true";

    if (expanded) {
      grid.classList.add("expanded");
      icon.classList.add("collapsed");
    }
  }
});

// Default Image
window.handleimage = function (element) {
  const isHyperShiftLvl5 =
    element.id === "HyperShift-video" ||
    (element.alt === "HyperShift" &&
      element.closest(".media-container")?.querySelector("video"));

  if (isHyperShiftLvl5) {
    return;
  }

  element.src =
    "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat";
};

function clearSearch() {
  const searchBar = document.getElementById("search-bar");
  const clearButton = document.getElementById("clear-search");

  if (searchBar) {
    searchBar.value = "";
    filterItems();
  }

  if (clearButton) {
    clearButton.style.display = "none";
  }
}

function updateTotalItemsLabel(itemType) {
  const totalItemsLabel = document.getElementById("total-items-label");
  if (totalItemsLabel) {
    if (itemType === "favorites") {
      totalItemsLabel.textContent = "Total Favorites: ";
    } else if (itemType === "all-items") {
      totalItemsLabel.textContent = "Total Items: ";
    } else {
      let categoryName;
      if (itemType === "hyperchromes") {
        categoryName = "HyperChrome";
      } else {
        categoryName = itemType
          .slice(0, -1)
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
      totalItemsLabel.textContent = `Total ${categoryName}s: `;
    }
  }
}

function updateSearchPlaceholder() {
  const sortValue = document.getElementById("sort-dropdown").value;
  const searchBar = document.getElementById("search-bar");

  // Extract category from sort value (e.g., 'name-vehicles' -> 'vehicles')
  const category = sortValue.split("-").slice(1).join("-");

  // Define placeholders for different categories
  const placeholders = {
    "all-items": "Search items...",
    "limited-items": "Search limited items...",
    "seasonal-items": "Search seasonal items...",
    vehicles: "Search vehicles (e.g., Brulee, Torpedo)...",
    spoilers: "Search spoilers (e.g., Mecha Arm, Dual Flags)...",
    rims: "Search rims (e.g., Star, Spinner)...",
    "body-colors": "Search body colors (e.g., Vantablack, Radiant Ice)...",
    "tire-stickers": "Search tire stickers (e.g., Badonuts, Blue 50)...",
    "tire-styles": "Search tire styles (e.g., Brickset, Glacier)...",
    drifts: "Search drifts (e.g., OG Fuel, Cosmic)...",
    hyperchromes: "Search hyperchromes (e.g., HyperRed, HyperBlue)...",
    furnitures: "Search furniture (e.g., Sci-Fi Kitchen, Picnic Table)...",
    textures: "Search textures (e.g., Galaxy, Rainbow)...",
    horns: "Search horns (e.g., Air Horn, Train Horn)...",
    "weapon-skins": "Search weapon skins (e.g., White Marble, Tiger)...",
  };

  // Set placeholder based on category
  searchBar.placeholder = placeholders[category] || "Search items...";
}

window.handleCardClick = function (name, type, event) {
  // Prevent opening card on right click (event.button = 2)
  if (event.button === 2) {
    return;
  }

  // Only handle navigation if click is in card-body
  if (!event.target.closest(".item-card-body")) {
    return;
  }

  event.preventDefault();

  // Always convert spaces to hyphens for consistent storage
  const formattedType = type.replace(/\s+/g, "-");

  // Store both dropdown values before navigating
  const currentSort = document.getElementById("sort-dropdown").value;
  const currentValueSort = document.getElementById("value-sort-dropdown").value;

  sessionStorage.setItem("sortDropdown", currentSort);
  sessionStorage.setItem("valueSortDropdown", currentValueSort);

  const formattedName = encodeURIComponent(name);
  const formattedUrlType = encodeURIComponent(type.toLowerCase());
  const url = `/item/${formattedUrlType}/${formattedName}`;

  window.location.href = url;
};

window.handleCategoryClick = function (event, category) {
  event.preventDefault();

  const hyphenatedCategory = category.replace(/\s+/g, "-");
  const dropdown = document.getElementById("sort-dropdown");
  const newValue = `name-${hyphenatedCategory}`;
  dropdown.value = newValue;
  sessionStorage.setItem("sortDropdown", newValue);

  // Get the current value sort
  const valueSortDropdown = document.getElementById("value-sort-dropdown");
  const valueSort = valueSortDropdown.value;
  sessionStorage.setItem("valueSortDropdown", valueSort);

  sortItems();
};

// Add new function for horn playback
function handleHornClick(hornName, event) {
  // Don't prevent default or stop propagation to allow navigation
  // event.preventDefault();
  // event.stopPropagation();

  const audioElement = document.querySelector(
    `[data-horn="${hornName}"] audio`
  );

  // Stop all other playing horns first
  document.querySelectorAll(".horn-audio").forEach((audio) => {
    if (audio !== audioElement) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}

// Make sure sortItems is accessible globally
if (typeof window.sortItems !== "function") {
  console.warn("sortItems not found on window object, ensuring it's defined");
  window.sortItems = function () {
    console.warn("Fallback sortItems called - page may need refresh");
  };
}

function toggleContributors(header) {
  const grid = header.nextElementSibling;
  const icon = header.querySelector(".toggle-icon");

  if (window.innerWidth <= 768) {
    grid.classList.toggle("expanded");
    icon.classList.toggle("collapsed");

    // Store the state in localStorage
    localStorage.setItem(
      "contributorsExpanded",
      grid.classList.contains("expanded")
    );
  }
}

// Add video observer for managing video playback
const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // Wait a frame before playing to avoid potential race conditions
        requestAnimationFrame(() => {
          video.play().catch((err) => console.log("Video play failed:", err));
        });
      } else {
        video.pause();
        // Reset video to start
        video.currentTime = 0;
      }
    });
  },
  {
    threshold: 0.5, // Video will play when 50% visible
  }
);

// Function to observe all videos in cards
function observeCardVideos() {
  // document.querySelectorAll(".items-card video").forEach((video) => {
  //   videoObserver.observe(video);
  // });
}

// Also handle tab/window visibility
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause all videos when tab is not visible
    // document.querySelectorAll(".items-card video").forEach((video) => {
    //   video.pause();
    // });
  } else {
    // Check which videos are visible and should be playing
    document.querySelectorAll(".card video").forEach((video) => {
      const entry = video.getBoundingClientRect();
      const isVisible = entry.top < window.innerHeight && entry.bottom > 0;
      if (isVisible) {
        video.play().catch((err) => console.log("Video play failed:", err));
      }
    });
  }
});

async function getRandomItem(event) {
  event.preventDefault();
  
  // Idk whether I should show the loading overlay here or not
  // showLoadingOverlay();
  
  try {
    // Fetch random item
    const response = await fetch('https://api.jailbreakchangelogs.xyz/items/random');
    const item = await response.json();
    
    if (!item) {
      throw new Error('No item returned');
    }
    
    // Construct URL for the item
    const itemUrl = `/item/${item.type.toLowerCase()}/${encodeURIComponent(item.name)}`;
    
    // Show success notification
    notyf.success(`Found ${item.name} ${item.type}! Redirecting...`);
    
    // Wait 2 seconds before redirecting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Redirect to the item page
    window.location.href = itemUrl;
    
  } catch (error) {
    console.error('Error fetching random item:', error);
    notyf.error('Failed to get random item. Please try again.');
  }
}

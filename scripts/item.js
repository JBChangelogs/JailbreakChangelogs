const VALID_SORTS = [
  "vehicle",
  "spoiler",
  "rim",
  "body-color",
  "texture",
  "tire-sticker",
  "tire-style",
  "drift",
  "hyperchrome",
  "furniture",
  "limited-item",
  "horn",
];

function isValidHyperChrome(name) {
  // List of valid HyperChrome colors
  const validColors = [
    "HyperBlue",
    "HyperDiamond",
    "HyperGreen",
    "HyperOrange",
    "HyperPink",
    "HyperPurple",
    "HyperRed",
    "HyperYellow",
    "HyperShift",
  ];

  // Remove "Level X" and normalize case for comparison
  const baseName = name.replace(/\s+Level\s+\d+$/, "").toLowerCase();

  // First try exact match (case-insensitive)
  if (validColors.some((color) => color.toLowerCase() === baseName)) {
    return true;
  }

  // If no exact match, check for close matches (for suggestions)
  const similarityThreshold = 0.85; // Adjust this value as needed
  return validColors.some((color) => {
    const similarity = calculateNameSimilarity(baseName, color.toLowerCase());
    return similarity > similarityThreshold;
  });
}

function calculateNameSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1)
    .fill()
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

async function loadSimilarItemsByName(searchName) {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list"
    );
    if (!response.ok) throw new Error("Failed to fetch items");

    const items = await response.json();
    const urlPath = window.location.pathname.split("/");
    const urlType = urlPath[2];

    // For HyperChromes, extract the base name without level
    const isHyperChrome = urlType.toLowerCase() === "hyperchrome";
    const searchBaseName = isHyperChrome
      ? searchName.replace(/\s+Level\s+\d+$/, "")
      : searchName;

    // If we're in HyperChrome category and the search name isn't valid, show no results
    if (isHyperChrome && !isValidHyperChrome(searchBaseName)) {
      const similarItemsContainer = document.getElementById("similar-items");
      if (similarItemsContainer) {
        similarItemsContainer.innerHTML = `
          <div class="col-12 text-center">
            <p class="text-muted">"${searchBaseName}" is not a valid HyperChrome color</p>
          </div>
        `;
      }
      return;
    }

    let similarItems = [];

    // Add HyperShift suggestion for HyperChromes
    if (isHyperChrome && searchName !== "HyperShift") {
      // Extract level number if present
      const levelMatch = searchName.match(/Level\s+(\d+)$/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 0;

      // Check if level is 4 or higher
      const isHighLevel = level >= 4;
      // For lower levels (1-3), randomly decide (30% chance)
      const showForLowerLevel = level < 4 && Math.random() < 0.3;

      if (isHighLevel || showForLowerLevel) {
        const hyperShift = items.find(
          (item) =>
            item.name === "HyperShift" &&
            item.type.toLowerCase() === "hyperchrome"
        );
        if (hyperShift) {
          similarItems.push(hyperShift);
        }
      }
    }
    // Find items with similar names using fuzzy matching AND matching type
    const otherSimilarItems = items
      .filter((item) => {
        // For HyperChromes, first validate that it's a real HyperChrome
        if (isHyperChrome) {
          if (!isValidHyperChrome(item.name)) {
            return false;
          }
        }

        // Skip HyperShift if already added
        if (
          item.name === "HyperShift" &&
          similarItems.some((i) => i.name === "HyperShift")
        ) {
          return false;
        }

        // For HyperChromes, compare base names
        const itemBaseName = isHyperChrome
          ? item.name.replace(/\s+Level\s+\d+$/, "")
          : item.name;

        const similarity = calculateNameSimilarity(
          searchBaseName.toLowerCase(),
          itemBaseName.toLowerCase()
        );

        // More lenient similarity threshold for HyperChromes
        const similarityThreshold = isHyperChrome ? 0.4 : 0.2;

        // Check both name similarity and type match
        return (
          similarity > similarityThreshold &&
          item.type.toLowerCase() === urlType.toLowerCase()
        );
      })
      .sort((a, b) => {
        // For sorting, compare base names for HyperChromes
        const aBaseName = isHyperChrome
          ? a.name.replace(/\s+Level\s+\d+$/, "")
          : a.name;
        const bBaseName = isHyperChrome
          ? b.name.replace(/\s+Level\s+\d+$/, "")
          : b.name;

        const simA = calculateNameSimilarity(
          searchBaseName.toLowerCase(),
          aBaseName.toLowerCase()
        );
        const simB = calculateNameSimilarity(
          searchBaseName.toLowerCase(),
          bBaseName.toLowerCase()
        );
        return simB - simA;
      });

    // Combine HyperShift (if added) with other similar items
    similarItems = [...similarItems, ...otherSimilarItems].slice(0, 4);

    const similarItemsContainer = document.getElementById("similar-items");
    if (!similarItemsContainer) return;

    if (similarItems.length > 0) {
      // Hide the regular similar-items-section if it exists
      const regularSimilarSection = document.querySelector(
        ".similar-items-section"
      );
      if (regularSimilarSection) {
        regularSimilarSection.style.display = "none";
      }

      similarItemsContainer.innerHTML = similarItems
        .map(
          (item) => `
        <div class="col-lg-3 col-md-6 col-6">
          <a href="/item/${item.type.toLowerCase()}/${encodeURIComponent(
            item.name
          )}" 
             class="card h-100 text-decoration-none hover-effect">
            ${getItemMediaElement(item, {
              containerClass: "card-img-wrapper position-relative h-100",
              imageClass: "card-img-top w-100 h-100",
              size: "480p",
              showLimitedBadge: false,
            })}
            <div class="card-overlay position-absolute bottom-0 start-0 w-100 p-2"
                 style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
              <h6 class="card-title mb-1 text-white">${item.name}</h6>
              <small class="text-light">${item.type}</small>
            </div>
          </a>
        </div>
      `
        )
        .join("");

      // Add hover effect styles
      const style = document.createElement("style");
      style.textContent = `
        .hover-effect:hover img {
          transform: scale(1.05);
        }
        .hover-effect {
          transition: transform 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
      `;
      document.head.appendChild(style);
    } else {
      similarItemsContainer.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-muted">No similar items found</p>
        </div>
      `;

      const regularSimilarSection = document.querySelector(
        ".similar-items-section"
      );
      if (regularSimilarSection) {
        regularSimilarSection.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error loading similar items:", error);
    const similarItemsSection = document.querySelector(
      ".similar-items-section"
    );
    if (similarItemsSection) {
      similarItemsSection.style.display = "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  function showLoadingOverlay() {
    $("#loading-overlay").addClass("show");
  }

  function hideLoadingOverlay() {
    $("#loading-overlay").removeClass("show");
  }

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

  const rawItemName = window.location.pathname.split("/").pop();
  const itemName = decodeURIComponent(rawItemName).trim().replace(/\s+/g, " "); // Get the item name from the URL

  function formatChartValue(value) {
    // Return "-" if value is null, undefined, or empty string
    if (value === null || value === undefined || value === "") {
      return 0;
    }
    // Convert string values like "7.5m" or "75k" to numbers
    let numericValue = value;
    if (typeof value === "string") {
      value = value.toLowerCase();
      if (value.endsWith("m")) {
        numericValue = parseFloat(value) * 1000000;
      } else if (value.endsWith("k")) {
        numericValue = parseFloat(value) * 1000;
      } else {
        numericValue = parseFloat(value);
      }
    }
    // Return "-" if conversion resulted in NaN
    if (isNaN(numericValue)) {
      return 0;
    }
    // Return the number with commas
    return numericValue;
  }

  async function loadItemDetails() {
    showLoadingOverlay();

    try {
      const urlPath = window.location.pathname.split("/");
      const urlType = urlPath[2];
      const rawItemName = urlPath.pop();
      const itemName = decodeURIComponent(rawItemName)
        .trim()
        .replace(/\s+/g, " ");

      if (!urlType || !itemName) {
        throw new Error("Invalid URL format");
      }

      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
          itemName
        )}&type=${urlType}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Item not found");
      }

      const item = await response.json();

      if (item && !item.error && item.type) {
        displayItemDetails(item);
      } else {
        throw new Error("Invalid item data received");
      }

      handleUrlParams();
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorMessage(
        error.message === "Item not found"
          ? "Item Not Found"
          : "Error Loading item details"
      );
    } finally {
      hideLoadingOverlay();
    }
  }

  function formatValue(value) {
    // Return "-" if value is null, undefined, or empty string
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    // Convert string values like "7.5m" or "75k" to numbers
    let numericValue = value;
    if (typeof value === "string") {
      // Normalize the string: replace comma with period for decimal numbers
      value = value.toLowerCase().replace(",", ".");
      if (value.endsWith("b")) {
        numericValue = parseFloat(value) * 1000000000;
      } else if (value.endsWith("m")) {
        numericValue = parseFloat(value) * 1000000;
      } else if (value.endsWith("k")) {
        numericValue = parseFloat(value) * 1000;
      } else {
        numericValue = parseFloat(value);
      }
    }

    // Return "-" if conversion resulted in NaN
    if (isNaN(numericValue)) {
      return "-";
    }

    // Use fixed precision to avoid rounding errors
    return Math.round(numericValue).toLocaleString("en-US");
  }

  function formatValueForDisplay(value, isMobile = false) {
    if (!value || value === "N/A") return "No Value";

    const numericValue = parseNumericValue(value);

    if (isMobile) {
      if (numericValue >= 1000000) {
        return (numericValue / 1000000).toFixed(1) + "M";
      } else if (numericValue >= 1000) {
        return (numericValue / 1000).toFixed(1) + "K";
      }
      return numericValue.toLocaleString();
    }

    return numericValue.toLocaleString();
  }

  function parseNumericValue(value) {
    if (!value || value === "N/A") return 0;

    const valueStr = value.toString().toLowerCase();
    if (valueStr.endsWith("m")) {
      return parseFloat(valueStr) * 1000000;
    } else if (valueStr.endsWith("k")) {
      return parseFloat(valueStr) * 1000;
    }
    return parseFloat(valueStr) || 0;
  }

  // Demand level mapping
  const DEMAND_WEIGHTS = {
    "close to none": 1,
    low: 2,
    medium: 3,
    high: 4,
    "very high": 5,
    "n/a": 0,
  };

  function calculateSimilarityScore(currentItem, comparisonItem) {
    let score = 0;
    const weights = {
      type: 35, // Type match is very important
      limited: 20, // Limited status is quite important
      valueRange: 25, // Value similarity is important
      demand: 15, // Demand similarity has medium importance
      notes: 5, // Notes similarity has low importance
      tradable: 15, // New weight for tradable status
      hyperchrome: 25, // New weight for HyperChrome matching
    };

    // 1. Type Matching (35 points)
    if (currentItem.type === comparisonItem.type) {
      score += weights.type;

      // Extra points for HyperChrome items
      if (currentItem.type.toLowerCase() === "hyperchrome") {
        score += weights.hyperchrome;

        // Even more points if one is HyperShift
        if (
          currentItem.name === "HyperShift" ||
          comparisonItem.name === "HyperShift"
        ) {
          score += weights.hyperchrome * 0.5; // Additional bonus for HyperShift
        }
      }
    }

    // 2. Limited Status (20 points)
    if (currentItem.is_limited === comparisonItem.is_limited) {
      score += weights.limited;
    }

    // 3. Tradable Status (15 points) - New!
    if (currentItem.tradable === comparisonItem.tradable) {
      score += weights.tradable;
    }

    // 4. Value Range Comparison (25 points)
    const currentValue = parseNumericValue(currentItem.cash_value);
    const comparisonValue = parseNumericValue(comparisonItem.cash_value);

    if (currentValue > 0 && comparisonValue > 0) {
      const valueDifference = Math.abs(currentValue - comparisonValue);
      const valueRatio =
        Math.min(currentValue, comparisonValue) /
        Math.max(currentValue, comparisonValue);

      // Score based on value similarity
      if (valueRatio > 0.9) score += weights.valueRange;
      else if (valueRatio > 0.7) score += weights.valueRange * 0.8;
      else if (valueRatio > 0.5) score += weights.valueRange * 0.6;
      else if (valueRatio > 0.3) score += weights.valueRange * 0.4;
      else if (valueRatio > 0.1) score += weights.valueRange * 0.2;
    }

    // 5. Demand Similarity (15 points)
    const currentDemand =
      DEMAND_WEIGHTS[currentItem.demand?.toLowerCase() || "n/a"];
    const comparisonDemand =
      DEMAND_WEIGHTS[comparisonItem.demand?.toLowerCase() || "n/a"];

    if (currentDemand > 0 && comparisonDemand > 0) {
      const demandDifference = Math.abs(currentDemand - comparisonDemand);
      if (demandDifference === 0) score += weights.demand;
      else if (demandDifference === 1) score += weights.demand * 0.7;
      else if (demandDifference === 2) score += weights.demand * 0.4;
    }

    // 6. Notes Analysis (5 points)
    if (
      currentItem.notes &&
      comparisonItem.notes &&
      currentItem.notes !== "N/A" &&
      comparisonItem.notes !== "N/A"
    ) {
      // Simple text similarity check
      const currentWords = new Set(
        currentItem.notes.toLowerCase().split(/\s+/)
      );
      const comparisonWords = new Set(
        comparisonItem.notes.toLowerCase().split(/\s+/)
      );
      const commonWords = [...currentWords].filter((word) =>
        comparisonWords.has(word)
      );

      if (commonWords.length > 0) {
        score +=
          weights.notes *
          (commonWords.length /
            Math.max(currentWords.size, comparisonWords.size));
      }
    }

    return score;
  }

  function getItemMediaElement(item, options = {}) {
    const {
      containerClass = "",
      imageClass = "",
      showLimitedBadge = true,
      size = "original", // 'original' or '480p'
      aspectRatio = "16/9",
    } = options;

    // Special case for horns
    if (item.type.toLowerCase() === "horn") {
      return `
        <div class="media-container" data-tooltip="Click to play horn sound">
          <div class="horn-player-wrapper" onclick="playHornSound(this)">
            <img src="/assets/audios/horn_thumbnail.webp" 
                 class="${imageClass || "card-img-top"}" 
                 alt="Horn Thumbnail" 
                 style="opacity: 1;">
            <audio class="horn-audio" preload="none">
              <source src="/assets/audios/horns/${
                item.name
              }.mp3" type="audio/mp3">
            </audio>
          </div>
        </div>`;
    }

    // Special case for HyperShift
    if (item.name === "HyperShift" && item.type === "HyperChrome") {
      return `
        <div class="media-container ${containerClass} ${
        item.is_limited && showLimitedBadge ? "limited-item" : ""
      }">
          <video class="${imageClass || "card-img-top"}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 autoplay loop muted playsinline
                 onerror="this.onerror=null; this.style.display='none'; let img=document.createElement('img'); img.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'; img.className=this.className; img.style=this.style; this.parentNode.appendChild(img);">
            <source src="/assets/images/items/hyperchromes/HyperShift.webm" type="video/webm">
            <source src="/assets/images/items/hyperchromes/HyperShift.mp4" type="video/mp4">
          </video>
          ${item.is_limited && showLimitedBadge ? getLimitedBadgeHtml() : ""}
        </div>`;
    }

    // Special case for Gamer TV Set
    if (item.name === "Gamer TV Set" && item.type === "Furniture") {
      return `
        <div class="media-container position-relative ${containerClass}">
          <video class="${imageClass || "card-img-top"}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 autoplay loop muted playsinline>
            <source src="/assets/images/items/furnitures/Gamer TV Set.webm" type="video/webm">
            <source src="/assets/images/items/furnitures/Gamer TV Set.mp4" type="video/mp4">
          </video>
        </div>`;
    }

    // Special case for Drifts
    if (item.type === "Drift") {
      return `
        <div class="media-container position-relative ${containerClass}" style="aspect-ratio: 16/9;">
          <video class="${imageClass || "card-img-top"}" 
                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;" 
                 playsinline 
                 muted 
                 autoplay
                 loop>
            <source src="/assets/images/items/drifts/${
              item.name
            }.webm" type="video/webm">
            <source src="/assets/images/items/drifts/${
              item.name
            }.mp4" type="video/mp4">
          </video>
          ${item.is_limited ? getLimitedBadgeHtml() : ""}
        </div>`;
    }

    // Default case for regular items
    const imagePath =
      size === "480p"
        ? `/assets/images/items/480p/${item.type.toLowerCase()}s/${
            item.name
          }.webp`
        : `/assets/images/items/${item.type.toLowerCase()}s/${item.name}.webp`;

    return `
      <div class="media-container ${containerClass} ${
      item.is_limited && showLimitedBadge ? "limited-item" : ""
    }" 
           style="aspect-ratio: ${aspectRatio};">
        <img src="${imagePath}"
             class="${imageClass || "img-fluid rounded thumbnail"}"
             alt="${item.name}"
             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
             onerror="handleimage(this)">
        ${item.is_limited && showLimitedBadge ? getLimitedBadgeHtml() : ""}
      </div>`;
  }

  function getLimitedBadgeHtml() {
    return `
      <span class="badge limited-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="margin-right: 4px">
          <rect width="24" height="24" fill="none" />
          <path fill="#000" d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z" />
        </svg>
        Limited
      </span>`;
  }

  function displayItemDetails(item) {
    const image_type = item.type.toLowerCase();

    // Define color before using it in badge templates
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

    // Modify the badge HTML generation
    let specialBadgeHtml = "";
    let typeBadgeHtml = "";

    // Change how badges are generated for different types
    if (item.type === "HyperChrome") {
      typeBadgeHtml = `
        <span class="hyperchrome-badge" style="position: static; color: black; margin-left: 12px;">
         HyperChrome
        </span>
      `;
    } else {
      // Only show type badge for non-HyperChrome items
      typeBadgeHtml = `
        <span class="badge" 
              style="background-color: ${color};
                    font-weight: 600;
                    padding: 8px 16px;
                    font-size: 1rem;
                    letter-spacing: 0.5px;
                    border-radius: 20px;">
            ${item.type}
        </span>
      `;

      // Show limited badge if item is limited
      if (item.is_limited) {
        specialBadgeHtml = `
          <span class="badge limited-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="margin-right: 4px">
           <rect width="24" height="24" fill="none" />
           <path fill="#000" d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z" />
         </svg> Limited
          </span>
        `;
      }
    }

    const container = document.getElementById("item-container");

    // Replace the media element generation with getItemMediaElement call
    const mediaElement = getItemMediaElement(item, {
      containerClass: item.is_limited ? "limited-item" : "",
      showLimitedBadge: true,
    });

    const value = formatValue(item.cash_value);
    const duped_value = formatValue(item.duped_value);
    const urlPath = window.location.pathname.split("/");
    const urlType = urlPath[2];
    const formattedUrlType = item.type;

    // Show graph if either value exists
    const hasValues = value !== "-" || duped_value !== "-";

    // Add this function to format duped owners
    function formatDupedOwners(ownersList) {
      if (!ownersList || !Array.isArray(ownersList)) return null;
      // Filter and map to get just the owner names and additional data
      const owners = ownersList
        .filter((entry) => entry && entry.owner && entry.owner.trim())
        .map((entry) => ({
          name: entry.owner.trim(),
          proof: entry.proof,
          userId: entry.user_id,
          created: entry.created_at,
        }));

      return owners.length
        ? {
            count: owners.length,
            list: owners,
          }
        : null;
    }

    setTimeout(() => {
      const mediaContainer = document.querySelector(".media-container");
      const video = mediaContainer.querySelector("video");

      if (video) {
        // Create intersection observer to handle video playback
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Video is visible in viewport
                video
                  .play()
                  .catch((err) => console.log("Video play failed:", err));
              } else {
                // Video is not visible in viewport
                video.pause();
              }
            });
          },
          {
            threshold: 0.5, // Trigger when 50% of the video is visible
          }
        );

        // Start observing the video
        observer.observe(mediaContainer);

        // Handle tab visibility changes
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            video.pause();
          } else {
            const box = mediaContainer.getBoundingClientRect();
            const isVisible = box.top < window.innerHeight && box.bottom > 0;
            if (isVisible) {
              video
                .play()
                .catch((err) => console.log("Video play failed:", err));
            }
          }
        });
      }
    }, 100);

    async function loadSimilarItems(currentItem) {
      try {
        const response = await fetch(
          "https://api3.jailbreakchangelogs.xyz/items/list"
        );
        const items = await response.json();

        // For HyperChrome items, check if we should show HyperShift
        let scoredItems = [];
        if (
          currentItem.type.toLowerCase() === "hyperchrome" &&
          currentItem.name !== "HyperShift"
        ) {
          // Check if it's Level 4 or 5
          const isHighLevel = currentItem.name.match(/Level [45]$/);
          // For lower levels, randomly decide (30% chance)
          const showForLowerLevel = Math.random() < 0.3;

          if (isHighLevel || showForLowerLevel) {
            const hyperShift = items.find(
              (item) =>
                item.name === "HyperShift" &&
                item.type.toLowerCase() === "hyperchrome"
            );
            if (hyperShift) {
              scoredItems.push({
                ...hyperShift,
                similarityScore: 999, // Ensure it appears first
              });
            }
          }
        }

        // Add other items
        const otherItems = items
          .filter(
            (item) =>
              item.id !== currentItem.id &&
              !(
                item.name === "HyperShift" &&
                item.type.toLowerCase() === "hyperchrome"
              )
          )
          .map((item) => ({
            ...item,
            similarityScore: calculateSimilarityScore(currentItem, item),
          }))
          .sort((a, b) => b.similarityScore - a.similarityScore);

        // Combine HyperShift (if added) with top items
        scoredItems = [...scoredItems, ...otherItems].slice(0, 4);

        // Display the similar items
        const container = document.getElementById("similar-items");
        container.innerHTML = ""; // Clear existing items

        scoredItems.forEach((item) => {
          const card = document.createElement("div");
          card.className = "col-lg-3 col-md-3 col-12"; // Changed from col-6 to col-12 for mobile (1 per row)
          card.innerHTML = `
          <a href="/item/${item.type}/${encodeURIComponent(item.name)}" 
            class="text-decoration-none similar-item-card">
            <div class="card h-100">
              <div class="card-img-wrapper position-relative" style="aspect-ratio: 16/9;">
                ${getItemMediaElement(item, {
                  containerClass: "position-relative",
                  imageClass: "card-img-top",
                  showLimitedBadge: true,
                  size: "480p",
                  aspectRatio: "16/9",
                })}
              </div>
              <div class="card-overlay position-absolute bottom-0 start-0 w-100 p-2"
                   style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                <h6 class="card-title mb-1 text-white">${item.name}</h6>
                <small class="text-light">${item.type}</small>
              </div>
            </div>
          </a>
        `;
          container.appendChild(card);
        });
      } catch (error) {
        console.error("Error loading similar items:", error);
      }
    }

    const hasValue = value !== "-" && value !== "N/A";
    const hasDupedValue = duped_value !== "-" && duped_value !== "N/A";
    const hasDemand = item.demand && item.demand !== "N/A";
    const hasNotes = item.notes && item.notes !== "N/A";
    const demandSection = hasDemand
      ? `
    <div class="col-md-6 mt-3">
      <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
      <h4 class="text-muted mb-3 d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" fill="none" />
    <path fill="currentColor" fill-rule="evenodd" d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767L3.404 11.794a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5" />
  </svg>
        Demand
      </h4>
       <p class="h2 mb-0" style="color: #76ABAE; font-weight: 600;">
          ${
            item.demand === "'N/A'" || item.demand === "N/A"
              ? "No Demand"
              : item.demand
          }
        </p>
      </div>
    </div>
    `
      : "";
    function formatPriceValue(price) {
      if (!price || price === "N/A") return "No Price Data";

      // Check if price contains a range (e.g. "100k - 5m")
      if (price.includes("-")) {
        const cashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" style="vertical-align: -0.1em; margin-left: 2px;">
          <rect width="16" height="16" fill="none" />
          <path fill="#76ABAE" d="M16 14H2v-1h13V6h1z" />
          <path fill="#76ABAE" d="M13 4v7H1V4zm1-1H0v9h14z" />
          <path fill="#76ABAE" d="M3 6H2v3h1v1h4a2.5 2.5 0 1 1 0-5H3zm8 0V5H7a2.5 2.5 0 1 1 0 5h4V9h1V6z" />
        </svg>`;

        return price
          .split("-")
          .map((part) => {
            part = part.trim();
            // Parse each part of the range
            if (part.toLowerCase().endsWith("b")) {
              const num =
                parseFloat(part.toLowerCase().replace("b", "")) * 1000000000;
              return `${cashIcon} ${num.toLocaleString()}`;
            }
            if (part.toLowerCase().endsWith("k")) {
              const num =
                parseFloat(part.toLowerCase().replace("k", "")) * 1000;
              return `${cashIcon} ${num.toLocaleString()}`;
            }
            if (part.toLowerCase().endsWith("m")) {
              const num =
                parseFloat(part.toLowerCase().replace("m", "")) * 1000000;
              return `${cashIcon} ${num.toLocaleString()}`;
            }
            return `${cashIcon} ${parseFloat(part).toLocaleString()}`;
          })
          .join(" - ");
      }

      // Handle combined "Free / X Robux" format
      if (price.includes("/")) {
        const [free, robuxPart] = price.split("/").map((part) => part.trim());
        // If first part is "Free" and second part contains Robux
        if (
          free.toLowerCase() === "free" &&
          robuxPart.toLowerCase().includes("robux")
        ) {
          const numericValue = robuxPart.replace(/[^0-9]/g, "");
          return `Free / <img src="/assets/Robux.png" alt="Robux" style="height: 1em; vertical-align: -0.1em; margin-left: 2px;"> ${numericValue}`;
        }
      }

      // Handle regular prices (non-ranges)
      if (typeof price === "string") {
        // Check for Robux values
        if (price.toLowerCase().includes("robux")) {
          const numericValue = price.replace(/[^0-9]/g, "");
          return `<img src="/assets/Robux.png" alt="Robux" style="height: 1em; vertical-align: -0.1em; margin-left: 2px;"> ${numericValue}`;
        }

        // Handle b/k/m suffixes
        const lowerPrice = price.toLowerCase();
        if (lowerPrice.endsWith("b")) {
          const baseNumber =
            parseFloat(lowerPrice.replace("b", "")) * 1000000000;
          return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" style="vertical-align: -0.1em; margin-left: 2px;">
        <rect width="16" height="16" fill="none" />
        <path fill="#76ABAE" d="M16 14H2v-1h13V6h1z" />
        <path fill="#76ABAE" d="M13 4v7H1V4zm1-1H0v9h14z" />
        <path fill="#76ABAE" d="M3 6H2v3h1v1h4a2.5 2.5 0 1 1 0-5H3zm8 0V5H7a2.5 2.5 0 1 1 0 5h4V9h1V6z" />
        </svg> ${baseNumber.toLocaleString()}`;
        }
        if (lowerPrice.endsWith("k")) {
          const baseNumber = parseFloat(lowerPrice.replace("k", "")) * 1000;
          return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" style="vertical-align: -0.1em; margin-left: 2px;">
        <rect width="16" height="16" fill="none" />
        <path fill="#76ABAE" d="M16 14H2v-1h13V6h1z" />
        <path fill="#76ABAE" d="M13 4v7H1V4zm1-1H0v9h14z" />
        <path fill="#76ABAE" d="M3 6H2v3h1v1h4a2.5 2.5 0 1 1 0-5H3zm8 0V5H7a2.5 2.5 0 1 1 0 5h4V9h1V6z" />
        </svg> ${baseNumber.toLocaleString()}`;
        }
        if (lowerPrice.endsWith("m")) {
          const baseNumber = parseFloat(lowerPrice.replace("m", "")) * 1000000;
          return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" style="vertical-align: -0.1em; margin-left: 2px;">
        <rect width="16" height="16" fill="none" />
        <path fill="#76ABAE" d="M16 14H2v-1h13V6h1z" />
        <path fill="#76ABAE" d="M13 4v7H1V4zm1-1H0v9h14z" />
        <path fill="#76ABAE" d="M3 6H2v3h1v1h4a2.5 2.5 0 1 1 0-5H3zm8 0V5H7a2.5 2.5 0 1 1 0 5h4V9h1V6z" />
        </svg> ${baseNumber.toLocaleString()}`;
        }
      }

      // Handle numeric values
      const numericValue = parseFloat(price.toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(numericValue) && numericValue > 1) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" style="vertical-align: -0.1em; margin-left: 2px;">
      <rect width="24" height="24" fill="none"/>
      <path fill="#76ABAE" d="M3 6h18v12H3zm9 3a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3M7 8a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/>
    </svg> ${numericValue.toLocaleString()}`;
      }

      return price;
    }
    const priceSection =
      item.type.toLowerCase() === "vehicle"
        ? `
    <div class="col-md-6 mt-3">
      <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
        <h4 class="text-muted mb-3 d-flex align-items-center">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M21.52 11.615a3.3 3.3 0 0 0-.76-1l-7-7a4.56 4.56 0 0 0-3.25-1.35H5.59a3.31 3.31 0 0 0-3.32 3.31v4.92a4.58 4.58 0 0 0 1.35 3.26l7 7a3.3 3.3 0 0 0 1.08.72c.401.171.833.26 1.27.26a3.33 3.33 0 0 0 2.34-1l2.73-2.72l2.72-2.72a3.3 3.3 0 0 0 .72-1.08a3.35 3.35 0 0 0 0-2.54zm-12.37.28a2.87 2.87 0 1 1 2.87-2.87a2.88 2.88 0 0 1-2.87 2.9z" />
</svg>
          Original Price
        </h4>
        <p class="h2 mb-0" style="color: #76ABAE; font-weight: 600;">
          ${formatPriceValue(item.price)}
        </p>
      </div>
    </div>
    `
        : "";

    // Health section for vehicles
    const healthSection =
      item.type.toLowerCase() === "vehicle"
        ? `
<div class="col-md-6 mt-3">
  <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
    <h4 class="text-muted mb-3 d-flex align-items-center">
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M19 14v3h3v2h-3v3h-2v-3h-3v-2h3v-3zm1.243-9.243a6 6 0 0 1 .507 7.91a6 6 0 0 0-8.06 8.127l-.69.691l-8.479-8.492a6 6 0 0 1 8.48-8.464a6 6 0 0 1 8.242.228" />
</svg>
      Vehicle Health
    </h4>
    <p class="h2 mb-0" style="color: #76ABAE; font-weight: 600;">
      ${item.health ? item.health : "No Health Data"}
    </p>
    <small class="text-muted mt-2 d-block">
      If any data for health is incorrect dm 
      <a href="https://discord.com/users/1123014543891775509" 
        target="_blank" 
        rel="noopener noreferrer"
        style="color: #76ABAE;">
        @PikachuWolverine
      </a> 
      on discord.
    </small>
  </div>
</div>
`
        : "";

    const notesSection = hasNotes
      ? `
      <div class="col-md-6 mt-3">
        <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
          <h4 class="text-muted mb-3 d-flex align-items-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<g fill="currentColor">
		<path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
		<path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
		<path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
	</g>
</svg>
            Notes
          </h4>
          <p class="h5 mb-0" style="color: #76ABAE; font-weight: 500; line-height: 1.4;">
            ${item.notes}
          </p>
        </div>
      </div>
    `
      : "";
    const dupedOwners = formatDupedOwners(item.duped_owners);
    const valuesSection = `
    <div class="values-section border-top border-bottom py-4 my-4">
      <div class="row g-4">
        ${
          item.last_updated
            ? `
          <div class="col-12">
            <div class="d-flex align-items-center">
              <small class="text-muted">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<g fill="currentColor">
		<path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
		<path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
		<path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
	</g>
</svg>
                Last updated: ${formatTimeAgo(item.last_updated)}
              </small>
            </div>
          </div>
        `
            : `
          <div class="col-12">
            <div class="d-flex align-items-center">
              <small class="text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<g fill="currentColor">
		<path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
		<path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
		<path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
	</g>
</svg>
                Last updated: N/A
              </small>
            </div>
          </div>
        `
        }
        
       <!-- Cash Value Card -->
      <div class="col-md-6">
        <div class="value-card p-4 rounded-3" style="background-color: rgba(24, 101, 131, 0.1); border: 1px solid rgba(24, 101, 131, 0.2);">
          <h4 class="text-muted mb-3 d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<g fill="currentColor">
		<path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1zm7 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4" />
		<path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z" />
	</g>
</svg>
            Cash Value
          </h4>
          <p class="h2 mb-0" style="color: rgb(29, 125, 163); font-weight: 600;">
            ${hasValue ? value : "No Cash Value"}
          </p>
        </div>
      </div>
    
        <!-- Duped Value Card with Owners -->
        <div class="col-md-6">
          <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
            <h4 class="text-muted mb-3 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" fill-rule="evenodd" d="M0 0h1v15h15v1H0zm10 11.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-1 0v2.6l-3.613-4.417a.5.5 0 0 0-.74-.037L7.06 8.233L3.404 3.206a.5.5 0 0 0-.808.588l4 5.5a.5.5 0 0 0 .758.06l2.609-2.61L13.445 11H10.5a.5.5 0 0 0-.5.5" />
</svg>
              Duped Value
            </h4>
            <p class="h2 mb-0" style="color: #748D92; font-weight: 600;">
              ${hasDupedValue ? duped_value : "No Duped Value"}
            </p>
            ${
              dupedOwners
                ? `
              <div class="mt-3 pt-3 border-top">
                <button class="btn btn-link text-decoration-none p-0 d-flex align-items-center" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#dupedOwnersList" 
                        aria-expanded="false" aria-controls="dupedOwnersList" 
                        style="color: #748d92;">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
	<rect width="48" height="48" fill="none" />
	<path fill="currentColor" d="M16 24a8 8 0 1 0 0-16a8 8 0 0 0 0 16m18 0a6 6 0 1 0 0-12a6 6 0 0 0 0 12M6.75 27A3.75 3.75 0 0 0 3 30.75V32s0 9 13 9s13-9 13-9v-1.25A3.75 3.75 0 0 0 25.25 27zm21.924 11.089c1.376.558 3.119.911 5.325.911c10.5 0 10.5-8 10.5-8v-.25A3.75 3.75 0 0 0 40.75 27H29.607a5.73 5.73 0 0 1 1.391 3.75v1.295l-.001.057l-.006.15q-.008.173-.035.43a10 10 0 0 1-.24 1.325a10.7 10.7 0 0 1-2.042 4.082" />
</svg>
                  <span class="duped-owners-count">${
                    dupedOwners.count
                  } Known Duped Owner${
                    dupedOwners.count !== 1 ? "s" : ""
                  }</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 12 12" class="toggle-icon ms-2" style="transition: transform 0.2s ease">
                    <rect width="12" height="12" fill="none" />
                    <path fill="#748d92" d="M2.22 7.53a.75.75 0 0 0 1.06 0L6 4.81l2.72 2.72a.75.75 0 0 0 1.06-1.06L6.53 3.22a.75.75 0 0 0-1.06 0L2.22 6.47a.75.75 0 0 0 0 1.06" />
                  </svg>
                </button>
                <div class="collapse mt-3" id="dupedOwnersList">
                  <div class="duped-owners-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
                    ${dupedOwners.list
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(
                        (owner) => `
                      <a href="/dupes/calculator?duper=${encodeURIComponent(
                        owner.name
                      )}&itemId=${encodeURIComponent(item.id)}"
                         class="duped-owner-item p-2 rounded" 
                         style="
                           background-color: rgba(18, 78, 102, 0.2);
                           font-size: 0.9rem;
                           color: #d3d9d4;
                           overflow: hidden;
                           text-overflow: ellipsis;
                           white-space: nowrap;
                           text-decoration: none;
                           transition: background-color 0.2s ease, color 0.2s ease;
                         "
                         onmouseover="this.style.backgroundColor='rgba(18, 78, 102, 0.4)'; this.style.color='#ffffff';"
                         onmouseout="this.style.backgroundColor='rgba(18, 78, 102, 0.2)'; this.style.color='#d3d9d4';">
                        ${owner.name}
                      </a>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
        
        <!-- Demand Card -->
        <div class="col-md-6 mt-3">
          <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
            <h4 class="text-muted mb-3 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14">
	<rect width="14" height="14" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1">
		<path d="M9.5 3.5h4v4" />
		<path d="M13.5 3.5L7.85 9.15a.5.5 0 0 1-.7 0l-2.3-2.3a.5.5 0 0 0-.7 0L.5 10.5" />
	</g>
</svg>
              Demand
            </h4>
            <p class="h2 mb-0" style="color: #76ABAE; font-weight: 600;">
              ${hasDemand ? item.demand : "No Demand"}
            </p>
          </div>
        </div>
    
        <!-- Notes Card -->
        <div class="col-md-6 mt-3">
          <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
            <h4 class="text-muted mb-3 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<g fill="currentColor">
		<path d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
		<path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
		<path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
	</g>
</svg>
              Notes
            </h4>
            <p class="h5 mb-0" style="color: #76ABAE; font-weight: 500; line-height: 1.4;">
              ${hasNotes ? item.notes : "No Notes"}
            </p>
          </div>
        </div>
         <!-- Price Card (vehicles only) -->
      ${priceSection}
  
      <!-- Health Card (vehicles only) -->
      ${healthSection}
      </div>
    </div>
  `;

    // Determine if we should show the graph
    const graphSection = hasValues
      ? `
      <!-- Combined Graph Section -->
      <div class="row mb-4" style="padding-top: 40px;">
        <div class="col-12">
          <div class="card chart-container">
            <div class="card-body">
              <div class="chart-wrapper">
                <div id="combinedChart"></div>
              </div>
              <button id="fullscreen" class="btn btn-secondary mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1-.5-.5zm-9.5 9a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
                </svg>
                Toggle Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>`
      : `
      <!-- No Values Message -->
      <div class="row mb-4" style="padding-top: 40px;">
        <div class="col-12">
          <div class="card chart-container">
            <div class="card-body text-center py-5">
              <h3 style="color: #748d92; font-family: 'Luckiest Guy', cursive;">No values available to generate graph</h3>
              <p class="text-muted">This item currently has no recorded values</p>
            </div>
          </div>
        </div>
      </div>
      `;

    container.innerHTML = `
           <div class="container-fluid mt-1">
              <div class="media-container-wrapper">
                  <!-- Main Item Info Section -->
                  <div class="row mb-4">
                     <!-- Left Side - Image and Health -->
                    <div class="col-md-5 p-3">
                      <div class="d-flex flex-column gap-3">
                        ${mediaElement}
                      </div>
                    </div>
  
                      <!-- Right Side - Item Details -->
                      <div class="col-md-7 p-3">
                          <!-- Item Title and Badge Container -->
                          <div class="item-header d-flex align-items-center mb-2">
                             <h1 class="mb-1 me-3 h2" style="font-weight: 600; font-family: 'Luckiest Guy', cursive; letter-spacing: 1px;">${
                               item.name
                             }</h1>
                              <div class="badge-container d-flex align-items-center gap-2">
                                  ${
                                    item.type === "HyperChrome"
                                      ? `<span class="hyperchrome-badge">HyperChrome</span>`
                                      : `<span class="badge" style="background-color: ${color};">${item.type}</span>`
                                  }
                                  ${
                                    item.tradable === 0
                                      ? `<span class="badge" style="background-color: #dc3545;">Not Tradable</span>`
                                      : ""
                                  }
                                  <span class="badge favorites-badge" style="background-color: #ffea005f; display: flex; align-items: center; gap: 4px;">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512">
                                      <rect width="512" height="512" fill="none" />
                                      <path fill="#ffb636" d="m252.5 381l-128 49c-5.9 2.2-12.1-2.3-11.8-8.6l7-136.9c.1-2.1-.6-4.2-1.9-5.9L31.6 172c-4-4.9-1.6-12.2 4.5-13.9l132.4-35.6c2.1-.6 3.9-1.9 5-3.7L248.3 4c3.4-5.3 11.2-5.3 14.6 0l74.8 114.9c1.2 1.8 3 3.1 5 3.7l132.4 35.6c6.1 1.6 8.5 9 4.5 13.9l-86.1 106.6c-1.3 1.7-2 3.8-1.9 5.9l7 136.9c.3 6.3-5.9 10.8-11.8 8.6l-128-49c-2.1-.8-4.3-.8-6.3-.1" />
                                      <path fill="#ffd469" d="m456.1 51.7l-41-41c-1.2-1.2-2.8-1.7-4.4-1.5s-3.1 1.2-3.9 2.6l-42.3 83.3c-1.2 2.1-.8 4.6.9 6.3c1 1 2.4 1.5 3.7 1.5c.9 0 1.8-.2 2.6-.7L454.9 60c1.4-.8 2.4-2.2 2.6-3.9c.3-1.6-.3-3.2-1.4-4.4" />
                                    </svg>
                                    <span id="favorites-count">0</span>
                                  </span>
                              </div>
                          </div>
                           ${
                             item.creator && item.creator !== "N/A"
                               ? `<div class="mt-0 mb-3">
        <span style="color: var(--text-muted);">Created by </span>
        ${
          item.creator.match(/\((\d+)\)/)
            ? `<a href="https://www.roblox.com/users/${
                item.creator.match(/\((\d+)\)/)[1]
              }/profile" 
              target="_blank" 
              rel="noopener noreferrer"
              style="color: var(--text-primary); text-decoration: none; border-bottom: 1px dotted var(--text-primary);"
              onmouseover="this.style.color='var(--accent-color-light)'"
              onmouseout="this.style.color='var(--text-primary)'">${
                item.creator.split(" (")[0]
              }</a>`
            : `<a href="#" 
              style="color: var(--text-primary); text-decoration: none; border-bottom: 1px dotted var(--text-primary);"
              onclick="return false;">${item.creator}</a>`
        }
      </div>`
                               : ""
                           }
                         
                           ${
                             item.description && item.description !== "N/A"
                               ? `<div class="item-description collapsed">
                                    ${item.description}
                                    <div class="read-more-fade"></div>
                                  </div>
                                  <button class="read-more-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z"/></svg>Read More
                                  </button>`
                               : ""
                           }
                          <!-- Values Section -->
                          ${valuesSection}
  
                          <div class="values-text d-flex flex-column align-items-start mt-3">
                            <strong class="mb-2">Want to make a value suggestion for ${
                              item.name
                            }?</strong>
                            <button
                              onclick="window.open('https://discord.com/invite/jailbreaktrading', '_blank', 'noopener,noreferrer')"
                              class="discord-button"
                            >
                              Visit Jailbreak Trading Core!
                            </button>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
        
            ${graphSection}`;

    // Initialize description toggle after DOM update
    setTimeout(() => {
      initializeDescriptionToggle();
    }, 100);

    // First, check if the item exists before initializing comments
    if (window.commentsManagerInstance) {
      // Clear existing comments
      window.commentsManagerInstance.clearComments();

      // Only proceed if item exists and has valid properties
      if (item && item.id && item.type) {
        window.commentsManagerInstance.type = item.type.toLowerCase();
        window.commentsManagerInstance.itemId = item.id;
        window.commentsManagerInstance.itemName = item.name;
        window.commentsManagerInstance.loadComments();
      } else {
        // Hide comments section if item doesn't exist
        const commentsSection = document.querySelector("comment-container");
        if (commentsSection) {
          commentsSection.style.display = "none";
        }
      }
    } else {
      // Only create new instance if item exists and has valid properties
      if (item && item.id && item.type) {
        window.commentsManagerInstance = new CommentsManager(
          item.type.toLowerCase(),
          item.id,
          item.name
        );
        window.commentsManagerInstance.loadComments();
      } else {
        // Hide comments section if item doesn't exist
        const commentsSection = document.querySelector("comment-container");
        if (commentsSection) {
          commentsSection.style.display = "none";
        }
      }
    }

    // Modify the fetch and error handling for the chart
    if (hasValues) {
      setTimeout(() => {
        // Initialize chart container first
        const chartContainer = document.querySelector(".chart-container");

        fetch(`https://api3.jailbreakchangelogs.xyz/item/history?id=${item.id}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("No history found");
            }
            return response.json();
          })
          .then((data) => {
            // Only show chart if we have valid data
            if (data && data.length > 0) {
              // Initialize Highcharts and show data
              const chart = Highcharts.stockChart("combinedChart", {
                chart: {
                  type: "spline",
                  backgroundColor: "transparent",
                  style: {
                    fontFamily:
                      '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  },
                },
                rangeSelector: {
                  buttons: [
                    {
                      type: "week",
                      count: 1,
                      text: "1w",
                    },
                    {
                      type: "month",
                      count: 1,
                      text: "1m",
                    },
                    {
                      type: "month",
                      count: 6,
                      text: "6m",
                    },
                    {
                      type: "year",
                      count: 1,
                      text: "1y",
                    },
                    {
                      type: "all",
                      text: "All",
                    },
                  ],
                  selected: 1, // Default to 1 month view
                  buttonTheme: {
                    fill: "#124e66",
                    stroke: "#124e66",
                    style: {
                      color: "#d3d9d4",
                    },
                    states: {
                      hover: {
                        fill: "#1d7da3",
                        stroke: "#1d7da3",
                        style: {
                          color: "#ffffff",
                        },
                      },
                      select: {
                        fill: "#1d7da3",
                        stroke: "#1d7da3",
                        style: {
                          color: "#ffffff",
                        },
                      },
                      disabled: {
                        fill: "#2e3944",
                        stroke: "#2e3944",
                        style: {
                          color: "#748d92",
                          cursor: "not-allowed",
                        },
                      },
                    },
                  },
                  inputStyle: {
                    color: "#d3d9d4",
                    backgroundColor: "#2e3944",
                  },
                  labelStyle: {
                    color: "#d3d9d4",
                  },
                },
                navigator: {
                  enabled: false,
                  series: [
                    {
                      color: "#1d7da3", // Cash value - inside color
                      lineWidth: 2,
                      fillOpacity: 0.3, // More visible fill
                      type: "areaspline",
                    },
                    {
                      color: "#748d92", // Duped value - inside color
                      lineWidth: 2,
                      fillOpacity: 0.3,
                      type: "areaspline",
                    },
                  ],
                  height: 60,
                  maskFill: "rgba(46, 57, 68, 0.6)", // Using bg-secondary with opacity
                  maskInside: true,
                  outlineColor: "#2e3944", // Using bg-secondary for outline
                  outlineWidth: 1,
                  xAxis: {
                    labels: {
                      style: {
                        color: "#d3d9d4",
                      },
                    },
                    gridLineColor: "rgba(211, 217, 212, 0.1)",
                  },
                  handles: {
                    backgroundColor: "#2e3944", // Using bg-secondary
                    borderColor: "#1d7da3", // accent-color-light
                    borderWidth: 2,
                    height: 20,
                    width: 10,
                  },
                },
                scrollbar: {
                  enabled: false,
                },
                title: {
                  text: `Value History for ${item.name}`,
                  style: {
                    color: "#D3D9D4",
                    fontWeight: "bold",
                    fontFamily: '"Luckiest Guy", cursive',
                    letterSpacing: "1px",
                    fontSize: window.innerWidth < 768 ? "18px" : "24px",
                  },
                },
                credits: {
                  enabled: false,
                },
                tooltip: {
                  shared: true,
                  split: false,
                  backgroundColor: "#2e3944",
                  borderColor: "#124e66",
                  borderRadius: 8,
                  style: {
                    color: "#d3d9d4",
                  },
                  formatter: function () {
                    // Convert milliseconds to local date string using user's timezone
                    const localDate = new Date(this.x).toLocaleString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      }
                    );

                    let s = `<b>${localDate}</b><br/>`;

                    this.points.forEach(function (point) {
                      s += `<span style="color: ${point.series.color}">${
                        point.series.name
                      }: ${point.y.toLocaleString()}</span><br/>`;
                    });

                    return s;
                  },
                },
                xAxis: {
                  type: "datetime",
                  labels: {
                    style: {
                      color: "#D3D9D4",
                    },
                    format: "{value:%b %d}", // Remove year from axis labels
                  },
                  lineColor: "#2E3944",
                  tickColor: "#2E3944",
                  gridLineColor: "rgba(211, 217, 212, 0.1)",
                  gridLineWidth: 1,
                },
                yAxis: {
                  opposite: false,
                  title: {
                    text: "Value",
                    style: {
                      color: "#D3D9D4",
                    },
                  },
                  min: 0, // Force axis to start at 0
                  tickAmount: 10, // Show 10 ticks
                  labels: {
                    style: {
                      color: "#D3D9D4",
                    },
                    formatter: function () {
                      if (this.value >= 1000000) {
                        return (this.value / 1000000).toFixed(1) + "M";
                      } else if (this.value >= 1000) {
                        return (this.value / 1000).toFixed(1) + "K";
                      }
                      return this.value;
                    },
                  },
                  gridLineColor: "rgba(211, 217, 212, 0.1)",
                  gridLineWidth: 1,
                  startOnTick: true, // Ensure it starts at the min value
                  endOnTick: true, // Ensure it ends at a nice rounded value
                  alignTicks: true, // Align ticks with grid lines
                },
                legend: {
                  enabled: true,
                  itemStyle: {
                    color: "#D3D9D4",
                  },
                  itemHoverStyle: {
                    color: "#ffffff",
                  },
                },
                plotOptions: {
                  series: {
                    showInNavigator: true,
                    animation: {
                      duration: 1000,
                    },
                    marker: {
                      enabled: false,
                      states: {
                        hover: {
                          enabled: true,
                        },
                      },
                    },
                    dataLabels: {
                      style: {
                        backgroundColor: "#212a31",
                      },
                    },
                  },
                },
                labels: {
                  style: {
                    backgroundColor: "#212a31",
                  },
                },
                loading: {
                  labelStyle: {
                    backgroundColor: "transparent",
                    color: "#D3D9D4",
                    fontFamily: '"Luckiest Guy", cursive',
                    fontSize: "18px",
                  },
                  style: {
                    backgroundColor: "rgba(33, 42, 49, 0.8)", // Semi-transparent dark background
                  },
                },
                series: [
                  {
                    name: "Cash Value",
                    data: [],
                    color: "rgb(29, 125, 163)",
                    lineWidth: 2,
                  },
                  {
                    name: "Duped Value",
                    data: [],
                    color: "#748D92",
                    lineWidth: 2,
                  },
                ],
                exporting: {
                  buttons: {
                    contextButton: {
                      menuItems: ["viewFullscreen"],
                    },
                  },
                },
              });
              // Add styles for the fullscreen button icon
              const style = document.createElement("style");
              style.textContent = `
                #fullscreen svg {
                  margin-right: 6px;
                  vertical-align: -2px;
                }
              `;
              document.head.appendChild(style);

              // Show loading state immediately after chart initialization
              chart.showLoading("Loading data...");

              // Add fullscreen click handler
              let isInFullscreen = false;

              document
                .getElementById("fullscreen")
                .addEventListener("click", function () {
                  const isEnteringFullscreen = !chart.fullscreen.isOpen;

                  // Toggle fullscreen first
                  chart.fullscreen.toggle();

                  // Then update navigator
                  setTimeout(() => {
                    chart.update({
                      navigator: {
                        enabled: isEnteringFullscreen,
                      },
                    });

                    if (isEnteringFullscreen) {
                      // Update navigator data only when entering fullscreen
                      chart.navigator.series[0].setData(
                        chart.series[0].options.data
                      );
                    }
                  }, 100);
                });

              // Add fullscreen exit handler
              Highcharts.addEvent(chart, "fullscreenExit", function () {
                // Ensure navigator is disabled on fullscreen exit
                chart.update({
                  navigator: {
                    enabled: false,
                  },
                });
              });

              // Add document-level fullscreen change listener
              document.addEventListener("fullscreenchange", function () {
                if (!document.fullscreenElement) {
                  // Extra safety - ensure navigator is hidden when exiting fullscreen via Escape key
                  chart.update({
                    navigator: {
                      enabled: false,
                    },
                  });
                }
              });

              // Fetch data
              fetch(
                `https://api3.jailbreakchangelogs.xyz/item/history?id=${item.id}`
              )
                .then((response) => response.json())
                .then((data) => {
                  const chartData = data.map((item) => ({
                    x: item.date * 1000,
                    y: formatChartValue(item.cash_value),
                  }));

                  const dupedChartData = data.map((item) => ({
                    x: item.date * 1000,
                    y: formatChartValue(item.duped_value),
                  }));

                  // Update main series data
                  chart.series[0].setData(chartData);
                  chart.series[1].setData(
                    dupedChartData.some((point) => point.y > 0)
                      ? dupedChartData
                      : []
                  );

                  // Move the button state logic here, after data is loaded
                  if (chartData.length > 0) {
                    const firstDate = chartData[0].x;
                    const lastDate = chartData[chartData.length - 1].x;
                    const dataRangeInMs = lastDate - firstDate;

                    const intervals = {
                      week: 7 * 24 * 60 * 60 * 1000,
                      month: 30 * 24 * 60 * 60 * 1000,
                      sixMonth: 180 * 24 * 60 * 60 * 1000,
                      year: 365 * 24 * 60 * 60 * 1000,
                    };

                    chart.rangeSelector.buttons.forEach((button, index) => {
                      let shouldDisable = false;

                      switch (index) {
                        case 0: // 1w
                          shouldDisable = dataRangeInMs < intervals.week;
                          break;
                        case 1: // 1m
                          shouldDisable = dataRangeInMs < intervals.month;
                          break;
                        case 2: // 6m
                          shouldDisable = dataRangeInMs < intervals.sixMonth;
                          break;
                        case 3: // 1y
                          shouldDisable = dataRangeInMs < intervals.year;
                          break;
                      }

                      if (shouldDisable) {
                        button.setState(2); // Disable button
                        button.element.style.cursor = "not-allowed";
                      }
                    });
                  }

                  // Hide loading state
                  chart.hideLoading();
                })
                .catch((error) => {
                  console.error("Error fetching data:", error);
                  chart.showLoading("Error loading data");
                });

              // Add resize handler for responsive title
              window.addEventListener("resize", () => {
                chart.setTitle({
                  text: chart.title.textStr,
                  style: {
                    ...chart.title.style,
                    fontSize: window.innerWidth < 768 ? "18px" : "24px",
                  },
                });
              });
            } else {
              throw new Error("No history data");
            }
          })
          .catch((error) => {
            // Replace chart container with "no values" message
            chartContainer.innerHTML = `
              <div class="card-body text-center py-5">
                <h3 style="color: #748d92; font-family: 'Luckiest Guy', cursive;">No values available to generate graph</h3>
                <p class="text-muted">This item currently has no recorded values</p>
              </div>
            `;
          });
      }, 100);
    }

    loadSimilarItems(item);

    function formatFavoritesCount(count) {
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + "M";
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + "K";
      }
      return count.toString();
    }

    // Fetch favorites count
    fetch(`https://api3.jailbreakchangelogs.xyz/item/favorites?id=${item.id}`)
      .then((response) => response.json())
      .then((count) => {
        const favoritesCount = document.getElementById("favorites-count");
        if (favoritesCount) {
          favoritesCount.textContent = formatFavoritesCount(count);
        }
      })
      .catch((error) => console.error("Error fetching favorites:", error));
  }

  function showErrorMessage(message) {
    hideLoadingOverlay();

    const urlPath = window.location.pathname.split("/");
    const itemType = urlPath[2];
    const rawItemName = urlPath.pop();
    const searchName = decodeURIComponent(rawItemName)
      .trim()
      .replace(/\s+/g, " ");

    // Hide comments section
    const commentsSection = document.querySelector(".comment-container");
    if (commentsSection) {
      commentsSection.style.display = "none";
    }

    if (window.commentsManagerInstance) {
      window.commentsManagerInstance = null;
    }

    const container = document.getElementById("item-container");
    // Check if category is valid
    const isValidCategory = VALID_SORTS.some(
      (category) => category.toLowerCase() === itemType.toLowerCase()
    );
    // Hide similar items section if category is invalid
    const similarItemsSection = document.querySelector(
      ".similar-items-section"
    );
    if (similarItemsSection) {
      similarItemsSection.style.display = "none"; // Hide the entire section
    }

    container.innerHTML = `
    <div class="container mt-5">
      <div class="alert alert-danger text-center" role="alert">
        <div class="mb-3">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2a1 1 0 0 0 0-2" />
</svg>
        </div>
        <h4 class="alert-heading mb-3">Item Not Found</h4>
        <p>${
          isValidCategory
            ? `"${searchName}" is not a valid ${itemType}`
            : `Invalid category "${itemType}"`
        }</p>
        <div class="mt-4 d-flex flex-column flex-md-row gap-3 justify-content-center">
          ${
            isValidCategory
              ? `<a href="/values?sort=${itemType}s&valueSort=cash-desc" 
                class="btn btn-outline-primary"
                style="border-color: var(--accent-color-light); color: var(--accent-color-light);"
                onmouseover="this.style.backgroundColor='var(--accent-color)'; this.style.color='var(--text-primary)';"
                onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--accent-color-light)';">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20">
	<rect width="20" height="20" fill="none" />
	<path fill="currentColor" fill-rule="evenodd" d="M4.5 4.5v4h4v-4zm-.5-1a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5zm7.5 1v4h4v-4zm-.5-1a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5zm-6.5 8v4h4v-4zm-.5-1a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5zm7.5 1v4h4v-4zm-.5-1a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5z" clip-rule="evenodd" />
</svg> Browse Other ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s
            </a>`
              : ""
          }
          <a href="/values" 
             class="btn btn-outline-primary"
             style="border-color: var(--accent-color-light); color: var(--accent-color-light);"
             onmouseover="this.style.backgroundColor='var(--accent-color)'; this.style.color='var(--text-primary)';"
             onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--accent-color-light)';">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
		<path stroke-dasharray="20" stroke-dashoffset="20" d="M21 12h-17.5">
			<animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="20;0" />
		</path>
		<path stroke-dasharray="12" stroke-dashoffset="12" d="M3 12l7 7M3 12l7 -7">
			<animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.2s" values="12;0" />
		</path>
	</g>
</svg> Back to All Items
          </a>
        </div>
      </div>
      ${
        isValidCategory
          ? `
        <!-- Similar Items Section -->
        <div class="mt-4">
          <h5 class="text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
	<rect width="48" height="48" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
		<path d="M21 38c9.389 0 17-7.611 17-17S30.389 4 21 4S4 11.611 4 21s7.611 17 17 17Z" />
		<path stroke-linecap="round" d="M26.657 14.343A7.98 7.98 0 0 0 21 12a7.98 7.98 0 0 0-5.657 2.343m17.879 18.879l8.485 8.485" />
	</g>
</svg> Did you mean?
          </h5>
          <div id="similar-items" class="row g-3">
            <style>
              @media (max-width: 768px) {
                .card-title {
                  font-size: 0.9rem !important;
                }
                .card-overlay h6 {
                  font-size: 0.85rem !important;
                }
                .card-overlay small {
                  font-size: 0.75rem !important;
                }
              }
            </style>
            <div class="col-12 text-center text-muted">
              <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              Looking for similar items...
            </div>
          </div>
        </div>
      `
          : ""
      }
    </div>`;

    // Only load similar items if category is valid
    if (isValidCategory) {
      loadSimilarItemsByName(searchName);
    }
  }

  // Update handleimage function to skip HyperShift
  window.handleimage = function (element) {
    const isHyperShift =
      element.id === "hypershift-video" ||
      (element.alt === "HyperShift" &&
        element.closest(".media-container").querySelector("video"));

    if (isHyperShift) {
      return; // Don't replace HyperShift video with placeholder
    }
    element.src =
      "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat";
  };

  await loadItemDetails();
});

// Add horn player functionality
window.playHornSound = function (wrapper) {
  const audio = wrapper.querySelector(".horn-audio");
  const allAudios = document.querySelectorAll(".horn-audio");

  // Stop all other playing horns first
  allAudios.forEach((a) => {
    if (a !== audio) {
      a.pause();
      a.currentTime = 0;
    }
  });

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
    audio.currentTime = 0;
  }
};

function formatDate(timestamp) {
  // Convert Unix timestamp to milliseconds and create a Date object
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatChartDate(timestamp) {
  // Convert Unix timestamp to milliseconds and create a Date object
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function handleinvalidImage() {
  setTimeout(() => {
    const userId = this.id.replace("avatar-", "");
    const username = this.closest("li").querySelector("a").textContent;
    this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;
  }, 0);
}

function initializeDescriptionToggle() {
  const description = document.querySelector(".item-description");
  const readMoreBtn = document.querySelector(".read-more-btn");

  if (description && readMoreBtn) {
    // Check if we need the read more button
    const needsReadMore = description.scrollHeight > 80;

    if (!needsReadMore) {
      readMoreBtn.style.display = "none";
      description.classList.remove("collapsed");
      description.classList.add("expanded");
      return;
    }

    // Make sure button is visible and description is collapsed initially
    readMoreBtn.style.display = "flex";
    description.classList.add("collapsed");
    description.classList.remove("expanded");
    readMoreBtn.addEventListener("click", () => {
      const isCollapsed = description.classList.contains("collapsed");
      description.classList.toggle("collapsed");
      description.classList.toggle("expanded");
      readMoreBtn.innerHTML = isCollapsed
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6l-6 6z"/></svg>Show Less'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z"/></svg>Read More';
    });
  }
}

function handleUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("comments")) {
    // Find and click the comments tab
    const commentsTab = document.querySelector("#comments-tab");
    if (commentsTab) {
      commentsTab.click();
    }
    // Clean up URL
    const url = window.location.pathname;
    window.history.replaceState({}, "", url);
  }
}

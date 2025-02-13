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
            <div class="card-img-wrapper position-relative h-100">
              <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; height: 100%;">
                ${
                  item.name === "HyperShift" && item.type === "HyperChrome"
                    ? `
                    <img 
                      src="/assets/images/items/hyperchromes/HyperShift.gif"
                      class="card-img-top w-100 h-100"
                      style="object-fit: cover; transition: transform 0.3s ease;"
                      alt="${item.name}"
                    >
                  `
                    : `
                    <img src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
                        item.name
                      }.webp" 
                         class="card-img-top w-100 h-100"
                         style="object-fit: cover; transition: transform 0.3s ease;"
                         alt="${item.name}"
                         onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`
                }
              </div>
              <div class="card-overlay position-absolute bottom-0 start-0 w-100 p-2"
                   style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                <h6 class="card-title mb-1 text-white">${item.name}</h6>
                <small class="text-light">${item.type}</small>
              </div>
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

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const diff = now - timestamp;

    // Time intervals in seconds
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    if (diff < 60) return "just now";

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diff / seconds);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
      }
    }
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

    function handleCommentScroll() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("comments")) {
        // Wait for content to load
        setTimeout(() => {
          const commentsSection = document.querySelector(".comment-container");
          if (commentsSection) {
            const offset = 30; // 30px offset from the top
            const elementPosition = commentsSection.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });

            // Clean up URL
            const url = window.location.pathname;
            window.history.replaceState({}, "", url);
          }
        }, 1000); // Wait for content to render
      }
    }

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

      handleCommentScroll();
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

  function displayItemDetails(item) {
    const image_type = item.type.toLowerCase();

    // Define color before using it in badge templates
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
            <i class="bi bi-star-fill me-1"></i>Limited
          </span>
        `;
      }
    }

    function showFirefoxAutoplayNotice() {
      // Remove existing notice if present
      const existingNotice = document.querySelector(".firefox-autoplay-notice");
      if (existingNotice) {
        existingNotice.remove();
      }

      const notice = document.createElement("div");
      notice.className = "firefox-autoplay-notice";
      notice.innerHTML = `
        <div style="
          position: fixed;
          top: 50px;
          right: 20px;
          background: #1E1E1E;
          border: 2px solid #FF4500;
          color: #FFFFFF;
          padding: 15px;
          border-radius: 8px;
          max-width: 350px;
          width: calc(100% - 40px);
          z-index: 1000;
          box-shadow: 0 0 20px rgba(255,69,0,0.2);
          font-family: system-ui, -apple-system, sans-serif;
          animation: pulse 2s infinite;
          margin: 0 auto;

    
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 8px;
          ">
            <span style="color: #FF4500; font-size: 24px;">⚠️</span>
            <h4 style="
              margin: 0;
              font-size: 16px;
              color: #FF4500;
              flex-grow: 1;
              font-weight: bold;
            ">Firefox Drift Preview Notice</h4>
            <button onclick="this.closest('.firefox-autoplay-notice').remove()" 
              style="
                background: #FF4500;
                border: 2px solid #FFFFFF;
                color: #FFFFFF;
                cursor: pointer;
                padding: 4px 8px;
                line-height: 1;
                border-radius: 4px;
                margin-left: 8px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
              "
              onmouseover="this.style.backgroundColor='#FF6A33'"
              onmouseout="this.style.backgroundColor='#FF4500'"
              title="Dismiss">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <p style="
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #FFFFFF;
          ">
            Hover over the drift image to preview the effect! To enable auto-preview, you'll need to adjust Firefox's autoplay settings. 
            <a href="https://support.mozilla.org/en-US/kb/block-autoplay#w_always-allow-or-block-media-autoplay" 
               target="_blank" 
               style="
                 color: #FF4500;
                 text-decoration: underline;
                 font-weight: 500;
               ">
              Learn how to enable autoplay
            </a>
          </p>
        </div>
      `;

      // Add mobile-specific styles
      const mobileStyles = document.createElement("style");
      mobileStyles.textContent = `
      @media (max-width: 768px) {
        .firefox-autoplay-notice > div {
          right: 50% !important;
          transform: translateX(50%) !important;
          top: 40px !important;
          max-width: calc(100% - 40px) !important;
          font-size: 14px !important;
        }
      }
    `;
      document.head.appendChild(mobileStyles);

      // Add pulse animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,69,0,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255,69,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,69,0,0); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(notice);
    }
    const container = document.getElementById("item-container");

    // Determine media element based on type
    let element;
    // For Drift videos
    if (item.type === "Drift") {
      element = `
    <div class="media-container ${item.is_limited ? "limited-item" : ""}">
        <video 
          src="/assets/images/items/drifts/${item.name}.webm"
          class="img-fluid rounded video-player"
          playsinline 
          muted 
          loop
          autoplay
          defaultMuted
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; opacity: 1;"
        ></video>
        ${item.is_limited ? specialBadgeHtml : ""}
    </div>
  `;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      element = `
      <div class="media-container ${item.is_limited ? "limited-item" : ""}">
          <div class="skeleton-loader"></div>
          <img 
              src="/assets/images/items/hyperchromes/HyperShift.gif"
              class="card-img-top"
              onload="this.parentElement.querySelector('.skeleton-loader').style.display='none'; this.style.opacity='1'"
              onerror="handleimage(this)"
              style="width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.3s ease;"
              alt="HyperShift"
          />
      </div>
  `;
    } else {
      element = `
        <div class="media-container ${item.is_limited ? "limited-item" : ""}">
          <img 
            src="/assets/images/items/${encodeURIComponent(image_type)}/${
        item.name
      }s.webp"
            class="img-fluid rounded thumbnail"
            alt="${item.name}"
            onerror="handleimage(this)"
          >
          ${item.is_limited ? specialBadgeHtml : ""}
        </div>
      `;
    }

    const value = formatValue(item.cash_value);
    const duped_value = formatValue(item.duped_value);
    const urlPath = window.location.pathname.split("/");
    const urlType = urlPath[2];
    const formattedUrlType = item.type;

    // Show graph if either value exists
    const hasValues = value !== "-" || duped_value !== "-";

    // Add this function to format duped owners
    function formatDupedOwners(ownerString) {
      if (!ownerString) return null;
      const owners = ownerString
        .split(",")
        .filter((owner) => owner.trim())
        .filter((owner) => owner.trim() !== "N/A"); // Filter out N/A values
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
                ${
                  item.name === "HyperShift" && item.type === "HyperChrome"
                    ? `
                    <img 
                      src="/assets/images/items/hyperchromes/HyperShift.gif"
                      class="card-img-top" 
                      style="width: 100%; height: 100%; object-fit: cover;"
                      alt="${item.name}"
                    />
                  `
                    : `
                    <img src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
                        item.name
                      }.webp" 
                         class="card-img-top" 
                         alt="${item.name}"
                         onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`
                }
                  ${
                    item.similarityScore > 75
                      ? '<span class="badge bg-success position-absolute top-0 end-0 m-2 best-match-badge">Best Match</span>'
                      : ""
                  }
                </div>
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title text-truncate mb-2">${item.name}</h5>
                  <div class="value-display">
                    <div class="mb-2">
                      <small class="text-muted d-block">Cash Value:</small>
                      <p class="card-text mb-1 desktop-value" style="color: var(--accent-color-light)">
                        ${formatValueForDisplay(item.cash_value, false)}
                      </p>
                      <p class="card-text mb-1 mobile-value d-none" style="color: var(--accent-color-light)">
                        ${formatValueForDisplay(item.cash_value, true)}
                      </p>
                    </div>
                    <div class="mb-2">
                      <small class="text-muted d-block">Duped Value:</small>
                      <p class="card-text mb-1 desktop-value ${
                        item.duped_value ? "text-warning" : ""
                      }">
                        ${formatValueForDisplay(item.duped_value, false)}
                      </p>
                      <p class="card-text mb-1 mobile-value d-none ${
                        item.duped_value ? "text-warning" : ""
                      }">
                        ${formatValueForDisplay(item.duped_value, true)}
                      </p>
                    </div>
                  </div>
                  ${
                    item.is_limited
                      ? '<span class="badge limited-badge"><i class="bi bi-star-fill me-1"></i>Limited</span>'
                      : ""
                  }
                  <div class="mt-2">
                    <small class="text-muted demand-tag">
                      <i class="bi bi-graph-up-arrow me-1"></i>
                      ${
                        item.demand && item.demand !== "N/A"
                          ? item.demand
                          : "No Demand"
                      } 
                      <span class="demand-separator mx-2">|</span>
                      <span class="last-updated">
                        Last updated: ${
                          item.last_updated
                            ? formatTimeAgo(item.last_updated)
                            : "N/A"
                        }
                      </span>
                    </small>
                  </div>

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
          <i class="bi bi-graph-up-arrow me-2"></i>
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

        // Handle k/m suffixes
        const lowerPrice = price.toLowerCase();
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
      <path fill="#76ABAE" d="M3 6h18v12H3zm9 3a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3M7 8a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2v-4a2 2 0 0 1-2-2z"/>
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
          <i class="bi bi-tag-fill me-2"></i>
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
      <i class="bi bi-heart-fill me-2"></i>
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
            <i class="bi bi-journal-text me-2"></i>
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
                <i class="bi bi-clock-history me-1"></i>
                Last updated: ${formatTimeAgo(item.last_updated)}
              </small>
            </div>
          </div>
        `
            : `
          <div class="col-12">
            <div class="d-flex align-items-center">
              <small class="text-muted">
                <i class="bi bi-clock-history me-1"></i>
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
            <i class="bi bi-cash-stack me-2"></i>
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
              <i class="bi bi-graph-down me-2"></i>
              Duped Value
            </h4>
            <p class="h2 mb-0" style="color: #748D92; font-weight: 600;">
              ${hasDupedValue ? duped_value : "No Duped Value"}
            </p>
            ${
              dupedOwners
                ? `
              <div class="mt-3 pt-3 border-top">
                <button class="btn btn-link text-decoration-none p-0" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#dupedOwnersList" 
                        aria-expanded="false" aria-controls="dupedOwnersList" 
                        style="color: #748d92;">
                  <i class="bi bi-people-fill me-1"></i>
                  <span class="duped-owners-count">${
                    dupedOwners.count
                  } Known Duped Owner${
                    dupedOwners.count !== 1 ? "s" : ""
                  }</span>
                  <i class="bi bi-chevron-down ms-1"></i>
                </button>
                <div class="collapse mt-3" id="dupedOwnersList">
                  <div class="duped-owners-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
                    ${dupedOwners.list
                      .map(
                        (owner) => `
                      <a href="https://www.roblox.com/search/users?keyword=${encodeURIComponent(
                        owner.trim()
                      )}"
                         target="_blank"
                         rel="noopener noreferrer"
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
                         onmouseout="this.style.backgroundColor='rgba(18, 78, 102, 0.2)'; this.style.color='#d3d9d4';"
                      >
                        ${owner.trim()}
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
              <i class="bi bi-graph-up-arrow me-2"></i>
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
              <i class="bi bi-journal-text me-2"></i>
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
            <!-- Breadcrumb Navigation -->
            <div class="container-fluid mt-1">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/">Home</a></li>
                        <li class="breadcrumb-item"><a href="/values">Values</a></li>
                      <li class="breadcrumb-item">
                          <a href="/values?sort=${formattedUrlType.toLowerCase()}s&valueSort=cash-desc">
                              ${formattedUrlType}s
                          </a>
                      </li>
                        <li class="breadcrumb-item active" aria-current="page">${
                          item.name
                        }</li>
                    </ol>
                </nav>
             </div>
    
           <div class="container-fluid mt-1">
              <div class="media-container-wrapper">
                  <!-- Main Item Info Section -->
                  <div class="row mb-4">
                     <!-- Left Side - Image and Health -->
                    <div class="col-md-5 p-3">
                      <div class="d-flex flex-column gap-3">
                        ${
                          item.type === "Drift"
                            ? element
                            : item.name === "HyperShift" &&
                              item.type === "HyperChrome"
                            ? element
                            : `
                          <div class="media-container ${
                            item.is_limited ? "limited-item" : ""
                          }">
                              <img 
                                  src="/assets/images/items/${encodeURIComponent(
                                    image_type
                                  )}s/${item.name}.webp"
                                  class="img-fluid rounded thumbnail"
                                  alt="${item.name}"
                                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
                                  onerror="handleimage(this)"
                              >
                              ${item.is_limited ? specialBadgeHtml : ""}
                          </div>
                        `
                        }
                      
                      </div>
                    </div>

                      <!-- Right Side - Item Details -->
                      <div class="col-md-7 p-3">
                          <!-- Item Title and Badge Container -->
                          <div class="item-header d-flex align-items-center mb-4">
                              <h1 class="mb-0 me-3 h2" style="font-weight: 600;">${
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
                                      <path fill="#ffd469" d="m456.1 51.7l-41-41c-1.2-1.2-2.8-1.7-4.4-1.5s-3.1 1.2-3.9 2.6l-42.3 83.3c-1.2 2.1-.8 4.6.9 6.3c1 1 2.4 1.5 3.7 1.5c.9 0 1.8-.2 2.6-.7L454.9 60c1.4-.8 2.4-2.2 2.6-3.9c.3-1.6-.3-3.2-1.4-4.4m-307 43.5l-42.3-83.3c-.8-1.4-2.2-2.4-3.9-2.6c-1.6-.2-3.3.3-4.4 1.5l-41 41c-1.2 1.2-1.7 2.8-1.5 4.4s1.2 3.1 2.6 3.9l83.3 42.3c.8.5 1.7.7 2.6.7c1.4 0 2.7-.5 3.7-1.5c1.7-1.8 2-4.4.9-6.4m140.7 410l-29-88.8c-.2-.9-.7-1.7-1.3-2.3c-1-1-2.3-1.5-3.7-1.5c-2.4 0-4.4 1.6-5.1 3.9l-29 88.8c-.4 1.6-.1 3.3.9 4.6s2.5 2.1 4.2 2.1h57.9c1.6 0 3.2-.8 4.2-2.1c1.1-1.4 1.4-3.1.9-4.7" />
                                    </svg>
                                    <span id="favorites-count">0</span>
                                  </span>
                              </div>
                          </div>
                           ${
                             item.description && item.description !== "N/A"
                               ? `<div class="item-description collapsed">
                                    ${item.description}
                                    <div class="read-more-fade"></div>
                                  </div>
                                  <button class="read-more-btn">
                                    <i class="bi bi-chevron-down"></i>Read More
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

    // Only initialize chart if values exist
    if (hasValues) {
      setTimeout(() => {
        // Show loading state while we fetch the data
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
              // Keep full date format in tooltip
              const date = Highcharts.dateFormat("%b %d, %Y %l:%M %p", this.x);
              let s = `<b>${date}</b><br/>`;

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
                chart.navigator.series[0].setData(chart.series[0].options.data);
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
        fetch(`https://api3.jailbreakchangelogs.xyz/item/history?id=${item.id}`)
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
              dupedChartData.some((point) => point.y > 0) ? dupedChartData : []
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
          <i class="bi bi-exclamation-circle-fill" style="font-size: 2rem;"></i>
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
              <i class="bi bi-grid me-2"></i>Browse Other ${
                itemType.charAt(0).toUpperCase() + itemType.slice(1)
              }s
            </a>`
              : ""
          }
          <a href="/values" 
             class="btn btn-outline-primary"
             style="border-color: var(--accent-color-light); color: var(--accent-color-light);"
             onmouseover="this.style.backgroundColor='var(--accent-color)'; this.style.color='var(--text-primary)';"
             onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--accent-color-light)';">
            <i class="bi bi-arrow-left me-2"></i>Back to All Items
          </a>
        </div>
      </div>
      ${
        isValidCategory
          ? `
        <!-- Similar Items Section -->
        <div class="mt-4">
          <h5 class="text-center mb-4">
            <i class="bi bi-search me-2"></i>Did you mean?
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
      "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp";
  };

  loadItemDetails();
});

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

// Add this function at the start of the file, after the constants
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
        ? '<i class="bi bi-chevron-up"></i>Show Less'
        : '<i class="bi bi-chevron-down"></i>Read More';
    });
  }
}

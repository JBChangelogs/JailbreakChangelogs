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
    showLoadingOverlay(); // Show loading when starting to fetch

    try {
      const urlPath = window.location.pathname.split("/");
      const urlType = urlPath[2];
      const rawItemName = urlPath.pop();
      const itemName = decodeURIComponent(rawItemName)
        .trim()
        .replace(/\s+/g, " ");

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
      const item = await response.json();

      if (item && !item.error) {
        displayItemDetails(item);
      } else {
        showErrorMessage("Item Not Found.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorMessage("Error Loading item details");
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
    };

    // 1. Type Matching (35 points)
    if (currentItem.type === comparisonItem.type) {
      score += weights.type;
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
          <i class="bi bi-stars"></i>HyperChrome
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
          <video 
              src="/assets/images/items/hyperchromes/HyperShift.webm"
              class="video-player card-img-top"
              playsinline 
              muted 
              loop
              autoplay
              id="hypershift-video"
              onloadeddata="this.parentElement.querySelector('.skeleton-loader').style.display='none'; this.style.opacity='1'"
              onerror="handleimage(this)"
              style="width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.3s ease;"
          ></video>
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

    const dupedOwners = formatDupedOwners(item.duped_owners);
    const dupedOwnersSection = dupedOwners
      ? `
      <div class="duped-owners-section mt-4">
        <div class="info-card p-4 rounded-3" style="background-color: rgba(46, 57, 68, 0.3); border: 1px solid rgba(46, 57, 68, 0.4);">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h4 class="text-muted mb-0 d-flex align-items-center">
              <i class="bi bi-people-fill me-2"></i>
              Known Duped Owners
            </h4>
            <span class="badge bg-secondary">${dupedOwners.count} owners</span>
          </div>
          <div class="collapse" id="dupedOwnersList">
            <div class="duped-owners-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
              ${dupedOwners.list
                .map(
                  (owner) => `
                <a 
                  href="https://www.roblox.com/search/users?keyword=${encodeURIComponent(
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
                    cursor: pointer;
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
          <button class="btn btn-link text-decoration-none w-100 mt-2" type="button" data-bs-toggle="collapse" data-bs-target="#dupedOwnersList" aria-expanded="false" aria-controls="dupedOwnersList" style="color: #748d92;">
            <i class="bi bi-chevron-down me-1"></i>
            <span class="toggle-text">Show Owners</span>
          </button>
        </div>
      </div>`
      : "";

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

        // Calculate similarity scores for all items
        const scoredItems = items
          .filter((item) => item.id !== currentItem.id) // Exclude current item
          .map((item) => ({
            ...item,
            similarityScore: calculateSimilarityScore(currentItem, item),
          }))
          .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by score
          .slice(0, 4); // Get top 4 most similar items

        // Display the similar items
        const container = document.getElementById("similar-items");
        container.innerHTML = ""; // Clear existing items

        scoredItems.forEach((item) => {
          const card = document.createElement("div");
          card.className = "col-lg-3 col-md-3 col-6"; // Changed to col-6 for mobile (2 per row)
          card.innerHTML = `
            <a href="/item/${item.type}/${encodeURIComponent(item.name)}" 
              class="text-decoration-none similar-item-card">
             <div class="card h-100 ${
               item.tradable === 0 ? "not-tradable-card" : ""
             }">
                <div class="card-img-wrapper position-relative" style="aspect-ratio: 16/9;">
                  <img src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
            item.name
          }.webp" 
                      class="card-img-top" 
                      alt="${item.name}"
                      onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">
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
        
          <!-- Cash Value Card - Always Show -->
          <div class="col-md-6">
            <div class="value-card p-4 rounded-3" style="background-color: rgba(24, 101, 131, 0.1); border: 1px solid rgba(24, 101, 131, 0.2);">
              <h4 class="text-muted mb-3 d-flex align-items-center">
                <i class="bi bi-cash-stack me-2"></i>
                Cash Value
              </h4>
              <p class="h2 mb-0" style="color: rgb(24, 101, 131); font-weight: 600;">
                ${hasValue ? value : "No Cash Value"}
              </p>
            </div>
          </div>
      
          <!-- Duped Value Card - Always Show -->
          <div class="col-md-6">
            <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
              <h4 class="text-muted mb-3 d-flex align-items-center">
                <i class="bi bi-graph-down me-2"></i>
                Duped Value
              </h4>
              <p class="h2 mb-0" style="color: #748D92; font-weight: 600;">
                ${hasDupedValue ? duped_value : "No Duped Value"}
              </p>
            </div>
          </div>
      
          <!-- Demand Card - Always Show -->
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
      
          <!-- Notes Card - Always Show -->
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
            <div class="card-header text-center">
              <h3 class="card-title" style="font-weight: revert; font-family: 'Luckiest Guy', cursive;">
                Value History for ${item.name}
              </h3>
            </div>
            <div class="card-body">
              <div class="chart-wrapper">
                <canvas id="combinedChart"></canvas>
              </div>
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
            <div class="container-fluid mt-3">
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
    
           <div class="container-fluid mt-5">
              <div class="media-container-wrapper">
                  <!-- Main Item Info Section -->
                  <div class="row mb-4">
                      <!-- Left Side - Image -->
                      <div class="col-md-5 p-3">
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

                      <!-- Right Side - Item Details -->
                      <div class="col-md-7 p-3">
                          <!-- Item Title and Type Badge -->
                        <div class="d-flex align-items-center mb-4">
                            <h1 class="mb-0 me-3 h2" style="font-weight: 600;">${
                              item.name
                            }</h1>
                            ${typeBadgeHtml}
                            ${
                              item.tradable === 0
                                ? `
                              <span class="badge bg-danger ms-2" style="font-size: 0.9rem;">
                               Not Tradable
                              </span>
                            `
                                : ""
                            }
                        </div>
                           ${
                             item.description && item.description !== "N/A"
                               ? `<p class="text-muted mb-0">${item.description}</p>`
                               : ""
                           }
                          <!-- Values Section -->
                          ${valuesSection}

                          <div class="values-text d-flex flex-column align-items-start mt-3">
                            <strong class="mb-2">Want to make a value suggestion for ${
                              item.name
                            }?</strong>
                            <button
                              onclick="window.open('https://discord.com/invite/baHCsb8N5A', '_blank', 'noopener,noreferrer')"
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

    if (window.commentsManagerInstance) {
      window.commentsManagerInstance.clearComments();
      window.commentsManagerInstance.type = item.type.toLowerCase();
      window.commentsManagerInstance.itemId = item.id;
      window.commentsManagerInstance.loadComments();
    } else {
      window.commentsManagerInstance = new CommentsManager(
        item.type.toLowerCase(),
        item.id,
        item.name
      );
      window.commentsManagerInstance.loadComments();
    }

    // Only initialize chart if values exist
    if (hasValues) {
      setTimeout(() => {
        const ctx = document.getElementById("combinedChart")?.getContext("2d");
        if (!ctx) return;

        const dates = [];
        const values = [];
        const duped_values = [];
        fetch(`https://api3.jailbreakchangelogs.xyz/item/history?id=${item.id}`)
          .then((response) => response.json())
          .then((data) => {
            for (const item of data) {
              const date = formatChartDate(item.date);
              dates.push(date);
              const value = formatChartValue(item.cash_value);
              values.push(value);
              const duped_value = formatChartValue(item.duped_value);
              duped_values.push(duped_value);
            }
            // Initialize the chart after data is ready
            new Chart(ctx, {
              type: "line",
              data: {
                labels: dates,
                datasets: [
                  {
                    label: "Cash Value",
                    data: values,
                    borderColor: "rgb(24, 101, 131)",
                    backgroundColor: "rgba(24, 101, 131, 0.1)",
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                  },
                  {
                    label: "Duped Value",
                    data: duped_values.every((value) => value === 0)
                      ? []
                      : duped_values,
                    borderColor: "#748D92",
                    backgroundColor: "rgba(116, 141, 146, 0.1)",
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: "index",
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: "top",
                    align: "start",
                    labels: {
                      color: "#D3D9D4",
                      usePointStyle: true,
                      padding: 20,
                      font: {
                        size: window.innerWidth < 768 ? 11 : 13,
                        weight: "bold",
                      },
                      generateLabels: function (chart) {
                        const defaultLabels =
                          Chart.defaults.plugins.legend.labels.generateLabels(
                            chart
                          );
                        return defaultLabels.map((label) => ({
                          ...label,
                          borderRadius: 4,
                          textAlign: "left",
                          padding: window.innerWidth < 768 ? 12 : 8,
                        }));
                      },
                    },
                    onHover: function (event, legendItem, legend) {
                      document.body.style.cursor = "pointer";
                      if (legendItem) {
                        legendItem.fillStyle = legendItem.strokeStyle + "40";
                      }
                    },
                    onLeave: function (event, legendItem, legend) {
                      document.body.style.cursor = "default";
                      if (legendItem) {
                        legendItem.fillStyle = legendItem.strokeStyle + "20";
                      }
                    },
                    title: {
                      display: true,
                      text: "Click legends to show/hide data series",
                      padding: {
                        top: 10,
                        bottom: 20,
                      },
                      color: "#748D92",
                      font: {
                        size: window.innerWidth < 768 ? 10 : 11,
                        style: "italic",
                        weight: "normal",
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    type: "linear",
                    display: true,
                    title: {
                      display: true,
                      text: "Value",
                      color: "#D3D9D4",
                      font: {
                        size: 14,
                        weight: "bold",
                      },
                    },
                    grid: {
                      color: "rgba(46, 57, 68, 0.1)",
                      borderColor: "#2E3944",
                      tickColor: "#2E3944",
                      lineWidth: 1,
                      borderDash: [5, 5],
                      drawBorder: true,
                      drawTicks: true,
                    },
                    ticks: {
                      color: "#D3D9D4",
                      padding: 10,
                      callback: function (value) {
                        return value.toLocaleString();
                      },
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: "Date",
                      color: "#D3D9D4",
                      font: {
                        size: 14,
                        weight: "bold",
                      },
                    },
                    grid: {
                      color: "rgba(46, 57, 68, 0.1)",
                      borderColor: "#2E3944",
                      tickColor: "#2E3944",
                      display: true,
                      lineWidth: 1,
                      borderDash: [5, 5],
                      drawBorder: true,
                      drawTicks: true,
                    },
                    ticks: {
                      color: "#D3D9D4",
                      padding: 10,
                      font: {
                        size: 11,
                      },
                    },
                  },
                },

                padding: {
                  left: 5,
                  right: 5,
                  top: 20,
                  bottom: 5,
                },
                layout: {},
              },
            });
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
          });
      }, 100);
    }
    // Add at the end of displayItemDetails function
    loadSimilarItems(item);
  }

  function showErrorMessage(message) {
    hideLoadingOverlay();
    const container = document.getElementById("item-container");
    container.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger text-center role="alert">
                   ${message}
                   <br>
                   <a href="/values" class="btn btn-primary mt-3">Back to All Items</a>
                </div>
            </div>
        `;
  }

  // Update handleimage function to skip HyperShift
  window.handleimage = function (element) {
    console.log("handleimage called for:", {
      id: element.id,
      alt: element.alt,
      tagName: element.tagName,
      src: element.src,
      isHyperShiftVideo: element.id === "hypershift-video",
      isHyperShiftAlt: element.alt === "HyperShift",
    });

    const isHyperShift =
      element.id === "hypershift-video" ||
      (element.alt === "HyperShift" &&
        element.closest(".media-container").querySelector("video"));

    if (isHyperShift) {
      console.log("Skipping placeholder for HyperShift");
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

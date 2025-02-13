function showLoadingOverlay() {
  $("#loading-overlay").addClass("show");
}

function hideLoadingOverlay() {
  $("#loading-overlay").removeClass("show");
}

// Get trade ID from URL
const tradeId = window.location.pathname.split("/").pop();

// Function to get item image element
function getItemImageElement(item) {
  // Special handling for HyperShift
  if (item.name === "HyperShift") {
    return `<img src="/assets/images/items/hyperchromes/HyperShift.gif" 
                   class="card-img-top" 
                   alt="${item.name}">`;
  }

  // Handle Drift items
  if (item.type === "Drift") {
    return `<img src="/assets/images/items/drifts/thumbnails/${item.name}.webp" 
                   class="card-img-top" 
                   alt="${item.name}"
                   onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`;
  }

  // Regular items
  return `<img src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
    item.name
  }.webp" 
                 class="card-img-top" 
                 alt="${item.name}"
                 onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`;
}

// Add this function to trade-ad.js
async function deleteTradeAd(tradeId) {
  try {
    const token = getCookie("token");
    if (!token) {
      notyf.error("Please login to delete trade advertisements");
      return;
    }

    // Show confirmation dialog
    if (!confirm("Are you sure you want to delete this trade advertisement?")) {
      return;
    }

    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/trades/delete?id=${tradeId}&token=${token}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Delete trade error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    notyf.success("Trade advertisement deleted successfully!");
    // Redirect to trading page after successful deletion
    setTimeout(() => {
      window.location.href = "/trading";
    }, 1500);
  } catch (error) {
    console.error("Error deleting trade:", error);
    notyf.error("Failed to delete trade advertisement");
  }
}

// Function to format timestamp
function formatTimestamp(timestamp) {
  // Convert Unix timestamp to milliseconds if it's in seconds
  const timestampMs =
    timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(timestampMs);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  // For older dates, return formatted date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Function to format value
function formatValue(value, useSuffix = false) {
  if (!value || value === "N/A") return "No Value";
  const parsedValue = parseValue(value);

  // Use suffixes for mobile if enabled
  if (useSuffix && window.innerWidth <= 768) {
    if (parsedValue >= 1000000000) {
      return (parsedValue / 1000000000).toFixed(1) + "B";
    } else if (parsedValue >= 1000000) {
      return (parsedValue / 1000000).toFixed(1) + "M";
    } else if (parsedValue >= 1000) {
      return (parsedValue / 1000).toFixed(1) + "K";
    }
  }

  return parsedValue.toLocaleString("fullwide", { useGrouping: true });
}

// Function to parse value
function parseValue(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  value = value.toString().toLowerCase();
  if (value.includes("k")) {
    return parseFloat(value) * 1000;
  } else if (value.includes("m")) {
    return parseFloat(value) * 1000000;
  } else if (value.includes("b")) {
    return parseFloat(value) * 1000000000;
  }
  return parseFloat(value) || 0;
}

// Function to create item HTML
function createItemHTML(item, count) {
  return `
    <div class="trade-ad-item">
      <div class="trade-ad-item-content">
        <div class="item-image-container">
          ${getItemImageElement(item)}
          ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
        </div>
        <div class="item-details">
          <div class="item-name">
            ${item.name}
            ${
              item.is_limited
                ? `
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
                          <rect width="512" height="512" fill="none" />
                          <defs>
                              <linearGradient id="meteoconsStarFill0" x1="187.9" x2="324.1" y1="138.1" y2="373.9" gradientUnits="userSpaceOnUse">
                                  <stop offset="0" stop-color="#fcd966" />
                                  <stop offset=".5" stop-color="#fcd966" />
                                  <stop offset="1" stop-color="#fccd34" />
                              </linearGradient>
                          </defs>
                          <path fill="url(#meteoconsStarFill0)" stroke="#fcd34d" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="m105.7 263.5l107.5 29.9a7.9 7.9 0 0 1 5.4 5.4l29.9 107.5a7.8 7.8 0 0 0 15 0l29.9-107.5a7.9 7.9 0 0 1 5.4-5.4l107.5-29.9a7.8 7.8 0 0 0 0-15l-107.5-29.9a7.9 7.9 0 0 1-5.4-5.4l-29.9-107.5a7.8 7.8 0 0 0-15 0l-29.9 107.5a7.9 7.9 0 0 1-5.4 5.4l-107.5 29.9a7.8 7.8 0 0 0 0 15Z">
                              <animateTransform additive="sum" attributeName="transform" calcMode="spline" dur="6s" keySplines=".42, 0, .58, 1; .42, 0, .58, 1" repeatCount="indefinite" type="rotate" values="-15 256 256; 15 256 256; -15 256 256" />
                              <animate attributeName="opacity" dur="6s" values="1; .75; 1; .75; 1; .75; 1" />
                          </path>
                      </svg>
                  `
                : ""
            }
          
          </div>
          <div class="item-values">
            <div class="value-badge">
              <span class="value-label">Cash Value:</span>
              <span class="value-amount">${formatValue(
                item.cash_value,
                true
              )}</span>
            </div>
            <div class="value-badge">
              <span class="value-label">Duped Value:</span>
              <span class="value-amount">${formatValue(
                item.duped_value,
                true
              )}</span>
            </div>
            <div class="value-badge">
              <span class="value-label">Type:</span>
              <span class="value-amount">${item.type}</span>
            </div>
            <div class="value-badge demand-badge">
              <span class="value-label">Demand:</span>
              <span class="value-amount demand-${(
                item.demand || "0"
              ).toLowerCase()}">${item.demand || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// Function to fetch and process trade data
async function loadTradeData() {
  showLoadingOverlay();
  try {
    // Fetch trade details
    const tradeResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/trades/get?id=${tradeId}`
    );

    if (!tradeResponse.ok) {
      throw new Error("Trade not found");
    }

    const trade = await tradeResponse.json();

    // Fetch author details
    const authorResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${trade.author}`
    );
    const author = await authorResponse.json();

    // Check if author has valid Roblox data
    if (
      !author?.roblox_id ||
      !author?.roblox_username ||
      !author?.roblox_display_name ||
      !author?.roblox_avatar ||
      !author?.roblox_join_date
    ) {
      // Redirect to trading page if no valid Roblox data
      window.location.href = "/trading";
      return;
    }

    // Process offering items
    const offeringIds = trade.offering.split(",").filter((id) => id);
    const offeringItems = await Promise.all(
      offeringIds.map((id) =>
        fetch(`https://api3.jailbreakchangelogs.xyz/items/get?id=${id}`).then(
          (res) => res.json()
        )
      )
    );

    // Process requesting items
    const requestingIds = trade.requesting.split(",").filter((id) => id);
    const requestingItems = await Promise.all(
      requestingIds.map((id) =>
        fetch(`https://api3.jailbreakchangelogs.xyz/items/get?id=${id}`).then(
          (res) => res.json()
        )
      )
    );

    // Calculate values
    const offeringValues = {
      cash: offeringItems.reduce(
        (sum, item) => sum + parseValue(item.cash_value || 0),
        0
      ),
      duped: offeringItems.reduce(
        (sum, item) => sum + parseValue(item.duped_value || 0),
        0
      ),
    };

    const requestingValues = {
      cash: requestingItems.reduce(
        (sum, item) => sum + parseValue(item.cash_value || 0),
        0
      ),
      duped: requestingItems.reduce(
        (sum, item) => sum + parseValue(item.duped_value || 0),
        0
      ),
    };

    // Update breadcrumbs
    updateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Trading", url: "/trading" },
      { name: `Trade #${tradeId}`, url: null },
    ]);

    // Get fallback avatar function
    function getFallbackAvatar(username) {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
        username || "Unknown"
      )}&bold=true&format=svg`;
    }

    hideLoadingOverlay();
    // Update trader info
    document.querySelector(".trader-info").innerHTML = `
        <img src="${
          author?.roblox_avatar || getFallbackAvatar(author?.roblox_username)
        }" 
         alt="${author?.roblox_username || "Unknown"}" 
         class="trader-avatar"
         onerror="this.onerror=null; this.src='${getFallbackAvatar(
           author?.roblox_username
         )}'"
         width="64"
         height="64">
        <div class="trader-details">
          <a href="https://www.roblox.com/users/${author?.roblox_id}/profile" 
            class="trader-name"
            target="_blank" 
            rel="noopener noreferrer">
            ${author?.roblox_display_name || "Unknown"} 
            <span class="text-muted">(${
              author?.roblox_id || "Unknown ID"
            })</span>
          </a>
          <a href="https://www.roblox.com/users/${author?.roblox_id}/profile" 
            class="trader-username text-muted" 
            target="_blank" 
            rel="noopener noreferrer">
            @${author?.roblox_username || "unknown"}
          </a>
        </div>`;

    // Count duplicates
    const itemCounts = {};
    offeringIds.forEach((id) => {
      itemCounts[id] = (itemCounts[id] || 0) + 1;
    });
    requestingIds.forEach((id) => {
      itemCounts[id] = (itemCounts[id] || 0) + 1;
    });

    // Render offering items
    const offeringGrid = document.querySelector(".offering .trade-items-grid");
    offeringGrid.innerHTML = offeringItems
      .map((item) => createItemHTML(item, itemCounts[item.id]))
      .join("");

    // Render requesting items
    const requestingGrid = document.querySelector(
      ".requesting .trade-items-grid"
    );

    requestingGrid.innerHTML = requestingItems
      .map((item) => createItemHTML(item, itemCounts[item.id]))
      .join("");

    document.querySelector(".offering .side-total").innerHTML = `
      <div class="card bg-dark border-success mt-3">
          <div class="card-body p-3">
              <h6 class="card-subtitle mb-2" style="color: #00c853">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 .5v2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5m0 4v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M4.5 9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 12.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M7.5 6a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM7 9.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM10 6.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5z" />
</svg> Side Totals
              </h6>
              <div class="d-flex flex-column gap-2">
                  <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Cash Value:</span>
                      <span class="badge" style="background-color: #00c853">${formatValue(
                        offeringValues.cash
                      )}</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Duped Value:</span>
                      <span class="badge" style="background-color: #00c853">${formatValue(
                        offeringValues.duped
                      )}</span>
                  </div>
              </div>
          </div>
      </div>
  `;

    document.querySelector(".requesting .side-total").innerHTML = `
      <div class="card bg-dark border-primary mt-3">
          <div class="card-body p-3">
              <h6 class="card-subtitle mb-2" style="color: #2196f3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 .5v2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5m0 4v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M4.5 9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 12.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M7.5 6a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM7 9.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM10 6.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5z" />
</svg> Side Totals
              </h6>
              <div class="d-flex flex-column gap-2">
                  <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Cash Value:</span>
                      <span class="badge" style="background-color: #2196f3">${formatValue(
                        requestingValues.cash
                      )}</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Duped Value:</span>
                      <span class="badge" style="background-color: #2196f3">${formatValue(
                        requestingValues.duped
                      )}</span>
                  </div>
              </div>
          </div>
      </div>
  `;

    // Update timestamp and status
    const timestampElement = document.querySelector(".timestamp");
    timestampElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <rect width="16" height="16" fill="none" />
            <g fill="currentColor">
                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
            </g>
        </svg>
        ${formatTimestamp(trade.created_at)}
    `;

    const statusElement = document.querySelector(".trade-status");
    statusElement.className = `trade-status ${trade.status.toLowerCase()}`;
    statusElement.textContent = trade.status;

    // Update trade actions
    const actionsContainer = document.querySelector(".trade-actions");
    if (trade.author === localStorage.getItem("userid")) {
      actionsContainer.innerHTML = `
          <a href="/trading?edit=${tradeId}" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="m14.06 9l.94.94L5.92 19H5v-.92zm3.6-6c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z" />
</svg> Edit Trade
          </a>
          <button class="btn btn-danger" onclick="deleteTradeAd('${tradeId}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg> Delete Trade
          </button>
        `;
    } else {
      actionsContainer.remove();
    }

    // Show the trade content
    document.querySelector(".trade-content").style.display = "block";
  } catch (error) {
    console.error("Error loading trade:", error);
    hideLoadingOverlay();
    showErrorState();
  }
}

// Function to show error state
function showErrorState() {
  const container = document.querySelector(".container");
  const tradeContent = document.querySelector(".trade-content");
  tradeContent.style.display = "none";

  const errorHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Trade Not Found</h4>
        <p>This trade advertisement could not be found or has been deleted.</p>
        <hr>
        <p class="mb-0">
          <a href="/trading" class="alert-link">Return to Trading Hub</a>
        </p>
      </div>
    `;

  // Update breadcrumbs for error state
  updateBreadcrumbs([
    { name: "Home", url: "/" },
    { name: "Trading", url: "/trading" },
    { name: "Trade Not Found", url: null },
  ]);

  document
    .querySelector(".breadcrumb")
    .insertAdjacentHTML("afterend", errorHTML);
}

// Function to update breadcrumbs
function updateBreadcrumbs(items) {
  const breadcrumbList = document.querySelector(".breadcrumb");
  breadcrumbList.innerHTML = items
    .map(
      (item) => `
        <li class="breadcrumb-item ${!item.url ? "active" : ""}">
          ${item.url ? `<a href="${item.url}">${item.name}</a>` : item.name}
        </li>
      `
    )
    .join("");
}

// Initialize comments manager for this trade
if (!window.commentsManagerInstance) {
  document.addEventListener("DOMContentLoaded", () => {
    window.commentsManagerInstance = new CommentsManager("trade", tradeId);
    window.commentsManagerInstance.loadComments();
  });
}

// Load trade data when page loads
document.addEventListener("DOMContentLoaded", loadTradeData);

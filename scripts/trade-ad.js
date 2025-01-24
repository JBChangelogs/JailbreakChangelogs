// Configure toastr
toastr.options = {
  positionClass: "toast-bottom-right",
  closeButton: true,
  progressBar: true,
  preventDuplicates: true,
  timeOut: 3000,
};

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
    const token = Cookies.get("token");
    if (!token) {
      toastr.error("Please login to delete trade advertisements");
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

    toastr.success("Trade advertisement deleted successfully!");
    // Redirect to trading page after successful deletion
    setTimeout(() => {
      window.location.href = "/trading";
    }, 1500);
  } catch (error) {
    console.error("Error deleting trade:", error);
    toastr.error("Failed to delete trade advertisement");
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
                ? '<i class="bi bi-star-fill text-warning ms-1"></i>'
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
                  <i class="bi bi-calculator me-2"></i>Side Totals
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
                  <i class="bi bi-calculator me-2"></i>Side Totals
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
    document.querySelector(".timestamp").textContent = formatTimestamp(
      trade.created_at
    );
    const statusElement = document.querySelector(".trade-status");
    statusElement.className = `trade-status ${trade.status.toLowerCase()}`;
    statusElement.textContent = trade.status;

    // Update trade actions
    const actionsContainer = document.querySelector(".trade-actions");
    if (trade.author === sessionStorage.getItem("userid")) {
      actionsContainer.innerHTML = `
          <a href="/trading?edit=${tradeId}" class="btn btn-primary">
            <i class="bi bi-pencil"></i> Edit Trade
          </a>
          <button class="btn btn-danger" onclick="deleteTradeAd('${tradeId}')">
            <i class="bi bi-trash"></i> Delete Trade
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

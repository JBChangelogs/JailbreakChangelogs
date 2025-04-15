const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

let activeBottomSheet = null;
let startY = 0;
let currentY = 0;
let initialTransform = 0;
let tradeSortOrder = "latest";
const currentUserId = localStorage.getItem("userid");
const TRADES_PER_PAGE = 6;
let currentTradesPage = 1;
let allTradeAds = [];

async function canCreateTradeAd() {
  const token = getCookie("token");
  if (!token) {
    notyf.error("Please login first");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`
    );
    if (!response.ok) throw new Error("Failed to fetch user data");

    const userData = await response.json();
    if (!userData) throw new Error("No user data found");

    // Check if user has Roblox data
    if (!userData.roblox_id) {
      // Just pass the message string instead of an object
      notyf.error("Please link your Roblox account first");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking trade permissions:", error);
    notyf.error("Failed to verify trade permissions");
    return false;
  }
}

function createSkeletonTradeAd() {
  // Check if viewport is mobile (less than or equal to 768px)
  const isMobile = window.innerWidth <= 768;
  const skeletonCount = isMobile ? 2 : 3;

  return `
    <div class="trade-ad">
      <div class="trade-ad-header">
        <div class="trader-info">
          <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
          <div class="trader-details">
            <div class="skeleton-text title skeleton"></div>
            <div class="skeleton-text skeleton"></div>
          </div>
        </div>
      </div>
      <div class="trade-sides-container">
        <div class="trade-side offering">
          <div class="trade-side-label">Offering</div>
          <div class="trade-items-grid">
            ${Array(skeletonCount)
              .fill(
                `<div class="trade-ad-item loading">
                  <div class="item-image-container">
                    <div class="skeleton-image skeleton"></div>
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="trade-side requesting">
          <div class="trade-side-label">Requesting</div>
          <div class="trade-items-grid">
            ${Array(skeletonCount)
              .fill(
                `<div class="trade-ad-item loading">
                  <div class="item-image-container">
                    <div class="skeleton-image skeleton"></div>
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="trade-ad-footer">
        <div class="skeleton-text skeleton" style="width: 120px;"></div>
        <div class="skeleton-text skeleton" style="width: 80px;"></div>
      </div>
    </div>
  `;
}

function initializeBottomSheet() {
  const bottomSheet = document.createElement("div");
  bottomSheet.className = "bottom-sheet";
  bottomSheet.innerHTML = `
    <div class="bottom-sheet-header">
      <button type="button" class="bottom-sheet-close">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
	<rect width="32" height="32" fill="none" />
	<path fill="currentColor" d="M16 2C8.2 2 2 8.2 2 16s6.2 14 14 14s14-6.2 14-14S23.8 2 16 2m5.4 21L16 17.6L10.6 23L9 21.4l5.4-5.4L9 10.6L10.6 9l5.4 5.4L21.4 9l1.6 1.6l-5.4 5.4l5.4 5.4z" />
</svg>
      </button>
      <h3 class="bottom-sheet-title"></h3>
    </div>
    <div class="bottom-sheet-content"></div>
  `;

  const backdrop = document.createElement("div");
  backdrop.className = "bottom-sheet-backdrop";

  // Add click event to backdrop
  backdrop.addEventListener("click", hideBottomSheet);

  // Add click event to close button
  const closeButton = bottomSheet.querySelector(".bottom-sheet-close");
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling
    hideBottomSheet();
  });

  document.body.appendChild(backdrop);
  document.body.appendChild(bottomSheet);

  // Only handle touch events on the header area excluding the close button
  const bottomSheetHeader = bottomSheet.querySelector(".bottom-sheet-header");
  bottomSheetHeader.addEventListener(
    "touchstart",
    (e) => {
      if (!e.target.closest(".bottom-sheet-close")) {
        handleTouchStart(e);
      }
    },
    { passive: false }
  );

  bottomSheetHeader.addEventListener(
    "touchmove",
    (e) => {
      if (!e.target.closest(".bottom-sheet-close")) {
        handleTouchMove(e);
      }
    },
    { passive: false }
  );

  bottomSheetHeader.addEventListener("touchend", (e) => {
    if (!e.target.closest(".bottom-sheet-close")) {
      handleTouchEnd(e);
    }
  });

  return { bottomSheet, backdrop };
}

function getTransformValue(element) {
  const transform = element.style.transform;
  return transform ? parseInt(transform.match(/-?\d+/)[0]) : 0;
}

function handleTouchStart(e) {
  // Only handle touch events on the header
  if (!e.target.closest(".bottom-sheet-header")) {
    return;
  }

  e.preventDefault();
  startY = e.touches[0].clientY;
  const bottomSheet = document.querySelector(".bottom-sheet");
  initialTransform = getTransformValue(bottomSheet);
  bottomSheet.style.transition = "none";
}

function handleTouchMove(e) {
  // Only handle touch events on the header
  if (!e.target.closest(".bottom-sheet-header")) {
    return;
  }

  const bottomSheet = document.querySelector(".bottom-sheet");
  currentY = e.touches[0].clientY;
  const deltaY = currentY - startY;

  // Only allow dragging down, not up
  if (deltaY < 0) {
    return;
  }

  e.preventDefault();
  bottomSheet.style.transform = `translateY(${deltaY}px)`;
}

function handleTouchEnd(e) {
  const bottomSheet = document.querySelector(".bottom-sheet");
  const deltaY = currentY - startY;

  bottomSheet.style.transition = "transform 0.3s ease-out";

  // Close sheet if dragged down more than 100px
  if (deltaY > 100) {
    hideBottomSheet();
  } else {
    bottomSheet.style.transform = "translateY(0)";
  }
}

function showBottomSheet(item) {
  if (window.innerWidth > 768) return;

  const { bottomSheet, backdrop } = document.querySelector(".bottom-sheet")
    ? {
        bottomSheet: document.querySelector(".bottom-sheet"),
        backdrop: document.querySelector(".bottom-sheet-backdrop"),
      }
    : initializeBottomSheet();

  // Just add the class to prevent scrolling
  document.body.classList.add("bottom-sheet-open");

  bottomSheet.querySelector(".bottom-sheet-title").textContent = item.name;
  bottomSheet.querySelector(".bottom-sheet-content").innerHTML = `
    <div class="item-image-container">
      ${getItemImageElement(item)}
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Type</span>
      <span class="value">${item.type}</span>
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Cash Value</span>
      <span class="value">${formatValue(item.cash_value, true)}</span>
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Duped Value</span>
      <span class="value">${formatValue(item.duped_value, true)}</span>
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Limited</span>
      <span class="value">${item.is_limited ? "Yes" : "No"}</span>
    </div>
  `;

  backdrop.classList.add("show");
  bottomSheet.classList.add("show");
  activeBottomSheet = bottomSheet;
}

function hideBottomSheet() {
  const bottomSheet = document.querySelector(".bottom-sheet");
  const backdrop = document.querySelector(".bottom-sheet-backdrop");

  if (bottomSheet && backdrop) {
    // Remove the class to restore scrolling
    document.body.classList.remove("bottom-sheet-open");

    // Hide the sheet
    bottomSheet.style.transform = "translateY(100%)";
    backdrop.classList.remove("show");

    // Remove elements after animation
    setTimeout(() => {
      bottomSheet.remove();
      backdrop.remove();
    }, 300);

    activeBottomSheet = null;
  }
}

// Add this new centralized function near the top of the file
function getItemImagePath(item) {
  if (!item)
    return "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat";

  if (item.name === "HyperShift") {
    return "/assets/images/items/hyperchromes/HyperShift.gif";
  }

  if (item.type === "Horn") {
    return "/assets/audios/horn_thumbnail.webp";
  }

  if (item.type === "Drift") {
    return `/assets/images/items/480p/drifts/${item.name}.webp`;
  }

  // Default path for other items
  return `/assets/images/items/480p/${item.type.toLowerCase()}s/${
    item.name
  }.webp`;
}

// Update the getItemImageElement function to use the new centralized function
function getItemImageElement(item) {
  return `<img src="${getItemImagePath(item)}" 
               class="card-img-top" 
               alt="${item?.name || "Item"}"
               onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">`;
}

// Update getItemImageUrl to use the new centralized function
function getItemImageUrl(item) {
  return getItemImagePath(item);
}

function decimalToHex(decimal) {
  if (!decimal || decimal === "None") return "#124E66";

  // Convert to hex and ensure exactly 6 digits
  const hex = decimal.toString(16).padStart(6, "0").slice(-6);

  // Return the hex color with a # prefix
  return `#${hex}`;
}

function handleModalClose() {
  const searchInput = document.getElementById("modal-item-search");
  const clearButton = document.getElementById("clear-search-btn");

  if (searchInput) {
    searchInput.value = "";
  }

  if (clearButton) {
    clearButton.style.display = "none";
  }

  // Instead of resetting to all items, reapply the current sort/filter
  const sortDropdown = document.getElementById("modal-value-sort-dropdown");
  if (sortDropdown) {
    sortModalItems(); // This will maintain the current dropdown selection and apply filters
  } else {
    currentPage = 1;
    filteredItems = [...allItems];
    displayAvailableItems(currentTradeType);
  }
}

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

// Store all items and current trade items
let allItems = [];
const offeringItems = [];
const requestingItems = [];
let currentTradeType = "offering"; // Set default to "offering"

const ITEMS_PER_PAGE = 100;
let currentPage = 1;
let filteredItems = [];

// Fetch all items on load
async function loadItems() {
  try {
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/items/list"
    );
    allItems = await response.json();

    // Sort by cash value descending by default - we'll keep this sort for all views
    allItems.sort((a, b) => {
      const valueA = parseValue(a.cash_value || 0);
      const valueB = parseValue(b.cash_value || 0);
      return valueB - valueA;
    });

    // Reset filtered items and maintain the same sort
    filteredItems = [...allItems];

    // Reset sort dropdown to default "All Items"
    const sortDropdown = document.getElementById("modal-value-sort-dropdown");
    if (sortDropdown) {
      sortDropdown.value = "name-all-items";
    }

    currentTradeType = "offering";

    // Set active state on offering button
    document.querySelectorAll(".available-items-toggle").forEach((button) => {
      button.dataset.active = (button.dataset.type === "offering").toString();
    });

    displayAvailableItems("offering");
    displayAvailableItems("requesting");
  } catch (error) {
    console.error("Error loading items:", error);
    notyf.error("Failed to load items");
  }
}

function addItemToTrade(item, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;

  // Check if item is tradable
  if (item.tradable === 0) {
    notyf.error(`${item.name} is not tradable and cannot be added to trades`);
    return;
  }

  if (items.length >= 8) {
    notyf.error(`You can only add up to 8 items to ${tradeType}`);
    return;
  }

  // Track item count for multiplier display
  const existingIndex = items.findIndex(
    (existingItem) =>
      existingItem &&
      existingItem.name === item.name &&
      existingItem.type === item.type
  );

  if (existingIndex !== -1) {
    const nextEmptyIndex = findNextEmptySlot(items);
    if (nextEmptyIndex !== -1) {
      items[nextEmptyIndex] = item;
    }
  } else {
    items.push(item);
  }

  // Always render trade items first
  renderTradeItems(tradeType);
  updateTradeSummary();

  // Check if preview section exists and is not hidden
  const previewSection = document.getElementById("trade-preview");
  if (
    previewSection &&
    window.getComputedStyle(previewSection).display !== "none"
  ) {
    // Update both sides of the preview to maintain consistency
    renderPreviewItems("preview-offering-items", offeringItems);
    renderPreviewItems("preview-requesting-items", requestingItems);

    // Update value differences
    const valueDifferencesContainer =
      document.getElementById("value-differences");
    if (valueDifferencesContainer) {
      valueDifferencesContainer.innerHTML = renderValueDifferences();
    }
  }

  if (currentTradeType) {
    displayAvailableItems(currentTradeType);
  }
}

// Function to quickly add item from available items
function quickAddItem(itemName, itemType) {
  const item = allItems.find((i) => i.name === itemName && i.type === itemType);
  if (!item) return;

  // Use the global selection state
  if (selectedPlaceholderIndex !== -1 && selectedTradeType) {
    const items =
      selectedTradeType === "Offer" ? offeringItems : requestingItems;

    // Only check if the specific slot is empty
    if (items[selectedPlaceholderIndex]) {
      // If slot is filled, try to find next empty slot
      const nextEmptyIndex = findNextEmptySlot(items);
      if (nextEmptyIndex !== -1) {
        items[nextEmptyIndex] = item;
        renderTradeItems(selectedTradeType);
        updateTradeSummary();
        updatePreviewIfVisible(); // Add this line
      } else {
        notyf.error("No empty slots available");
      }
      return;
    }

    // Insert at the exact selected position
    items[selectedPlaceholderIndex] = item;

    // Store type before clearing selection
    const currentType = selectedTradeType;

    // Clear selection state
    clearPlaceholderSelection();

    // Update UI
    renderTradeItems(currentType);
    updateTradeSummary();
    updatePreviewIfVisible(); // Add this line
  } else {
    // No placeholder selected, find first empty slot
    const items =
      currentTradeType === "offering" ? offeringItems : requestingItems;
    const emptyIndex = findNextEmptySlot(items);

    if (emptyIndex !== -1) {
      items[emptyIndex] = item;
      renderTradeItems(currentTradeType === "offering" ? "Offer" : "Request");
      updateTradeSummary();
      updatePreviewIfVisible(); // Add this line
    } else {
      notyf.error(
        `No empty slots available in ${
          currentTradeType === "offering" ? "Offer" : "Request"
        }`
      );
    }
  }
}

// Add this new helper function
function updatePreviewIfVisible() {
  const previewSection = document.getElementById("trade-preview");
  if (
    previewSection &&
    window.getComputedStyle(previewSection).display !== "none"
  ) {
    // Update both sides of the preview
    renderPreviewItems("preview-offering-items", offeringItems);
    renderPreviewItems("preview-requesting-items", requestingItems);

    // Update value differences
    const valueDifferencesContainer =
      document.getElementById("value-differences");
    if (valueDifferencesContainer) {
      valueDifferencesContainer.innerHTML = renderValueDifferences();
    }
  }
}

// Add new helper function to clear selection
function clearPlaceholderSelection() {
  document.querySelectorAll(".trade-card.empty-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });
  selectedPlaceholderIndex = -1;
  selectedTradeType = null;
}

// Add helper function to find next empty slot
function findNextEmptySlot(items) {
  for (let i = 0; i < 8; i++) {
    if (!items[i]) return i;
  }
  return -1;
}

// Update remove item function to maintain slot positions
function removeItem(index, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  delete items[index];

  renderTradeItems(tradeType);
  updateTradeSummary();

  // Automatically update preview if it's visible
  const previewSection = document.getElementById("trade-preview");
  if (previewSection && previewSection.style.display === "block") {
    renderPreviewItems("preview-offering-items", offeringItems);
    renderPreviewItems("preview-requesting-items", requestingItems);

    // Update value differences
    const valueDifferencesContainer =
      document.getElementById("value-differences");
    if (valueDifferencesContainer) {
      valueDifferencesContainer.innerHTML = renderValueDifferences();
    }
  }
}

// Function to toggle available items display
function toggleAvailableItems(type) {
  const container = document.getElementById("available-items-container");

  // Early return if clicking same type
  if (currentTradeType === type) {
    return;
  }

  // Show container and update title
  container.style.display = "block";
  title.textContent =
    type === "offering" ? "Add Items to Offer" : "Add Items to Request";

  // Update active states on buttons
  document.querySelectorAll(".available-items-toggle").forEach((button) => {
    button.dataset.active = (button.dataset.type === type).toString();
  });

  // Update trade type and reset page
  currentTradeType = type;

  currentPage = 1;

  // Display available items
  displayAvailableItems(type);
}

function displayAvailableItems(type) {
  const container = document.getElementById("modal-available-items-list");
  const searchInput = document.getElementById("modal-item-search");

  if (searchInput) {
    setTimeout(() => {
      searchInput.focus();
    }, 500);
  }

  // Sort filteredItems by cash value descending before displaying
  filteredItems.sort((a, b) => {
    const aValue = parseValue(a.cash_value || "0");
    const bValue = parseValue(b.cash_value || "0");
    return bValue - aValue;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Use tradableItems for display
  const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

  // Get the current category from the dropdown
  const sortDropdown = document.getElementById("modal-value-sort-dropdown");
  const selectedOption = sortDropdown
    ? sortDropdown.options[sortDropdown.selectedIndex].text
    : "All Items";

  // Show no results message if no items match the search
  if (filteredItems.length === 0) {
    const sortDropdown = document.getElementById("modal-value-sort-dropdown");
    const selectedValue = sortDropdown ? sortDropdown.value : "name-all-items";
    const [_, ...categoryParts] = selectedValue.split("-");
    const currentCategory = categoryParts.join("-");

    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="no-results">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
	<rect width="48" height="48" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
		<path d="M21 38c9.389 0 17-7.611 17-17S30.389 4 21 4S4 11.611 4 21s7.611 17 17 17Z" />
		<path stroke-linecap="round" d="M26.657 14.343A7.98 7.98 0 0 0 21 12a7.98 7.98 0 0 0-5.657 2.343m17.879 18.879l8.485 8.485" />
	</g>
</svg>
          <p class="mb-0">${
            currentCategory === "all-items"
              ? "No items matched your search"
              : `No items found under ${currentCategory.replace(/-/g, " ")}`
          }</p>
        </div>
      </div>
    `;
    return;
  }

  renderPagination(totalPages, type);

  // Add a count display
  const countDisplay = `
    <div class="items-count-display mb-3">
      Showing ${startIndex + 1}-${Math.min(
    endIndex,
    filteredItems.length
  )} of ${filteredItems.length} items
    </div>
  `;

  // Show no results message if no items match the search
  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="no-results">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
	<rect width="48" height="48" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
		<path d="M21 38c9.389 0 17-7.611 17-17S30.389 4 21 4S4 11.611 4 21s7.611 17 17 17Z" />
		<path stroke-linecap="round" d="M26.657 14.343A7.98 7.98 0 0 0 21 12a7.98 7.98 0 0 0-5.657 2.343m17.879 18.879l8.485 8.485" />
	</g>
</svg>
          <p class="mb-0">No ${selectedOption} found</p>
        </div>
      </div>
    `;
    return;
  }

  renderPagination(totalPages, type);

  // Find the card-body section and add the new fields
  container.innerHTML =
    countDisplay +
    itemsToDisplay
      .map((item) => {
        return `
        <div class="col-custom-5">
          <div class="card available-item-card ${
            item.tradable === 0 ? "not-tradable" : ""
          }" 
               onclick="${
                 item.tradable === 0
                   ? ""
                   : `quickAddItem('${item.name}', '${item.type}')`
               }"
               ${item.tradable === 0 ? "" : 'data-bs-dismiss="modal"'}>
            <div class="card-header">
              ${item.name}
            </div>
            <div class="position-relative" style="aspect-ratio: 16/9;">
              <img class="card-img w-100 h-100 object-fit-cover"
                   src="${getItemImageUrl(item)}"
                   alt=""
                   onerror="this.onerror=null; this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'; this.style.display='block'; this.previousElementSibling.style.display='none'"
              >
            </div>
           <div class="card-body">
            ${
              item.tradable === 0
                ? '<div class="not-tradable-label">Not Tradable</div>'
                : `
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${item.type}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cash Value:</span>
                  <span class="info-value">${formatValue(
                    item.cash_value
                  )}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Duped Value:</span>
                  <span class="info-value">${formatValue(
                    item.duped_value || 0
                  )}</span>
                </div>
              <div class="info-row ${item.is_limited ? "limited-item" : ""}">
                <span class="info-label">Limited:</span>
                <span class="info-value">
                  ${
                    item.is_limited
                      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
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
                        </svg>Yes`
                      : "No"
                  }
                </span>
              </div>

                <div class="info-row">
                  <span class="info-label">Demand:</span>
                  <span class="info-value demand-${(
                    item.demand || "0"
                  ).toLowerCase()}">${item.demand || "N/A"}</span>
                </div>
                `
            }
          </div>

          </div>
        </div>
      `;
      })
      .join("");
}

// Helper function to get the correct image URL based on item type
function getItemImageUrl(item) {
  return getItemImagePath(item);
}

// Update the sortModalItems function to use the new centralized function
function sortModalItems() {
  const valueSortDropdown = document.getElementById(
    "modal-value-sort-dropdown"
  );
  const searchInput = document.getElementById("modal-item-search");

  if (!valueSortDropdown) {
    console.error("Sort dropdown not found!");
    return;
  }

  const sortValue = valueSortDropdown.value;
  const [sortType, ...categoryParts] = sortValue.split("-");
  const category = categoryParts.join("-");

  // Start with all items
  let filtered = [...allItems];

  // Apply category filter
  if (category === "limited-items") {
    filtered = filtered.filter((item) => item.is_limited);
  } else if (category !== "all-items") {
    const typeMap = {
      vehicles: "Vehicle",
      spoilers: "Spoiler",
      rims: "Rim",
      "body-colors": "Body Color",
      hyperchromes: "HyperChrome",
      textures: "Texture",
      "tire-stickers": "Tire Sticker",
      "tire-styles": "Tire Style",
      drifts: "Drift",
      furnitures: "Furniture",
      horns: "Horn",
      "weapon-skins": "Weapon Skin",
    };

    const targetType = typeMap[category];
    if (targetType) {
      filtered = filtered.filter((item) => item.type === targetType);
    }
  } else {
    // If "All Items" is selected, reset to all items and re-apply initial sort
    filtered = [...allItems];
    filtered.sort((a, b) => {
      const aValue = parseFloat(a.cash_value) || 0;
      const bValue = parseFloat(b.cash_value) || 0;
      return bValue - aValue;
    });
  }

  // Apply search filter if there's a search term
  const searchTerm = searchInput?.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter((item) => {
      const itemName = item.name.toLowerCase();
      const itemType = item.type.toLowerCase();
      return itemName.startsWith(searchTerm) || itemType.startsWith(searchTerm);
    });
  }

  // Always sort by cash value descending, regardless of category
  filtered.sort((a, b) => {
    const aValue = parseFloat(a.cash_value) || 0;
    const bValue = parseFloat(b.cash_value) || 0;
    return bValue - aValue;
  });

  // Update filtered items
  filteredItems = filtered;
  currentPage = 1;

  // Display the results
  displayAvailableItems(currentTradeType);
}

async function updateExpirationOptions() {
  try {
    const token = getCookie("token");
    if (!token) return;

    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`
    );
    const userData = await response.json();
    const premiumTier = userData.premiumtype || 0;
    
    const expirationSelect = document.getElementById("trade-expiration");
    if (!expirationSelect) return;

    // Default to 6 hours
    expirationSelect.value = '6';
    
    // Enable options based on premium tier
    Array.from(expirationSelect.options).forEach(option => {
      const requiredTier = parseInt(option.dataset.premium || 0);
      option.disabled = requiredTier > premiumTier;
    });
  } catch (err) {
    console.error('Failed to fetch user premium status:', err);
  }
}

function parseValue(value) {
  if (typeof value === "number") return value;
  if (!value || value === "N/A") return 0;

  const numStr = value.toString().toLowerCase();
  if (numStr.includes("k")) {
    return parseFloat(numStr) * 1000;
  } else if (numStr.includes("m")) {
    return parseFloat(numStr) * 1000000;
  } else if (numStr.includes("b")) {
    return parseFloat(numStr) * 1000000000;
  }
  return parseFloat(numStr) || 0;
}

// Update renderPagination function to use modal elements
function renderPagination(totalPages, type) {
  const topPagination = document.getElementById("modal-pagination-top");
  const bottomPagination = document.getElementById("modal-pagination-bottom");
  const paginationHTML = `
    <div class="pagination-container">
      <button class="pagination-button" onclick="changePage(${
        currentPage - 1
      }, '${type}')" ${currentPage === 1 ? "disabled" : ""}>
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="#fff" d="m14 18l-6-6l6-6l1.4 1.4l-4.6 4.6l4.6 4.6z" />
</svg>
      </button>
      <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-button" onclick="changePage(${
        currentPage + 1
      }, '${type}')" ${currentPage === totalPages ? "disabled" : ""}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="#fff" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z" />
</svg>
      </button>
    </div>
  `;

  if (topPagination) topPagination.innerHTML = paginationHTML;
  if (bottomPagination) topPagination.innerHTML = paginationHTML;
}

function changePage(newPage, type) {
  if (
    newPage >= 1 &&
    newPage <= Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  ) {
    currentPage = newPage;
    displayAvailableItems(type);
  }
}

// Add debounced search handler
let searchTimeout;
function handleSearch(type) {
  clearTimeout(searchTimeout);
  const searchInput = document.getElementById("modal-item-search");
  const searchTerm = searchInput.value.toLowerCase().trim();
  const clearButton = document.getElementById("clear-search-btn");

  // Show/hide clear button
  if (clearButton) {
    clearButton.style.display = searchTerm ? "block" : "none";
  }

  searchTimeout = setTimeout(() => {
    currentPage = 1;

    // Filter items based on search term
    if (searchTerm) {
      filteredItems = allItems.filter((item) => {
        const itemName = item.name.toLowerCase();
        const itemType = item.type.toLowerCase();
        // Only return true if name or type starts with the search term
        return (
          itemName.startsWith(searchTerm) ||
          // Only search by type if search term is longer than 1 character
          (searchTerm.length > 1 && itemType.startsWith(searchTerm))
        );
      });
    } else {
      filteredItems = [...allItems];
    }

    // Apply current category filter from dropdown
    const sortDropdown = document.getElementById("modal-value-sort-dropdown");
    if (sortDropdown && sortDropdown.value !== "name-all-items") {
      const [sortType, ...categoryParts] = sortDropdown.value.split("-");
      const category = categoryParts.join("-");

      if (category === "limited-items") {
        filteredItems = filteredItems.filter((item) => item.is_limited);
      } else {
        const typeMap = {
          vehicles: "Vehicle",
          spoilers: "Spoiler",
          rims: "Rim",
          "body-colors": "Body Color",
          hyperchromes: "HyperChrome",
          textures: "Texture",
          "tire-stickers": "Tire Sticker",
          "tire-styles": "Tire Style",
          drifts: "Drift",
          furnitures: "Furniture",
          horns: "Horn",
          "weapon-skins": "Weapon Skin",
        };

        const targetType = typeMap[category];
        if (targetType) {
          filteredItems = filteredItems.filter(
            (item) => item.type === targetType
          );
        }
      }
    }

    displayAvailableItems(type);
  }, 300);
}

// Update clearSearch function
function clearSearch() {
  const searchInput = document.getElementById("modal-item-search");
  const clearButton = document.getElementById("clear-search-btn");

  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }

  if (clearButton) {
    clearButton.style.display = "none";
  }

  // Reset to all items but maintain category filter
  currentPage = 1;
  const sortDropdown = document.getElementById("modal-value-sort-dropdown");
  if (sortDropdown) {
    sortModalItems(); // This will apply the current category filter
  } else {
    filteredItems = [...allItems];
    displayAvailableItems(currentTradeType);
  }
}

// Format value for display
function formatValue(value) {
  if (!value) return "0";
  const parsedValue = parseValue(value);
  return formatLargeNumber(parsedValue);
}

let selectedPlaceholderIndex = -1;
let selectedTradeType = null;

// Function to create empty placeholder cards
function createPlaceholderCard(index, tradeType) {
  return `
    <div class="col-md-3 col-6 mb-3">
      <div class="trade-card-wrapper">
        <div class="trade-card empty-slot" 
             onclick="handlePlaceholderClick(${index}, '${tradeType}')">
          <div class="empty-slot-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
		<circle cx="12" cy="12" r="10" />
		<path d="M8 12h8m-4-4v8" />
	</g>
</svg>
            <span>Empty Slot</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Update handlePlaceholderClick function
function handlePlaceholderClick(index, tradeType) {
  // Remove selected state from all slots
  document.querySelectorAll(".trade-card.empty-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });

  // Add selected state to clicked slot
  event.currentTarget.classList.add("selected");

  // Update the global selection state
  selectedPlaceholderIndex = index;
  selectedTradeType = tradeType;

  // Update modal title
  const modalTitle = document.getElementById("availableItemsModalLabel");
  modalTitle.textContent = `Select Item to ${tradeType}`;

  // Set current trade type
  currentTradeType = tradeType === "Offer" ? "offering" : "requesting";

  // Reset search and page
  if (document.getElementById("modal-item-search")) {
    document.getElementById("modal-item-search").value = "";
  }
  currentPage = 1;

  // Display items in modal
  displayAvailableItems(currentTradeType);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("availableItemsModal")
  );
  modal.show();
}

// Function to render empty slots
function renderEmptySlots(containerId, count) {
  const container = document.getElementById(containerId);
  let html = "";
  for (let i = 0; i < count; i++) {
    html += createPlaceholderCard(
      i,
      containerId === "offering-list" ? "Offer" : "Request"
    );
  }
  container.innerHTML = html;
}

function renderTradeItems(tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  const containerId =
    tradeType.toLowerCase() === "offer" ? "offering-list" : "requesting-list";
  const container = document.getElementById(containerId);

  if (!container) return;

  // Create an array of 8 slots
  let slots = new Array(8).fill(null);

  // Count duplicates and track first position
  const itemPositions = new Map();
  const itemCounts = new Map();

  // First pass: count items and record first position for this side only
  Object.entries(items).forEach(([index, item]) => {
    if (!item) return;
    const itemKey = `${item.name}-${item.type}`;
    if (!itemPositions.has(itemKey)) {
      itemPositions.set(itemKey, parseInt(index));
    }
    // Only count items on this side
    itemCounts.set(itemKey, (itemCounts.get(itemKey) || 0) + 1);
  });

  // Second pass: only keep items in their first position
  Object.entries(items).forEach(([index, item]) => {
    if (!item) return;
    const itemKey = `${item.name}-${item.type}`;
    if (parseInt(index) === itemPositions.get(itemKey)) {
      slots[parseInt(index)] = item;
    }
  });

  // Generate HTML
  let html = slots
    .map((item, index) => {
      if (item) {
        const itemKey = `${item.name}-${item.type}`;
        const count = itemCounts.get(itemKey);
        return `
        <div class="col-md-3 col-6 mb-3">
      <div class="trade-card">
        <div class="card-img-container">
          ${getItemImageElement(item)}
          ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
          <div class="remove-icon" onclick="event.stopPropagation(); removeItem(${index}, '${tradeType}')">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg>
          </div>
        </div>
        <div class="trade-card-info">
          <div class="item-name ">${item.name}</div>
          <div class="item-type">${item.type}</div>
        </div>
      </div>
    </div>`;
      } else {
        return createPlaceholderCard(index, tradeType);
      }
    })
    .join("");

  container.innerHTML = html;

  // Reapply selection if needed
  if (selectedTradeType === tradeType && selectedPlaceholderIndex !== -1) {
    const slots = container.querySelectorAll(".trade-card.empty-slot");
    const targetSlot = slots[selectedPlaceholderIndex];
    if (targetSlot) {
      targetSlot.classList.add("selected");
    }
  }
}

// Add these helper functions for value parsing
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

// Update the formatLargeNumber function to show full numbers
function formatLargeNumber(num) {
  return num.toLocaleString("fullwide", { useGrouping: true });
}

// Update trade summary
function updateTradeSummary() {
  const offerCashValue = Object.values(offeringItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.cash_value || 0) : 0),
    0
  );
  const offerDupedValue = Object.values(offeringItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.duped_value || 0) : 0),
    0
  );
  const requestCashValue = Object.values(requestingItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.cash_value || 0) : 0),
    0
  );
  const requestDupedValue = Object.values(requestingItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.duped_value || 0) : 0),
    0
  );
}

// Initialize
loadItems();

// Enable/Disable Confirm Trade Button
function toggleConfirmButton() {
  const hasOfferingItems = Object.values(offeringItems).some((item) => item);
  const hasRequestingItems = Object.values(requestingItems).some(
    (item) => item
  );

  if (hasOfferingItems && hasRequestingItems) {
    confirmTradeButton.removeAttribute("disabled");
  } else {
    confirmTradeButton.setAttribute("disabled", "true");
  }
}

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
      `https://api.jailbreakchangelogs.xyz/trades/delete?id=${tradeId}&token=${token}&nocache=true`,
      {
        method: "DELETE", // Changed from implicit GET to explicit DELETE
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Delete trade error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    notyf.success(
      "Trade advertisement deleted successfully!"
    );
    cleanupTradePreview();
    await loadTradeAds(); // Refresh the trade ads list
  } catch (error) {
    console.error("Error deleting trade:", error);
    notyf.error("Failed to delete trade advertisement");
  }
}

async function makeTradeOffer(tradeId) {
  try {
    const token = getCookie("token");
    if (!token) {
      notyf.error("Please login to make offers");
      return;
    }

    // Get user data to get the user ID
    const userResponse = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`
    );
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data");
    }
    const userData = await userResponse.json();

    // Prepare the request body
    const offerData = {
      id: parseInt(tradeId),
      owner: token
    };

    // Make the offer
    const response = await fetch(
      "https://api.testing.jailbreakchangelogs.xyz/trades/offer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
      }
    );

    if (response.status === 409) {
      notyf.warning("You have already made an offer for this trade");
      return;
    }

    if (response.status === 403) {
      notyf.error("Cannot send offer - this user's settings does not allow direct messages");
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    notyf.success("Offer sent successfully!");
  } catch (error) {
    console.error("Error making offer:", error);
    notyf.error("Failed to send offer");
  }
}

async function editTradeAd(tradeId) {
  try {
    // Update URL with edit parameter
    const url = new URL(window.location);
    url.searchParams.set("edit", tradeId);
    window.history.replaceState({}, "", url);

    // Check authentication
    const token = getCookie("token");
    if (!token) {
      notyf.error("Please login to edit trade advertisements");
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url);
      return;
    }

    // Get user data from token
    const userResponse = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`
    );
    if (!userResponse.ok) {
      console.error("Failed to fetch user data:", userResponse.status);
      throw new Error("Failed to fetch user data");
    }
    const userData = await userResponse.json();

    // Fetch trade details
    const tradeResponse = await fetch(
      `https://api.testing.jailbreakchangelogs.xyz/trades/get?id=${tradeId}&nocache=true`
    );
    if (!tradeResponse.ok) {
      console.error("Trade not found:", tradeResponse.status);
      notyf.error("Trade advertisement not found");
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url);
      return;
    }
    const trade = await tradeResponse.json();

    // Fetch author details
    const authorDetails = await fetchUserDetails(trade.author);

    // Verify ownership
    if (trade.author !== userData.id) {
      notyf.error("You don't have permission to edit this trade advertisement");
      setTimeout(() => {
        window.location.href = "/trading";
      }, 3000);
      return;
    }

    // Show success toast
    notyf.success(
      `Editing Trade #${tradeId} by ${
        authorDetails?.roblox_username || "Unknown"
      }`,
      "",
      { timeOut: 4500 }
    );

    // Reset current trade
    resetTrade();

    // Show the trade preview
    const previewSection = document.getElementById("trade-preview");
    if (previewSection) {
      previewSection.style.display = "block";

      // Load offering items
      for (const item of trade.offering) {
        if (item) {
          addItemToTrade(item, "Offer");
        }
      }

      // Load requesting items
      for (const item of trade.requesting) {
        if (item) {
          addItemToTrade(item, "Request");
        }
      }

      // Update preview
      renderPreviewItems("preview-offering-items", offeringItems);
      renderPreviewItems("preview-requesting-items", requestingItems);

      // Update value differences
      const valueDifferencesContainer =
        document.getElementById("value-differences");
      if (valueDifferencesContainer) {
        valueDifferencesContainer.innerHTML = renderValueDifferences();
      }

      // After loading trade data and before calling previewTrade
      await previewTrade();
      // Set the initial status in the dropdown
      const statusSelect = document.getElementById("trade-status-select");
      if (statusSelect) {
        statusSelect.value = trade.status || "Pending";
      }

      // Hide the confirm trade button
      const confirmTradeBtn = document.getElementById("confirm-trade-btn");
      if (confirmTradeBtn) {
        confirmTradeBtn.style.display = "none";
      }

      // Add update/cancel buttons
      const previewActions = document.querySelector(".preview-actions");
      if (previewActions) {
        previewActions.innerHTML = `
          <button class="btn btn-primary" onclick="updateTradeAd('${tradeId}')">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M5 18.08V19h.92l9.06-9.06l-.92-.92z" opacity="0.3" />
	<path fill="currentColor" d="M20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29s-.51.1-.7.29l-1.83 1.83l3.75 3.75zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM5.92 19H5v-.92l9.06-9.06l.92.92z" />
</svg>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTradeAd('${String(
            trade.id
          )}')">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg>
          </button>
        `;
      }
    }

    // Scroll to trade section
    const tradeSidesWrapper = document.querySelector(".trade-sides-wrapper");
    if (tradeSidesWrapper) {
      tradeSidesWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch (error) {
    console.error("Error in editTradeAd:", error);
    notyf.error("Failed to load trade for editing");
    const url = new URL(window.location);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url);
  }
}

function cancelEdit() {
  const url = new URL(window.location);
  url.searchParams.delete("edit");
  window.history.replaceState({}, "", url);

  // Show the confirm trade button again
  const confirmTradeBtn = document.getElementById("confirm-trade-btn");
  if (confirmTradeBtn) {
    confirmTradeBtn.style.display = "block";
    confirmTradeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <rect width="24" height="24" fill="none" />
            <g fill="#fff">
                <path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0" />
                <path d="M21.894 11.553C19.736 7.236 15.904 5 12 5s-7.736 2.236-9.894 6.553a1 1 0 0 0 0 .894C4.264 16.764 8.096 19 12 19s7.736-2.236 9.894-6.553a1 1 0 0 0 0-.894M12 17c-2.969 0-6.002-1.62-7.87-5C5.998 8.62 9.03 7 12 7s6.002 1.62 7.87 5c-1.868 3.38-4.901 5-7.87 5" />
            </g>
        </svg>
        Preview Trade
    `;
  }

  resetTrade();
  window.location.reload();
}

async function updateTradeAd(tradeId) {
  try {
    const token = getCookie("token");
    if (!token) {
      notyf.error("Please login to update trade advertisements");
      return;
    }

    if (!confirm("Are you sure you want to update this trade advertisement?")) {
      return;
    }

    // Get the selected status from the dropdown
    const statusSelect = document.getElementById("trade-status-select");
    const selectedStatus = statusSelect ? statusSelect.value : "Pending";

    const offeringList = Object.values(offeringItems).filter((item) => item);
    const requestingList = Object.values(requestingItems).filter(
      (item) => item
    );

    if (!offeringList.length || !requestingList.length) {
      notyf.error("Please add items to both sides of the trade");
      return;
    }

    const apiUrl = `https://api.testing.jailbreakchangelogs.xyz/trades/update?id=${tradeId}&nocache=true`;

    const tradeData = {
      offering: offeringList.map((item) => item.id).join(","),
      requesting: requestingList.map((item) => item.id).join(","),
      status: selectedStatus,
      owner: token
    };

    const response = await fetch(apiUrl, {
      method: "POST", 
      headers: {
      "Content-Type": "application/json",
      },
      body: JSON.stringify(tradeData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Update trade error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Clean up and refresh
    cleanupTradePreview();
    await loadTradeAds();
    
    // Show success message
    notyf.success("Trade advertisement updated successfully!");
  } catch (error) {
    console.error("Error updating trade:", error);
    notyf.error("Failed to update trade advertisement");
  }
}

function sortTradeAds(order) {
  tradeSortOrder = order;
  allTradeAds.sort((a, b) => {
    const timeA = parseInt(a.created_at);
    const timeB = parseInt(b.created_at);
    return order === "latest" ? timeB - timeA : timeA - timeB;
  });
  loadTradeAds();
}

// Function to create a trade ad
async function loadTradeAds() {
  try {
    const tradeAdsSection = document.querySelector(".trade-ads-section");
    if (!tradeAdsSection) return;

    // Show loading state
    tradeAdsSection.innerHTML = `
      <div class="trade-ads-grid">
        <div class="trade-ad header-container">
          <div class="d-flex justify-content-between align-items-center">
            <h3 class="trade-ads-header">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" style="margin-right: 8px;">
        <rect width="16" height="16" fill="none" />
        <g fill="#fff">
            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
            <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
        </g>
    </svg>
    Recent Trade Advertisements
</h3>

            <div class="sort-controls">
              <select class="form-select form-select-sm" onchange="sortTradeAds(this.value)">
                <option value="latest" ${
                  tradeSortOrder === "latest" ? "selected" : ""
                }>Latest First</option>
                <option value="oldest" ${
                  tradeSortOrder === "oldest" ? "selected" : ""
                }>Oldest First</option>
              </select>
            </div>
          </div>
        </div>
        ${Array(TRADES_PER_PAGE).fill(createSkeletonTradeAd()).join("")}
      </div>
    `;

    // Fetch and process data
    const response = await fetch(
      "https://api.testing.jailbreakchangelogs.xyz/trades/list?nocache=true"
    );
    const data = await response.json();
    allTradeAds = Array.isArray(data) ? data : [];

    // Sort trade ads
    allTradeAds.sort((a, b) => {
      const timeA = parseInt(a.created_at);
      const timeB = parseInt(b.created_at);
      return tradeSortOrder === "latest" ? timeB - timeA : timeA - timeB;
    });

    if (allTradeAds.length === 0) {
      tradeAdsSection.innerHTML = `
        <div class="trade-ads-grid">
          <div class="trade-ad header-container">
            <div class="d-flex justify-content-between align-items-center">
             <h3 class="trade-ads-header">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" style="margin-right: 8px;">
        <rect width="16" height="16" fill="none" />
        <g fill="#fff">
            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
            <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
        </g>
    </svg>
    Recent Trade Advertisements
</h3>

              <div class="sort-controls">
                <select class="form-select form-select-sm" disabled>
                  <option>Latest First</option>
                </select>
              </div>
            </div>
          </div>
          <div class="no-trades-message">No trade advertisements found</div>
        </div>
      `;
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(allTradeAds.length / TRADES_PER_PAGE);
    const startIndex = (currentTradesPage - 1) * TRADES_PER_PAGE;
    const endIndex = startIndex + TRADES_PER_PAGE;
    const currentPageTrades = allTradeAds.slice(startIndex, endIndex);

    // Create HTML for current page trades
    const tradePromises = currentPageTrades.map((trade) =>
      createTradeAdHTML(trade)
    );
    const tradeHTMLs = await Promise.all(tradePromises);

    // Render the final HTML
    tradeAdsSection.innerHTML = `
      <div class="trade-ads-grid">
        <div class="trade-ad header-container">
          <div class="d-flex justify-content-between align-items-center">
           <h3 class="trade-ads-header">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" style="margin-right: 8px;">
        <rect width="16" height="16" fill="none" />
        <g fill="#fff">
            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
            <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
        </g>
    </svg>
    Recent Trade Advertisements
</h3>

            <div class="sort-controls">
              <select class="form-select form-select-sm" onchange="sortTradeAds(this.value)">
                <option value="latest" ${
                  tradeSortOrder === "latest" ? "selected" : ""
                }>Latest First</option>
                <option value="oldest" ${
                  tradeSortOrder === "oldest" ? "selected" : ""
                }>Oldest First</option>
              </select>
            </div>
          </div>
        </div>
        ${tradeHTMLs.join("")}
      </div>
      ${
        totalPages > 1
          ? `
        <div class="trade-ads-pagination">
          <button class="pagination-button" onclick="changeTradesPage(${
            currentTradesPage - 1
          })" ${currentTradesPage === 1 ? "disabled" : ""}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14 7l-5 5l5 5" />
</svg>
          </button>
          <span class="pagination-info">Page ${currentTradesPage} of ${totalPages}</span>
          <button class="pagination-button" onclick="changeTradesPage(${
            currentTradesPage + 1
          })" ${currentTradesPage === totalPages ? "disabled" : ""}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 7l5 5l-5 5" />
</svg>
          </button>
        </div>
      `
          : ""
      }
    `;
  } catch (error) {
    console.error("Error loading trade ads:", error);
    notyf.error("Failed to load trade ads");
  }
}

function changeTradesPage(newPage) {
  if (
    newPage >= 1 &&
    newPage <= Math.ceil(allTradeAds.length / TRADES_PER_PAGE)
  ) {
    currentTradesPage = newPage;
    loadTradeAds();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const availableItemsModal = document.getElementById("availableItemsModal");
  if (availableItemsModal) {
    availableItemsModal.addEventListener("hidden.bs.modal", handleModalClose);
  }

  // Check login status immediately
  const token = getCookie("token");
  if (!token) {
    notyf.error("Please login to create trade advertisements");
    // Save current URL to redirect back after login
    localStorage.setItem("redirectAfterLogin", window.location.href);
  }

  // Load items first
  await loadItems();

  // Check for edit parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const editTradeId = urlParams.get("edit");
  if (editTradeId) {
    // Trigger edit functionality
    editTradeAd(editTradeId);
  }

  // Then load trade ads
  await loadTradeAds();

  // Check if returning from auth
  const isReturnFromAuth = document.referrer.includes("/roblox");

  // Restore pending trade if it exists
  const pendingTrade = localStorage.getItem("pendingTrade");
  if (pendingTrade) {
    try {
      const { offering, requesting } = JSON.parse(pendingTrade);
      offering.forEach(item => addItemToTrade(item, "Offer"));
      requesting.forEach(item => addItemToTrade(item, "Request"));
      localStorage.removeItem("pendingTrade");
      
      if (isReturnFromAuth) {
        notyf.success("Your trade items have been restored");
      }
    } catch (err) {
      console.error("Error restoring pending trade:", err);
      notyf.error("Failed to restore your pending trade");
    }
  }

  // Initialize both sections with 8 empty slots
  renderEmptySlots("offering-list", 8);
  renderEmptySlots("requesting-list", 8);

  // Initial renders
  renderTradeItems("Offer");
  renderTradeItems("Request");

  // Make sure preview section exists
  const previewSection = document.getElementById("trade-preview");
  if (!previewSection) {
    console.warn("Trade preview section not found in DOM");
  }
});

// Function to fetch item details by ID
async function fetchItemDetails(id) {
  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/items/get?id=${id}`
    );
    return await response.json();
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
}

async function fetchUserDetails(userId) {
  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/?id=${userId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

function hasValidRobloxData(authorDetails) {
  return !!(
    authorDetails?.roblox_id &&
    authorDetails?.roblox_username &&
    authorDetails?.roblox_display_name &&
    authorDetails?.roblox_avatar &&
    authorDetails?.roblox_join_date
  );
}

async function createTradeAdHTML(trade) {
  // Start with a skeleton template
  const container = document.createElement("div");
  container.innerHTML = createSkeletonTradeAd();
  const tradeAdElement = container.firstElementChild;

  try {
    // Fetch user details first
    const authorDetails = await fetchUserDetails(trade.author);

    // Skip this trade ad if author has no valid Roblox data
    if (!hasValidRobloxData(authorDetails)) {
      return "";
    }

    // Process item counts for multipliers
    const offeringCounts = {};
    const requestingCounts = {};
    
    trade.offering.split(",").forEach((id) => {
      offeringCounts[id] = (offeringCounts[id] || 0) + 1;
    });
    trade.requesting.split(",").forEach((id) => {
      requestingCounts[id] = (requestingCounts[id] || 0) + 1;
    });

    // Create item HTML helper function
    const createItemHTML = async (itemId, isOffering) => {
      const item = await fetchItemDetails(itemId);
      if (!item) return "";

      const count = isOffering ? offeringCounts[itemId] : requestingCounts[itemId];
      const multiplierHTML =
        count > 1 ? `<div class="item-multiplier">×${count}</div>` : "";

      return `
        <div class="trade-ad-item" onclick="showBottomSheet(${JSON.stringify(
          item
        ).replace(/"/g, "&quot;")})">
          <div class="trade-ad-item-content">
            <div class="item-image-container">
              <img src="${getItemImagePath(item)}" 
                   alt="${item.name}"
                   onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">
              ${multiplierHTML}
            </div>
            <div class="item-details">
              <div class="item-name">${item.name}</div>
              <div class="item-values">
                <div class="value-badge">
                  <span class="value-label">Type:</span>
                  <span class="value-amount">${item.type}</span>
                </div>
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
              </div>
            </div>
          </div>
        </div>`;
    };

    // Fetch and process items with deduplication
    const [offeringItemsHtml, requestingItemsHtml] = await Promise.all([
      Promise.all(
        [...new Set(trade.offering.split(","))]
          .filter((id) => id)
          .map(id => createItemHTML(id, true))
      ),
      Promise.all(
        [...new Set(trade.requesting.split(","))]
          .filter((id) => id)
          .map(id => createItemHTML(id, false))
      ),
    ]);

    function getFallbackAvatar(username) {
      return "assets/default-avatar.png";
    }

    tradeAdElement.innerHTML = `
       <div class="trade-ad" data-trade-id="${trade.id}">
        <div class="trade-status ${(trade.status || "Pending").toLowerCase()}">
          ${trade.status || "Pending"}
        </div>
        <div class="trader-info">
          <img src="${
            authorDetails?.roblox_avatar ||
            getFallbackAvatar(authorDetails?.roblox_username)
          }" 
            alt="${authorDetails?.roblox_username || "Unknown"}" 
            class="trader-avatar"
            onerror="this.onerror=null; this.src='${getFallbackAvatar(
              authorDetails?.roblox_username
            )}'"
            width="64"
            height="64">
            <div class="trader-details">
              <a href="https://www.roblox.com/users/${
                authorDetails?.roblox_id
              }/profile" 
                class="trader-name"
                target="_blank" 
                rel="noopener noreferrer">
                ${authorDetails?.roblox_display_name || "Unknown"} 
                <span class="text-muted">(${
                  authorDetails?.roblox_id || "Unknown ID"
                })</span>
              </a>
              <a href="https://www.roblox.com/users/${
                authorDetails?.roblox_id
              }/profile" 
                class="trader-username text-muted" 
                target="_blank" 
                rel="noopener noreferrer">
                @${authorDetails?.roblox_username || "unknown"}
              </a>
            </div>
          </div>
        </div>

        <div class="trade-sides-container">
          <div class="trade-side offering">
            <div class="trade-side-label">Offering</div>
            <div class="trade-items-grid">
              ${offeringItemsHtml.join("")}
            </div>
          </div>

          <div class="trade-side requesting">
            <div class="trade-side-label">Requesting</div>
            <div class="trade-items-grid">
              ${requestingItemsHtml.join("")}
            </div>
          </div>
        </div>

      <div class="trade-ad-footer">
      <div class="d-flex justify-content-between align-items-center w-100">
        <div class="trade-timestamp">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<g fill="#748d92">
		<path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
		<path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
		<path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
	</g>
</svg> ${formatTimestamp(trade.created_at)}
        </div>
        <div class="d-flex align-items-center gap-2">
          <a href="/trading/ad/${String(
            trade.id
          )}" class="btn btn-sm btn-outline-info">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
		<path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0" />
		<path d="M2 12c1.6-4.097 5.336-7 10-7s8.4 2.903 10 7c-1.6 4.097-5.336 7-10 7s-8.4-2.903-10-7" />
	</g>
</svg> View Details
          </a>
           ${
            authorDetails?.id !== currentUserId 
            ? `<button class="btn btn-sm btn-success" onclick="makeTradeOffer('${String(trade.id)}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                  <rect width="24" height="24" fill="none" />
                  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                    <path d="M3 12h4l3 8l4-16l3 8h4" />
                  </g>
                </svg> Make Offer
              </button>`
            : ''
          }
          ${
            authorDetails?.id === currentUserId
              ? `
            <button class="btn btn-sm btn-outline-primary" onclick="editTradeAd('${String(
              trade.id
            )}')">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M5 18.08V19h.92l9.06-9.06l-.92-.92z" opacity="0.3" />
	<path fill="currentColor" d="M20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29s-.51.1-.7.29l-1.83 1.83l3.75 3.75zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM5.92 19H5v-.92l9.06-9.06l.92.92z" />
</svg>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTradeAd('${String(
              trade.id
            )}')">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg>
            </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  </div>`;
  } catch (error) {
    console.error("Error creating trade ad:", error);
    // Keep the skeleton state if there's an error
  }

  return tradeAdElement.outerHTML;
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
  // Convert Unix timestamp to milliseconds if it's in seconds
  const timestampMs =
    timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(timestampMs);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";

  // Minutes
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  // Hours
  const hours = Math.floor(diffInSeconds / 3600);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  // Days
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  // Months
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  // For older dates, return formatted date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Add event listeners when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're returning from Roblox auth
  const isReturnFromAuth = document.referrer.includes("/roblox");

  // Check for pending trade and restore if needed
  const pendingTrade = localStorage.getItem("pendingTrade");
  if (pendingTrade) {
    try {
      const { side1, side2 } = JSON.parse(pendingTrade);
      // Restore trade items
      side1.forEach((item) => addItemToTrade(item, "Offer"));
      side2.forEach((item) => addItemToTrade(item, "Request"));
      // Clear pending trade
      localStorage.removeItem("pendingTrade");
      // Show preview if returning from auth
      if (isReturnFromAuth) {
        previewTrade();
      }
    } catch (err) {
      console.error("Error restoring pending trade:", err);
      notyf.error("Failed to restore your pending trade");
    }
  }

  // Initialize both sections with 8 empty slots
  renderEmptySlots("offering-list", 8);
  renderEmptySlots("requesting-list", 8);

  // Initial renders
  renderTradeItems("Offer");
  renderTradeItems("Request");
});

// Initial Render
renderTradeItems("Offer");
renderTradeItems("Request");

async function previewTrade() {
  if (!(await canCreateTradeAd())) {
    return;
  }

  // Get elements and check URL parameters
  const previewSection = document.getElementById("trade-preview");
  const availableContainer = document.getElementById("available-items-container");
  const confirmButton = document.getElementById("confirm-trade-btn");
  const urlParams = new URLSearchParams(window.location.search);
  const isEditing = urlParams.has("edit");
  const tradeId = urlParams.get("edit");

  // Check if required elements exist
  if (!previewSection || !availableContainer || !confirmButton) {
    console.error("Required elements not found in the DOM");
    notyf.error("An error occurred while preparing the trade preview");
    return;
  }

  const hasOfferingItems = Object.values(offeringItems).some((item) => item);
  const hasRequestingItems = Object.values(requestingItems).some(
    (item) => item
  );

  if (!hasOfferingItems || !hasRequestingItems) {
    notyf.error(
      "Please add at least one item to both offering and requesting sections"
    );
    return;
  }

  // Show/hide sections
  previewSection.style.display = "block";
  availableContainer.style.display = "none";
  confirmButton.style.display = "none";

  // Update expiration options based on premium tier
  await updateExpirationOptions();

  // Render preview items
  renderPreviewItems("preview-offering-items", offeringItems);
  renderPreviewItems("preview-requesting-items", requestingItems);

  // Add value differences
  const valueDifferencesContainer =
    document.getElementById("value-differences");
  if (!valueDifferencesContainer) {
    console.error("Value differences container not found!");
    return;
  }
  valueDifferencesContainer.innerHTML = renderValueDifferences();

  if (isEditing) {
    // Create status select container
    const statusSelectContainer = document.createElement("div");
    statusSelectContainer.className = "confirm-trade-wrapper mt-4";
    statusSelectContainer.innerHTML = `
      <div class="status-container">
        <label for="trade-status-select" class="form-label">Trade Status</label>
        <select id="trade-status-select" class="form-select">
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
    `;

    // Insert status select after value differences
    valueDifferencesContainer.insertAdjacentElement(
      "afterend",
      statusSelectContainer
    );
  }

  // Add preview actions
  const previewActions = document.createElement("div");
  previewActions.className = "preview-actions mt-4 text-center";

  if (isEditing) {
    previewActions.innerHTML = `
      <button class="btn btn-primary" onclick="updateTradeAd('${tradeId}')">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="#fff" d="M21 7v12q0 .825-.587 1.413T19 21H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h12zm-9 11q1.25 0 2.125-.875T15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18m-6-8h9V6H6z" />
</svg>Update Trade
      </button>
      <button class="btn btn-secondary ms-2" onclick="cancelEdit()">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
	<rect width="32" height="32" fill="none" />
	<path fill="#fff" d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zm3.6 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" />
</svg>Cancel
      </button>
    `;
  } else {
    previewActions.innerHTML = `
      <button class="btn btn-primary" onclick="createTradeAd()">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
		<circle cx="12" cy="12" r="10" />
		<path d="M8 12h8m-4-4v8" />
	</g>
</svg></i> Create Trade Ad
      </button>
    `;
  }

  // Insert preview actions
  const existingPreviewActions = document.querySelector(".preview-actions");
  if (existingPreviewActions) {
    existingPreviewActions.remove();
  }

  if (isEditing) {
    // Insert after status select container
    const statusSelectContainer = document.querySelector(
      ".confirm-trade-wrapper"
    );
    if (statusSelectContainer) {
      statusSelectContainer.insertAdjacentElement("afterend", previewActions);
    } else {
      console.error(
        "Status select container not found for inserting preview actions!"
      );
      valueDifferencesContainer.insertAdjacentElement(
        "afterend",
        previewActions
      );
    }
  } else {
    valueDifferencesContainer.insertAdjacentElement("afterend", previewActions);
  }
}

function renderPreviewItems(containerId, items) {
  const container = document.getElementById(containerId);
  const values = calculateSideValues(items);

  // Count duplicates
  const itemCounts = new Map();
  Object.values(items)
    .filter((item) => item)
    .forEach((item) => {
      const itemKey = `${item.name}-${item.type}`;
      itemCounts.set(itemKey, (itemCounts.get(itemKey) || 0) + 1);
    });

  // Create unique items array with counts
  const uniqueItems = [];
  const processedKeys = new Set();

  Object.values(items)
    .filter((item) => item)
    .forEach((item) => {
      const itemKey = `${item.name}-${item.type}`;
      if (!processedKeys.has(itemKey)) {
        processedKeys.add(itemKey);
        uniqueItems.push({
          item,
          count: itemCounts.get(itemKey),
        });
      }
    });

  const itemsHtml = uniqueItems
    .map(
      ({ item, count }) => `
  <div class="preview-item" 
       data-bs-toggle="tooltip" 
       data-bs-placement="top" 
       title="Limited: ${item.is_limited ? "Yes" : "No"} | Demand: ${
        item.demand || "N/A"
      }">
    <div class="preview-item-image-container">
      ${getItemImageElement(item)}
      ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
    </div>
    <div class="item-name">
      ${item.name}
      ${
        item.is_limited
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
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
                        </svg>`
          : ""
      }
    
    </div>
    <div class="item-details">
      <div class="demand-indicator demand-${(
        item.demand || "0"
      ).toLowerCase()}">
        Demand: ${item.demand || "N/A"}
      </div>
    </div>
  </div>
`
    )
    .join("");

  const valuesHtml = `
    <div class="side-values-summary">
      <h6>
        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                        >
                          <rect width="20" height="20" fill="none" />
                          <path
                            fill="currentColor"
                            d="M15 2H5c-.6 0-1 .4-1 1v14c0 .6.4 1 1 1h10c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1M6.5 16.8c-.7 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2s1.2.6 1.2 1.2s-.5 1.2-1.2 1.2m0-3.6c-.7 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2s1.2.6 1.2 1.2s-.5 1.2-1.2 1.2m3.5 7c-.7 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2s1.2.6 1.2 1.2s-.5 1.2-1.2 1.2m0-3.6c-.7 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2s1.2.6 1.2 1.2s-.5 1.2-1.2 1.2m0-3.4c-.7 0-1.2-.6-1.2-1.2s.5-1.4 1.2-1.4s1.2.6 1.2 1.2s-.5 1.4-1.2 1.4m4.8 5.7c0 .7-.6 1.2-1.2 1.2s-1.2-.6-1.2-1.2V12c0-.7.6-1.2 1.2-1.2s1.2.6 1.2 1.2zm-1.3-5.7c-.7 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2s1.2.6 1.2 1.2s-.5 1.2-1.2 1.2M15 6.4H5V3h10z"
                          />
                        </svg>
        ${
          containerId === "preview-offering-items" ? "Offering" : "Requesting"
        } Totals
      </h6>
      <div class="side-value-row">
        <span class="text-muted">Cash Value:</span>
        <span class="badge" style="background-color: ${
          containerId === "preview-offering-items" ? "#00c853" : "#2196f3"
        }">${formatValue(values.cashValue, true)}</span>
      </div>
      <div class="side-value-row">
        <span class="text-muted">Duped Value:</span>
        <span class="badge" style="background-color: ${
          containerId === "preview-offering-items" ? "#00c853" : "#2196f3"
        }">${formatValue(values.dupedValue, true)}</span>
      </div>
    </div>
  `;
  container.innerHTML = `
    <div class="preview-items-grid">
      ${itemsHtml}
    </div>
    ${valuesHtml}
  `;
}

function calculateSideValues(items) {
  const cashValue = Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => sum + parseValue(item.cash_value || 0), 0);

  const dupedValue = Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => sum + parseValue(item.duped_value || 0), 0);

  return { cashValue, dupedValue };
}

function renderValueDifferences() {
  const offerValues = calculateSideValues(offeringItems);
  const requestValues = calculateSideValues(requestingItems);

  const cashDiff = requestValues.cashValue - offerValues.cashValue;
  const dupedDiff = requestValues.dupedValue - offerValues.dupedValue;

  return `
    <div class="value-differences">
      <h6 class="difference-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3l4 4l-4 4m4-4H4m4 14l-4-4l4-4m-4 4h16" />
</svg>Value Differences
      </h6>
      <div class="difference-content">
        <div class="difference-row">
          <div class="difference-label">
            <span>Cash Value Difference:</span>
            <span class="difference-value ${
              cashDiff >= 0 ? "positive" : "negative"
            }">
              ${cashDiff >= 0 ? "+" : ""}${formatValue(cashDiff, true)}
            </span>
          </div>
        <div class="difference-indicator">
          ${
            cashDiff > 0
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <rect width="24" height="24" fill="none" />
                  <g fill="none" fill-rule="evenodd">
                    <path d="M24 0v24H0V0zM12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.105.074l.014.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.092l.01-.009l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                    <path fill="#00c853" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m-4.242 9.996a1 1 0 0 0 1.414 0L11 10.167v6.076a1 1 0 1 0 2 0v-6.076l1.829 1.829a1 1 0 0 0 1.414-1.415l-3.536-3.535a1 1 0 0 0-1.414 0L7.758 10.58a1 1 0 0 0 0 1.415Z" />
                  </g>
                </svg>`
              : cashDiff < 0
              ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <rect width="24" height="24" fill="none" />
                  <path fill="#ff5252" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m3.69 11.86l-3 2.86a.5.5 0 0 1-.15.1a.5.5 0 0 1-.16.1a.94.94 0 0 1-.76 0a1 1 0 0 1-.33-.21l-3-3a1 1 0 0 1 1.42-1.42l1.29 1.3V8a1 1 0 0 1 2 0v5.66l1.31-1.25a1 1 0 0 1 1.38 1.45" />
                </svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                  <rect width="16" height="16" fill="none" />
                  <path fill="#748d92" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" />
                </svg>`
          }
        </div>
        </div>
        <div class="difference-row">
          <div class="difference-label">
            <span>Duped Value Difference:</span>
            <span class="difference-value ${
              dupedDiff >= 0 ? "positive" : "negative"
            }">
              ${dupedDiff >= 0 ? "+" : ""}${formatValue(dupedDiff, true)}
            </span>
          </div>
          <div class="difference-indicator">
              ${
                dupedDiff > 0
                  ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <rect width="24" height="24" fill="none" />
                      <g fill="none" fill-rule="evenodd">
                        <path d="M24 0v24H0V0zM12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.105.074l.014.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.092l.01-.009l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                        <path fill="#00c853" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m-4.242 9.996a1 1 0 0 0 1.414 0L11 10.167v6.076a1 1 0 1 0 2 0v-6.076l1.829 1.829a1 1 0 0 0 1.414-1.415l-3.536-3.535a1 1 0 0 0-1.414 0L7.758 10.58a1 1 0 0 0 0 1.415Z" />
                      </g>
                    </svg>`
                  : dupedDiff < 0
                  ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <rect width="24" height="24" fill="none" />
                      <path fill="#ff5252" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m3.69 11.86l-3 2.86a.5.5 0 0 1-.15.1a.5.5 0 0 1-.16.1a.94.94 0 0 1-.76 0a1 1 0 0 1-.33-.21l-3-3a1 1 0 0 1 1.42-1.42l1.29 1.3V8a1 1 0 0 1 2 0v5.66l1.31-1.25a1 1 0 0 1 1.38 1.45" />
                    </svg>`
                  : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                      <rect width="16" height="16" fill="none" />
                      <path fill="#748d92" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" />
                    </svg>`
              }
            </div>
        </div>
      </div>
    </div>
  `;
}

function calculateTotalValue(items, valueType) {
  return Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => parseValue(item[valueType] || 0), 0);
}
function resetTrade() {
  try {
    // Clear items
    offeringItems.length = 0;
    requestingItems.length = 0;

    // Reset UI
    renderTradeItems("Offer");
    renderTradeItems("Request");
    updateTradeSummary();

    // Get DOM elements
    const previewSection = document.getElementById("trade-preview");
    const availableContainer = document.getElementById(
      "available-items-container"
    );

    // Update visibility
    if (previewSection) {
      previewSection.style.display = "none";
    }
    if (availableContainer) {
      availableContainer.style.display = "block";
    }

    // Remove any extra preview button that might have been added
    const extraPreviewBtn =
      availableContainer?.querySelector("#confirm-trade-btn");
    if (extraPreviewBtn) {
      extraPreviewBtn.remove();
    }

    // Remove editing class if container exists
    if (availableContainer) {
      availableContainer.classList.remove("editing");
    }

    // Remove the confirm wrapper if it exists
    const confirmWrapper = document.querySelector(".confirm-trade-wrapper");
    if (confirmWrapper) {
      confirmWrapper.remove();
    }
  } catch (error) {
    console.error("Error in resetTrade:", error);
    notyf.error("An error occurred while resetting the trade");
  }
}

// Function to create a trade advertisement
async function createTradeAd() {
  if (!(await canCreateTradeAd())) {
    return;
  }

  try {
    // Check for authentication token first
    const token = getCookie("token");
    if (!token) {
      notyf.error("Please login to create a trade advertisement");
      return;
    }

    // Get user data to check premium tier
    const userResponse = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`
    );
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data");
    }
    const userData = await userResponse.json();
    const premiumTier = userData.premiumtype || 0;

    // Get items from both sides
    const offeringList = Object.values(offeringItems).filter((item) => item);
    const requestingList = Object.values(requestingItems).filter(
      (item) => item
    );

    // Validate trade
    if (!offeringList.length || !requestingList.length) {
      notyf.error("Please add items to both sides of the trade");
      return;
    }

    // Get selected expiration time and validate against premium tier
    const expirationSelect = document.getElementById("trade-expiration");
    const selectedOption = expirationSelect.options[expirationSelect.selectedIndex];
    const requiredTier = parseInt(selectedOption.dataset.premium || 0);
    
    if (requiredTier > premiumTier) {
      notyf.error(`Your premium tier doesn't allow ${selectedOption.text} expiration time`);
      expirationSelect.classList.add('is-invalid');
      return;
    }

    const expires = parseInt(expirationSelect.value);

    // Prepare trade data
    const tradeData = {
      offering: offeringList.map((item) => item.id).join(","),
      requesting: requestingList.map((item) => item.id).join(","),
      owner: token,
      expires: expires
    };

    // Make API call to create trade
    const response = await fetch(
      "https://api.testing.jailbreakchangelogs.xyz/trades/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tradeData),
      }
    );

    if (response.status === 409) {
      notyf.warning("You already have an active trade advertisement with the selected items");
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // On success
    notyf.success(
      "Trade advertisement created successfully!"
    );
    resetTrade();

    // Update trade ads list without modifying the preview button
    await loadTradeAds();
  } catch (error) {
    console.error("Error creating trade:", error);
    notyf.error("Failed to create trade advertisement");
  }
  // Initialize bottom sheet
  initializeBottomSheet();

  // Add resize handler to hide bottom sheet on desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && activeBottomSheet) {
      hideBottomSheet();
    }
  });

  document
    .getElementById("availableItemsModal")
    .addEventListener("hidden.bs.modal", () => {
      // Reset search input
      const searchInput = document.getElementById("modal-item-search");
      if (searchInput) {
        searchInput.value = "";
      }

      // Don't reset filtered items, instead reapply the current sort/filter
      const sortDropdown = document.getElementById("modal-value-sort-dropdown");
      if (sortDropdown) {
        sortModalItems();
      }

      // Reset to first page
      currentPage = 1;

      // Display items with current filters
      displayAvailableItems(currentTradeType);
    });
}

function cleanupTradePreview() {
  // Hide trade preview
  const previewSection = document.getElementById("trade-preview");
  if (previewSection) {
    previewSection.style.display = "none";
  }

  // Reset trade items
  resetTrade();

  // Clean URL by removing edit parameter
  const url = new URL(window.location);
  url.searchParams.delete("edit");
  window.history.replaceState({}, "", url);

  // Show confirm trade button
  const confirmTradeBtn = document.getElementById("confirm-trade-btn");
  if (confirmTradeBtn) {
    confirmTradeBtn.style.display = "block";
  }
}

// Configure toastr
toastr.options = {
  positionClass: "toast-bottom-right",
  closeButton: true,
  progressBar: true,
  preventDuplicates: true,
  timeOut: 3000,
};

// Store all items and current trade items
let allItems = [];
const offeringItems = [];
const requestingItems = [];
let currentTradeType = "offering"; // Set default to "offering"

const ITEMS_PER_PAGE = 100;
let currentPage = 1;
let filteredItems = [];

// Fetch all items on load
// Fetch all items on load
async function loadItems() {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list"
    );
    allItems = await response.json();

    // Initialize filteredItems with all items
    filteredItems = [...allItems];

    currentTradeType = "offering";

    // Set active state on offering button
    document.querySelectorAll(".available-items-toggle").forEach((button) => {
      button.dataset.active = (button.dataset.type === "offering").toString();
    });

    // Sort items initially by name-all-items
    const sortDropdown = document.getElementById("modal-value-sort-dropdown");
    if (sortDropdown) {
      sortDropdown.value = "name-all-items";
      sortModalItems(); // This will trigger the initial sort and display
    } else {
      // If dropdown isn't available, just display items
      displayAvailableItems("offering");
    }

    displayAvailableItems("requesting");
  } catch (error) {
    console.error("Error loading items:", error);
    toastr.error("Failed to load items");
  }
}

// Helper function to get item images (copied from trading.js)
function getItemImageElement(item) {
  // Special handling for HyperShift
  if (item.name === "HyperShift") {
    return `<img src="/assets/images/items/hyperchromes/HyperShift.gif" 
                 class="card-img-top w-100 h-100 object-fit-cover"
                 alt="${item.name}"
                 onload="this.parentElement.previousElementSibling.style.display='none'">`;
  }

  if (item.type === "Drift") {
    return `<img src="/assets/images/items/480p/drifts/${item.name}.webp" 
                 class="card-img-top w-100 h-100 object-fit-cover"
                 alt="${item.name}"
                 onload="this.parentElement.previousElementSibling.style.display='none'"
                 onerror="this.onerror=null; this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`;
  }

  return `<img src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
    item.name
  }.webp" 
               class="card-img-top w-100 h-100 object-fit-cover"
               alt="${item.name}"
               onload="this.parentElement.previousElementSibling.style.display='none'"
               onerror="this.onerror=null; this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`;
}

// Calculate values for each side
function calculateSideValues(items) {
  const cashValue = Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => sum + parseValue(item.cash_value || 0), 0);

  const dupedValue = Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => sum + parseValue(item.duped_value || 0), 0);

  return { cashValue, dupedValue };
}

// Render the preview items
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

  // In both calculator.js and trading.js, update the itemsHtml section in renderPreviewItems:
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
            ? '<i class="bi bi-star-fill text-warning ms-1"></i>'
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
        <i class="bi bi-calculator me-2"></i>
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

// Render value differences
function renderValueDifferences() {
  const offerValues = calculateSideValues(offeringItems);
  const requestValues = calculateSideValues(requestingItems);

  const cashDiff = requestValues.cashValue - offerValues.cashValue;
  const dupedDiff = requestValues.dupedValue - offerValues.dupedValue;

  return `
    <div class="value-differences">
      <h6 class="difference-title">
        <i class="bi bi-arrow-left-right me-2"></i>Value Differences
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
            <i class="bi ${
              cashDiff > 0
                ? "bi-arrow-up-circle-fill text-success"
                : cashDiff < 0
                ? "bi-arrow-down-circle-fill text-danger"
                : "bi-dash-circle-fill text-muted"
            }"></i>
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
            <i class="bi ${
              dupedDiff > 0
                ? "bi-arrow-up-circle-fill text-success"
                : dupedDiff < 0
                ? "bi-arrow-down-circle-fill text-danger"
                : "bi-dash-circle-fill text-muted"
            }"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Add item to trade
function addItemToTrade(item, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  if (items.length >= 8) {
    toastr.error(`You can only add up to 8 items to ${tradeType}`);
    return;
  }

  // Count actual items (not empty slots)
  const itemCount = Object.values(items).filter((item) => item).length;

  if (itemCount >= 8) {
    toastr.warning(`Maximum of 8 items reached for ${tradeType} side`, "", {
      timeOut: 2000,
      closeButton: true,
      progressBar: true,
    });
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

  // Automatically update preview
  updatePreview();
}

function updatePreview() {
  const previewContainer = document.getElementById("trade-preview");
  if (!previewContainer) return;

  // Always show preview container
  previewContainer.style.display = "block";

  // Update preview items
  renderPreviewItems("preview-offering-items", offeringItems);
  renderPreviewItems("preview-requesting-items", requestingItems);

  // Update value differences
  const valueDifferencesContainer =
    document.getElementById("value-differences");
  if (valueDifferencesContainer) {
    valueDifferencesContainer.innerHTML = renderValueDifferences();
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

        updatePreview(); // Add this line
      } else {
        toastr.error("No empty slots available");
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

    updatePreview(); // Add this line
  } else {
    // No placeholder selected, find first empty slot
    const items =
      currentTradeType === "offering" ? offeringItems : requestingItems;
    const emptyIndex = findNextEmptySlot(items);

    if (emptyIndex !== -1) {
      items[emptyIndex] = item;
      renderTradeItems(currentTradeType === "offering" ? "Offer" : "Request");

      updatePreview(); // Add this line
    } else {
      toastr.error(
        `No empty slots available in ${
          currentTradeType === "offering" ? "Offer" : "Request"
        }`
      );
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

function sortModalItems() {
  const valueSortDropdown = document.getElementById(
    "modal-value-sort-dropdown"
  );
  if (!valueSortDropdown) {
    console.error("Sort dropdown not found!");
    return;
  }

  const sortValue = valueSortDropdown.value;

  // Parse sort parameters
  const [sortType, ...categoryParts] = sortValue.split("-");
  const category = categoryParts.join("-");

  // Start with all items if filteredItems is empty
  let filtered = filteredItems.length > 0 ? [...filteredItems] : [...allItems];

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
    };

    const targetType = typeMap[category];

    if (targetType) {
      filtered = filtered.filter((item) => item.type === targetType);
    }
  }

  // Sort items
  filtered.sort((a, b) => {
    if (sortType === "value") {
      const aValue = parseFloat(a.cash_value) || 0;
      const bValue = parseFloat(b.cash_value) || 0;
      return bValue - aValue; // Sort high to low
    } else {
      // Default to name sort
      return a.name.localeCompare(b.name);
    }
  });

  // Update filteredItems and display
  filteredItems = filtered;
  currentPage = 1;
  displayAvailableItems(currentTradeType);
}

function removeItem(index, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  delete items[index];

  renderTradeItems(tradeType);

  // Automatically update preview
  updatePreview();
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

  // Get the current category from the dropdown
  const sortDropdown = document.getElementById("modal-value-sort-dropdown");
  const selectedOption = sortDropdown
    ? sortDropdown.options[sortDropdown.selectedIndex].text
    : "All Items";

  // Show no results message if no items match
  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="no-results">
          <i class="bi bi-search mb-2" style="font-size: 2rem;"></i>
          <p class="mb-0">No ${selectedOption} found</p>
        </div>
      </div>
    `;
    return;
  }

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

  renderPagination(totalPages, type);

  // Add count display
  const countDisplay = `
    <div class="items-count-display mb-3">
      Showing ${startIndex + 1}-${Math.min(
    endIndex,
    filteredItems.length
  )} of ${filteredItems.length} items
    </div>
  `;

  container.innerHTML =
    countDisplay +
    itemsToDisplay
      .map(
        (item) => `
  <div class="col-custom-5">
    <div class="card available-item-card" 
         onclick="quickAddItem('${item.name}', '${item.type}')"
         data-bs-dismiss="modal">
      <div class="card-header">
        ${item.name}
      </div>
      <div class="position-relative" style="aspect-ratio: 16/9; overflow: hidden;">
        <div class="spinner-container position-absolute top-50 start-50 translate-middle">
          <div class="spinner-border custom-spinner" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div class="item-image-wrapper" style="width: 100%; height: 100%;">
          ${getItemImageElement(item)}
        </div>
      </div>
     <div class="card-body">
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${item.type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cash Value:</span>
          <span class="info-value">${formatValue(item.cash_value)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duped Value:</span>
          <span class="info-value">${formatValue(item.duped_value || 0)}</span>
        </div>
        <div class="info-row ${item.is_limited ? "limited-item" : ""}">
          <span class="info-label">Limited:</span>
          <span class="info-value">
            ${
              item.is_limited
                ? '<i class="bi bi-star-fill text-warning me-1"></i>Yes'
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
      </div>
    </div>
  </div>
`
      )
      .join("");
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
        <i class="bi bi-chevron-left"></i>
      </button>
      <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-button" onclick="changePage(${
        currentPage + 1
      }, '${type}')" ${currentPage === totalPages ? "disabled" : ""}>
        <i class="bi bi-chevron-right"></i>
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
        return itemName.includes(searchTerm) || itemType.includes(searchTerm);
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
            <i class="bi bi-plus-circle"></i>
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

  // First pass: count items and record first position
  Object.entries(items).forEach(([index, item]) => {
    if (!item) return;
    const itemKey = `${item.name}-${item.type}`;
    if (!itemPositions.has(itemKey)) {
      itemPositions.set(itemKey, parseInt(index));
    }
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
                ${
                  count > 1
                    ? `<div class="item-multiplier">×${count}</div>`
                    : ""
                }
                <div class="remove-icon" onclick="event.stopPropagation(); removeItem(${index}, '${tradeType}')">
                  <i class="bi bi-trash"></i>
                </div>
              </div>
              <div class="trade-card-info">
                <div class="item-name">${item.name}</div>
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

  const cashDifference = offerCashValue - requestCashValue;
  const dupedDifference = offerDupedValue - requestDupedValue;

  document.getElementById("trade-summary").innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5>Trade Summary</h5>
        <div class="d-flex justify-content-between mb-2">
          <span>Offering Cash Value:</span>
          <span>${formatLargeNumber(offerCashValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Offering Duped Value:</span>
          <span>${formatLargeNumber(offerDupedValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Requesting Cash Value:</span>
          <span>${formatLargeNumber(requestCashValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Requesting Duped Value:</span>
          <span>${formatLargeNumber(requestDupedValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Cash Value Difference:</span>
          <span class="${cashDifference >= 0 ? "text-success" : "text-danger"}">
            ${cashDifference >= 0 ? "+" : ""}${formatLargeNumber(
    cashDifference
  )}
          </span>
        </div>
        <div class="d-flex justify-content-between">
          <span>Duped Value Difference:</span>
          <span class="${
            dupedDifference >= 0 ? "text-success" : "text-danger"
          }">
            ${dupedDifference >= 0 ? "+" : ""}${formatLargeNumber(
    dupedDifference
  )}
          </span>
        </div>
      </div>
    </div>
  `;
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
      toastr.error("Failed to restore your pending trade");
    }
  }

  // Initialize both sections with 8 empty slots
  renderEmptySlots("offering-list", 8);
  renderEmptySlots("requesting-list", 8);

  // Initial renders
  renderTradeItems("Offer");
  renderTradeItems("Request");

  updatePreview();
});

// Initial Render
renderTradeItems("Offer");
renderTradeItems("Request");

function previewTrade() {
  const hasOfferingItems = Object.values(offeringItems).some((item) => item);
  const hasRequestingItems = Object.values(requestingItems).some(
    (item) => item
  );

  if (!hasOfferingItems || !hasRequestingItems) {
    toastr.error(
      "Please add at least one item to both offering and requesting sections"
    );
    return;
  }

  // Show/hide appropriate containers
  document.getElementById("trade-preview").style.display = "block";
  document.getElementById("available-items-list").style.display = "none";
  document.getElementById("confirm-trade-btn").style.display = "none";

  // Render preview items
  renderPreviewItems("preview-offering-items", offeringItems);
  renderPreviewItems("preview-requesting-items", requestingItems);

  // Update value differences
  const valueDifferencesContainer =
    document.getElementById("value-differences");
  valueDifferencesContainer.innerHTML = renderValueDifferences();
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
      <div class="trade-ad-item">
        <div class="trade-ad-item-content">
          <div class="item-image-container">
            ${getItemImageElement(item)}
            ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
          </div>
          <div class="item-details">
            <div class="item-name">${item.name}</div>
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
                  item.duped_value || 0,
                  true
                )}</span>
              </div>
              <div class="value-badge">
                <span class="value-label">Type:</span>
                <span class="value-amount">${item.type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  const valuesHtml = `
    <div class="side-values-summary">
      <h6>
        <i class="bi bi-calculator me-2"></i>
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
    <div class="trade-items-grid">
      ${itemsHtml}
    </div>
    ${valuesHtml}
  `;
}

function editTrade() {
  // Show available items container and hide preview
  document.getElementById("available-items-list").style.display = "block";
  document.getElementById("confirm-trade-btn").style.display = "block";
  document.getElementById("trade-preview").style.display = "none";
}

async function submitTrade() {
  // Show a simple message when trade is submitted
  toastr.info("This is a demo version. Trade submission is disabled.");

  // Reset button state after showing message
  const submitButton = document.querySelector(
    "#trade-preview-container .btn-success"
  );
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="bi bi-upload me-2"></i>Post Trade';
  }
}

function calculateTotalValue(items, valueType) {
  return Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => parseValue(item[valueType] || 0), 0);
}

function resetTrade() {
  // Clear items
  offeringItems.length = 0;
  requestingItems.length = 0;

  // Reset UI
  renderTradeItems("Offer");
  renderTradeItems("Request");

  // Hide preview
  document.getElementById("trade-preview").style.display = "none";
  document.getElementById("available-items-list").style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const sortDropdown = document.getElementById("modal-value-sort-dropdown");
  if (sortDropdown) {
    sortDropdown.addEventListener("change", sortModalItems);
  }
});

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
    notyf.error("Failed to load items");
  }
}

// Helper function to get item images (copied from trading.js)
function getItemImageElement(item) {
  if (!item)
    return "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat";

  if (item.name === "HyperShift") {
    return `<img src="/assets/images/items/hyperchromes/HyperShift.gif" 
                 class="card-img-top w-100 h-100 object-fit-cover"
                 alt="${item.name}"
                 onload="this.parentElement.previousElementSibling.style.display='none'">`;
  }

  if (item.type === "Horn") {
    return `<img src="/assets/audios/horn_thumbnail.webp" 
                 class="card-img-top w-100 h-100 object-fit-cover"
                 alt="${item.name}"
                 onload="this.parentElement.previousElementSibling.style.display='none'"
                 onerror="this.onerror=null; this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">`;
  }

  if (item.type === "Drift") {
    return `<img src="/assets/images/items/480p/drifts/${item.name}.webp" 
                 class="card-img-top w-100 h-100 object-fit-cover"
                 alt="${item.name}"
                 onload="this.parentElement.previousElementSibling.style.display='none'"
                 onerror="this.onerror=null; this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">`;
  }

  return `<img src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
    item.name
  }.webp" 
               class="card-img-top w-100 h-100 object-fit-cover"
               alt="${item.name}"
               onload="this.parentElement.previousElementSibling.style.display='none'"
               onerror="this.onerror=null; this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">`;
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
               class="card-img-top w-100 h-100 object-fit-cover" 
               alt="${item?.name || "Item"}"
               onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">`;
}

// Update getItemImageUrl to use the new centralized function
function getItemImageUrl(item) {
  return getItemImagePath(item);
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

  // const itemsHtml = uniqueItems
  //   .map(
  //     ({ item, count }) => `
  //   <div class="preview-item"
  //        data-bs-toggle="tooltip"
  //        data-bs-placement="top"
  //        title="Limited: ${item.is_limited ? "Yes" : "No"} | Demand: ${
  //       item.demand || "N/A"
  //     }">
  //     <div class="preview-item-image-container">
  //       ${getItemImageElement(item)}
  //       ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
  //     </div>
  //     <div class="item-name">
  //       ${item.name}
  //       ${
  //         item.is_limited
  //           ? '<i class="bi bi-star-fill text-warning ms-1"></i>'
  //           : ""
  //       }
  //     </div>
  //     <div class="item-details">
  //       <div class="demand-indicator demand-${(
  //         item.demand || "0"
  //       ).toLowerCase()}">
  //         Demand: ${item.demand || "N/A"}
  //       </div>
  //     </div>
  //   </div>
  // `
  //   )
  //   .join("");

  const valuesHtml = `
    <div class="side-values-summary">
      <h6>
       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 .5v2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5m0 4v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M4.5 9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 12.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M7.5 6a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM10 6.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5z" />
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

// Render value differences
function renderValueDifferences() {
  const offerValues = calculateSideValues(offeringItems);
  const requestValues = calculateSideValues(requestingItems);

  const cashDiff = requestValues.cashValue - offerValues.cashValue;
  const dupedDiff = requestValues.dupedValue - offerValues.dupedValue;

  return `
    <div class="value-differences">
      <h6 class="difference-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 6H3m18 0l-4 4m4-4l-4-4M3 18h18M3 18l4 4m-4-4l4-4" />
</svg> Value Differences
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

// Add item to trade
function addItemToTrade(item, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  if (items.length >= 8) {
    notyf.error(`You can only add up to 8 items to ${tradeType}`);
    return;
  }

  // Count actual items (not empty slots)
  const itemCount = Object.values(items).filter((item) => item).length;

  if (itemCount >= 8) {
    notyf.warning(`Maximum of 8 items reached for ${tradeType} side`, "", {
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
      notyf.error(
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
  const [sortType, ...categoryParts] = sortValue.split("-");
  const category = categoryParts.join("-");

  // Always start with all items from allItems, not filteredItems
  let filtered = [...allItems];

  // First apply search filter if there's a search term
  const searchInput = document.getElementById("modal-item-search");
  const searchTerm = searchInput?.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter((item) => {
      const itemName = item.name.toLowerCase();
      const itemType = item.type.toLowerCase();
      return itemName.startsWith(searchTerm) || itemType.startsWith(searchTerm);
    });
  }

  // Then apply category filter
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
  }

  // Always sort by cash value descending
  filtered.sort((a, b) => {
    const aValue = parseFloat(a.cash_value) || 0;
    const bValue = parseFloat(b.cash_value) || 0;
    return bValue - aValue;
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

  // Sort filteredItems by cash value descending before displaying
  filteredItems.sort((a, b) => {
    const aValue = parseValue(a.cash_value || "0");
    const bValue = parseValue(b.cash_value || "0");
    return bValue - aValue;
  });

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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
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
      <div class="position-relative" style="aspect-ratio: 16/9; overflow: hidden;">
        <div class="item-image-wrapper" style="width: 100%; height: 100%;">
          ${getItemImageElement(item)}
        </div>
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
                <span class="info-value">${formatValue(item.cash_value)}</span>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14 7l-5 5l5 5" />
</svg>
      </button>
      <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-button" onclick="changePage(${
        currentPage + 1
      }, '${type}')" ${currentPage === totalPages ? "disabled" : ""}>
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 7l5 5l-5 5" />
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m1 5h-2v4H7v2h4v4h2v-4h4v-2h-4z" />
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
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg>
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
      notyf.error("Failed to restore your pending trade");
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
    notyf.error(
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
       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 .5v2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5m0 4v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M4.5 9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 12.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5M7.5 6a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM10 6.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5m.5 2.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5z" />
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

// Update handleModalClose function
function handleModalClose() {
  const searchInput = document.getElementById("modal-item-search");
  const clearButton = document.getElementById("clear-search-btn");

  if (searchInput) {
    searchInput.value = "";
  }

  if (clearButton) {
    clearButton.style.display = "none";
  }

  // Reset filtered items based on current dropdown selection
  sortModalItems();
}

// Add event listener for modal close
document.addEventListener("DOMContentLoaded", () => {
  const availableItemsModal = document.getElementById("availableItemsModal");
  if (availableItemsModal) {
    availableItemsModal.addEventListener("hidden.bs.modal", handleModalClose);
  }

  const sortDropdown = document.getElementById("modal-value-sort-dropdown");
  if (sortDropdown) {
    sortDropdown.addEventListener("change", sortModalItems);
  }
});

let currentPage = 0;
const ITEMS_PER_PAGE = 50;
let currentDupes = [];
let filteredDupes = [];
let isReversed = false; // Add at top with other state variables

// Format timestamp to readable date
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ordinal: true,
    })
    .replace(/(\d+)(?=(st|nd|rd|th))/, (_, n) => {
      const suffix = ["th", "st", "nd", "rd"][
        (n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10
      ];
      return `${n}${suffix}`;
    });
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Display dupes in the table
function displayDupes(dupes, append = false) {
  const tbody = document.getElementById("dupesTableBody");
  if (!append) {
    tbody.innerHTML = "";
  }

  const startIndex = currentPage * ITEMS_PER_PAGE;
  let displayDupes = [...dupes];

  // Hide load more button if total items are 50 or less
  const loadMoreBtn = document.getElementById("loadMore");
  if (loadMoreBtn) {
    loadMoreBtn.style.display =
      dupes.length <= ITEMS_PER_PAGE ? "none" : "block";
  }

  if (isReversed) {
    displayDupes = displayDupes
      .slice(startIndex, startIndex + ITEMS_PER_PAGE)
      .reverse();
  } else {
    displayDupes = displayDupes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }

  displayDupes.forEach((dupe, index) => {
    const number = isReversed
      ? dupes.length - startIndex - index
      : startIndex + index + 1;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="dupe-number">${number}</td>
      <td>
        <a 
          href="https://www.roblox.com/search/users?keyword=${encodeURIComponent(
            dupe.owner
          )}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="text-primary text-decoration-none"
        >
          ${dupe.owner}
        </a>
      </td>
      <td>${formatDate(dupe.created_at)}</td>
    `;
    tbody.appendChild(row);
  });
}

// Fetch items list and filter by name
async function searchItems(searchTerm) {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list"
    );
    if (!response.ok) throw new Error("Failed to fetch items");
    const items = await response.json();

    // Filter items by name (case-insensitive)
    const searchTermLower = searchTerm.toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTermLower)
    );
  } catch (error) {
    console.error("Error searching items:", error);
    notyf.error("Error searching items");
    return [];
  }
}

// Display search results
function displaySearchResults(items) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";

  // Hide other containers when showing search results
  document.getElementById("itemInfo").style.display = "none";
  document.getElementById("dupesList").style.display = "none";
  document.getElementById("usernameSearchContainer").style.display = "none";

  if (items.length === 0) {
    resultsContainer.innerHTML = `
      <div class="search-info-panel">
        <div class="search-info-message">
          <svg class="search-info-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <p class="search-info-text">No items found</p>
          <p class="search-info-subtext">Try adjusting your search terms</p>
        </div>
      </div>`;
  } else {
    const resultsGrid = document.createElement("div");
    resultsGrid.className = "search-results-grid";

    items.forEach((item) => {
      const resultItem = document.createElement("button");
      resultItem.className = "search-result-item";
      resultItem.innerHTML = `
        <div class="result-item-content">
          <span class="result-item-name">${item.name}</span>
          <span class="result-item-type">(${item.type})</span>
        </div>
      `;
      resultItem.onclick = () => selectItem(item);
      resultsGrid.appendChild(resultItem);
    });

    resultsContainer.appendChild(resultsGrid);
  }

  resultsContainer.style.display = "block";
}

// Select item and fetch its dupes
async function selectItem(item) {
  document.getElementById("searchResults").style.display = "none";
  document.getElementById("itemSearch").value = item.name;
  document.getElementById("usernameSearch").value = ""; // Clear username search
  await fetchDupesForItem(item);
}

// Update item stats - modified to preserve labels
function updateItemStats(dupes, filteredUsername = "") {
  const dupesCount = document.getElementById("dupesCount");
  const latestDupe = document.getElementById("latestDupe");

  if (!dupesCount || !latestDupe) {
    console.error("Stats elements not found");
    return;
  }

  let dupesToCount = dupes;

  // If filtering by username, count only filtered dupes
  if (filteredUsername) {
    dupesToCount = dupes.filter((dupe) =>
      dupe.owner.toLowerCase().includes(filteredUsername.toLowerCase())
    );
  }

  dupesCount.textContent = formatNumber(dupesToCount.length);

  if (dupesToCount.length > 0) {
    const latest = dupesToCount.reduce((latest, dupe) =>
      dupe.created_at > latest.created_at ? dupe : latest
    );
    latestDupe.textContent = formatDate(latest.created_at);
  } else {
    latestDupe.textContent = "Never";
  }
}

// Update handleShare function
function handleShare(item) {
  if (!item || !item.name) {
    notyf.info("Please search for an item first to get its share link");
    return;
  }

  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?item=${encodeURIComponent(
    item.name
  )}&type=${encodeURIComponent(item.type)}`;

  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      notyf.success("Share link copied to clipboard!");
    })
    .catch(() => {
      notyf.error("Failed to copy share link");
    });
}

// Fetch dupes for selected item
async function fetchDupesForItem(item) {
  const elements = {
    loading: document.getElementById("loading"),
    itemInfo: document.getElementById("itemInfo"),
    dupesList: document.getElementById("dupesList"),
    noResults: document.getElementById("noResults"),
    loadMore: document.getElementById("loadMore"),
    itemSubtitle: document.querySelector(".item-subtitle"),
    itemName: document.getElementById("itemName"),
    itemType: document.getElementById("itemType"),
    usernameSearchContainer: document.getElementById("usernameSearchContainer"),
  };

  if (elements.loading) elements.loading.style.display = "block";

  // Hide elements if they exist
  Object.entries(elements).forEach(([key, element]) => {
    if (element && key !== "loading") {
      element.style.display = "none";
    }
  });

  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/dupes/get?id=${item.id}`
    );
    const data = await response.json();

    // Hide loading
    if (elements.loading) elements.loading.style.display = "none";

    // Always show item info
    if (elements.itemInfo) {
      elements.itemInfo.style.display = "block";

      if (elements.itemName) elements.itemName.textContent = item.name;

      if (elements.itemType) elements.itemType.textContent = item.type;

      if (elements.itemSubtitle) {
        elements.itemSubtitle.textContent = `Duplicate List for ${item.name}`;
      }

      // Setup share button
      const shareButton = document.getElementById("shareButton");
      if (shareButton) {
        shareButton.onclick = () => handleShare(item);
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        if (elements.itemSubtitle) {
          elements.itemSubtitle.textContent = `No Results for ${item.name} (${item.type})`;
        }
        notyf.error("No duplicates found for this item");
        updateItemStats([]); // Update stats with empty array
        return;
      }
      throw new Error("Failed to fetch dupes");
    }

    // Store dupes list and reset pagination
    currentDupes = Array.isArray(data) ? data : [];
    filteredDupes = [...currentDupes];
    currentPage = 0;

    // Update stats with the actual data
    updateItemStats(currentDupes);

    // Show UI elements if we have dupes
    if (currentDupes.length > 0) {
      if (elements.usernameSearchContainer) {
        elements.usernameSearchContainer.style.display = "block";
      }
      if (elements.dupesList) {
        elements.dupesList.style.display = "block";
        displayDupes(filteredDupes.slice(0, ITEMS_PER_PAGE));
      }
      if (elements.loadMore) {
        elements.loadMore.style.display =
          filteredDupes.length > ITEMS_PER_PAGE ? "block" : "none";
      }
    } else {
      if (elements.itemSubtitle) {
        elements.itemSubtitle.textContent = `No Results for ${item.name}`;
      }
      if (elements.dupesList) {
        elements.dupesList.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error fetching dupes:", error);
    notyf.error("Error fetching dupes list");
    if (elements.loading) elements.loading.style.display = "none";
    if (elements.itemSubtitle) {
      elements.itemSubtitle.textContent = `Error Loading Results for ${item.name}`;
    }
    updateItemStats([]); // Update stats with empty array on error
  }
}

// Filter dupes by username
function filterDupesByUsername(username) {
  const searchTerm = username.toLowerCase();
  filteredDupes = currentDupes.filter((dupe) =>
    dupe.owner.toLowerCase().includes(searchTerm)
  );

  currentPage = 0;
  displayDupes(filteredDupes.slice(0, ITEMS_PER_PAGE));

  // Update stats with username filter
  updateItemStats(currentDupes, username.trim());

  document.getElementById("loadMore").style.display =
    filteredDupes.length > ITEMS_PER_PAGE ? "block" : "none";
}

// Handle search input
let searchTimeout;
async function handleSearch() {
  const searchTerm = document.getElementById("itemSearch").value.trim();

  if (searchTerm.length < 2) {
    document.getElementById("searchResults").style.display = "none";
    return;
  }

  const items = await searchItems(searchTerm);
  displaySearchResults(items);
}

// Load more dupes
function loadMore() {
  currentPage++;
  const start = currentPage * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  displayDupes(filteredDupes, true);

  // Hide load more button if we've displayed all items
  if (end >= filteredDupes.length) {
    document.getElementById("loadMore").style.display = "none";
  }
}

// Clear search state
function clearSearchState() {
  const elements = {
    itemSearch: document.getElementById("itemSearch"),
    searchResults: document.getElementById("searchResults"),
    itemInfo: document.getElementById("itemInfo"),
    dupesList: document.getElementById("dupesList"),
    usernameSearchContainer: document.getElementById("usernameSearchContainer"),
    loadMore: document.getElementById("loadMore"),
  };

  // Only proceed with elements that exist
  if (elements.itemSearch) elements.itemSearch.value = "";
  if (elements.searchResults) elements.searchResults.style.display = "none";
  if (elements.itemInfo) elements.itemInfo.style.display = "none";
  if (elements.dupesList) elements.dupesList.style.display = "none";
  if (elements.usernameSearchContainer)
    elements.usernameSearchContainer.style.display = "none";
  if (elements.loadMore) elements.loadMore.style.display = "none";
}

// Clear search with notification
function clearSearch() {
  clearSearchState();
  notyf.success("Search cleared successfully");
}

// Clear username search
function clearUsernameSearch() {
  const usernameInput = document.getElementById("usernameSearch");
  if (usernameInput) {
    usernameInput.value = "";
    filterDupesByUsername(""); // Reset to show all dupes
  }
}

// Clear everything on page load/refresh
function clearOnLoad() {
  clearSearchState();
  currentPage = 0;
  currentDupes = [];
  filteredDupes = [];
}

// Add this new function
async function handleUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemName = urlParams.get("item");
  const itemType = urlParams.get("type");

  if (itemName) {
    const items = await searchItems(itemName);
    const matchedItem = items.find(
      (item) =>
        item.name.toLowerCase() === itemName.toLowerCase() &&
        (!itemType || item.type.toLowerCase() === itemType.toLowerCase())
    );

    if (matchedItem) {
      // Clean the URL without reloading the page
      window.history.replaceState({}, document.title, "/dupes");

      // Set search input and fetch dupes
      document.getElementById("itemSearch").value = matchedItem.name;
      await selectItem(matchedItem);
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  clearOnLoad();

  // Add clear username button listener
  const clearUsernameBtn = document.getElementById("clearUsernameBtn");
  if (clearUsernameBtn) {
    clearUsernameBtn.addEventListener("click", clearUsernameSearch);
  }

  // Handle URL parameters on load
  handleUrlParams();

  // Add column sort handler
  const columnHeader = document.querySelector(".column-number");
  columnHeader.addEventListener("click", () => {
    isReversed = !isReversed;
    columnHeader.classList.toggle("active", isReversed);
    displayDupes(filteredDupes);
  });
});

// Event listeners
document.getElementById("itemSearch").addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleSearch, 300); // Debounce search
});

document.getElementById("searchBtn").addEventListener("click", handleSearch);
document.getElementById("loadMoreBtn").addEventListener("click", loadMore);

// Add event listener for clear button
document
  .getElementById("clearSearchBtn")
  .addEventListener("click", clearSearch);

// Close search results when clicking outside
document.addEventListener("click", (e) => {
  const searchResults = document.getElementById("searchResults");
  const searchInput = document.getElementById("itemSearch");
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.style.display = "none";
  }
});

document.getElementById("usernameSearch").addEventListener("input", (e) => {
  filterDupesByUsername(e.target.value.trim());
});

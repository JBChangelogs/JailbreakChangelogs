let allData = [];
let currentPage = 1;
const itemsPerPage = 20;

function showLoadingOverlay() {
  $("#loading-overlay").addClass("show");
}

function hideLoadingOverlay() {
  $("#loading-overlay").removeClass("show");
}

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");

// Show/hide clear button based on input content
searchInput.addEventListener("input", function () {
  if (this.value) {
    clearSearchBtn.classList.remove("d-none");
  } else {
    clearSearchBtn.classList.add("d-none");
  }
});

// Clear search input
clearSearchBtn.addEventListener("click", function () {
  searchInput.value = "";
  clearSearchBtn.classList.add("d-none");
  searchInput.focus();
  displayData(); // Refresh the table data
});

function fetchAndDisplayTradeData() {
  const apiUrl = "/trade-data";

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected an array");
      }
      allData = data;
      updateTypeFilter(data);
      displayData();
      hideLoadingOverlay();
    })
    .catch((error) => {
      console.error("Error fetching trade data:", error);
      const tableBody = document.querySelector("#tradeDataTable tbody");
      tableBody.innerHTML = ""; // Clear the table body
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5;
      cell.textContent = `Error loading data: ${error.message}`;
      hideLoadingOverlay();
    });
}

function displayData() {
  const tableBody = document.querySelector("#tradeDataTable tbody");
  tableBody.innerHTML = "";

  const filteredData = filterData(allData);
  const sortedData = sortData(filteredData);
  const paginatedData = paginateData(sortedData);

  if (filteredData.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.className = "text-center p-4";

    // Get the current filter type and search term
    const filterType = document.getElementById("filterType").value;
    const searchTerm = document.getElementById("searchInput").value;

    // Create a styled message container
    const messageContainer = document.createElement("div");
    messageContainer.className =
      "d-flex flex-column align-items-center justify-content-center";

    // Add an icon
    const icon = document.createElement("div");
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" class="mb-3">
        <rect width="24" height="24" fill="none" />
        <path fill="none" stroke="#ff6b6b" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0" />
      </svg>
    `;

    // Create and style the message
    const messageText = document.createElement("div");
    messageText.style.color = "#ff4757"; // Softer red for text
    messageText.style.fontSize = "1.1rem";
    messageText.style.fontWeight = "500";

    // Customize message based on whether there's a filter, search term, or both
    let message = "No results found";
    if (filterType && searchTerm) {
      message += ` for "${searchTerm}" in ${filterType} category`;
    } else if (filterType) {
      message += ` in ${filterType} category`;
    } else if (searchTerm) {
      message += ` for "${searchTerm}"`;
    }

    messageText.textContent = message;

    // Add a very light red background and subtle border
    cell.style.backgroundColor = "#fff5f5"; // Very light red background
    cell.style.border = "1px solid #ffd9d9"; // Light red border
    cell.style.borderRadius = "4px";

    // Add a suggestion text
    const suggestionText = document.createElement("div");
    suggestionText.style.color = "#ff8787"; // Even lighter red for secondary text
    suggestionText.style.fontSize = "0.9rem";
    suggestionText.style.marginTop = "8px";
    suggestionText.textContent = "Try adjusting your search or filters";

    // Assemble the message container
    messageContainer.appendChild(icon);
    messageContainer.appendChild(messageText);
    messageContainer.appendChild(suggestionText);
    cell.appendChild(messageContainer);
  } else {
    paginatedData.forEach((item) => {
      const row = tableBody.insertRow();
      const cells = [
        item.Type,
        item.Name,
        item.TimesTraded.toLocaleString(),
        item.UniqueCirculation.toLocaleString(),
        item.DemandMultiple.toPrecision(6),
      ];

      cells.forEach((cellData) => {
        const cell = row.insertCell();
        cell.textContent = cellData;
      });
    });
  }
  updatePagination(filteredData.length);
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("sortBy").value = "TimesTraded_desc";
  localStorage.removeItem("sortPreference");
  currentPage = 1;
  displayData();

  // Show toast notification
  notyf.success("Filters have been cleared", "Clear Filters");

  // Disable the button
  const clearButton = document.getElementById("clearFilters");
  clearButton.disabled = true;

  // Re-enable the button after 5 seconds
  setTimeout(() => {
    clearButton.disabled = false;
  }, 5000);
}

// Event listener for the clear button
document.getElementById("clearFilters").addEventListener("click", clearFilters);

function filterData(data) {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  // Updated filter type event listener
  const filterType = document.getElementById("filterType").value;

  return data.filter(
    (item) =>
      (item.Name.toLowerCase().includes(searchTerm) ||
        item.Type.toLowerCase().includes(searchTerm)) &&
      (filterType === "" || item.Type === filterType)
  );
}

function sortData(data) {
  const sortBy = document.getElementById("sortBy").value;
  const [field, order] = sortBy.split("_");

  return [...data].sort((a, b) => {
    if (order === "asc") {
      return a[field] - b[field];
    } else {
      return b[field] - a[field];
    }
  });
}

function paginateData(data) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return data.slice(startIndex, startIndex + itemsPerPage);
}

function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  document.getElementById(
    "currentPage"
  ).textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

function updateTypeFilter(data) {
  const types = [...new Set(data.map((item) => item.Type))];
  const filterType = document.getElementById("filterType");
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    filterType.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayTradeData();

  document.getElementById("searchInput").addEventListener("input", displayData);
  document.getElementById("filterType").addEventListener("change", displayData);
  document.getElementById("sortBy").addEventListener("change", displayData);

  // Filter type change handler
  const filterType = document.getElementById("filterType");
  filterType.addEventListener("change", () => {
    const searchInput = document.getElementById("searchInput");
    searchInput.value = "";
    clearSearchBtn.classList.add("d-none");
    currentPage = 1;
    displayData();
  });

  // Sort change handler
  const sortBy = document.getElementById("sortBy");
  sortBy.addEventListener("change", () => {
    const searchInput = document.getElementById("searchInput");
    searchInput.value = "";
    clearSearchBtn.classList.add("d-none");
    localStorage.setItem("sortPreference", sortBy.value);
    currentPage = 1;
    displayData();
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayData();
    }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    const totalItems = filterData(allData).length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayData();
    }
  });

  // Load saved sort preference
  const savedSort = localStorage.getItem("sortPreference");
  if (savedSort) {
    sortBy.value = savedSort;
  }
});

let allData = [];
let currentPage = 1;
const itemsPerPage = 20;

function configureToastr() {
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: true,
    positionClass: "toast-bottom-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };
}

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
  toastr.success("Filters have been cleared", "Clear Filters");
}

function filterData(data) {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
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

function hideLoadingOverlay() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayTradeData();
  configureToastr();

  document.getElementById("searchInput").addEventListener("input", displayData);
  document.getElementById("filterType").addEventListener("change", displayData);
  document.getElementById("sortBy").addEventListener("change", displayData);
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
  const sortBy = document.getElementById("sortBy");
  sortBy.addEventListener("change", () => {
    localStorage.setItem("sortPreference", sortBy.value);
    displayData();
  });

  // Add event listener for the clear button
  document
    .getElementById("clearFilters")
    .addEventListener("click", clearFilters);

  // Load saved sort preference
  const savedSort = localStorage.getItem("sortPreference");
  if (savedSort) {
    sortBy.value = savedSort;
  }
});

// Constants
const API_BASE_URL = "https://api3.jailbreakchangelogs.xyz";
const DISCORD_CDN = "https://cdn.discordapp.com";
const USERS_PER_PAGE = 15;
let currentPage = 1;
let allUsers = [];

const decimalToHex = (decimal) => {
  // Return default color if decimal is falsy OR specifically "None"
  if (!decimal || decimal === "None") return "#124E66";

  // Convert to hex and ensure exactly 6 digits
  const hex = decimal.toString(16).padStart(6, "0").slice(-6);

  // Return the hex color with a # prefix
  return `#${hex}`;
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  clearButton: document.getElementById("clearButton"),
  usersGrid: document.getElementById("usersGrid"),
  loadingSpinner: document.getElementById("loading-spinner"),
  userResults: document.getElementById("user-results"),
  totalUsersCount: document.getElementById("total-users-count"),
};

const messages = {
  loading: `
    <div class="col-12 text-center py-5">
      <div class="search-message text-muted">
        <i class="bi bi-arrow-repeat spin me-2" style="color: var(--accent-color-light);"></i>
        Loading users...
      </div>
    </div>
  `,
  noUsers: `
    <div class="col-12 text-center py-5">
      <div class="no-results-message text-muted">
        <i class="bi bi-exclamation-circle me-2"></i>
        No users found
      </div>
    </div>
  `,
  resultsCount: (count, isSearch = false) => `
  <div class="mb-3 text-center">
    <span class="badge bg-primary">
      <i class="bi bi-people-fill me-1"></i>
      ${
        isSearch ? count : Math.max(...allUsers.map((user) => user.usernumber))
      } users found
    </span>
  </div>
`,

  error: `
    <div class="col-12 text-center py-5">
      <div class="no-results-message text-muted">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Unable to load users. Please try again later.
      </div>
    </div>
  `,
};

const createPaginationControls = (totalUsers) => {
  const totalPages = Math.ceil(allUsers.length / USERS_PER_PAGE);

  // Calculate which page numbers to show
  let pages = [];
  if (totalPages <= 6) {
    // If 6 or fewer pages, show all
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    // Always show first 3 and last 3 when current page is at edges
    if (currentPage <= 3) {
      pages = [1, 2, 3, 4, 5, 6];
    } else if (currentPage >= totalPages - 2) {
      pages = Array.from({ length: 6 }, (_, i) => totalPages - 5 + i);
    } else {
      // Show 3 pages before and 3 after current page
      pages = [
        currentPage - 2,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2,
        currentPage + 3,
      ];
    }
  }

  let paginationHTML = `
  <div class="pagination-wrapper">
    <nav aria-label="User pagination">
      <ul class="pagination justify-content-center flex-wrap gap-2 mb-0">
        <!-- Previous Arrow -->
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
          <a class="page-link" href="#" data-page="${
            currentPage - 1
          }" aria-label="Previous">
            <i class="bi bi-chevron-left"></i>
          </a>
        </li>

        ${pages
          .map(
            (page) => `
          <li class="page-item ${currentPage === page ? "active" : ""}">
            <a class="page-link ${currentPage === page ? "active" : ""}" 
               href="#" 
               data-page="${page}"
               ${
                 currentPage === page
                   ? 'style="background-color: var(--accent-color); color: var(--text-primary);"'
                   : ""
               }>
              ${page}
            </a>
          </li>
        `
          )
          .join("")}
        
        <li class="page-item">
          <div class="page-input-container">
            <input type="number" 
                   class="form-control page-input" 
                   min="1" 
                   max="${totalPages}" 
                   value="${currentPage}"
                   aria-label="Go to page">
          </div>
        </li>

        <li class="page-item d-flex align-items-center ms-2">
          <span class="page-text small">of ${totalPages}</span>
        </li>

        <!-- Next Arrow -->
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
          <a class="page-link" href="#" data-page="${
            currentPage + 1
          }" aria-label="Next">
            <i class="bi bi-chevron-right"></i>
          </a>
        </li>
      </ul>
    </nav>
  </div>
  `;

  return paginationHTML;
};
const fetchAvatar = async (userId, avatarHash, format) => {
  const url = `${DISCORD_CDN}/avatars/${userId}/${avatarHash}.${format}`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok ? url : null;
};

// User Card Template
const createUserCard = async (user) => {
  let avatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;

  if (user.avatar) {
    try {
      // Try GIF first
      const gifUrl = await fetchAvatar(user.id, user.avatar, "gif");
      if (gifUrl) {
        avatarUrl = gifUrl;
      } else {
        // Fallback to PNG if GIF doesn't exist
        const pngUrl = await fetchAvatar(user.id, user.avatar, "png");
        if (pngUrl) {
          avatarUrl = pngUrl;
        }
      }
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }
  }

  return `
  <div class="user-card-wrapper">
    <div class="card user-card border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="d-flex align-items-center gap-2">
          <img 
            src="${avatarUrl}"
            class="user-avatar rounded-circle flex-shrink-0" 
            alt="${user.username}"
            width="60"
            height="60"
            style="border: 3px solid ${decimalToHex(user.accent_color)};"
            onerror="this.src='https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${
              user.username
            }&bold=true&format=svg'"
          >
          <div class="user-info overflow-hidden flex-grow-1">
            <h5 class="user-name text-truncate mb-1 fs-6">${
              user.global_name === "None" ? user.username : user.global_name
            }</h5>
            <p class="user-username text-muted small mb-0">@${user.username}</p>
          </div>
          <a href="/users/${user.id}" class="btn btn-primary btn-sm ms-2">
            View
          </a>
        </div>
      </div>
    </div>
  </div>
`;
};

// Display Functions
const showLoading = () => {
  elements.usersGrid.style.display = "none";
  elements.loadingSpinner.style.display = "flex";
  elements.userResults.style.display = "block";
};

const hideLoading = () => {
  elements.loadingSpinner.style.display = "none";
  elements.usersGrid.style.display = "block";
};

const showMessage = (message) => {
  elements.loadingSpinner.style.display = "none";
  elements.usersGrid.innerHTML = message;
  elements.usersGrid.style.display = "block";
  elements.userResults.style.display = "block";
};

// User Display Logic
const displayUsers = async (users, page = 1) => {
  const startIndex = (page - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const usersToDisplay = users.slice(startIndex, endIndex);

  const userCards = await Promise.all(
    usersToDisplay.map((user) => createUserCard(user))
  );

  elements.usersGrid.innerHTML = `
  ${messages.resultsCount(users.length, users !== allUsers)}
  <div class="row g-4">
    ${userCards.join("")}
  </div>
  ${createPaginationControls(allUsers.length)}
`;

  // Add pagination event listeners
  document.querySelectorAll(".pagination .page-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Get the total number of pages
      const totalPages = Math.ceil(users.length / USERS_PER_PAGE);

      // Check if clicking on an arrow
      if (e.currentTarget.getAttribute("aria-label") === "Previous") {
        if (currentPage > 1) {
          currentPage--;
          displayUsers(users, currentPage);
        }
      } else if (e.currentTarget.getAttribute("aria-label") === "Next") {
        if (currentPage < totalPages) {
          currentPage++;
          displayUsers(users, currentPage);
        }
      } else {
        // Handle numbered page clicks
        const newPage = parseInt(e.currentTarget.dataset.page);
        if (!isNaN(newPage) && newPage > 0) {
          currentPage = newPage;
          displayUsers(users, currentPage);
        }
      }
    });
  });

  // Add page input listener
  document.querySelector(".page-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newPage = parseInt(e.target.value);
      const totalPages = Math.ceil(users.length / USERS_PER_PAGE);

      if (!isNaN(newPage) && newPage > 0 && newPage <= totalPages) {
        currentPage = newPage;
        displayUsers(users, currentPage);
      } else {
        // Reset to current page if invalid input
        e.target.value = currentPage;
      }
    }
  });
};

// API Functions
const searchUsers = (searchTerm) => {
  const searchTermLower = searchTerm.toLowerCase();
  return allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTermLower) ||
      (user.global_name &&
        user.global_name.toLowerCase().includes(searchTermLower))
  );
};

// Event Handlers
const handleSearch = async () => {
  const searchTerm = elements.searchInput.value.trim();

  showLoading();
  const searchTermLower = searchTerm.toLowerCase();

  const filteredUsers = allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTermLower) ||
      (user.global_name &&
        user.global_name.toLowerCase().includes(searchTermLower))
  );

  if (filteredUsers.length === 0) {
    showMessage(messages.noUsers);
  } else {
    await displayUsers(filteredUsers, 1);
    hideLoading();
  }
};

// Modify the DOMContentLoaded event listener to this:
document.addEventListener("DOMContentLoaded", async () => {
  // Initial load - fetch users once and use for everything
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/users/list`);
    if (response.status === 404) {
      showMessage(messages.error);
      elements.totalUsersCount.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>Service unavailable`;
      return;
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const users = await response.json();
    allUsers = users; // Store globally for later use

    // Update total users count
    const totalUsers = Math.max(...users.map((user) => user.usernumber));
    elements.totalUsersCount.innerHTML = `<i class="bi bi-person-lines-fill me-1"></i>Total Users: ${totalUsers.toLocaleString()}`;

    // Display initial user cards
    await displayUsers(users, 1);
    hideLoading();
  } catch (error) {
    console.error("Error loading users:", error);
    showMessage(messages.error);
    elements.totalUsersCount.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>Service unavailable`;
  }

  // Event listeners
  elements.searchButton.addEventListener("click", handleSearch);
  elements.clearButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.clearButton.style.display = "none";
    displayUsers(allUsers, 1); // Show all users again
  });

  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });

  let searchTimeout;
  elements.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const searchTerm = elements.searchInput.value.trim();
    elements.clearButton.style.display = searchTerm ? "block" : "none";
    searchTimeout = setTimeout(handleSearch, 300);
  });
});

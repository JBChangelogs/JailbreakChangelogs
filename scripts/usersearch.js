// Constants
const API_BASE_URL = "https://api3.jailbreakchangelogs.xyz";
const USERS_PER_PAGE = 15;
let currentPage = 1;
let allUsers = [];

const decimalToHex = (decimal) =>
  !decimal || decimal === "None"
    ? "#000000"
    : `#${decimal.toString(16).substring(0, 6)}`;

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
  // loading: `
  //   <div class="col-12 text-center py-5">
  //     <div class="search-message text-muted">
  //       <i class="bi bi-arrow-repeat spin me-2" style="color: var(--accent-color-light);"></i>
  //       Loading users...
  //     </div>
  //   </div>
  // `,
  noUsers: `
    <div class="col-12 text-center py-5">
      <div class="no-results-message text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m9-3v4m0 3v.01" />
</svg>
        No users found
      </div>
    </div>
  `,
  resultsCount: (count, isSearch = false) => {
    return `
      <div class="mb-3 text-center">
        <span class="badge bg-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <rect width="16" height="16" fill="none" />
            <path fill="currentColor" d="M7 14s-1 0-1-1s1-4 5-4s5 3 5 4s-1 1-1 1zm4-6a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5" />
          </svg>
          ${count} of ${allUsers.length} users found
        </span>
      </div>
    `;
  },
  error: `
    <div class="col-12 text-center py-5">
      <div class="no-results-message text-muted">
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M12 16a1 1 0 1 0 1 1a1 1 0 0 0-1-1m10.67 1.47l-8.05-14a3 3 0 0 0-5.24 0l-8 14A3 3 0 0 0 3.94 22h16.12a3 3 0 0 0 2.61-4.53m-1.73 2a1 1 0 0 1-.88.51H3.94a1 1 0 0 1-.88-.51a1 1 0 0 1 0-1l8-14a1 1 0 0 1 1.78 0l8.05 14a1 1 0 0 1 .05 1.02ZM12 8a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1" />
</svg>
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
    // Show different number of pages based on current page position
    if (currentPage <= 3) {
      // Near start: show first 4 pages
      pages = [1, 2, 3, 4];
    } else if (currentPage >= totalPages - 2) {
      // Near end: show last 4 pages
      pages = Array.from({ length: 4 }, (_, i) => totalPages - 3 + i);
    } else {
      // Middle: show current page and surrounding pages
      pages = [currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <rect width="24" height="24" fill="none" />
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14 7l-5 5l5 5" />
            </svg>
          </a>
        </li>

        <!-- First page if not in first group -->
        ${
          currentPage > 3
            ? `
          <li class="page-item">
            <a class="page-link" href="#" data-page="1">1</a>
          </li>
          ${
            currentPage > 4
              ? '<li class="page-item disabled"><span class="page-link">...</span></li>'
              : ""
          }
        `
            : ""
        }

        <!-- Main page numbers -->
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

        <!-- Last page if not in last group -->
        ${
          currentPage < totalPages - 2
            ? `
          ${
            currentPage < totalPages - 3
              ? '<li class="page-item disabled"><span class="page-link">...</span></li>'
              : ""
          }
          <li class="page-item">
            <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
          </li>
        `
            : ""
        }

        <!-- Page input -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <rect width="24" height="24" fill="none" />
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10 7l5 5l-5 5" />
            </svg>
          </a>
        </li>
      </ul>
    </nav>
  </div>
  `;

  return paginationHTML;
};

// User Card Template
const getBadgeHTML = (usernumber) => {
  return `
    <div class="user-number-badge">
      <span class="badge bg-secondary">#${usernumber}</span>
    </div>
  `;
};

const createUserCard = async (user) => {
  let avatarUrl;
  try {
    avatarUrl = await window.checkAndSetAvatar(user);
  } catch (error) {
    console.error("Error fetching avatar:", error);
  }

  return `
    <div class="user-card-wrapper" onclick="window.location.href='/users/${
      user.id
    }'">
      <div class="card user-card">
        <div class="card-body">
          ${getBadgeHTML(user.usernumber)}
          <div class="user-info-container">
            <img 
              src="${avatarUrl}"
              class="user-avatar rounded-circle" 
              alt="${user.username}"
              style="border-color: ${decimalToHex(user.accent_color)};"
              onerror="this.src='${window.checkAndSetAvatar(user)}'"
            >
            <div class="user-info">
              <h5 class="user-name text-truncate">${
                user.global_name === "None" ? user.username : user.global_name
              }</h5>
              <p class="user-username text-truncate">@${user.username}</p>
            </div>
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

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Shuffle once when users are first loaded
let shuffledUsers = [];
let avatarCache = new Map(); // Cache for avatar URLs

// Modified shuffle logic to only shuffle first page
const getInitialShuffledUsers = (users) => {
  // Sort users by usernumber in ascending order instead of shuffling
  return users.sort((a, b) => a.usernumber - b.usernumber);
};

// User Display Logic
const displayUsers = async (users, page = 1) => {
  const startIndex = (page - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const usersToDisplay = users.slice(startIndex, endIndex);

  // Load avatars for current page if not already cached
  const avatarPromises = usersToDisplay.map(async (user) => {
    if (!avatarCache.has(user.id)) {
      const avatarUrl = await window.checkAndSetAvatar(user);
      avatarCache.set(user.id, avatarUrl);
    }
  });
  await Promise.all(avatarPromises);

  // Generate HTML for user cards
  const userCardsHTML = usersToDisplay
    .map(
      (user) => `
    <div class="user-card-wrapper" onclick="window.location.href='/users/${
      user.id
    }'">
      <div class="card user-card">
        <div class="card-body">
          ${getBadgeHTML(user.usernumber)}
          <div class="user-info-container">
            <img 
              src="${avatarCache.get(user.id)}"
              class="user-avatar rounded-circle" 
              alt="${user.username}"
              style="border-color: ${decimalToHex(user.accent_color)};"
              loading="lazy"
              onerror="this.src='${avatarCache.get(user.id)}'"
            >
            <div class="user-info">
              <h5 class="user-name text-truncate">${
                user.global_name === "None" ? user.username : user.global_name
              }</h5>
              <p class="user-username text-truncate">@${user.username}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Update DOM in a single operation
  elements.usersGrid.innerHTML = `
    ${messages.resultsCount(users.length)}
    <div class="row g-4">
      ${userCardsHTML}
    </div>
    ${createPaginationControls(users.length)}
  `;

  // Preload next page avatars
  const nextPageStart = endIndex;
  const nextPageEnd = nextPageStart + USERS_PER_PAGE;
  const nextPageUsers = users.slice(nextPageStart, nextPageEnd);

  // Load next page avatars in the background
  nextPageUsers.forEach(async (user) => {
    if (!avatarCache.has(user.id)) {
      const avatarUrl = await window.checkAndSetAvatar(user);
      avatarCache.set(user.id, avatarUrl);
    }
  });

  // Add pagination event listeners
  const paginationHandler = (e) => {
    e.preventDefault();
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    let newPage = currentPage;

    if (e.currentTarget.getAttribute("aria-label") === "Previous") {
      if (currentPage > 1) newPage--;
    } else if (e.currentTarget.getAttribute("aria-label") === "Next") {
      if (currentPage < totalPages) newPage++;
    } else {
      newPage = parseInt(e.currentTarget.dataset.page);
    }

    if (newPage !== currentPage && newPage > 0 && newPage <= totalPages) {
      currentPage = newPage;
      displayUsers(users, currentPage);
    }
  };

  document.querySelectorAll(".pagination .page-link").forEach((link) => {
    link.addEventListener("click", paginationHandler);
  });

  // Optimize page input handler
  const pageInput = document.querySelector(".page-input");
  if (pageInput) {
    pageInput.value = currentPage;
    pageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const newPage = parseInt(e.target.value);
        const totalPages = Math.ceil(users.length / USERS_PER_PAGE);

        if (newPage > 0 && newPage <= totalPages) {
          currentPage = newPage;
          displayUsers(users, currentPage);
        } else {
          e.target.value = currentPage;
        }
      }
    });
  }
};

// API Functions
const searchUsers = (searchTerm) => {
  const searchTermLower = searchTerm.toLowerCase();

  // Check if search term is a Discord user ID (17 or 18 digits)
  if (/^\d{17,19}$/.test(searchTerm)) {
    return allUsers.filter((user) => user.id === searchTerm);
  }

  // Regular username/global_name search
  return allUsers.filter(
    (user) =>
      user.username.toLowerCase().startsWith(searchTermLower) ||
      (user.global_name &&
        user.global_name.toLowerCase().startsWith(searchTermLower))
  );
};

// Event Handlers
const handleSearch = async () => {
  const searchTerm = elements.searchInput.value.trim();

  if (!searchTerm) {
    await displayUsers(allUsers, 1);
    hideLoading();
    return;
  }

  showLoading();
  const filteredUsers = searchUsers(searchTerm);

  if (filteredUsers.length === 0) {
    showMessage(messages.noUsers);
  } else {
    await displayUsers(filteredUsers, 1);
    hideLoading();
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  let searchInputValue = elements.searchInput.value.trim();

  // Show clear button if there's an initial search term
  elements.clearButton.style.display = searchInputValue ? "block" : "none";

  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/users/list?nocache=true`);
    if (response.status === 404) {
      showMessage(messages.error);
      elements.totalUsersCount.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M12 16a1 1 0 1 0 1 1a1 1 0 0 0-1-1m10.67 1.47l-8.05-14a3 3 0 0 0-5.24 0l-8 14A3 3 0 0 0 3.94 22h16.12a3 3 0 0 0 2.61-4.53m-1.73 2a1 1 0 0 1-.88.51H3.94a1 1 0 0 1-.88-.51a1 1 0 0 1 0-1l8-14a1 1 0 0 1 1.78 0l8.05 14a1 1 0 0 1 .05 1.02ZM12 8a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1" />
</svg> Service unavailable`;
      return;
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    allUsers = await response.json();
    // Sort all users by usernumber
    allUsers.sort((a, b) => a.usernumber - b.usernumber);

    // Get sorted users instead of shuffled
    shuffledUsers = allUsers; // No need for getInitialShuffledUsers since we're not shuffling anymore

    // Update total users count using array length
    elements.totalUsersCount.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" fill="none" />
        <path fill="currentColor" d="M6 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-5 6s-1 0-1-1s1-4 6-4s6 3 6 4s-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z" />
      </svg> 
      Total Users: ${allUsers.length.toLocaleString()}
    `;

    // Pre-cache first page avatars
    const firstPageUsers = shuffledUsers.slice(0, USERS_PER_PAGE);
    const avatarPromises = firstPageUsers.map(async (user) => {
      if (!avatarCache.has(user.id)) {
        const avatarUrl = await window.checkAndSetAvatar(user);
        avatarCache.set(user.id, avatarUrl);
      }
    });
    await Promise.all(avatarPromises);

    // Start background loading of all other avatars
    const backgroundLoad = async () => {
      const remainingUsers = shuffledUsers.slice(USERS_PER_PAGE);
      for (const user of remainingUsers) {
        if (!avatarCache.has(user.id)) {
          try {
            const avatarUrl = await window.checkAndSetAvatar(user);
            avatarCache.set(user.id, avatarUrl);
          } catch (error) {
            console.error(`Failed to load avatar for user ${user.id}:`, error);
          }
        }
        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    };
    backgroundLoad(); // Start background loading

    // Update total users count using highest usernumber

    elements.totalUsersCount.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" fill="none" />
        <path fill="currentColor" d="M6 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-5 6s-1 0-1-1s1-4 6-4s6 3 6 4s-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z" />
      </svg> 
      Total Users: ${allUsers.length.toLocaleString()}
    `;

    // Important: Check if search input has changed during loading
    const currentSearchTerm = elements.searchInput.value.trim();
    if (currentSearchTerm !== searchInputValue) {
      searchInputValue = currentSearchTerm;
      // Update clear button visibility for the new search term
      elements.clearButton.style.display = currentSearchTerm ? "block" : "none";
    }

    // Check if there was an initial search term
    if (searchInputValue) {
      const searchTermLower = searchInputValue.toLowerCase();

      const filteredUsers = allUsers.filter((user) => {
        const usernameMatch = user.username
          .toLowerCase()
          .startsWith(searchTermLower);
        const globalNameMatch =
          user.global_name &&
          user.global_name.toLowerCase().startsWith(searchTermLower);
        return usernameMatch || globalNameMatch;
      });

      if (filteredUsers.length === 0) {
        showMessage(messages.noUsers);
      } else {
        await displayUsers(filteredUsers, 1);
      }
    } else {
      await displayUsers(shuffledUsers, 1);
    }

    hideLoading();
  } catch (error) {
    console.error("Error in initialization:", error);
    showMessage(messages.error);
    elements.totalUsersCount.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M12 16a1 1 0 1 0 1 1a1 1 0 0 0-1-1m10.67 1.47l-8.05-14a3 3 0 0 0-5.24 0l-8 14A3 3 0 0 0 3.94 22h16.12a3 3 0 0 0 2.61-4.53m-1.73 2a1 1 0 0 1-.88.51H3.94a1 1 0 0 1-.88-.51a1 1 0 0 1 0-1l8-14a1 1 0 0 1 1.78 0l8.05 14a1 1 0 0 1 .05 1.02ZM12 8a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1" />
</svg> Service unavailable`;
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

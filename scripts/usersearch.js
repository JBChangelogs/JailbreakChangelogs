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
  resultsCount: (count, isSearch = false) => `
  <div class="mb-3 text-center">
    <span class="badge bg-primary">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M7 14s-1 0-1-1s1-4 5-4s5 3 5 4s-1 1-1 1zm4-6a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5" />
</svg>
      ${
        isSearch ? count : Math.max(...allUsers.map((user) => user.usernumber))
      } users found
    </span>
  </div>
`,

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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14 7l-5 5l5 5" />
</svg>
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
const fetchAvatar = async (userId, avatarHash, format) => {
  const url = `${DISCORD_CDN}/avatars/${userId}/${avatarHash}.${format}`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok ? url : null;
};

// User Card Template
// Update createUserCard function
const createUserCard = async (user) => {
  let avatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;

  if (user.avatar) {
    try {
      const gifUrl = await fetchAvatar(user.id, user.avatar, "gif");
      if (gifUrl) {
        avatarUrl = gifUrl;
      } else {
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
    <div class="user-card-wrapper" onclick="window.location.href='/users/${
      user.id
    }'">
      <div class="card user-card">
        <div class="card-body">
          <div class="user-info-container">
            <img 
              src="${avatarUrl}"
              class="user-avatar rounded-circle" 
              alt="${user.username}"
              style="border-color: ${decimalToHex(user.accent_color)};"
              onerror="this.src='https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${
                user.username
              }&bold=true&format=svg'"
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

// User Display Logic
const displayUsers = async (users, page = 1) => {
  // Shuffle the users array before pagination
  const shuffledUsers = shuffleArray(users);

  const startIndex = (page - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const usersToDisplay = shuffledUsers.slice(startIndex, endIndex);

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
      elements.totalUsersCount.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M12 16a1 1 0 1 0 1 1a1 1 0 0 0-1-1m10.67 1.47l-8.05-14a3 3 0 0 0-5.24 0l-8 14A3 3 0 0 0 3.94 22h16.12a3 3 0 0 0 2.61-4.53m-1.73 2a1 1 0 0 1-.88.51H3.94a1 1 0 0 1-.88-.51a1 1 0 0 1 0-1l8-14a1 1 0 0 1 1.78 0l8.05 14a1 1 0 0 1 .05 1.02ZM12 8a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1" />
</svg> Service unavailable`;
      return;
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const users = await response.json();
    allUsers = users; // Store globally for later use

    // Update total users count
    const totalUsers = Math.max(...users.map((user) => user.usernumber));
    elements.totalUsersCount.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
	<rect width="16" height="16" fill="none" />
	<path fill="currentColor" d="M6 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6m-5 6s-1 0-1-1s1-4 6-4s6 3 6 4s-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z" />
</svg> Total Users: ${totalUsers.toLocaleString()}`;

    // Display initial user cards
    await displayUsers(users, 1);
    hideLoading();
  } catch (error) {
    console.error("Error loading users:", error);
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

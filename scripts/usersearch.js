document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  const displayUsers = async (users) => {
    const searchTerm = searchInput.value.trim();
    const usersGrid = document.getElementById("usersGrid");
    const loadingSpinner = document.getElementById("loading-spinner");
  
    loadingSpinner.style.display = "none";
    usersGrid.style.display = "block";
    usersGrid.innerHTML = ""; // Clear previous results
  
    if (users.length === 0) {
      // Display "No results found :(" message
      const noResultsMessage = document.createElement("div");
      noResultsMessage.className = "no-results-message";
      noResultsMessage.textContent = "No results found :(";
      usersGrid.appendChild(noResultsMessage);
      return;
    }
  
    if (users.length === 1) {
      return (window.location.href = `/users/${users[0].id}`);
    }
    const exact_match = users.filter(
      (user) => user.username === searchTerm.toLowerCase()
    );
    if (exact_match.length > 0) {
      return (window.location.href = `/users/${exact_match[0].id}`);
    }
  
    // Helper to check if a URL returns 404
    const isValidImage = async (url) => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok; // True if status is 200-299
      } catch {
        return false; // Any fetch error will result in false
      }
    };
  
    // Process each user
    for (const user of users) {
      const userCard = document.createElement("div");
      let avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  
      // Check if avatar is valid, otherwise use placeholder
      if (!(await isValidImage(avatar))) {
        avatar = "assets/profile-pic-placeholder.png";
      }
  
      userCard.className = "user-card";
      userCard.innerHTML = `
        <div class="card user-card mb-3 border-0 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex align-items-center">
              <img src="${avatar}"
                   class="user-avatar rounded-circle me-3" 
                   alt="${user.username}">
              <div class="user-info">
                <h5 class="user-name">${user.global_name}</h5>
                <p class="user-username mb-0">@${user.username}</p>
              </div>
              <div class="ms-auto">
                <a href="/users/${user.id}" class="btn btn-primary btn-sm view-profile-btn">
                  View Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
  
      usersGrid.appendChild(userCard);
    }
  };
  

  // Function to handle search requests
  const handleSearch = async () => {
    const usersGrid = document.getElementById("usersGrid");
    usersGrid.style.display = "none";
    const searchTerm = searchInput.value.trim();
    const loadingSpinner = document.getElementById("loading-spinner");
    const userResults = document.getElementById("user-results");

    if (searchTerm) {
      userResults.style.display = "block";
      loadingSpinner.style.display = "flex"; // Changed to 'flex'
      try {
        const response = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/get/name?name=${searchTerm}`
        );
        if (response.ok) {
          const data = await response.json();
          displayUsers(data);
        } else {
          if (response.status === 404) {
            displayUsers([]);
          } else {
            console.error("Error fetching users:", response.statusText);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        loadingSpinner.style.display = "none";
      }
    } else {
      alert("Please enter a username to search.");
    }
  };

  // Event listener for search button click
  searchButton.addEventListener("click", handleSearch);

  // Event listener for Enter key press inside the input
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });
});

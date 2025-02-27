document.addEventListener("DOMContentLoaded", async () => {
  function decimalToHex(decimal) {
    // Return default color if decimal is falsy OR specifically "None"
    if (!decimal || decimal === "None") return "#124E66";

    // Convert to hex and ensure exactly 6 digits
    const hex = decimal.toString(16).padStart(6, "0").slice(-6);

    // Return the hex color with a # prefix
    return `#${hex}`;
  }

  const usersGrid = document.getElementById("usersGrid");
  const followingCountElement = document.getElementById("followingCount");

  if (!usersGrid) {
    console.error("Could not find usersGrid element");
    return;
  }

  // Get logged in user from session storage
  const loggedInUserId = localStorage.getItem("userid");
  const path = window.location.pathname;
  const segments = path.split("/");
  const showFollowing = JSON.parse(showingfollowing);
  const userId = segments[2];

  const displayUsers = (users) => {
    if (users.length > 0) {
      usersGrid.innerHTML = `
        <div class="row g-4">
          ${users
            .map((user) => {
              if (user.isBanned) {
                return `
                <div class="user-card-wrapper">
                  <div class="card user-card">
                    <div class="card-body">
                      <div class="user-info-container">
                        <img 
                          src="https://ui-avatars.com/api/?background=212a31&color=fff&size=128&rounded=true&name=?&bold=true&format=svg"
                          class="user-avatar rounded-circle" 
                          alt="Banned User"
                          style="border-color: #124E66;"
                        >
                        <div class="user-info">
                          <h5 class="user-name text-truncate text-danger">Account Suspended</h5>
                          <p class="user-username text-truncate text-muted">This user has been banned</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
              } else {
                return `
                <div class="user-card-wrapper" onclick="window.location.href='/users/${
                  user.id
                }'">
                  <div class="card user-card">
                    <div class="card-body">
                      <div class="user-info-container">
                        <img 
                          src="${user.avatarUrl}"
                          class="user-avatar rounded-circle" 
                          alt="${user.username}"
                          style="border-color: ${decimalToHex(
                            user.accent_color
                          )};"
                          onerror="this.src='https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${
                            user.username
                          }&bold=true&format=svg'"
                        >
                        <div class="user-info">
                          <h5 class="user-name text-truncate">${
                            user.global_name === "None"
                              ? user.username
                              : user.global_name
                          }</h5>
                          <p class="user-username text-truncate">@${
                            user.username
                          }</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
              }
            })
            .join("")}
        </div>
      `;
    } else {
      const isOwnProfile = loggedInUserId === userId;
      usersGrid.innerHTML = `
        <div class="text-center my-5 pt-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 36 36" class="text-muted mb-3">
            <rect width="36" height="36" fill="none" />
            <path fill="currentColor" d="M30.47 24.37a17.16 17.16 0 0 0-24.93 0A2 2 0 0 0 5 25.74V31a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2v-5.26a2 2 0 0 0-.53-1.37M29 31H7v-5.27a15.17 15.17 0 0 1 22 0Z" />
            <path fill="currentColor" d="M18 17a7 7 0 0 0 4.45-1.6h-.22a3.68 3.68 0 0 1-2.23-.8a5 5 0 1 1 1.24-8.42l1-1.76A7 7 0 1 0 18 17" />
            <path fill="currentColor" d="M26.85 1.14L21.13 11a1.28 1.28 0 0 0 1.1 2h11.45a1.28 1.28 0 0 0 1.1-2l-5.72-9.86a1.28 1.28 0 0 0-2.21 0" />
          </svg>
          <p class="text-muted h5 fw-light">No following yet</p>
          <p class="text-muted small">${
            isOwnProfile
              ? "Follow other users to see them here"
              : "This user isn't following anyone yet"
          }</p>
        </div>`;
    }
  };

  if (!document.getElementById("usersGrid")) {
    return; // Exit if the grid doesn't exist (means we're showing the private message)
  }

  // Always update page headings based on URL path rather than logged in status
  const titleElement = document.querySelector("h2");
  const subtitleElement = document.querySelector("h4");

  if (titleElement && loggedInUserId === userId) {
    titleElement.textContent = "Following";
  }

  // Keep the friends heading consistent
  if (subtitleElement) {
    subtitleElement.textContent =
      loggedInUserId === userId ? "My Following" : "Following";
  }

  // Async function to fetch followers
  async function fetchFollowing(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/following/get?user=${userId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  }

  // Fetch followers and log the results
  if (!showFollowing) {
    usersGrid.textContent = "This user has their following hidden.";
    if (followingCountElement) {
      followingCountElement.textContent = "(0)";
      if (subtitleElement) {
        subtitleElement.textContent =
          loggedInUserId === userId ? "My Following (0)" : "Following (0)";
      }
    }
    return;
  }

  const following = await fetchFollowing(userId);

  if (following.length > 0) {
    const processedUsers = [];
    let validUserCount = 0;

    for (const followedUser of following) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${followedUser.following_id}`
        );

        if (response.status === 403) {
          processedUsers.push({
            id: followedUser.following_id,
            isBanned: true,
          });
          validUserCount++;
        } else if (response.ok) {
          const userData = await response.json();
          const avatarUrl = await window.checkAndSetAvatar(userData);
          processedUsers.push({
            ...userData,
            avatarUrl,
          });
          validUserCount++;
        }
      } catch (error) {
        console.error("Error processing following:", error);
      }
    }

    // Update count only after processing all users
    if (followingCountElement) {
      followingCountElement.textContent = `(${validUserCount})`;
      if (subtitleElement) {
        subtitleElement.textContent =
          loggedInUserId === userId
            ? `My Following (${validUserCount})`
            : `Following (${validUserCount})`;
      }
    }

    displayUsers(processedUsers);
  } else {
    // Show zero for empty following
    if (followingCountElement) {
      followingCountElement.textContent = "(0)";
      if (subtitleElement) {
        subtitleElement.textContent =
          loggedInUserId === userId ? "My Following (0)" : "Following (0)";
      }
    }
    usersGrid.innerHTML = `
      <div class="text-center my-5 pt-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 36 36" class="text-muted mb-3">
          <rect width="36" height="36" fill="none" />
          <path fill="currentColor" d="M30.47 24.37a17.16 17.16 0 0 0-24.93 0A2 2 0 0 0 5 25.74V31a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2v-5.26a2 2 0 0 0-.53-1.37M29 31H7v-5.27a15.17 15.17 0 0 1 22 0Z" />
          <path fill="currentColor" d="M18 17a7 7 0 0 0 4.45-1.6h-.22a3.68 3.68 0 0 1-2.23-.8a5 5 0 1 1 1.24-8.42l1-1.76A7 7 0 1 0 18 17" />
          <path fill="currentColor" d="M26.85 1.14L21.13 11a1.28 1.28 0 0 0 1.1 2h11.45a1.28 1.28 0 0 0 1.1-2l-5.72-9.86a1.28 1.28 0 0 0-2.21 0" />
        </svg>
        <p class="text-muted h5 fw-light">No following yet</p>
        <p class="text-muted small">${
          loggedInUserId === userId
            ? "Follow other users to see them here"
            : "This user isn't following anyone yet"
        }</p>
      </div>`;
  }
});

function handleinvalidImage(imgElement) {
  setTimeout(() => {
    const userCard = imgElement.closest(".user-card");
    const username = userCard
      .querySelector(".user-username")
      .textContent.substring(1); // Remove @ symbol
    imgElement.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${username}&bold=true&format=svg`;
  }, 0);
}

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
  const followerCountElement = document.getElementById("followerCount");

  if (!usersGrid) {
    console.error("Could not find usersGrid element");
    return;
  }

  // Define displayUsers before using it
  const displayUsers = (users) => {
    if (users.length > 0) {
      usersGrid.innerHTML = `
        <div class="row g-4">
          ${users
            .map(
              (user) => `
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
                      style="border-color: ${decimalToHex(user.accent_color)};"
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
          `
            )
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
          <p class="text-muted h5 fw-light">No followers yet</p>
          <p class="text-muted small">${
            isOwnProfile
              ? "Your followers will appear here"
              : "This user has no followers yet"
          }</p>
        </div>`;
    }
  };

  // Get logged in user from session storage
  const loggedInUserId = localStorage.getItem("userid");
  const path = window.location.pathname;
  const segments = path.split("/");
  const userId = segments[2];

  // Always update page headings based on URL path rather than logged in status
  const titleElement = document.querySelector("h2");
  const subtitleElement = document.querySelector("h4");

  if (titleElement && loggedInUserId === userId) {
    titleElement.textContent = "Followers";
  }

  // Keep the friends heading consistent
  if (subtitleElement) {
    subtitleElement.textContent =
      loggedInUserId === userId ? "My Followers" : "Followers";
  }

  const showfollowers = JSON.parse(showingfollowers);

  if (!document.getElementById("usersGrid")) {
    return;
  }

  async function fetchFollowers(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  }

  const fetchAvatar = async (userId, avatarHash, format) => {
    const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  };

  const getAvatarUrl = async (user) => {
    if (!user.avatar) {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;
    }

    try {
      const gifUrl = await fetchAvatar(user.id, user.avatar, "gif");
      if (gifUrl) return gifUrl;

      const pngUrl = await fetchAvatar(user.id, user.avatar, "png");
      if (pngUrl) return pngUrl;
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }

    return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;
  };

  const followers = await fetchFollowers(userId);

  if (followers.length > 0) {
    const processedUsers = [];
    let validUserCount = 0;

    for (const follower of followers) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${follower.follower_id}`
        );

        if (response.ok) {
          const userData = await response.json();
          const avatarUrl = await getAvatarUrl(userData);
          processedUsers.push({
            ...userData,
            avatarUrl,
          });
          validUserCount++;
        }
      } catch (error) {
        console.error("Error processing follower:", error);
      }
    }

    // Update counts and display after processing
    if (followerCountElement) {
      followerCountElement.textContent = `(${validUserCount})`;
      if (subtitleElement) {
        subtitleElement.textContent =
          loggedInUserId === userId
            ? `My Followers (${validUserCount})`
            : `Followers (${validUserCount})`;
      }
    }

    displayUsers(processedUsers);
  } else {
    // Show zero for empty followers
    if (followerCountElement) {
      followerCountElement.textContent = "(0)";
      if (subtitleElement) {
        subtitleElement.textContent =
          loggedInUserId === userId ? "My Followers (0)" : "Followers (0)";
      }
    }
    usersGrid.innerHTML = `
        <div class="text-center my-5 pt-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 36 36" class="text-muted mb-3">
            <rect width="36" height="36" fill="none" />
            <path fill="currentColor" d="M30.47 24.37a17.16 17.16 0 0 0-24.93 0A2 2 0 0 0 5 25.74V31a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2v-5.26a2 2 0 0 0-.53-1.37M29 31H7v-5.27a15.17 15.17 0 0 1 22 0Z" />
            <path fill="currentColor" d="M18 17a7 7 0 0 0 4.45-1.6h-.22a3.68 3.68 0 0 1-2.23-.8a5 5 0 1 1 1.24-8.42l1-1.76A7 7 0 1 0 18 17" />
            <path fill="currentColor" d="M26.85 1.14L21.13 11a1.28 1.28 0 0 0 1.1 2h11.45a1.28 1.28 0 0 0 1.1-2l-5.72-9.86a1.28 1.28 0 0 0-2.21 0" />
          </svg>
          <p class="text-muted h5 fw-light">No followers yet</p>
          <p class="text-muted small">${
            loggedInUserId === userId
              ? "Your followers will appear here"
              : "This user has no followers yet"
          }</p>
        </div>`;
  }
});

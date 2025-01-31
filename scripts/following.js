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
      usersGrid.innerHTML = '<p class="text-muted">No following yet</p>';
    }
  };

  if (!document.getElementById("usersGrid")) {
    return; // Exit if the grid doesn't exist (means we're showing the private message)
  }

  const fetchAvatar = async (userId, avatarHash, format) => {
    const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  };

  // Add getAvatarUrl helper function
  const getAvatarUrl = async (user) => {
    if (!user.avatar) {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;
    }

    try {
      // Try GIF first
      const gifUrl = await fetchAvatar(user.id, user.avatar, "gif");
      if (gifUrl) {
        return gifUrl;
      }
      // Fallback to PNG if GIF doesn't exist
      const pngUrl = await fetchAvatar(user.id, user.avatar, "png");
      if (pngUrl) {
        return pngUrl;
      }
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }

    // Fallback to default avatar if everything fails
    return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;
  };

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
    }
    return;
  }

  const following = await fetchFollowing(userId);

  // Update the count immediately when we get the data
  if (followingCountElement) {
    const count = Array.isArray(following) ? following.length : 0;
    followingCountElement.textContent = `(${count})`;

    if (subtitleElement) {
      subtitleElement.textContent =
        loggedInUserId === userId
          ? `My Following (${count})`
          : `Following (${count})`;
    }
  } else {
    console.error("Could not find followingCount element");
  }

  if (following.length > 0) {
    const processedUsers = [];

    for (const followedUser of following) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${followedUser.following_id}`
        );

        if (response.status === 403) {
          // Handle banned user
          processedUsers.push({
            id: followedUser.following_id,
            isBanned: true,
          });
        } else {
          const userData = await response.json();
          const avatarUrl = await getAvatarUrl(userData);
          processedUsers.push({
            ...userData,
            avatarUrl,
          });
        }
      } catch (error) {
        console.error("Error processing following:", error);
      }
    }

    displayUsers(processedUsers);
  } else {
    usersGrid.innerHTML = '<p class="text-muted">No following yet</p>';
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

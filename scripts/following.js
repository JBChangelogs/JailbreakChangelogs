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
  const loggedInUserId = sessionStorage.getItem("userid");
  const path = window.location.pathname;
  const segments = path.split("/");
  const showFollowing = JSON.parse(showingfollowing);
  const userId = segments[2];

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
    titleElement.textContent = "My following";
  }

  // Keep the friends heading consistent
  if (subtitleElement) {
    subtitleElement.textContent =
      loggedInUserId === userId ? "My Friends" : "Friends";
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
          ? `My Friends (${count})`
          : `Friends (${count})`;
    }
  } else {
    console.error("Could not find followingCount element");
  }

  if (following.length > 0) {
    for (const followedUser of following) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${followedUser.following_id}`
        );

        if (response.status === 403) {
          // Handle banned user
          const userCard = document.createElement("div");
          userCard.className = "user-card mb-3";
          userCard.innerHTML = `
            <div class="card user-card border-0 shadow-sm">
              <div class="card-body position-relative p-3">
                <div class="d-flex align-items-center">
                  <div class="me-4">
                    <img src="https://ui-avatars.com/api/?background=212a31&color=fff&size=128&rounded=true&name=?&bold=true&format=svg" 
                         class="user-avatar rounded-circle" 
                         width="60"
                         height="60"
                       style="border: 3px solid ${decimalToHex(
                         userData.accent_color
                       )};"
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-decoration-none">
                      <h5 class="user-name card-title mb-2 text-danger">Account Suspended</h5>
                    </div>
                    <p class="user-username card-text text-muted mb-0">This user has been banned</p>
                  </div>
                </div>
              </div>
            </div>`;
          usersGrid.appendChild(userCard);
        } else {
          // Handle active user
          const userData = await response.json();
          const avatarUrl = await getAvatarUrl(userData);

          const userCard = document.createElement("div");
          userCard.className = "user-card mb-3";
          userCard.innerHTML = `
            <div class="card user-card border-0 shadow-sm">
              <div class="card-body position-relative p-3">
                <div class="d-flex align-items-center">
                  <div class="me-4">
                    <img src="${avatarUrl}" 
                         class="user-avatar rounded-circle" 
                         width="48"
                         height="48"
                         style="border: 3px solid ${decimalToHex(
                           userData.accent_color
                         )};"
                         onerror="handleinvalidImage(this)">
                  </div>
                  <div class="flex-grow-1">
                    <a href="/users/${
                      userData.id
                    }" class="text-decoration-none">
                      <h5 class="user-name card-title mb-2">${
                        userData.global_name
                      }</h5>
                    </a>
                    <p class="user-username card-text text-muted mb-0">@${
                      userData.username
                    }</p>
                  </div>
                </div>
              </div>
            </div>`;
          usersGrid.appendChild(userCard);
        }
      } catch (error) {
        console.error("Error processing following:", error);
      }
    }
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

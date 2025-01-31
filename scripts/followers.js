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

  // Update the count
  if (followerCountElement) {
    const count = Array.isArray(followers) ? followers.length : 0;
    followerCountElement.textContent = `(${count})`;

    if (subtitleElement) {
      subtitleElement.textContent =
        loggedInUserId === userId
          ? `My Followers (${count})`
          : `Followers (${count})`;
    }
  }

  // Clear existing content
  usersGrid.innerHTML = "";
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
      usersGrid.innerHTML = '<p class="text-muted">No followers yet</p>';
    }
  };

  if (followers.length > 0) {
    const processedUsers = [];

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
        }
      } catch (error) {
        console.error("Error processing follower:", error);
      }
    }

    displayUsers(processedUsers);
  } else {
    usersGrid.innerHTML = '<p class="text-muted">No followers yet</p>';
  }
});

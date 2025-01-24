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
  const loggedInUserId = sessionStorage.getItem("userid");
  const path = window.location.pathname;
  const segments = path.split("/");
  const userId = segments[2];

  // Always update page headings based on URL path rather than logged in status
  const titleElement = document.querySelector("h2");
  const subtitleElement = document.querySelector("h4");

  if (titleElement && loggedInUserId === userId) {
    titleElement.textContent = "My followers";
  }

  // Keep the friends heading consistent
  if (subtitleElement) {
    subtitleElement.textContent =
      loggedInUserId === userId ? "My Friends" : "Friends";
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
          ? `My Friends (${count})`
          : `Friends (${count})`;
    }
  }

  // Clear existing content
  usersGrid.innerHTML = "";

  if (followers.length > 0) {
    for (const follower of followers) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${follower.follower_id}`
        );

        if (response.ok) {
          const userData = await response.json();
          const avatarUrl = await getAvatarUrl(userData);

          // Insert the card template here
          const userCard = document.createElement("div");
          userCard.className = "user-card mb-3";
          userCard.innerHTML = `
          <div class="card user-card border-0 shadow-sm">
            <div class="card-body position-relative p-3">
              <div class="d-flex align-items-center">
                <div class="me-4">
                  <img src="${avatarUrl}" 
                       class="user-avatar rounded-circle" 
                       width="60"
                       height="60"
                       style="border: 3px solid ${decimalToHex(
                         userData.accent_color
                       )};"
                       onerror="handleinvalidImage(this)">
                </div>
                <div class="flex-grow-1">
                  <a href="/users/${userData.id}" class="text-decoration-none">
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
        console.error("Error processing follower:", error);
      }
    }
  } else {
    usersGrid.innerHTML = '<p class="text-muted">No followers yet</p>';
  }
});

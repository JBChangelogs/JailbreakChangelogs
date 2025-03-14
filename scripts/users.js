document.addEventListener("DOMContentLoaded", function () {
  // Initialize all tooltips
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );

  const bannerContainer = document.querySelector(".banner-container");
  if (bannerContainer) {
    bannerContainer.classList.add("loading"); // Add loading state immediately
  }
  const permissions = JSON.parse(settings);
  const udata = JSON.parse(userData);

  const favoritesTab = document.getElementById("favorites-tab");
  if (favoritesTab) {
    favoritesTab.addEventListener("click", function () {
      currentPage = 1; // Reset to first page when switching tabs
      const userId = window.location.pathname.split("/").pop();
      card_pagination.style.display = "none"; // Hide pagination initially
      fetchUserFavorites(userId);
    });
  }

  // Add click handler for comments tab
  const commentsTab = document.getElementById("comments-tab");
  if (commentsTab) {
    commentsTab.addEventListener("click", function () {
      currentPage = 1; // Reset to first page when switching tabs
      const userId = window.location.pathname.split("/").pop();
      card_pagination.style.display = "none"; // Hide pagination initially
      fetchUserComments(userId);
    });
  }

  const follow_button = document.getElementById("follow-button");
  const settings_button = document.getElementById("settings-button");
  const pathSegments = window.location.pathname.split("/");
  const earlyBadge = document.getElementById("early-badge");
  const loggedinuserId = localStorage.getItem("userid");
  const userId = pathSegments[pathSegments.length - 1];
  const card_pagination = document.getElementById("card-pagination");
  const userBanner = document.getElementById("banner");

  // Initialize pagination visibility at start
  if (card_pagination) {
    card_pagination.style.display = "flex";
  }

  // Handle Discord connection
  const discordConnection = document.getElementById("discord-connection");
  if (discordConnection) {
    if (permissions.hide_connections === 1 && loggedinuserId !== userId) {
      discordConnection.innerHTML = `
        <div class="connection-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <rect width="16" height="16" fill="none" />
            <g fill="#748D92">
              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
              <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
            </g>
          </svg>
          <span class="connection-text">Connection Hidden</span>
        </div>`;
    } else {
      const discordUsername =
        discordConnection.querySelector(".connection-text");
      discordUsername.textContent = udata.username;
      discordConnection.addEventListener("click", function () {
        if (!udata.id) {
          console.error("Discord ID not found in user data");
          return;
        }
        const discordUrl = `https://discord.com/users/${udata.id}`;

        window.open(discordUrl, "_blank", "noopener,noreferrer");
      });
    }
  }

  // Handle Roblox connection
  const robloxConnection = document.getElementById("roblox-connection");
  if (robloxConnection) {
    if (permissions.hide_connections === 1 && loggedinuserId !== userId) {
      robloxConnection.innerHTML = `
        <div class="connection-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <rect width="16" height="16" fill="none" />
            <g fill="#748D92">
              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
              <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
            </g>
          </svg>
          <span class="connection-text">Connection Hidden</span>
        </div>`;
    } else if (udata.roblox_username && udata.roblox_id) {
      const robloxUsername = robloxConnection.querySelector(".connection-text");

      robloxUsername.textContent = udata.roblox_username;

      robloxConnection.addEventListener("click", function () {
        const robloxUrl = `https://www.roblox.com/users/${udata.roblox_id}/profile`;

        window.open(robloxUrl, "_blank", "noopener,noreferrer");
      });
    } else {
      // Hide the Roblox connection if user doesn't have Roblox data

      robloxConnection.style.display = "none";
    }
  }

  // Get if we're in private profile view
  const isPrivateView =
    permissions.profile_public === 0 &&
    localStorage.getItem("userid") !== pathSegments[pathSegments.length - 1];

  // If we're in private view, don't proceed with button-related code
  if (isPrivateView) {
    return; // Exit early for private profiles
  }
  const recent_comments_button = document.getElementById(
    "recent-comments-button"
  );

  // const loggedinuserId = localStorage.getItem("userid");
  // const userId = pathSegments[pathSegments.length - 1];
  // const card_pagination = document.getElementById("card-pagination");
  // const userBanner = document.getElementById("banner");

  // Get button elements
  const editBioButton = document.getElementById("edit-bio-button");
  const saveBioButton = document.getElementById("save-bio-button");
  const cancelBioButton = document.getElementById("cancel-bio-button");
  const userBio = document.getElementById("userBio");
  const characterCount = document.getElementById("character-count");
  const userDateBio = document.getElementById("description-updated-date");

  if (earlyBadge) {
    earlyBadge.addEventListener("click", function () {
      toastControl.showToast(
        "special",
        `This user was user #${udata.usernumber}/100 to join Jailbreak Changelogs!`
      );
    });
  }

  if (permissions.profile_public === 0 && loggedinuserId !== userId) {
    // If profile is private and viewer is not the owner
    const mainContent = document.querySelector(".user-content");
    const userStats = document.querySelector(".user-stats");

    // Hide the stats
    if (userStats) {
      userStats.style.display = "none";
    }

    // Hide the follow button if it exists
    if (follow_button) {
      follow_button.style.display = "none";
    }
  }
  function linkifyText(text) {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.replace(urlRegex, function (url) {
      // Create a safe link with proper attributes
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1d7da3; text-decoration: underline;">${url}</a>`;
    });
  }

  // Handle settings button click
  settings_button.addEventListener("click", function () {
    window.location.href = "/settings";
  });

  // Show edit button only for logged in user viewing their own profile
  function updateBioButtonsVisibility() {
    if (loggedinuserId && loggedinuserId === userId) {
      editBioButton.classList.remove("d-none");
    } else {
      editBioButton.classList.add("d-none");
    }
    saveBioButton.classList.add("d-none");
    cancelBioButton.classList.add("d-none");
  }

  function stripHtml(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  // Handle edit button click
  editBioButton.addEventListener("click", function () {
    // Hide edit button, show save and cancel
    editBioButton.classList.add("d-none");
    saveBioButton.classList.remove("d-none");
    cancelBioButton.classList.remove("d-none");

    // Create textarea
    const textarea = document.createElement("textarea");
    textarea.className = "form-control";
    textarea.id = "bio-textarea";
    textarea.style.minHeight = "150px";
    textarea.style.resize = "none";
    textarea.maxLength = 500;
    textarea.value = stripHtml(userBio.innerHTML.replace(/<br\s*\/?>/g, "\n"));

    // custom styling
    textarea.style.backgroundColor = "#212a31"; // --bg-primary
    textarea.style.color = "#d3d9d4"; // --text-primary
    textarea.style.border = "1px solid #748d92"; // --text-muted for border
    textarea.style.transition = "border-color 0.2s ease";

    //  focus styles
    textarea.addEventListener("focus", function () {
      this.style.borderColor = "#1d7da3"; // --accent-color-light
      this.style.boxShadow = "0 0 0 0.2rem rgba(29, 125, 163, 0.25)"; // --accent-color-light with opacity
      this.style.backgroundColor = "#2e3944"; // --bg-secondary
    });

    // Reset styles on blur
    textarea.addEventListener("blur", function () {
      this.style.borderColor = "#748d92"; // --text-muted
      this.style.boxShadow = "none";
      this.style.backgroundColor = "#212a31"; // --bg-primary
    });

    // Store original content
    const originalContent = userBio.innerHTML;
    const originalDate = userDateBio.textContent;

    // Replace bio with textarea
    userBio.style.display = "none";
    userBio.insertAdjacentElement("afterend", textarea);

    // Update character count
    characterCount.textContent = `${textarea.value.length}/500`;
    textarea.addEventListener("input", function () {
      characterCount.textContent = `${this.value.length}/500`;
    });

    // Handle cancel
    cancelBioButton.addEventListener("click", function () {
      textarea.remove();
      userBio.style.display = "";
      userBio.innerHTML = originalContent;
      userDateBio.textContent = originalDate;
      characterCount.textContent = "";
      updateBioButtonsVisibility();
    });

    // Handle save
    saveBioButton.addEventListener("click", async function () {
      const description = textarea.value;
      if (description.length > 500) {
        toastControl.showToast(
          "error",
          "Bio cannot exceed 500 characters",
          "Error"
        );
        return;
      }

      try {
        const user = getCookie("token");
        if (!user) {
          toastControl.showToast("error", "You must be logged in", "Error");
          return;
        }

        const response = await fetch(
          "https://api3.jailbreakchangelogs.xyz/users/description/update",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
            body: JSON.stringify({ user, description }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update bio");
        }

        toastControl.showToast(
          "success",
          "Bio updated successfully",
          "Success"
        );

        // Refresh bio content
        fetchUserBio(userId);

        // Reset UI
        textarea.remove();
        userBio.style.display = "";
        characterCount.textContent = "";
        updateBioButtonsVisibility();
      } catch (error) {
        console.error("Error updating bio:", error);
        toastControl.showToast("error", "Failed to update bio", "Error");
      }
    });
  });

  // Initialize buttons visibility
  updateBioButtonsVisibility();

  if (permissions.profile_public === true && loggedinuserId !== userId) {
    window.location.href = "/users";
  }

  let banner;
  function decimalToHex(decimal) {
    if (!decimal || decimal === "None") return "#000000";

    // Simply convert the decimal string to a 6-character hex
    // By taking the first 6 characters after converting to hex
    const hex = decimal.toString(16).substring(0, 6);
    return `#${hex}`;
  }

  // Toast control mechanism
  const toastControl = {
    showToast(type, message, title) {
      switch (type) {
        case "success":
          notyf.success(message);
          break;
        case "error":
          notyf.error(message);
          break;
        case "info":
          notyf.info(message);
          break;
        case "special":
          notyf.open({
            type: "special",
            message: message,
          });
          break;
      }
    },
  };

  async function fetchBanner(userId, bannerHash) {
    // Early return if no banner hash or if banner hash is "None"
    if (!userId || !bannerHash || bannerHash === "None") {
      return null;
    }

    const isAnimated = bannerHash.startsWith("a_");
    const format = isAnimated ? "gif" : "png";
    const bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${format}?size=4096`;

    try {
      const response = await fetch(bannerUrl, {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.ok) {
        return bannerUrl;
      }

      // Only try PNG as fallback if original request was for GIF
      if (isAnimated) {
        const pngUrl = bannerUrl.replace(".gif", ".png");
        const pngResponse = await fetch(pngUrl, {
          method: "HEAD",
          cache: "no-store",
        });

        if (pngResponse.ok) {
          return pngUrl;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  // Remove getBannerUrl function since we've simplified the logic
  async function fetchUserBanner(userId) {
    const bannerContainer = document.querySelector(".banner-container");
    const userBanner = document.getElementById("banner");

    try {
      // Generate fallback banner URL once
      const randomNumber = Math.floor(Math.random() * 14) + 1;
      const fallbackBanner = `/assets/backgrounds/background${randomNumber}.webp`;

      // Get user settings first
      const settingsResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch user settings");
      }

      const settings = await settingsResponse.json();
      let bannerUrl = fallbackBanner;

      if (settings.banner_discord === 1) {
        const discordBanner = await fetchBanner(userId, udata.banner);
        if (discordBanner) {
          bannerUrl = discordBanner;
        }
      } else {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/background/get?user=${userId}`
        );

        if (response.ok) {
          const bannerData = await response.json();
          if (
            bannerData.image_url &&
            !bannerData.image_url.includes("/assets/backgrounds/background") &&
            bannerData.image_url !== "NONE"
          ) {
            bannerUrl = bannerData.image_url;
          }
        }
      }

      // Load the banner image
      const img = new Image();
      img.onload = () => {
        userBanner.src = img.src;
        bannerContainer.classList.remove("loading");
        userBanner.style.opacity = "1";
      };
      img.onerror = () => {
        userBanner.src = fallbackBanner;
        bannerContainer.classList.remove("loading");
        userBanner.style.opacity = "1";
      };
      img.src = bannerUrl;
    } catch (error) {
      console.error("Error fetching banner:", error);
      // Use the same fallback banner variable here instead of generating a new one
      userBanner.src = fallbackBanner;
      bannerContainer.classList.remove("loading");
      userBanner.style.opacity = "1";
    }
  }

  function updateUIForUser() {
    follow_button.classList.remove("d-none");
    settings_button.classList.add("d-none");

    if (!loggedinuserId) {
      settings_button.classList.add("d-none");
      return;
    }

    if (loggedinuserId === userId) {
      follow_button.classList.add("d-none");
      settings_button.classList.remove("d-none");
    }
  }

  function formatTimeDifference(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) {
      return "just now";
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diff < 2592000) {
      // 30 days
      const days = Math.floor(diff / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else {
      // Format as date if more than 30 days
      return new Date(timestamp * 1000).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  function updateUserPresence(userData) {
    const statusIndicator = document.getElementById("status-indicator");
    const lastSeenElement = document.getElementById("last-seen");

    // Clean up existing tooltip
    const tooltipInstance = bootstrap.Tooltip.getInstance(statusIndicator);
    if (tooltipInstance) {
      tooltipInstance.dispose();
    }

    // Check if presence is hidden for non-profile owners
    if (permissions.hide_presence === 1 && loggedinuserId !== userId) {
      statusIndicator.className = "status-indicator status-offline";
      statusIndicator.setAttribute("data-bs-toggle", "tooltip");
      statusIndicator.setAttribute("data-bs-placement", "top");
      statusIndicator.setAttribute("title", "Status Hidden");
      lastSeenElement.innerHTML = `
        <span style="color: #748D92;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" style="vertical-align: -1px;">
            <rect width="16" height="16" fill="none" />
            <g fill="currentColor">
              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
              <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
            </g>
          </svg>
          Last seen hidden
        </span>`;
    } else if (userData.presence && userData.presence.status === "Online") {
      statusIndicator.className = "status-indicator status-online";
      statusIndicator.setAttribute("data-bs-toggle", "tooltip");
      statusIndicator.setAttribute("data-bs-placement", "top");
      statusIndicator.setAttribute("title", "Online");
      lastSeenElement.textContent = "Online";
    } else {
      const lastSeenText =
        userData.last_seen === null
          ? "Last seen unknown"
          : `Last seen ${formatTimeDifference(userData.last_seen)}`;

      statusIndicator.className = "status-indicator status-offline";
      statusIndicator.setAttribute("data-bs-toggle", "tooltip");
      statusIndicator.setAttribute("data-bs-placement", "top");
      statusIndicator.setAttribute("title", lastSeenText);
      lastSeenElement.textContent = lastSeenText;
    }

    // Initialize tooltip - now this runs for ALL cases
    new bootstrap.Tooltip(statusIndicator);
  }

  function showLoginRecommendationBanner(userData) {
    if (userData.last_seen === null) {
      const userBio = document.getElementById("userBio");
      const bannerHTML = `
        <div class="alert alert-info border-0 shadow-sm mb-4" role="alert" 
             style="background-color: var(--bg-secondary); border-left: 4px solid var(--accent-color-light);">
          <div class="d-flex align-items-center">
            <div class="me-3">
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="#1d7da3" d="M13.435 2.075a3.33 3.33 0 0 0-2.87 0c-.394.189-.755.497-1.26.928l-.079.066a2.56 2.56 0 0 1-1.58.655l-.102.008c-.662.053-1.135.09-1.547.236a3.33 3.33 0 0 0-2.03 2.029c-.145.412-.182.885-.235 1.547l-.008.102a2.56 2.56 0 0 1-.655 1.58l-.066.078c-.431.506-.74.867-.928 1.261a3.33 3.33 0 0 0 0 2.87c.189.394.497.755.928 1.26l.066.079c.41.48.604.939.655 1.58l.008.102c.053.662.09 1.135.236 1.547a3.33 3.33 0 0 0 2.029 2.03c.412.145.885.182 1.547.235l.102.008c.629.05 1.09.238 1.58.655l.078.066c.506.431.867.74 1.261.928a3.33 3.33 0 0 0 2.87 0c.394-.189.755-.497 1.26-.928l.079-.066c.48-.41.939-.604 1.58-.655l.102-.008c.662-.053 1.135-.09 1.547-.236a3.33 3.33 0 0 0 2.029-2.029c.145-.412.182-.885.235-1.547l.008-.102c.05-.629.238-1.09.655-1.58l.066-.079c.431-.505.74-.866.928-1.26a3.33 3.33 0 0 0 0-2.87c-.189-.394-.497-.755-.928-1.26l-.066-.079a2.56 2.56 0 0 1-.655-1.58l-.008-.102c-.053-.662-.09-1.135-.236-1.547a3.33 3.33 0 0 0-2.029-2.03c-.412-.145-.885-.182-1.547-.235l-.102-.008a2.56 2.56 0 0 1-1.58-.655l-.079-.066c-.505-.431-.866-.74-1.26-.928M12 7.25a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75M10.75 16a.75.75 0 0 1 .5-.707v-3.586a.75.75 0 0 1 .25-1.457h.5a.75.75 0 0 1 .75.75v4.293a.75.75 0 0 1-.25 1.457h-1a.75.75 0 0 1-.75-.75" />
</svg>
            </div>
            <div>
              <h6 class="alert-heading mb-1" style="color: var(--accent-color-light);">
                Are you the owner of this profile?
              </h6>
              <p class="mb-0" style="color: var(--text-primary);">
                Login to enable status indicators and last seen timestamps. Your Discord avatar, banner, 
                and username changes will automatically sync with your profile.
              </p>
            </div>
          </div>
        </div>`;

      // Insert banner before the user bio
      userBio.insertAdjacentHTML("beforebegin", bannerHTML);
    }
  }

  async function fetchUserBio(userId) {
    try {
      // First get user data for member since date
      const userResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/?id=${userId}&nocache=true`
      );

      // Handle 404 - user not found
      if (userResponse.status === 404) {
        window.location.href = "/users";
        return;
      }

      // Handle banned user case
      if (userResponse.status === 403) {
        userBio.innerHTML = `
    <div class="alert alert-danger border-0 shadow-sm" role="alert" style="background-color: #2E3944; border-left: 4px solid #dc3545;">
      <div class="d-flex align-items-center">
      <div class="me-3">
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="none" />
    <path fill="#dc3545" fill-rule="evenodd" d="M11.577 4.237a.25.25 0 0 0-.354 0L9.037 6.423a.25.25 0 0 0 0 .354l8.186 8.186a.25.25 0 0 0 .354 0l2.186-2.186a.25.25 0 0 0 0-.354zm-1.414-1.06a1.75 1.75 0 0 1 2.474 0l8.186 8.186a1.75 1.75 0 0 1 0 2.474l-2.186 2.186a1.75 1.75 0 0 1-2.474 0L13.8 13.661l-6.67 6.67a2.447 2.447 0 0 1-3.46-3.461l6.67-6.67l-2.363-2.363a1.75 1.75 0 0 1 0-2.474zM11.4 11.26l-6.67 6.67a.947.947 0 1 0 1.34 1.339l6.67-6.67z" clip-rule="evenodd" />
  </svg>
      </div>
      <div>
        <h6 class="alert-heading mb-1" style="color: #dc3545;">Account Suspended</h6>
        <p class="mb-0" style="color: #D3D9D4;">
        This user's account has been suspended for violating our community guidelines.
        </p>
      </div>
      </div>
    </div>`;

        // Clear other profile elements
        userDateBio.innerHTML = "";

        // Hide interactive elements if they exist
        const elementsToHide = [
          document.querySelector(".user-stats"),
          document.getElementById("follow-button"),
          document.getElementById("comments-list"),
          document.getElementById("card-pagination"),
          document.querySelector(".username-container"),
        ];

        elementsToHide.forEach((element) => {
          if (element) element.style.display = "none";
        });

        // Set suspended account avatar
        const userAvatar = document.getElementById("user-avatar");
        if (userAvatar) {
          userAvatar.src =
            "https://ui-avatars.com/api/?background=144a61&color=fff&size=128&rounded=true&name=?&bold=true&format=svg";
          userAvatar.style.border = "4px solid #495057"; // Keep the gray border
        }

        return; // Exit early
      }

      if (!userResponse.ok) {
        throw new Error(`User data fetch failed: ${userResponse.status}`);
      }

      // Rest of the existing code...
      const userData = await userResponse.json();
      showLoginRecommendationBanner(userData);

      const usernameContainer = document.querySelector(".username-link");
      const memberSince = new Date(
        parseInt(userData.created_at) * 1000
      ).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // Then get bio data
      const bioResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/description/get?user=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      // Handle 404 (no description) case
      if (bioResponse.status === 404) {
        userBio.textContent = "No description provided";
        userDateBio.innerHTML = `
          <div class="mb-2">Last updated: Never</div>
          <hr class="my-2" style="border-color: #748D92; opacity: 0.2;">
          <div style="color: #748D92;">Member since: ${memberSince}</div>
        `;
        return;
      }

      // Handle other error cases
      if (!bioResponse.ok) {
        throw new Error(`Bio fetch failed: ${bioResponse.status}`);
      }

      // Process bio data for successful response
      const bioData = await bioResponse.json();
      const description = bioData.description || "No description provided";
      userBio.innerHTML = linkifyText(description.replace(/\n/g, "<br>"));

      // Format and set date
      const createdTimestamp = parseInt(userData.created_at) * 1000;
      const lastUpdatedTimestamp = bioData.last_updated
        ? bioData.last_updated * 1000
        : null;
      const date =
        !lastUpdatedTimestamp || lastUpdatedTimestamp === createdTimestamp
          ? "Never"
          : formatDate(lastUpdatedTimestamp / 1000); // Convert back to seconds for formatDate

      userDateBio.innerHTML = `
          <div class="mb-2">Last updated: ${date}</div>
          <hr class="my-2" style="border-color: #748D92; opacity: 0.2;">
          <div style="color: #748D92;">
            Member #${udata.usernumber} since ${memberSince}
            <div id="last-seen" class="mt-1" style="font-size: 0.9em;">
              ${
                userData.presence?.status === "Online"
                  ? "Online"
                  : userData.last_seen
                  ? `Last seen ${formatTimeDifference(userData.last_seen)}`
                  : ""
              }
            </div>
          </div>
        `;

      updateUserPresence(userData);
      await fetchUserBanner(userId);
    } catch (error) {
      console.error("Error in fetchUserBio:", error);
      userBio.textContent = "Error fetching user bio.";
      userDateBio.innerHTML = `
            <div class="mb-2">Last updated: Error</div>
            <hr class="my-2" style="border-color: #748D92; opacity: 0.2;">
            <div style="color: #748D92;">Member since: Unknown</div>
        `;
    }
  }

  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th"; // Covers 11th to 19th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  function formatDate(unixTimestamp) {
    const isMilliseconds = unixTimestamp.toString().length > 10;
    const timestamp = isMilliseconds ? unixTimestamp : unixTimestamp * 1000;

    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${day} ${month} ${year} at ${time}`;
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById("paginationControls");
    paginationContainer.innerHTML = ""; // Clear existing controls

    // Common button styles with your color palette
    const buttonClasses = "btn m-1";
    const buttonStyle = `
            background-color: #2E3944; 
            color: #D3D9D4;
            border: 1px solid #748D92;
            font-size: 0.875rem;
            padding: 0.25rem 0.5rem;
            transition: all 0.2s ease;
        `;
    const buttonHoverStyle = `
            background-color: #124E66;
            color: #D3D9D4;
            border-color: #D3D9D4;
        `;

    // Helper function to create buttons
    function createButton(text, isDisabled, onClick) {
      const button = document.createElement("button");
      button.textContent = text;
      button.classList.add(...buttonClasses.split(" "));
      button.style.cssText = buttonStyle;
      button.disabled = isDisabled;

      if (!isDisabled) {
        button.addEventListener("mouseover", () => {
          button.style.cssText = buttonStyle + buttonHoverStyle;
        });
        button.addEventListener("mouseout", () => {
          button.style.cssText = buttonStyle;
        });
        button.addEventListener("click", onClick);
      } else {
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
      }

      return button;
    }

    // Double left arrow
    const doubleLeftArrow = createButton("<<", currentPage === 1, () => {
      if (currentPage > 1) {
        currentPage = 1;
        const activeTab = document.querySelector(".nav-link.active").id;
        if (activeTab === "favorites-tab") {
          fetchUserFavorites(userId);
        } else {
          fetchUserComments(userId);
        }
      }
    });
    paginationContainer.appendChild(doubleLeftArrow);

    // Left arrow
    const leftArrow = createButton("<", currentPage === 1, () => {
      if (currentPage > 1) {
        currentPage--;
        const activeTab = document.querySelector(".nav-link.active").id;
        if (activeTab === "favorites-tab") {
          fetchUserFavorites(userId);
        } else {
          fetchUserComments(userId);
        }
      }
    });
    paginationContainer.appendChild(leftArrow);

    // Page input
    const pageInput = document.createElement("input");
    pageInput.type = "number";
    pageInput.value = currentPage;
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.classList.add("form-control", "mx-1");
    pageInput.style.cssText = `
            width: 50px;
            height: 31px;
            font-size: 0.875rem;
            padding: 0.25rem;
            background-color: #2E3944;
            color: #D3D9D4;
            border: 1px solid #748D92;
            text-align: center;
        `;
    pageInput.addEventListener("change", () => {
      const newPage = parseInt(pageInput.value);
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        const activeTab = document.querySelector(".nav-link.active").id;
        if (activeTab === "favorites-tab") {
          fetchUserFavorites(userId);
        } else {
          fetchUserComments(userId);
        }
      } else {
        pageInput.value = currentPage;
      }
    });
    paginationContainer.appendChild(pageInput);

    // Right arrow
    const rightArrow = createButton(">", currentPage === totalPages, () => {
      if (currentPage < totalPages) {
        currentPage++;
        const activeTab = document.querySelector(".nav-link.active").id;
        if (activeTab === "favorites-tab") {
          fetchUserFavorites(userId);
        } else {
          fetchUserComments(userId);
        }
      }
    });
    paginationContainer.appendChild(rightArrow);

    // Double right arrow
    const doubleRightArrow = createButton(
      ">>",
      currentPage === totalPages,
      () => {
        currentPage = totalPages;
        const activeTab = document.querySelector(".nav-link.active").id;
        if (activeTab === "favorites-tab") {
          fetchUserFavorites(userId);
        } else {
          fetchUserComments(userId);
        }
      }
    );
    paginationContainer.appendChild(doubleRightArrow);
  }

  let currentPage = 1;
  const commentsPerPage = 6;

  async function fetchUserComments(userId) {
    const recentComments = document.getElementById("comments-list");
    card_pagination.style.display = "flex";

    // Show loading spinner in card body
    recentComments.innerHTML = `
      <div class="card mb-3 comment-card shadow-lg" style="background-color: #212A31; color: #D3D9D4;">
        <div class="card-body d-flex justify-content-center align-items-center" style="min-height: 200px;">
          <div class="text-center">
            <div class="spinner-border text-light mb-2" role="status">
              <span class="visually-hidden">Loading recent comments...</span>
            </div>
            <p class="mb-0">Loading recent comments...</p>
          </div>
        </div>
      </div>`;

    try {
      // Check if comments are hidden
      if (permissions.show_recent_comments === 0 && loggedinuserId !== userId) {
        recentComments.innerHTML = `
          <div class="col-12 text-center p-4">
            <div class="hidden-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
                <rect width="16" height="16" fill="none" />
                <g fill="#748D92">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                  <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
                </g>
              </svg>
              <h4>Comments Hidden</h4>
              <p>This user has chosen to keep their comments private</p>
            </div>
          </div>`;
        renderPaginationControls(1);
        return;
      }

      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/comments/get/user?author=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const comments = await response.json();
      
      // Sort cmments by newest
      comments.sort((a, b) => b.date - a.date);

      // Handle no comments case
      if (!Array.isArray(comments) || comments.length === 0) {
        recentComments.innerHTML = `
          <div class="col-12 text-center p-4">
            <div class="no-favorites-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
                <rect width="16" height="16" fill="none" />
                <g fill="#748D92">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                </g>
              </svg>
              <h4>No Comments Yet</h4>
              <p>This user hasn't made any comments yet</p>
            </div>
          </div>`;
        renderPaginationControls(1);
        return;
      }

      // Calculate pagination
      const totalComments = comments.length;
      const totalPages = Math.max(
        1,
        Math.ceil(totalComments / commentsPerPage)
      ); // Always at least 1 page
      const startIndex = (currentPage - 1) * commentsPerPage;
      const paginatedComments = comments.slice(
        startIndex,
        startIndex + commentsPerPage
      );

      // Always show pagination and render controls
      card_pagination.style.display = "flex";
      renderPaginationControls(totalPages);

      // Clear existing content
      recentComments.innerHTML = "";

      // Process each comment
      for (const comment of paginatedComments) {
        const formattedDate = formatDate(comment.date);
        const commentElement = document.createElement("div");
        commentElement.className = "list-group-item";

        // Handle image URL and display values based on item type
        let imageUrl;
        let displayTitle = comment.item_type;
        let displayType = comment.item_type;
        let viewPath;

        // Special cases that don't use /480p path
        const specialTypes = ["changelog", "season", "trade"];
        
        try {
          if (specialTypes.includes(comment.item_type.toLowerCase())) {
            // Keep special types using ID in path
            switch (comment.item_type.toLowerCase()) {
              case "season":
                imageUrl = `/assets/images/seasons/${comment.item_id}/10.webp`;
                viewPath = `/seasons/${comment.item_id}`;
                const seasonResponse = await fetch(
                  `https://api3.jailbreakchangelogs.xyz/seasons/get?season=${comment.item_id}`
                );
                if (seasonResponse.ok) {
                  const seasonData = await seasonResponse.json();
                  displayTitle = `Season ${seasonData.season}`;
                  displayType = seasonData.title;
                }
                break;
        
              case "changelog":
                imageUrl = `/assets/images/changelogs/${comment.item_id}.webp`;
                viewPath = `/changelogs/${comment.item_id}`;
                const changelogResponse = await fetch(
                  `https://api3.jailbreakchangelogs.xyz/changelogs/get?id=${comment.item_id}`
                );
                if (changelogResponse.ok) {
                  const changelogData = await changelogResponse.json();
                  displayTitle = `Changelog ${comment.item_id}`;
                  displayType = changelogData.title;
                }
                break;
        
              case "trade":
                imageUrl = "/assets/logos/Banner_Background_480.webp";
                displayTitle = `Trade #${comment.item_id}`;
                displayType = "Trade Ad";
                viewPath = `/trading/ad/${comment.item_id}`;
                break;
            }
          } else {
            // Handle regular items
            const itemResponse = await fetch(
              `https://api3.jailbreakchangelogs.xyz/items/get?type=${comment.item_type.toLowerCase()}&id=${comment.item_id}`
            );
        
            if (itemResponse.ok) {
              const itemData = await itemResponse.json();
              if (comment.item_type.toLowerCase() === "horn") {
                imageUrl = "/assets/audios/horn_thumbnail.webp";
              } else {
                imageUrl = `/assets/images/items/480p/${comment.item_type.toLowerCase()}s/${itemData.name}.webp`;
              }
              displayTitle = itemData.name;
              displayType = itemData.type;
              // Use item name in URL for regular items
              viewPath = `/item/${comment.item_type.toLowerCase()}/${encodeURIComponent(itemData.name)}`;
            } else {
              imageUrl = "/assets/logos/Banner_Background_480.webp";
              // Fallback to ID if item fetch fails
              viewPath = `/${comment.item_type.toLowerCase()}s/${comment.item_id}`;
            }
          }

          // Create the comment card
          commentElement.innerHTML = `
            <div class="card mb-3 comment-card shadow-lg" style="background-color: #212A31; color: #D3D9D4;">
              <div class="card-body">
                <div class="row">
                  <!-- Image Section -->
                  <div class="col-md-4 d-none d-md-block">
                    <img src="${imageUrl}" alt="Comment Image" class="img-fluid rounded" style="max-height: 150px; object-fit: cover;">
                  </div>
                  
                  <!-- Content Section -->
                  <div class="col-md-8">
                    <div class="comment-header mb-2">
                      <h6 class="card-title" style="color: #748D92;">
                        ${displayTitle} [${capitalizeFirstLetter(displayType)}]
                      </h6>
                      <small class="text-muted" style="color: #748D92;">
                        ${formattedDate}
                        ${comment.edited_at ? ' (edited)' : ''}
                      </small>
                    </div>
                    <p class="card-text" style="color: #D3D9D4;">${comment.content}</p>
                    <a href="${viewPath}" class="btn btn-sm mt-3 view-item-btn">
                      View Comment
                    </a>
                  </div>
                </div>
              </div>
            </div>`;

          recentComments.appendChild(commentElement);
        } catch (error) {
          console.error("Error fetching item details:", error);
          imageUrl = "/assets/logos/Banner_Background_480.webp";
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);

      recentComments.innerHTML = `
        <div class="col-12 text-center p-4">
          <div class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
              <rect width="16" height="16" fill="none" />
              <g fill="#748D92">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
              </g>
            </svg>
            <h4>No Comments Yet</h4>
            <p>This user has no recent comments</p>
          </div>
        </div>`;
      card_pagination.style.display = "flex"; // Keep pagination visible even on error
      renderPaginationControls(1); // Show single page pagination on error
    }
  }

  async function updateUserCounts(userId) {
    try {
      // Show 0 initially instead of loading spinners
      const following = document.getElementById("following");
      const followers = document.getElementById("followers");
      following.textContent = "0 Following";
      followers.textContent = "0 Followers";

      // Special case for owner display
      if (userId === "659865209741246514" || userId === "1019539798383398946") {
        const crown = document.getElementById("crown");
        crown.style.display = "inline-block";
      }

      // Fetch data
      const [followingArray, followersArray] = await Promise.all([
        fetchUserFollowing(userId),
        fetchUserFollowers(userId),
      ]);

      // Update follow button state
      const isFollowing = followersArray.some(
        (follower) => follower.follower_id === loggedinuserId
      );
      follow_button.textContent = isFollowing ? "Unfollow" : "Follow";

      // Calculate counts
      const followingCount = Array.isArray(followingArray)
        ? followingArray.length
        : 0;
      const followersCount = Array.isArray(followersArray)
        ? followersArray.length
        : 0;

      // Create following link
      const followingLink = document.createElement("a");
      // CHANGE THIS PART - Always show links for profile owner
      followingLink.href = `/users/${userId}/following`; // Remove the conditional

      const followingCount_span = document.createElement("span");
      followingCount_span.textContent = followingCount;
      followingCount_span.classList.add("fw-bold");
      followingCount_span.style.color = "#748D92";
      followingCount_span.setAttribute("data-bs-toggle", "tooltip");
      followingCount_span.setAttribute("data-bs-placement", "top");
      followingCount_span.setAttribute(
        "title",
        followingCount.toLocaleString()
      );

      followingLink.appendChild(followingCount_span);
      // Handle singular/plural for "following" (always plural)
      followingLink.appendChild(document.createTextNode(" Following"));
      followingLink.classList.add("text-decoration-none");
      followingLink.style.color = "#D3D9D4";

      // Create followers link
      const followersLink = document.createElement("a");
      followersLink.href = `/users/${userId}/followers`;

      const followersCount_span = document.createElement("span");
      followersCount_span.textContent = followersCount;
      followersCount_span.classList.add("fw-bold");
      followersCount_span.style.color = "#748D92";
      followersCount_span.setAttribute("data-bs-toggle", "tooltip");
      followersCount_span.setAttribute("data-bs-placement", "top");
      followersCount_span.setAttribute(
        "title",
        followersCount.toLocaleString()
      );

      followersLink.appendChild(followersCount_span);
      // Handle singular/plural for "followers"
      followersLink.appendChild(
        document.createTextNode(
          followersCount === 1 ? " Follower" : " Followers"
        )
      );
      followersLink.classList.add("text-decoration-none");
      followersLink.style.color = "#D3D9D4";

      // Clear containers and add new content
      following.innerHTML = "";
      followers.innerHTML = "";
      following.appendChild(followingLink);
      followers.appendChild(followersLink);
    } catch (error) {
      console.error("Error updating user counts:", error);
      // Show error state
      following.innerHTML = "Error loading";
      followers.innerHTML = "Error loading";
    }
  }

  updateUIForUser();

  // Find this section in the code (around line 704)
  if (
    permissions.show_recent_comments === 1 ||
    localStorage.getItem("userid") === userId
  ) {
    card_pagination.style.display = "block";
    fetchUserComments(userId);
  } else {
    card_pagination.style.display = "none";
    // Add a message to inform users why comments aren't showing
    const recentComments = document.getElementById("comments-list");
    if (recentComments) {
      recentComments.innerHTML = `
      <div class="col-12 text-center p-4">
        <div class="hidden-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
            <rect width="16" height="16" fill="none" />
            <g fill="#748D92">
              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
              <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
            </g>
          </svg>
          <h4>Comments Hidden</h4>
          <p>This user has chosen to keep their comments private</p>
        </div>
      </div>`;
    }
  }

  async function setAvatarWithFallback(username) {
    const userAvatar = document.getElementById("user-avatar");
    const fallbackUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;

    // Early return if no avatar data
    if (!udata.id || !udata.avatar || udata.avatar === "None") {
      userAvatar.src = fallbackUrl;
      return;
    }

    try {
      // Determine if avatar should be animated based on hash
      const isAnimated = udata.avatar.startsWith("a_");
      const baseUrl = `https://cdn.discordapp.com/avatars/${udata.id}/${udata.avatar}`;

      // Try primary format first (gif for animated, png for static)
      const primaryFormat = isAnimated ? "gif" : "png";
      const primaryUrl = `${baseUrl}.${primaryFormat}?size=4096`;

      const response = await fetch(primaryUrl, { method: "HEAD" });
      if (response.ok) {
        userAvatar.src = primaryUrl;
        return;
      }

      // If animated failed, try png as fallback
      if (isAnimated) {
        const pngUrl = `${baseUrl}.png?size=4096`;
        const pngResponse = await fetch(pngUrl, { method: "HEAD" });
        if (pngResponse.ok) {
          userAvatar.src = pngUrl;
          return;
        }
      }

      // If all attempts fail, use fallback
      userAvatar.src = fallbackUrl;
    } catch {
      userAvatar.src = fallbackUrl;
    }
  }

  userAvatar = document.getElementById("user-avatar");
  if (!udata.accent_color) {
    userAvatar.style.setProperty("--avatar-border-color", "#000");
  } else {
    const hexColor = decimalToHex(udata.accent_color);

    userAvatar.style.setProperty("--avatar-border-color", hexColor);
  }

  setAvatarWithFallback(udata.username);

  updateUserCounts(userId);
  fetchUserBio(userId);

  const description_tab = document.getElementById("description-tab");

  async function fetchUserFollowers(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const followers = await response.json();
      const validUsers = [];

      // Check each follower to see if they still exist
      for (const user of followers) {
        const userCheckResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/?id=${user.follower_id}`
        );
        if (userCheckResponse.ok) {
          validUsers.push(user);
        }
      }

      return validUsers;
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  }

  async function fetchUserFollowing(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/following/get?user=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      // Handle 404 as a valid "no following" response
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const following = await response.json();
      const validUsers = [];

      // Check each user to see if they still exist
      for (const user of following) {
        const userCheckResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/?id=${user.following_id}`
        );
        if (userCheckResponse.ok) {
          validUsers.push(user);
        }
      }

      return validUsers;
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  }

  async function addFollow(userId) {
    try {
      const user = getCookie("token");
      // Get the target user ID from the URL
      const pathSegments = window.location.pathname.split("/");
      const targetUserId = pathSegments[2]; // This gets the ID from /users/{id}

      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({
            follower: user, // The logged-in user's token
            following: targetUserId, // The ID from the URL
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          toastControl.showToast(
            "error",
            "You are already following this user.",
            "Error"
          );
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update UI immediately
      const followersCount = document.querySelector("#followers .fw-bold");
      if (followersCount) {
        const currentCount = parseInt(followersCount.textContent);
        followersCount.textContent = (currentCount + 1).toString();
      }

      return true;
    } catch (error) {
      console.error("Error adding follow:", error);
      toastControl.showToast(
        "error",
        "Failed to follow user. Please try again.",
        "Error"
      );
      return false;
    }
  }

  async function removeFollow(userId) {
    try {
      const user = getCookie("token");
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/remove`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({ follower: user, following: userId }),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toastControl.showToast(
            "error",
            "You are not following this user.",
            "Error"
          );
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update UI immediately
      const followersCount = document.querySelector("#followers .fw-bold");
      if (followersCount) {
        const currentCount = parseInt(followersCount.textContent);
        followersCount.textContent = Math.max(0, currentCount - 1).toString();
      }

      return true;
    } catch (error) {
      console.error("Error removing follow:", error);
      toastControl.showToast(
        "error",
        "Failed to unfollow user. Please try again.",
        "Error"
      );
      return false;
    }
  }

  follow_button.addEventListener("click", function () {
    if (follow_button.disabled) return;
    follow_button.disabled =false;

    const user = getCookie("token");
    if (!user) {
      toastControl.showToast(
        "error",
        "You are not logged in to perform this action.",
        "Error"
      );
      follow_button.disabled = false;
      return;
    }

    // Get the ID of the user being followed/unfollowed from the URL
    const pathSegments = window.location.pathname.split("/");
    const targetUserId = pathSegments[2]; // This is the ID of the user being followed/unfollowed

    if (follow_button.textContent === "Follow") {
      addFollow(targetUserId)
        .then((success) => {
          if (success) {
            toastControl.showToast(
              "success",
              "User followed successfully.",
              "Success"
            );
            follow_button.textContent = "Unfollow";
            // Refresh counts after successful follow
            updateUserCounts(targetUserId);
          }
        })
        .finally(() => {
          follow_button.disabled = false;
        });
    } else {
      removeFollow(targetUserId)
        .then((success) => {
          if (success) {
            toastControl.showToast(
              "success",
              "User unfollowed successfully.",
              "Success"
            );
            follow_button.textContent = "Follow";
            // Refresh counts after successful unfollow
            updateUserCounts(targetUserId);
          }
        })
        .finally(() => {
          follow_button.disabled = false;
        });
    }
  });

  function AlertToast(message) {
    toastControl.showToast("info", message, "Alert");
  }
  function SuccessToast(message) {
    toastControl.showToast("success", message, "Alert");
  }

  async function fetchUserFavorites(userId) {
    const favoritesContainer = document.getElementById("favorites-grid");
    card_pagination.style.display = "flex";

    // Show loading spinner in favorites grid
    favoritesContainer.innerHTML = `
      <div class="col-12 d-flex justify-content-center align-items-center" style="min-height: 200px;">
        <div class="text-center">
          <div class="spinner-border text-light mb-2" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mb-0">Loading favorites...</p>
        </div>
      </div>`;

    try {
      // Check if user is profile owner
      const isProfileOwner = localStorage.getItem("userid") === userId;

      // First check user settings
      const settingsResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${userId}`
      );
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch user settings");
      }
      const settings = await settingsResponse.json();

      // Check if favorites are hidden
      if (settings.hide_favorites === 1 && !isProfileOwner) {
        favoritesContainer.innerHTML = `
          <div class="col-12 text-center p-4">
            <div class="hidden-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16">
                <rect width="16" height="16" fill="none" />
                <g fill="#748D92">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                  <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12l.708-.708l12 12z" />
                </g>
              </svg>
              <h4>Favorites Hidden</h4>
              <p>This user has chosen to keep their favorites private</p>
            </div>
          </div>`;
        renderPaginationControls(1);
        return;
      }

      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/favorites/get?user=${userId}`
      );

      if (response.status === 404) {
        showNoFavoritesMessage();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const favorites = await response.json();

      // Now check favorites length after we have the data
      if (!favorites || favorites.length === 0) {
        showNoFavoritesMessage();
        return;
      }

      // Fetch full item details for each favorite
      const itemPromises = favorites.map(async (fav) => {
        const itemResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/items/get?id=${fav.item_id}`
        );
        if (!itemResponse.ok) return null;
        const item = await itemResponse.json();
        // Add the favorite id to the item object
        item.favorite_id = fav.item_id;
        return item;
      });

      const items = (await Promise.all(itemPromises)).filter(
        (item) => item !== null
      );

      if (items.length === 0) {
        card_pagination.style.display = "none";
        favoritesContainer.innerHTML = `
          <div class="col-12 text-center p-4">
            <div class="no-favorites-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                <rect width="24" height="24" fill="none" />
                <path fill="#f8ff00" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25" />
              </svg>
              <h4>No Favorites Yet</h4>
              <p>This user hasn't added any items to their favorites</p>
            </div>
          </div>`;
        return;
      }

      // Pagination logic
      const itemsPerPage = 12;
      const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage)); // Always at least 1 page
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

      // Always show pagination controls
      card_pagination.style.display = "flex";
      renderPaginationControls(totalPages);

      // Clear and populate the favorites container
      favoritesContainer.innerHTML = paginatedItems
        .map((item) => {
          const itemType = item.type.toLowerCase();

          // Check specifically for HyperShift by favorite_id
          if (item.favorite_id === 587 && item.name === "HyperShift") {
            const card = `
              <div class="col-6 col-md-4 col-lg-3">
                <a href="/item/${itemType}/${encodeURIComponent(
              item.name
            )}" class="text-decoration-none">
                  <div class="card items-card">
                    <div class="position-relative">
                      <div class="media-container">
                        <video 
                          src="/assets/images/items/hyperchromes/HyperShift.webm" 
                          class="card-img-top" 
                          playsinline 
                          muted 
                          loop 
                          autoplay
                          style="width: 100%; height: auto;"
                        >
                        </video>
                      </div>
                      <div class="item-card-body text-center">
                        <div class="badges-container d-flex justify-content-center gap-2">
                          <span class="badge item-type-badge" style="background-color: ${getTypeColor(
                            itemType
                          )}">${item.type}</span>
                        </div>
                        <h5 class="card-title">${item.name}</h5>
                      </div>
                    </div>
                  </div>
                </a>
              </div>`;
            return card;
          }

          // Normal items handling (existing code)
          let imageUrl;
          if (itemType === "horn") {
            imageUrl = "/assets/audios/horn_thumbnail.webp";
          } else if (itemType === "drift") {
            imageUrl = `/assets/images/items/480p/drifts/${item.name}s.webp`;
          } else {
            imageUrl = `/assets/images/items/480p/${itemType}s/${item.name}.webp`;
          }

          return `
            <div class="col-6 col-md-4 col-lg-3">
              <a href="/item/${itemType}/${encodeURIComponent(
            item.name
          )}" class="text-decoration-none">
                <div class="card items-card">
                  <div class="position-relative">
                    <div class="media-container">
                      <img src="${imageUrl}" class="card-img-top" alt="${
            item.name
          }">
                    </div>
                    <div class="item-card-body text-center">
                      <div class="badges-container d-flex justify-content-center gap-2">
                        <span class="badge item-type-badge" style="background-color: ${getTypeColor(
                          itemType
                        )}">${item.type}</span>
                      </div>
                      <h5 class="card-title">${item.name}</h5>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          `;
        })
        .join("");

      // Remove drift video hover effects since we're not using videos anymore
      const driftCards = document.querySelectorAll(".items-card");
      driftCards.forEach((card) => {
        const video = card.querySelector("video");
        const thumbnail = card.querySelector(".thumbnail");
        // Only remove videos that aren't HyperShift
        if (video && !video.src.includes("HyperShift")) {
          video.remove();
        }
        if (thumbnail) {
          thumbnail.style.opacity = "1";
        }
      });
    } catch (error) {
      console.error("Error fetching favorites:", error);
      favoritesContainer.innerHTML = `
        <div class="col-12 text-center p-4">
          <div class="error-message">
            <h4>Error Loading Favorites</h4>
            <p>There was an error loading favorite items</p>
          </div>
        </div>`;
      renderPaginationControls(1); // Show single page pagination
    }
  }

  // Helper function to show no favorites message
  function showNoFavoritesMessage() {
    const favoritesContainer = document.getElementById("favorites-grid");
    card_pagination.style.display = "none";
    favoritesContainer.innerHTML = `
      <div class="col-12 text-center p-4">
        <div class="no-favorites-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
            <rect width="24" height="24" fill="none" />
            <path fill="#f8ff00" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275zM12 12.25" />
          </svg>
          <h4>No Favorites Yet</h4>
          <p>This user hasn't added any items to their favorites</p>
        </div>
      </div>`;
    renderPaginationControls(1);
  }

  // Helper function to get color for item type
  function getTypeColor(type) {
    const colors = {
      vehicle: "#c82c2c",
      spoiler: "#C18800",
      rim: "#6335B1",
      "tire-sticker": "#1CA1BD",
      "tire-style": "#4CAF50",
      drift: "#FF4500",
      "body-color": "#8A2BE2",
      texture: "#708090",
      hyperchrome: "#E91E63",
      furniture: "#9C6644",
      horn: "#4A90E2",
    };
    return colors[type] || "#748D92";
  }

  // Add loading spinner to favorite action
  window.handleFavorite = async function (event, itemId) {
    event.preventDefault();
    event.stopPropagation();

    const token = getCookie("token");
    if (!token) {
      notyf.error("Please login to favorite items", {
        position: "bottom-right",
        duration: 2000,
      });
      return;
    }

    const favoriteIcon = event.target.closest(".favorite-icon");
    const svgPath = favoriteIcon.querySelector("path");
    const isFavorited = svgPath.getAttribute("fill") === "#f8ff00";

    // Add loading spinner
    const originalHTML = favoriteIcon.innerHTML;
    favoriteIcon.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    favoriteIcon.style.pointerEvents = "none";

    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/favorites/${
          isFavorited ? "remove" : "add"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            item_id: itemId,
            owner: token,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Restore original icon with updated state
      favoriteIcon.innerHTML = originalHTML;
      if (isFavorited) {
        svgPath.setAttribute("fill", "none");
        svgPath.setAttribute("stroke", "#f8ff00");
      } else {
        svgPath.setAttribute("fill", "#f8ff00");
        svgPath.setAttribute("stroke", "none");
      }

      const item = allItems.find((item) => item.id === itemId);
      if (item) {
        item.is_favorite = !isFavorited;
      }

      notyf.success(
        isFavorited ? "Item removed from favorites" : "Item added to favorites",
        {
          position: "bottom-right",
          duration: 2000,
        }
      );
    } catch (error) {
      console.error("Error updating favorite:", error);
      notyf.error("Failed to update favorite status", {
        position: "bottom-right",
        duration: 2000,
      });
      // Restore original icon on error
      favoriteIcon.innerHTML = originalHTML;
    } finally {
      favoriteIcon.style.pointerEvents = "auto";
    }
  };

  // Initialize badge elements once at the top
  const crown = document.getElementById("crown");
  const badgesContainer = document.querySelector(".badges-container");

  // Hide badges container by default
  if (badgesContainer) {
    badgesContainer.style.display = "none";
  }

  function updateBadgesVisibility() {
    if (!badgesContainer) return;

    const hasCrown = crown?.style?.display === "inline-block";
    const hasEarlyBadge = earlyBadge?.style?.display === "inline-block";

    if (hasCrown || hasEarlyBadge) {
      badgesContainer.classList.add("visible");
    } else {
      badgesContainer.classList.remove("visible");
    }
  }

  // Initial state
  if (badgesContainer) {
    badgesContainer.classList.remove("visible");
  }

  // Set initial badge states
  if (udata.usernumber <= 100) {
    earlyBadge.style.display = "inline-block";
  } else {
    earlyBadge.style.display = "none";
  }

  if (userId === "659865209741246514" || userId === "1019539798383398946") {
    crown.style.display = "inline-block";
  } else {
    crown.style.display = "none";
  }

  // Update visibility after setting states
  updateBadgesVisibility();

  // Add crown click handler
  crown.addEventListener("click", function () {
    fetch(`/owner/check/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 200) {
          AlertToast("This user created Jailbreak Changelogs!");
        } else {
          SuccessToast(
            'The only owners of Jailbreak Changelogs are <a href="/users/659865209741246514" target="_blank" rel="noopener noreferrer">@Jakobiis</a> and <a href="/users/1019539798383398946" target="_blank" rel="noopener noreferrer">@Jalenzz</a>'
          );
          AlertToast(
            "This crown is given out to the creators of Jailbreak Changelogs! Unfortunately, this user is not one of them 🤣"
          );
        }
      })
      .catch((error) => {
        console.error("Error checking owner status:", error);
      });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Check for token in URL first
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  // Check if we're logging out from settings page
  if (urlParams.has('logout')) {
    // Clear session data
    localStorage.clear();
    deleteCookie("token");
    // Redirect to home without showing login modal
    window.location.href = '/';
    return;
  }
  
  if (token) {
    // If token is in URL, fetch user data and store it
    fetch(`https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`, {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    })
    .then(response => {
      if (!response.ok) throw new Error('Invalid token');
      return response.json();
    })
    .then(userData => {
      // Store user data
      localStorage.setItem("userid", userData.id);
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Set cookie
      document.cookie = `token=${token}; path=/; max-age=2592000; secure; samesite=Strict`;
      
      // Clean up URL and reload
      window.history.replaceState({}, '', '/settings');
      window.location.reload();
    })
    .catch(error => {
      console.error('Error fetching user data:', error);
      // If token is invalid, proceed with normal flow
      checkAuthAndRedirect();
    });
  } else {
    checkAuthAndRedirect();
  }

  function checkAuthAndRedirect() {
    const userId = localStorage.getItem("userid");
    if (!userId) {
      // Handle OAuth redirect on client side
      const currentUrl = window.location.href;
      const redirectUrl = encodeURIComponent(currentUrl);
      window.location.href = `https://api.jailbreakchangelogs.xyz/oauth?redirect=${redirectUrl}`;
      return;
    }

    // Show loading overlay immediately when page loads
    showLoadingOverlay();
  }

  function showLoadingOverlay() {
    document.querySelector("#loading-overlay").classList.add("show");
  }

  function hideLoadingOverlay() {
    document.querySelector("#loading-overlay").classList.remove("show");
  }

  // Handle URL parameter highlighting after loading is complete
  function handleHighlighting() {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightSetting = urlParams.get('highlight');
    
    if (highlightSetting) {
      // Find the setting element and highlight it
      const settingElement = document.querySelector(`[data-setting="${highlightSetting}"]`);
      if (settingElement) {
        // Scroll to the setting
        settingElement.closest('.list-group-item').scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // Add highlight class to the parent list-group-item
        const parentItem = settingElement.closest('.list-group-item');
        if (parentItem) {
          parentItem.classList.add('setting-highlight');
          
          // Remove highlight after animation completes
          setTimeout(() => {
            parentItem.classList.remove('setting-highlight');
            
            // Clean up URL by removing the highlight parameter
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('highlight');
            window.history.replaceState({}, '', newUrl.toString());
          }, 4000); // Match the CSS animation duration
        }
      }
    }
  }

  // Load settings and update switches
  async function loadSettings() {
    try {
      const token = getCookie("token");
      const userId = localStorage.getItem("userid"); // Get userId from localStorage
      
      if (!token || !userId) {
        throw new Error("No token or user ID found");
      }

      // Fetch user data first to get premium type
      const userResponse = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();
      const premiumType = userData.premiumtype || 0;

      // Handle premium features visibility
      const premiumElements = document.querySelectorAll('.premium-requirement');
      const premiumInputs = document.querySelectorAll('#banner_discord, #avatar_discord, #bannerInput, #avatarInput, #updateBannerBtn, #updateAvatarBtn');
      
      if (premiumType < 2) {
        premiumElements.forEach(el => el.style.display = 'block');
        premiumInputs.forEach(el => el.disabled = true);
      } else {
        premiumElements.forEach(el => el.style.display = 'none');
        premiumInputs.forEach(el => el.disabled = false);
      }

      // Populate custom avatar URL if available
      if (userData.custom_avatar) {
        document.getElementById("avatarInput").value = userData.custom_avatar;
      }

      // Populate custom banner URL if available
      if (userData.custom_banner) {
        document.getElementById("bannerInput").value = userData.custom_banner;
      }

      // Handle Roblox account section
      if (userData.roblox_username) {
        const robloxSection = document.getElementById('roblox-account-section');
        const robloxLink = document.getElementById('roblox-profile-link');
        
        robloxSection.style.display = 'block';
        robloxLink.href = `https://www.roblox.com/users/${userData.roblox_id}/profile`;
        robloxLink.textContent = userData.roblox_username;
      }

      // Load settings
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/settings?user=${userId}&nocache=true`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to load settings");
      const settings = await response.json();

      // Load custom banner and avatar URLs
      const [bannerResponse] = await Promise.all([
        fetch(`https://api.jailbreakchangelogs.xyz/users/banner/get?user=${userId}`)
      ]);

      let customBannerUrl = '';

      if (bannerResponse.ok) {
        const bannerData = await bannerResponse.json();
        if (bannerData.image_url && bannerData.image_url !== "NONE") {
          customBannerUrl = bannerData.image_url;
          document.getElementById("bannerInput").value = customBannerUrl;
        }
      }

      // Update all switches and handle visibility
      document.querySelectorAll(".form-check-input[data-setting]").forEach((input) => {
        const setting = input.dataset.setting;
        if (setting in settings) {
          input.checked = settings[setting] === 1;

          // Handle visibility of custom input fields
          if (setting === "banner_discord") {
            const customBannerInput = document.getElementById("custom_banner_input");
            if (customBannerInput) {
              customBannerInput.style.display = settings[setting] === 1 ? "none" : "block";
            }
          }
          if (setting === "avatar_discord") {
            const customAvatarInput = document.getElementById("custom_avatar_input");
            if (customAvatarInput) {
              customAvatarInput.style.display = settings[setting] === 1 ? "none" : "block";
            }
          }
        }
      });

      hideLoadingOverlay();
      // Handle highlighting after loading is complete
      handleHighlighting();
    } catch (error) {
      console.error("Error loading settings:", error);
      notyf.error("Failed to load settings");
      hideLoadingOverlay();
    }
  }

  // Initialize Notyf
  const notyf = new Notyf({
    duration: 2000,
    position: { x: "right", y: "bottom" },
    types: [
      {
        type: "success",
        background: "#124e66",
        icon: false,
      },
      {
        type: "error",
        background: "#dc3545",
        icon: false,
      },
    ],
  });

  // Update settings immediately when a switch changes
  document
    .querySelectorAll(".form-check-input[data-setting]")
    .forEach((input) => {
      input.addEventListener("change", async function () {
        const setting = this.dataset.setting;
        const newValue = this.checked ? 1 : 0;
        const token = getCookie("token");
        
        // Handle visibility for banner_discord and avatar_discord
        if (setting === "banner_discord" || setting === "avatar_discord") {
          const inputId = setting === "banner_discord" ? "custom_banner_input" : "custom_avatar_input";
          document.getElementById(inputId).style.display = this.checked ? "none" : "block";
          
          // Only make API call when toggling ON (1)
          if (newValue === 1) {
            try {
              // Get current state of all settings
              const currentSettings = {
                profile_public: document.querySelector('[data-setting="profile_public"]').checked ? 1 : 0,
                show_recent_comments: document.querySelector('[data-setting="show_recent_comments"]').checked ? 1 : 0,
                hide_following: document.querySelector('[data-setting="hide_following"]').checked ? 1 : 0,
                hide_followers: document.querySelector('[data-setting="hide_followers"]').checked ? 1 : 0,
                hide_favorites: document.querySelector('[data-setting="hide_favorites"]').checked ? 1 : 0,
                banner_discord: document.querySelector('[data-setting="banner_discord"]').checked ? 1 : 0,
                avatar_discord: document.querySelector('[data-setting="avatar_discord"]').checked ? 1 : 0,
                hide_connections: document.querySelector('[data-setting="hide_connections"]').checked ? 1 : 0,
                hide_presence: document.querySelector('[data-setting="hide_presence"]').checked ? 1 : 0,
                dms_allowed: document.querySelector('[data-setting="dms_allowed"]').checked ? 1 : 0
              };

              const response = await fetch(
                `https://api.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                  },
                  body: JSON.stringify(currentSettings),
                }
              );
              if (!response.ok) throw new Error("Failed to update setting");
              notyf.success("Setting updated successfully");
            } catch (error) {
              console.error("Error updating setting:", error);
              notyf.error("Failed to update setting");
              // Revert the toggle state
              this.checked = !this.checked;
              document.getElementById(inputId).style.display = this.checked ? "none" : "block";
            }
          }
          return;
        }

        // For all other settings
        try {
          const currentSettings = {
            profile_public: document.querySelector('[data-setting="profile_public"]').checked ? 1 : 0,
            show_recent_comments: document.querySelector('[data-setting="show_recent_comments"]').checked ? 1 : 0,
            hide_following: document.querySelector('[data-setting="hide_following"]').checked ? 1 : 0,
            hide_followers: document.querySelector('[data-setting="hide_followers"]').checked ? 1 : 0,
            hide_favorites: document.querySelector('[data-setting="hide_favorites"]').checked ? 1 : 0,
            banner_discord: document.querySelector('[data-setting="banner_discord"]').checked ? 1 : 0,
            avatar_discord: document.querySelector('[data-setting="avatar_discord"]').checked ? 1 : 0,
            hide_connections: document.querySelector('[data-setting="hide_connections"]').checked ? 1 : 0,
            hide_presence: document.querySelector('[data-setting="hide_presence"]').checked ? 1 : 0,
            dms_allowed: document.querySelector('[data-setting="dms_allowed"]').checked ? 1 : 0
          };

          const response = await fetch(
            `https://api.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
              },
              body: JSON.stringify(currentSettings),
            }
          );
          const responseData = await response.json();
          if (!response.ok || responseData.error) {
            throw new Error(responseData.error || "Failed to update settings");
          }
          notyf.success("Setting updated successfully");
        } catch (error) {
          console.error("Error updating settings:", error);
          notyf.error("Failed to update settings");
          this.checked = !this.checked;
        }
      });
    });

  // Handle banner update button
  document.getElementById("updateBannerBtn").addEventListener("click", async () => {
    const imageUrl = document.getElementById("bannerInput").value.trim();
    const token = getCookie("token");

    try {
      // Get user's premium type first
      const userResponse = await fetch(`https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`);
      if (!userResponse.ok) throw new Error("Failed to get user data");
      const userData = await userResponse.json();

      // Early return if user doesn't have required premium level
      if (userData.premiumtype < 2) {
        notyf.error("Supporter 2+ is required to use custom banners");
        return;
      }

      // Validate URL before making the update request (false means it's not an avatar)
      if (!validateImageUrl(imageUrl, userData.premiumtype, false)) {
        return;
      }

      // First update the banner URL
      const bannerResponse = await fetch(
        "https://api.jailbreakchangelogs.xyz/users/banner/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            owner: token,
            url: imageUrl || "NONE"
          })
        }
      );
      if (!bannerResponse.ok) throw new Error("Failed to update banner URL");

      // Then ensure the setting is set to use custom banner
      const currentSettings = {
        profile_public: document.querySelector('[data-setting="profile_public"]').checked ? 1 : 0,
        show_recent_comments: document.querySelector('[data-setting="show_recent_comments"]').checked ? 1 : 0,
        hide_following: document.querySelector('[data-setting="hide_following"]').checked ? 1 : 0,
        hide_followers: document.querySelector('[data-setting="hide_followers"]').checked ? 1 : 0,
        hide_favorites: document.querySelector('[data-setting="hide_favorites"]').checked ? 1 : 0,
        banner_discord: 0, // Force to use custom banner
        avatar_discord: document.querySelector('[data-setting="avatar_discord"]').checked ? 1 : 0,
        hide_connections: document.querySelector('[data-setting="hide_connections"]').checked ? 1 : 0,
        hide_presence: document.querySelector('[data-setting="hide_presence"]').checked ? 1 : 0,
        dms_allowed: document.querySelector('[data-setting="dms_allowed"]').checked ? 1 : 0
      };

      const settingsResponse = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(currentSettings),
        }
      );
      if (!settingsResponse.ok) throw new Error("Failed to update banner settings");

      // Update UI to reflect changes
      const bannerDiscordToggle = document.querySelector('[data-setting="banner_discord"]');
      if (bannerDiscordToggle) {
        bannerDiscordToggle.checked = false;
      }
      document.getElementById("custom_banner_input").style.display = "block";

      notyf.success("Banner updated successfully");
    } catch (error) {
      console.error("Error updating banner:", error);
      notyf.error("Failed to update banner");
    }
  });

  // Handle avatar update button
  document.getElementById("updateAvatarBtn").addEventListener("click", async () => {
    const imageUrl = document.getElementById("avatarInput").value.trim();
    const token = getCookie("token");

    try {
      // Get user's premium type first
      const userResponse = await fetch(`https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true`);
      if (!userResponse.ok) throw new Error("Failed to get user data");
      const userData = await userResponse.json();

      // Early return if user doesn't have required premium level
      if (userData.premiumtype < 2) {
        notyf.error("Supporter 2+ is required to use custom avatars");
        return;
      }

      // Validate URL before making the update request (true means it's an avatar)
      if (!validateImageUrl(imageUrl, userData.premiumtype, true)) {
        return;
      }

      // First update the avatar URL
      const avatarResponse = await fetch(
        "https://api.jailbreakchangelogs.xyz/users/avatar/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            owner: token,
            url: imageUrl
          })
        }
      );
      if (!avatarResponse.ok) throw new Error("Failed to update avatar URL");

      // Then ensure the setting is set to use custom avatar
      const currentSettings = {
        profile_public: document.querySelector('[data-setting="profile_public"]').checked ? 1 : 0,
        show_recent_comments: document.querySelector('[data-setting="show_recent_comments"]').checked ? 1 : 0,
        hide_following: document.querySelector('[data-setting="hide_following"]').checked ? 1 : 0,
        hide_followers: document.querySelector('[data-setting="hide_followers"]').checked ? 1 : 0,
        hide_favorites: document.querySelector('[data-setting="hide_favorites"]').checked ? 1 : 0,
        banner_discord: document.querySelector('[data-setting="banner_discord"]').checked ? 1 : 0,
        avatar_discord: 0, // Force to use custom avatar
        hide_connections: document.querySelector('[data-setting="hide_connections"]').checked ? 1 : 0,
        hide_presence: document.querySelector('[data-setting="hide_presence"]').checked ? 1 : 0,
        dms_allowed: document.querySelector('[data-setting="dms_allowed"]').checked ? 1 : 0
      };

      const settingsResponse = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(currentSettings),
        }
      );
      if (!settingsResponse.ok) throw new Error("Failed to update avatar settings");

      // Update UI to reflect changes
      const avatarDiscordToggle = document.querySelector('[data-setting="avatar_discord"]');
      if (avatarDiscordToggle) {
        avatarDiscordToggle.checked = false;
      }
      document.getElementById("custom_avatar_input").style.display = "block";

      notyf.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error updating avatar:", error);
      notyf.error("Failed to update avatar");
    }
  });

  // Handle Roblox account disconnection
  const disconnectRobloxButton = document.getElementById("disconnect-roblox-button");
  const disconnectConfirmation = document.getElementById("disconnect-confirmation");
  const confirmDisconnectButton = document.getElementById("confirm-disconnect");
  const cancelDisconnectButton = document.getElementById("cancel-disconnect");

  if (disconnectRobloxButton) {
    disconnectRobloxButton.addEventListener("click", () => {
      disconnectConfirmation.style.display = "block";
      disconnectRobloxButton.style.display = "none";
    });

    cancelDisconnectButton.addEventListener("click", () => {
      disconnectConfirmation.style.display = "none";
      disconnectRobloxButton.style.display = "block";
    });

    confirmDisconnectButton.addEventListener("click", async () => {
      const token = getCookie("token");
      if (!token) {
        notyf.error("You must be logged in to disconnect your Roblox account");
        return;
      }

      try {
        confirmDisconnectButton.disabled = true;
        confirmDisconnectButton.innerHTML = `
          <span class="spinner-border spinner-border-sm" role="status"></span>
          Disconnecting...
        `;

        const response = await fetch(
          "https://api.jailbreakchangelogs.xyz/oauth/roblox/disconnect",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            body: JSON.stringify({
              owner: token
            })
          }
        );

        if (!response.ok) throw new Error("Failed to disconnect Roblox account");

        notyf.success("Roblox account disconnected successfully");
        
        // Clear cached user data
        localStorage.removeItem("user");
        
        // Fetch fresh user data
        const userResponse = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}&nocache=true&nocache=true`
        );
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(userData));
          
          // Update navigation UI
          const profileContent = document.querySelector('.profile-actions');
          const dropdownContent = document.querySelector('.dropdown-menu');
          if (profileContent && dropdownContent) {
            // Re-render navigation content by triggering a page reload
            window.location.href = `/users/${userData.id}`;
          }
        }
        
        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error disconnecting Roblox account:", error);
        notyf.error("Failed to disconnect Roblox account");
        confirmDisconnectButton.disabled = false;
        confirmDisconnectButton.innerHTML = "Yes, Disconnect";
      }
    });
  }

  // Handle account deletion
  const deleteAccountButton = document.getElementById("delete-account-button");
  const deleteConfirmation = document.getElementById("delete-confirmation");
  const confirmDeleteButton = document.getElementById("confirm-delete");
  const cancelDeleteButton = document.getElementById("cancel-delete");
  const deletionCountdown = document.getElementById("deletion-countdown");
  let countdownInterval;
  let deleteTimeout;

  deleteAccountButton.addEventListener("click", () => {
    deleteConfirmation.style.display = "block";
    deleteAccountButton.style.display = "none";

    // Start countdown from 10
    let secondsLeft = 10;
    confirmDeleteButton.disabled = true;

    // Clear any existing intervals/timeouts
    clearInterval(countdownInterval);
    clearTimeout(deleteTimeout);

    countdownInterval = setInterval(() => {
      secondsLeft--;
      deletionCountdown.textContent = secondsLeft;

      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        confirmDeleteButton.disabled = false;
        deletionCountdown.parentElement.innerHTML =
          "<strong>Warning:</strong> You can now proceed with account deletion";
      }
    }, 1000);
  });

  cancelDeleteButton.addEventListener("click", () => {
    deleteConfirmation.style.display = "none";
    deleteAccountButton.style.display = "block";
    clearInterval(countdownInterval);
    clearTimeout(deleteTimeout);
    deletionCountdown.textContent = "10"; // Reset to 10 seconds
  });

  confirmDeleteButton.addEventListener("click", async () => {
    if (confirmDeleteButton.disabled) {
      return;
    }

    try {
      const token = getCookie("token");
      if (!token) {
        notyf.error("You must be logged in to delete your account");
        return;
      }

      confirmDeleteButton.disabled = true;
      confirmDeleteButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status"></span>
        Deleting...
      `;
      cancelDeleteButton.style.display = "none";

      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/delete?token=${encodeURIComponent(
          token
        )}`,
        {
          method: "DELETE",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete account");

      notyf.success("Account deleted successfully. Redirecting...");

      // Clear cookies and local storage
      Cookies.remove("token");
      localStorage.clear();

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      notyf.error("Failed to delete account");
      confirmDeleteButton.disabled = false;
      confirmDeleteButton.innerHTML = "Yes, Delete My Account";
      cancelDeleteButton.style.display = "inline-block";
    }
  });

  // Add listeners for banner_discord and avatar_discord toggles
  document.getElementById("banner_discord").addEventListener("change", function (e) {
    const customBannerInput = document.getElementById("custom_banner_input");
    customBannerInput.style.display = e.target.checked ? "none" : "block";
  });

  document.getElementById("avatar_discord").addEventListener("change", function (e) {
    const customAvatarInput = document.getElementById("custom_avatar_input");
    customAvatarInput.style.display = e.target.checked ? "none" : "block";
  });

  // Helper functions for URL validation
  function validateImageUrl(url, userPremiumType, isAvatar = false) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check for premium requirement first
      if (userPremiumType < 2) {
        notyf.error("Supporter 2+ is required to use custom avatars/banners");
        return false;
      }

      // Validate hostname
      const isImgBB = hostname === 'imgbb.com' || hostname === 'i.ibb.co';
      const isTenor = hostname === 'tenor.com' || hostname.endsWith('.tenor.com');
      const isPostImg = hostname === 'postimg.cc' || hostname === 'i.postimg.cc';
      
      if (!isImgBB && !isTenor && !isPostImg) {
        notyf.error("Only ImgBB, PostImg, and Tenor URLs are allowed");
        return false;
      }

      // Validate file extension
      const ext = url.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpeg', 'jpg', 'webp', 'gif', 'png'];

      if (!allowedExtensions.includes(ext)) {
        notyf.error("Only .jpeg, .jpg, .webp, .gif, and .png are allowed");
        return false;
      }

      // Additional check for GIF animations based on premium type and whether it's an avatar
      if (ext === 'gif' && isAvatar && userPremiumType < 3) {
        notyf.error("Supporter 3 is required to use animated avatars");
        return false;
      }

      return true;
    } catch (e) {
      notyf.error("Invalid URL format");
      return false;
    }
  }

  // Initialize settings
  loadSettings();
});

document.addEventListener("DOMContentLoaded", function () {
  const userId = localStorage.getItem("userid");
  if (!userId) {
    window.location.href = "/login";
    return;
  }

  // Helper function to create toggle button
  function createToggleButton(value) {
    const icon = document.createElement("i");
    icon.innerHTML =
      value === 1
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <rect width="16" height="16" fill="none" />
                <path fill="currentColor" d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06a.733.733 0 0 1 1.047 0l3.052 3.093l5.4-6.425z" />
               </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <rect width="16" height="16" fill="none" />
                <path fill="currentColor" d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
               </svg>`;
    return icon.innerHTML;
  }

  // Load settings and update switches
  async function loadSettings() {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${userId}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to load settings");
      const settings = await response.json();

      // Update all switches
      document
        .querySelectorAll(".form-check-input[data-setting]")
        .forEach((input) => {
          const setting = input.dataset.setting;
          if (setting in settings) {
            // Force avatar_discord to be enabled and disabled
            if (setting === "avatar_discord") {
              input.checked = true;
              input.disabled = true;
              return;
            }
            input.checked = settings[setting] === 1;

            // Handle visibility of custom input fields
            if (setting === "banner_discord") {
              const customBannerInput = document.getElementById(
                "custom_banner_input"
              );
              if (customBannerInput) {
                customBannerInput.style.display =
                  settings[setting] === 1 ? "none" : "block";
              }
            }
          }
        });

      // Load custom banner URL if discord banner is disabled
      if (settings.banner_discord === 0) {
        const bannerResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/background/get?user=${userId}`
        );
        if (bannerResponse.ok) {
          const bannerData = await bannerResponse.json();
          if (bannerData.image_url && bannerData.image_url !== "NONE") {
            document.getElementById("bannerInput").value = bannerData.image_url;
          }
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      notyf.error("Failed to load settings");
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

  // Add click handlers for all toggle buttons
  document.querySelectorAll('.btn[id$="_button"]').forEach((button) => {
    button.addEventListener("click", async () => {
      const settingKey = button.id.replace("_button", "");
      const currentValue = button.classList.contains("btn-success") ? 1 : 0;
      const newValue = currentValue === 1 ? 0 : 1;

      try {
        const token = getCookie("token");
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            body: JSON.stringify({
              [settingKey]: newValue,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to update setting");

        button.innerHTML = createToggleButton(newValue);
        button.classList.remove("btn-danger", "btn-success");
        button.classList.add(newValue === 1 ? "btn-success" : "btn-danger");

        if (settingKey === "banner_discord") {
          document.getElementById("custom_banner_input").style.display =
            newValue === 1 ? "none" : "block";
        }

        notyf.success("Setting updated successfully");
      } catch (error) {
        console.error("Error updating setting:", error);
        notyf.error("Failed to update setting");
      }
    });
  });

  // Update settings immediately when a switch changes
  document
    .querySelectorAll(".form-check-input[data-setting]")
    .forEach((input) => {
      input.addEventListener("change", async function () {
        // Ignore changes to avatar_discord
        if (this.dataset.setting === "avatar_discord") {
          this.checked = true;
          return;
        }

        const token = getCookie("token");
        const setting = this.dataset.setting;
        const newValue = this.checked ? 1 : 0;

        try {
          // Get current state of all switches
          const currentSettings = {
            profile_public: document.querySelector(
              '[data-setting="profile_public"]'
            ).checked
              ? 1
              : 0,
            show_recent_comments: document.querySelector(
              '[data-setting="show_recent_comments"]'
            ).checked
              ? 1
              : 0,
            hide_following: document.querySelector(
              '[data-setting="hide_following"]'
            ).checked
              ? 1
              : 0,
            hide_followers: document.querySelector(
              '[data-setting="hide_followers"]'
            ).checked
              ? 1
              : 0,
            hide_favorites: document.querySelector(
              '[data-setting="hide_favorites"]'
            ).checked
              ? 1
              : 0,
            banner_discord: document.querySelector(
              '[data-setting="banner_discord"]'
            ).checked
              ? 1
              : 0,
            avatar_discord: document.querySelector(
              '[data-setting="avatar_discord"]'
            ).checked
              ? 1
              : 0,
            hide_connections: document.querySelector(
              '[data-setting="hide_connections"]'
            ).checked
              ? 1
              : 0,
            hide_presence: document.querySelector(
              '[data-setting="hide_presence"]'
            ).checked
              ? 1
              : 0,
          };

          const response = await fetch(
            `https://api3.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
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

          // Success - don't verify the returned value since API returns success message
          notyf.success("Setting updated successfully");

          // Handle visibility for banner input
          if (setting === "banner_discord") {
            document.getElementById("custom_banner_input").style.display =
              newValue === 1 ? "none" : "block";
          }
        } catch (error) {
          console.error("Error updating settings:", error);
          notyf.error("Failed to update settings");

          // Revert the toggle state
          this.checked = !this.checked;

          // If it's a banner toggle, revert the display state
          if (setting === "banner_discord") {
            document.getElementById("custom_banner_input").style.display = this
              .checked
              ? "none"
              : "block";
          }
        }
      });
    });

  // Handle banner update button
  document
    .getElementById("updateBannerBtn")
    .addEventListener("click", async () => {
      const imageUrl = document.getElementById("bannerInput").value.trim();
      const token = getCookie("token");

      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/background/update?user=${token}&image=${encodeURIComponent(
            imageUrl || "NONE"
          )}`,
          {
            method: "POST",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to update banner");
        notyf.success("Banner updated successfully");
      } catch (error) {
        console.error("Error updating banner:", error);
        notyf.error("Failed to update banner");
      }
    });

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
        `https://api3.jailbreakchangelogs.xyz/users/delete?token=${encodeURIComponent(
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

  // Add listener for banner_discord toggle
  document
    .getElementById("banner_discord")
    .addEventListener("change", function (e) {
      const customBannerInput = document.getElementById("custom_banner_input");
      customBannerInput.style.display = e.target.checked ? "none" : "block";
    });

  // Initialize settings
  loadSettings();
});

window.notyf = new Notyf({
  duration: 4500,
  position: {
    x: "right",
    y: "bottom",
  },
  types: [
    {
      type: "info",
      background: "#2196f3",
      dismissible: true,
      icon: false,
    },
    {
      type: "success",
      background: "#4caf50",
      dismissible: true,
      icon: false,
    },
    {
      type: "warning",
      background: "#ff9800",
      dismissible: true,
      icon: false,
    },
    {
      type: "error",
      background: "#b20b0b",
      dismissible: true,
      icon: false,
    },
    {
      type: "special",
      background: "#9c27b0",
      dismissible: true,
      icon: false,
    },
  ],
  ripple: true,
  dismissible: true,
  rippleEffect: true,
});

// Make notyf methods global through window object
window.notyf.info = (message) => window.notyf.open({ type: "info", message });
window.notyf.success = (message) =>
  window.notyf.open({ type: "success", message });
window.notyf.warning = (message) =>
  window.notyf.open({ type: "warning", message });
window.notyf.error = (message) => window.notyf.open({ type: "error", message });
window.notyf.special = (message) =>
  window.notyf.open({ type: "special", message });

// Global variables
let globalUserData = null;
let escapePressCount = 0;
let escapePressTimeout = null;

// Cookie helper functions
window.getCookie = function (name) {
  const match = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return match ? match[2] : null;
};

window.setCookie = function (name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie =
    name +
    "=" +
    value +
    ";path=/;expires=" +
    d.toUTCString() +
    ";secure;samesite=Strict";
};

window.deleteCookie = function (name) {
  document.cookie =
    name +
    "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;secure;samesite=Strict";
};

const token = getCookie("token");
const userid = localStorage.getItem("userid"); // Single declaration

// session utilities
const SessionLogger = {
  debug: true,
  logEvent(type, details) {
    if (this.debug) {
      console.log(`[Session:${type}]`, details);
    }
  },
};

// Add retry configuration at the top with other globals
const SESSION_VALIDATION = {
  maxRetries: 3,
  retryDelay: 2000, // Increased to 2 seconds for more visible retries
  currentRetries: 0,
  debugMode: true, // Add debug mode
};

async function validateUserSession(token) {
  if (!token) {
    SessionLogger.logEvent("validate", "No token found");
    return false;
  }

  try {
    // Check if we've already hit max retries before attempting
    if (SESSION_VALIDATION.currentRetries >= SESSION_VALIDATION.maxRetries) {
      SessionLogger.logEvent("validate", "Max retries exceeded");
      return false;
    }

    SessionLogger.logEvent("validate", "Checking token validity...");

    if (SESSION_VALIDATION.debugMode) {
      SessionLogger.logEvent(
        "debug",
        `Attempt ${SESSION_VALIDATION.currentRetries + 1}/${
          SESSION_VALIDATION.maxRetries
        }`
      );
    }

    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get/token?token=${token}`,
      {
        signal: AbortSignal.timeout(1000),
      }
    );

    // Explicitly handle 401 unauthorized responses
    if (response.status === 401) {
      SessionLogger.logEvent("validate", "Token unauthorized (401)");
      clearSessionWithReason("invalid_token");
      window.location.reload(); // Force page refresh to update UI
      return false;
    }

    // Handle 500 errors as retryable errors
    if (response.status === 500) {
      SESSION_VALIDATION.currentRetries++;
      SessionLogger.logEvent(
        "retry",
        `Server error (500), retrying... Attempt ${SESSION_VALIDATION.currentRetries}/${SESSION_VALIDATION.maxRetries}`
      );

      if (SESSION_VALIDATION.currentRetries < SESSION_VALIDATION.maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, SESSION_VALIDATION.retryDelay)
        );
        return validateUserSession(token);
      } else {
        SessionLogger.logEvent(
          "validate",
          "Max retries exceeded after 500 errors"
        );
        return false;
      }
    }

    if (!response.ok) {
      SessionLogger.logEvent(
        "validate",
        `Token validation failed: ${response.status}`
      );
      return false;
    }

    const userData = await response.json();
    if (!userData || !userData.id) {
      SessionLogger.logEvent("validate", "Invalid user data received");
      return false;
    }

    SESSION_VALIDATION.currentRetries = 0; // Reset retries on success
    SessionLogger.logEvent("validate", "Token validated successfully");
    return true;
  } catch (error) {
    SessionLogger.logEvent(
      "error",
      `Session validation error: ${error.message}`
    );

    // Handle network errors and timeouts
    if (error instanceof TypeError || error.name === "TimeoutError") {
      SESSION_VALIDATION.currentRetries++;
      if (SESSION_VALIDATION.currentRetries < SESSION_VALIDATION.maxRetries) {
        SessionLogger.logEvent(
          "retry",
          `Network error, retrying in ${SESSION_VALIDATION.retryDelay}ms (${SESSION_VALIDATION.currentRetries}/${SESSION_VALIDATION.maxRetries})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, SESSION_VALIDATION.retryDelay)
        );
        return validateUserSession(token);
      }
    }

    return false;
  }
}

function clearSessionWithReason(reason) {
  SessionLogger.logEvent("logout", {
    reason,
    previousState: {
      hadToken: !!getCookie("token"),
      hadUserData: !!localStorage.getItem("user"),
      hadUserId: !!localStorage.getItem("userid"),
    },
  });

  localStorage.removeItem("user");
  localStorage.removeItem("avatar");
  localStorage.removeItem("userid");
  localStorage.removeItem("showWelcome");
  deleteCookie("token");
}

function parseUserData() {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to parse user data:", e);
    return null;
  }
}

// Initialize global user data
globalUserData = parseUserData();

function cleanupURL() {
  const url = new URL(window.location);
  if (url.searchParams.has("report-issue")) {
    url.searchParams.delete("report-issue");
    window.history.replaceState({}, "", url.toString());
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);

  // Single welcome message function
  function showWelcomeMessage() {
    if (globalUserData) {
      const name = globalUserData.username || globalUserData.global_name;
      if (name) {
        notyf.special(`Hello, ${name}!`);
      }
    }
    window.history.replaceState({}, "", window.location.pathname);
  }

  // Only show welcome message for freshlogin
  if (urlParams.has("freshlogin")) {
    showWelcomeMessage();
  }

  // Handle report issue flow without welcome message
  if (urlParams.has("report-issue")) {
    if (!token) {
      notyf.error("Please sign in to report issues");
      localStorage.setItem("reportIssueRedirect", "true");
      setTimeout(() => {
        window.location.href =
          "/login?redirect=" +
          encodeURIComponent(window.location.pathname + window.location.search);
      }, 3000);
      return;
    } else {
      document.querySelector('[data-bs-target="#reportIssueModal"]')?.click();
      cleanupURL();
    }
  }

  // Check for stored redirect first
  if (token && localStorage.getItem("reportIssueRedirect")) {
    localStorage.removeItem("reportIssueRedirect");
    window.location.href = "/?report-issue";
    return; // Stop execution here since we're redirecting
  }

  // Handle non-authenticated users
  const reportIssueBtn = document.querySelector(
    '[data-bs-target="#reportIssueModal"]'
  );

  // Only proceed if reportIssueBtn exists (i.e., not on auth pages)
  if (reportIssueBtn) {
    if (!token) {
      // User is not authenticated
      reportIssueBtn.classList.add("disabled");
      reportIssueBtn.removeAttribute("data-bs-target");
      reportIssueBtn.onclick = (e) => {
        e.preventDefault();
        notyf.error("Please sign in to report issues");

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      };
    } else {
      // Remove disabled state if it was previously set
      reportIssueBtn.classList.remove("disabled");
      reportIssueBtn.removeAttribute("title");
      reportIssueBtn.style.cursor = "pointer";

      // Get the actual user ID either from userId or globalUserData object
      const actualUserId = userid || globalUserData.id;

      // Reset form when opening modal
      reportIssueBtn.addEventListener("click", () => {
        document.getElementById("reportIssueForm").reset();
        document.getElementById("successMessage").classList.add("d-none");
        // Re-enable form elements if they were disabled
        const form = document.getElementById("reportIssueForm");
        form
          .querySelectorAll("input, textarea")
          .forEach((el) => (el.disabled = false));
        document.getElementById("submitIssue").disabled = false;
      });

      document
        .getElementById("submitIssue")
        .addEventListener("click", function () {
          const title = document.getElementById("issueTitle").value;
          const description = document.getElementById("issueDescription").value;

          // Clear previous validation styling
          document
            .querySelectorAll(".invalid-feedback")
            .forEach((el) => el.remove());
          document.getElementById("issueTitle").classList.remove("is-invalid");
          document
            .getElementById("issueDescription")
            .classList.remove("is-invalid");

          let hasError = false;
          const MIN_TITLE_LENGTH = 10;
          const MIN_DESCRIPTION_LENGTH = 25;

          if (description.length < MIN_DESCRIPTION_LENGTH) {
            const descriptionInput =
              document.getElementById("issueDescription");
            descriptionInput.classList.add("is-invalid");
            hasError = true;
            notyf.error(
              `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
            );
          }

          if (title.length < MIN_TITLE_LENGTH) {
            const titleInput = document.getElementById("issueTitle");
            titleInput.classList.add("is-invalid");
            hasError = true;
            notyf.error(
              `Title must be at least ${MIN_TITLE_LENGTH} characters long`
            );
          }

          if (hasError) {
            return; // Stop submission if validation fails
          }

          // Disable form while submitting
          const form = document.getElementById("reportIssueForm");
          const submitBtn = document.getElementById("submitIssue");
          form
            .querySelectorAll("input, textarea")
            .forEach((el) => (el.disabled = true));
          submitBtn.disabled = true;

          // Submit the issue
          fetch("https://api.jailbreakchangelogs.xyz/issues/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: "jailbreakchangelogs.xyz",
            },
            body: JSON.stringify({
              user: actualUserId,
              title: title,
              description: description,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              // Show success message
              const successMessage = document.getElementById("successMessage");
              successMessage.classList.remove("d-none");

              // Clean up URL parameter
              cleanupURL();

              // Close modal after 2 seconds
              setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById("reportIssueModal")
                );
                modal.hide();

                // Reset form and hide success message
                setTimeout(() => {
                  form.reset();
                  successMessage.classList.add("d-none");
                  form
                    .querySelectorAll("input, textarea")
                    .forEach((el) => (el.disabled = false));
                  submitBtn.disabled = false;
                }, 500);
              }, 2000);
            })
            .catch((error) => {
              console.error("Error submitting issue:", error);
              notyf.error(
                "There was an error submitting your issue. Please try again."
              );

              // Re-enable form on error
              form
                .querySelectorAll("input, textarea")
                .forEach((el) => (el.disabled = false));
              submitBtn.disabled = false;
            });
        });
    }
  }

  const sideMenu = document.getElementById("sideMenu");
  const mobileViewUpdates = document.getElementById("mobileViewUpdates");
  const mobileAvatarToggle = document.getElementById("mobileAvatarToggle");

  window.checkAndSetAvatar = async function (userData) {
    // Early return for users without avatars
    if (!userData.id || !userData.avatar || userData.avatar === "None") {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
        userData.username
      )}&bold=true`;
    }

    // Check if avatar is animated (starts with a_)
    const format = userData.avatar.startsWith("a_") ? "gif" : "png";
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${format}`;

    try {
      const response = await fetch(avatarUrl, {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.ok) {
        return avatarUrl;
      }
    } catch (error) {
      // If GIF fails for animated avatar, try PNG as fallback
      if (format === "gif") {
        try {
          const pngUrl = avatarUrl.replace(".gif", ".png");
          const pngResponse = await fetch(pngUrl, {
            method: "HEAD",
            cache: "no-store",
          });

          if (pngResponse.ok) {
            return pngUrl;
          }
        } catch {}
      }
    }

    // Return fallback avatar if all attempts fail
    return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      userData.username
    )}&bold=true`;
  };

  function toggleMenu() {
    // Only run these if mobileAvatarToggle exists
    if (mobileAvatarToggle) {
      mobileAvatarToggle.classList.toggle("opened");
      const isExpanded = mobileAvatarToggle.classList.contains("opened");
      mobileAvatarToggle.setAttribute("aria-expanded", isExpanded);
    }

    // These elements might exist on other pages
    if (sideMenu) {
      sideMenu.classList.toggle("show");
      document.body.classList.toggle("menu-open");
    }
  }

  // Only attach event listener if element exists
  if (mobileAvatarToggle) {
    mobileAvatarToggle.addEventListener("click", toggleMenu);
  }

  // Conditional check for mobileViewUpdates
  if (mobileViewUpdates) {
    mobileViewUpdates.addEventListener("click", toggleMenu);
  }

  // Only attach event listeners if sideMenu exists
  if (sideMenu) {
    sideMenu.querySelectorAll(".nav-link, .btn").forEach((link) => {
      link.addEventListener("click", toggleMenu);
    });
  }

  try {
    if (token) {
      const isValid = await validateUserSession(token);
      if (!isValid) {
        // Only clear session if we've exhausted all retries
        if (
          SESSION_VALIDATION.currentRetries >= SESSION_VALIDATION.maxRetries
        ) {
          clearSessionWithReason("invalid_session_after_retries");
          window.location.reload();
          return;
        }
      }
    } else if (globalUserData || userid) {
      clearSessionWithReason("missing_token");
      window.location.reload();
      return;
    }

    // ...rest of existing DOMContentLoaded code...
  } catch (error) {
    SessionLogger.logEvent(
      "error",
      `Critical initialization error: ${error.message}`
    );
    notyf.error(
      "An error occurred while loading your session. Please try again."
    );
  }
});

function formatStamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// Function to check version
function checkWebsiteVersion() {
  fetch("https://api.github.com/repos/JBChangelogs/JailbreakChangelogs/commits/main")
    .then((response) => response.json())
    .then((data) => {
      const transformedData = {
        version: data.sha.substring(0, 7), // Get first 7 characters of commit hash
        date: formatStamp(new Date(data.commit.committer.date).getTime())
      };
      updateVersionDisplay(transformedData);
    })
    .catch((error) => {
      console.error("Failed to fetch version data:", error);
    });
}

// Function to update the version display
function updateVersionDisplay(data) {
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    } else {
      setTimeout(() => updateElement(id, value), 100);
    }
  };

  updateElement("last-updated", data.date);
  updateElement("version-number", data.version);
}

document.addEventListener("DOMContentLoaded", async () => {
  checkWebsiteVersion();

  // Check if we're on an auth page (login or roblox)
  const isAuthPage =
    window.location.pathname === "/login" ||
    window.location.pathname === "/roblox";

  // Only proceed with user data and avatar handling if not on auth page
  if (token && !isAuthPage) {
    try {
      const response = await fetch(
        "https://api.jailbreakchangelogs.xyz/users/get/token?token=" + token
      );
      if (response.ok) {
        const userData = await response.json();
        if (userData) {
          // Update all user data at once
          globalUserData = userData;
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("userid", userData.id);

          if (userData.id && userData.avatar) {
            const avatarUrl = await window.checkAndSetAvatar(userData);
            if (avatarUrl) {
              localStorage.setItem("avatar", avatarUrl);

              // Update profile pictures if they exist
              const profilePicture = document.getElementById("profile-picture");
              const mobileProfilePicture = document.getElementById(
                "profile-picture-mobile"
              );
              if (profilePicture) profilePicture.src = avatarUrl;
              if (mobileProfilePicture) mobileProfilePicture.src = avatarUrl;
            }
          }

          // Handle welcome message
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has("freshlogin") || urlParams.has("report-issue")) {
            notyf.special(
              `Hello, ${userData.global_name || userData.username}!`
            );
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      }
    } catch (error) {
      // Only show error if we're not on an auth page and have exhausted retries
      if (!isAuthPage && SESSION_VALIDATION.currentRetries >= SESSION_VALIDATION.maxRetries) {
        console.error("Error fetching user data:", error);
        notyf.error(
          "Failed to load user data. Some features may be unavailable."
        );
      }
    }
  }

  // secret modal shhhhhhhhhhhhhhhhhhhh
  function showModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade show";
    modal.style.cssText = `
      display: inline-block !important;
      min-width: 100% !important;
      justify-content: center !important;
      align-items: center !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 1050 !important;
      height: 100vh !important;
    `;

    const modalDialog = document.createElement("div");
    modalDialog.className = "modal-dialog";
    modalDialog.style.cssText = `
      margin: 1.75rem auto !important;
      max-width: 500px !important;
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content bg-dark";
    modalContent.style.cssText = `
      background-color: #212529 !important;
      color: #fff !important;
      border: 1px solid rgba(255, 255, 255, 0.125) !important;
    `;

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.style.cssText = `
      border-bottom: 1px solid rgba(255, 255, 255, 0.125) !important;
      padding: 1rem !important;
    `;

    const modalTitle = document.createElement("h5");
    modalTitle.className = "modal-title";
    modalTitle.innerText = "Login with Token";
    modalTitle.style.cssText = `
      color: #fff !important;
      margin: 0 !important;
    `;

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.style.cssText = `
      padding: 1rem !important;
    `;
    const tokenInput = document.createElement("input");
    tokenInput.type = "text"; // Keep as text
    tokenInput.className = "form-control bg-dark text-light";
    tokenInput.placeholder = "Enter your token";
    tokenInput.autocomplete = "off"; // Prevent autocomplete
    tokenInput.spellcheck = false; // Disable spell checking
    tokenInput.setAttribute("autocorrect", "off"); // Disable autocorrect
    tokenInput.setAttribute("autocapitalize", "off"); // Disable auto capitalization
    tokenInput.style.cssText = `
      background-color: var(--bg-secondary) !important;
      border: 1px solid rgba(255, 255, 255, 0.125) !important;
      color: var(--text-primary) !important;
      padding: 0.5rem 1rem !important;
      width: 100% !important;
      margin-bottom: 1rem !important;
    `;

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalFooter.style.cssText = `
      border-top: 1px solid rgba(255, 255, 255, 0.125) !important;
      padding: 1rem !important;
      justify-content: flex-end !important;
    `;

    const loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.className = "btn"; // Remove btn-primary
    loginButton.innerText = "Login";
    loginButton.style.cssText = `
      background-color: var(--accent-color) !important;
      border-color: var(--accent-color) !important;
      color: var(--text-primary) !important;
      margin-left: 0.5rem !important;
      transition: background-color 0.2s ease-in-out !important;
    `;

    // Add hover effect
    loginButton.addEventListener("mouseover", () => {
      loginButton.style.backgroundColor =
        "var(--accent-color-light) !important";
    });

    loginButton.addEventListener("mouseout", () => {
      loginButton.style.backgroundColor = "var(--accent-color) !important";
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn"; // Remove btn-secondary
    closeButton.innerText = "Close";
    closeButton.style.cssText = `
      background-color: var(--bg-secondary) !important;
      border-color: var(--bg-secondary) !important;
      color: var(--text-muted) !important;
      transition: background-color 0.2s ease-in-out !important;
    `;

    // Add hover effect
    closeButton.addEventListener("mouseover", () => {
      closeButton.style.backgroundColor = "var(--bg-primary) !important";
    });

    closeButton.addEventListener("mouseout", () => {
      closeButton.style.backgroundColor = "var(--bg-secondary) !important";
    });

    // Error message element
    const errorMessage = document.createElement("div");
    errorMessage.className = "alert alert-danger d-none";
    errorMessage.style.cssText = `
      margin-top: 1rem !important;
      display: none !important;
    `;

    // Login button click handler
    loginButton.onclick = () => {
      const token = tokenInput.value;
      errorMessage.style.display = "none !important";
      loginButton.disabled = true;
      loginButton.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Logging in...';

      fetch(
        "https://api.jailbreakchangelogs.xyz/users/get/token?token=" + token
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((userData) => {
          if (!userData) {
            throw new Error("Invalid token");
          }
          deleteCookie("token");
          setCookie("token", token, 7);
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("avatar", avatarURL);
          localStorage.setItem("userid", userData.id);
          closeModal();
          window.location.reload(); // Just reload the current page instead of redirecting
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          errorMessage.style.display = "block !important";
          errorMessage.textContent =
            "Invalid token or network error. Please try again.";
          loginButton.disabled = false;
          loginButton.innerText = "Login";
        });
    };

    // Close button click handler
    closeButton.onclick = closeModal;

    // Append elements
    modalHeader.appendChild(modalTitle);
    modalBody.appendChild(tokenInput);
    modalBody.appendChild(errorMessage);
    modalFooter.appendChild(closeButton);
    modalFooter.appendChild(loginButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);

    // Add backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop fade show";
    backdrop.style.cssText = `
      opacity: 0.5 !important;
      background-color: #000 !important;
    `;

    // Append modal and backdrop to body
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Focus input
    setTimeout(() => tokenInput.focus(), 100);

    // Add escape key handler
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  function closeModal() {
    const modal = document.querySelector(".modal");
    const backdrop = document.querySelector(".modal-backdrop");

    if (modal) modal.remove();
    if (backdrop) backdrop.remove();

    document.body.style.overflow = "auto";
  }

  // Event listener for keydown
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      escapePressCount++;

      if (escapePressCount === 1) {
        // Start the timer on the first press
        escapePressTimeout = setTimeout(() => {
          escapePressCount = 0; // Reset count after 3 seconds
        }, 3000);
      }

      // Check if the count reaches 5
      if (escapePressCount === 5) {
        clearTimeout(escapePressTimeout); // Clear the timer
        escapePressCount = 0; // Reset count
        showModal(); // Show the modal
      }
    }
  });
  window.getAuthToken = function () {
    return getCookie("token");
  };

  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("campaign") || sessionStorage.getItem("campaign");
  if (campaign) {
    const token = getCookie("token");
    if (token) {
      fetch(
        "https://api.jailbreakchangelogs.xyz/campaigns/count?campaign=" +
          campaign +
          "&token=" +
          token,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      sessionStorage.removeItem("campaign");
    } else {
      notyf.info(
        "We noticed you're visiting from a campaign. Please log in to count your visit!",
        "Campaign Visit"
      );

      sessionStorage.setItem("campaign", campaign);
    }
  }

  window.logout = async function (reason = "user_initiated") {
    SessionLogger.logEvent("logout", `Logout initiated: ${reason}`);

    const token = getCookie("token");
    if (token) {
      try {
        await fetch(
          `https://api.jailbreakchangelogs.xyz/users/token/invalidate?session_token=${token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error invalidating token:", error);
      }
    }

    clearSessionWithReason(reason);
    window.location.reload();
  };
});

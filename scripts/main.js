function cleanupURL() {
  const url = new URL(window.location);
  if (url.searchParams.has("report-issue")) {
    url.searchParams.delete("report-issue");
    window.history.replaceState({}, "", url.toString());
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Configure toastr options
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-bottom-right",
    timeOut: 3000,
  };

  // Handle issue submission
  const reportIssueBtn = document.querySelector(
    '[data-bs-target="#reportIssueModal"]'
  );
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));
  const userId = sessionStorage.getItem("userId");
  const userData = sessionStorage.getItem("user");

  // Check if either userId directly or user object exists
  const hasValidUser = userId || (userData && JSON.parse(userData).id);

  // Handle non-authenticated users
  if (!token || !hasValidUser) {
    // User is not authenticated
    reportIssueBtn.classList.add("disabled");
    reportIssueBtn.removeAttribute("data-bs-target");
    reportIssueBtn.onclick = (e) => {
      e.preventDefault();
      toastr.error("Please sign in to report issues");

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

    // Get the actual user ID either from userId or user object
    const actualUserId = userId || JSON.parse(userData).id;

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
          const descriptionInput = document.getElementById("issueDescription");
          descriptionInput.classList.add("is-invalid");
          hasError = true;
          toastr.error(
            `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
          );
        }

        if (title.length < MIN_TITLE_LENGTH) {
          const titleInput = document.getElementById("issueTitle");
          titleInput.classList.add("is-invalid");
          hasError = true;
          toastr.error(
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
        fetch("https://api3.jailbreakchangelogs.xyz/issues/add", {
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
            toastr.error(
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

  // Check for report-issue parameter
  document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("report-issue")) {
      if (!token || !hasValidUser) {
        toastr.error("Please sign in to report issues");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        reportIssueBtn.click();
      }
    }
  });
  const sideMenu = document.getElementById("sideMenu");
  const mobileViewUpdates = document.getElementById("mobileViewUpdates");

  window.checkAndSetAvatar = async function (userData) {
    const gifUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.gif?size=128`;
    const webpUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.webp?size=128`;
    const fallbackAvatar = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      userData.username
    )}&bold=true&format=svg`;

    try {
      // Check GIF
      const gifResponse = await fetch(gifUrl, { method: "HEAD" });
      if (gifResponse.ok) {
        return gifUrl;
      }

      // Check WEBP
      const webpResponse = await fetch(webpUrl, { method: "HEAD" });
      if (webpResponse.ok) {
        return webpUrl;
      }

      return fallbackAvatar;
    } catch {
      return fallbackAvatar;
    }
  };

  function toggleMenu() {
    mobileAvatarToggle.classList.toggle("opened");
    sideMenu.classList.toggle("show");
    document.body.classList.toggle("menu-open");

    // Update aria-expanded attribute
    const isExpanded = mobileAvatarToggle.classList.contains("opened");
    mobileAvatarToggle.setAttribute("aria-expanded", isExpanded);
  }

  mobileAvatarToggle.addEventListener("click", toggleMenu);

  // Conditional check for mobileViewUpdates
  if (mobileViewUpdates) {
    mobileViewUpdates.addEventListener("click", toggleMenu);
  }

  // Close menu when a nav item is clicked
  sideMenu.querySelectorAll(".nav-link, .btn").forEach((link) => {
    link.addEventListener("click", toggleMenu);
  });
});

function formatStamp(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toUTCString();
}

// Function to check version
function checkWebsiteVersion() {
  fetch("https://api3.jailbreakchangelogs.xyz/version/website")
    .then((response) => response.json())
    .then((data) => {
      const transformedData = {
        version: data.version,
        date: formatStamp(data.last_updated),
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

  const token = Cookies.get("token");
  const user = sessionStorage.getItem("user");
  const userid = sessionStorage.getItem("userid");

  function clearSessionAndReload() {
    // Store report-issue flag if it exists before clearing
    const hasReportIssue = new URLSearchParams(window.location.search).has(
      "report-issue"
    );

    Cookies.remove("token");
    sessionStorage.clear();

    // If report-issue flag was present, store in localStorage
    if (hasReportIssue) {
      localStorage.setItem("reportIssueRedirect", "true");
      window.location.href = "/login";
    } else {
      window.location.reload();
    }
  }
  // Check and clear invalid session state
  if (!token && (user || userid)) {
    clearSessionAndReload();
    return;
  }

  if (token) {
    try {
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/users/get/token?token=" + token
      );
      if (!response.ok) {
        throw new Error("Invalid response");
      }

      const userData = await response.json();
      if (!userData) {
        clearSessionAndReload();
        return;
      }

      // Check and set avatar
      const avatarUrl = await window.checkAndSetAvatar(userData);
      sessionStorage.setItem("avatar", avatarUrl);
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("userid", userData.id);

      // Update profile pictures if they exist
      const profilePicture = document.getElementById("profile-picture");
      const mobileProfilePicture = document.getElementById(
        "profile-picture-mobile"
      );

      if (profilePicture) {
        profilePicture.src = avatarUrl;
      }
      if (mobileProfilePicture) {
        mobileProfilePicture.src = avatarUrl;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      clearSessionAndReload();
    }
  }

  // const profilepicture = document.getElementById("profile-picture");
  // const mobileprofilepicture = document.getElementById(
  //   "profile-picture-mobile"
  // );

  // if (!profilepicture && !mobileprofilepicture) {
  //   return;
  // }

  // if (userid) {
  //   profilepicture.src = avatarUrl;
  //   mobileprofilepicture.src = avatarUrl;
  // }
  let escapePressCount = 0;
  let escapePressTimeout;

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
        "https://api3.jailbreakchangelogs.xyz/users/get/token?token=" + token
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
          Cookies.remove("token");
          Cookies.set("token", token, { expires: 7 });
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          sessionStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.setItem("avatar", avatarURL);
          sessionStorage.setItem("userid", userData.id);
          closeModal();
          window.location.reload();
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
    return Cookies.get("token");
  };

  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("campaign") || sessionStorage.getItem("campaign");
  if (campaign) {
    const token = Cookies.get("token");
    if (token) {
      fetch(
        "https://api3.jailbreakchangelogs.xyz/campaigns/count?campaign=" +
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
      toastr.options = {
        closeButton: true,
        debug: false,
        newestOnTop: false,
        progressBar: true,
        positionClass: "toast-bottom-right",
        preventDuplicates: true,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "7000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut",
      };

      toastr.info(
        "We noticed you're visiting from a campaign. Please log in to count your visit!",
        "Campaign Visit"
      );

      sessionStorage.setItem("campaign", campaign);
    }
  }
  // Check for stored report-issue redirect
  if (token && localStorage.getItem("reportIssueRedirect")) {
    localStorage.removeItem("reportIssueRedirect");
    window.location.href = "/?report-issue";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const navbarToggler = document.getElementById("navbarToggler");
  const sideMenu = document.getElementById("sideMenu");
  const mobileViewUpdates = document.getElementById("mobileViewUpdates");

  function toggleMenu() {
    navbarToggler.classList.toggle("opened");
    sideMenu.classList.toggle("show");
    document.body.classList.toggle("menu-open");

    // Update aria-expanded attribute
    const isExpanded = navbarToggler.classList.contains("opened");
    navbarToggler.setAttribute("aria-expanded", isExpanded);
  }

  navbarToggler.addEventListener("click", toggleMenu);

  // Conditional check for mobileViewUpdates
  if (mobileViewUpdates) {
    mobileViewUpdates.addEventListener("click", toggleMenu);
  }

  // Close menu when a nav item is clicked
  sideMenu.querySelectorAll(".nav-link, .btn").forEach((link) => {
    link.addEventListener("click", toggleMenu);
  });
});

// Function to check version with caching
function checkVersionWithCache() {
  const cachedVersion = localStorage.getItem('versionData');
  const cachedTimestamp = localStorage.getItem('versionTimestamp');
  const currentTime = new Date().getTime();

  // Check if we have cached data and it's less than 1 hour old
  if (cachedVersion && cachedTimestamp && (currentTime - parseInt(cachedTimestamp) < 3600000)) {
    // Use cached data
    const versionData = JSON.parse(cachedVersion);
    updateVersionDisplay(versionData);
  } else {
    // Fetch new data
    fetch("https://api.jailbreakchangelogs.xyz/version/website")
      .then((response) => response.json())
      .then((data) => {
        // Cache the new data
        localStorage.setItem('versionData', JSON.stringify(data));
        localStorage.setItem('versionTimestamp', currentTime.toString());
        updateVersionDisplay(data);
      })
      .catch((error) => {
        console.error("Failed to fetch version data:", error);
      });
  }
}
function addCloudinaryOptimization(url) {
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_1200,f_auto,q_auto/${parts[1]}`;
    }
  }
  return url;
}

// Optimize meta tag images
document.querySelectorAll('meta[property^="og:image"], meta[name^="twitter:image"]').forEach(meta => {
  const originalUrl = meta.getAttribute('content');
  meta.setAttribute('content', addCloudinaryOptimization(originalUrl));
});

const heroElement = document.querySelector('.hero');
  if (heroElement) {
    const backgroundImage = getComputedStyle(heroElement).backgroundImage;
    const imageUrl = backgroundImage.slice(4, -1).replace(/["']/g, "");
    heroElement.style.backgroundImage = `url('${addCloudinaryOptimization(imageUrl)}')`;
  }
// Function to update the version display
function updateVersionDisplay(data) {
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    } else {
      // If the element doesn't exist yet, try again after a short delay
      setTimeout(() => updateElement(id, value), 100);
    }
  };

  updateElement("last-updated", data.date);
  updateElement("version-number", data.version);
}

document.addEventListener("DOMContentLoaded", () => {
  checkVersionWithCache();

  const avatarUrl = sessionStorage.getItem("avatar");

  function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
      let cookiePair = cookieArr[i].split("=");
      if (name === cookiePair[0].trim()) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null;
  }
  function setCookie(name, value, days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Set expiration time
    let expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/"; // Set cookie with expiration and path
  }
  function deleteCookie(name) {
    // Set the cookie with the same name, an empty value, and a past expiration date
    document.cookie = name + "=; Max-Age=0; path=/;";
  }

  const token = getCookie("token");
  const userid = sessionStorage.getItem("userid");

  if (token && !userid) {
    fetch("https://api.jailbreakchangelogs.xyz/users/get/token?token=" + token)
      .then((response) => {
        if (!response.ok) {
          console.error("Unexpected response status:", response.status);
          return null;
        }
        return response.json();
      })
      .then((userData) => {
        if (!userData) return;
        const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("avatar", avatarURL);
        sessionStorage.setItem("userid", userData.id);
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }
  const profilepicture = document.getElementById("profile-picture");
  const mobileprofilepicture = document.getElementById(
    "profile-picture-mobile"
  );

  if (!profilepicture && !mobileprofilepicture) {
    return;
  }

  if (userid) {
    profilepicture.src = avatarUrl;
    mobileprofilepicture.src = avatarUrl;
  }
  let escapePressCount = 0;
  let escapePressTimeout;

  // Function to create and show the modal
  function showModal() {
    // Create modal elements
    const modal = document.createElement("div");
    modal.className = "modal fade show";
    modal.style.display = "inline-block"; // Make the modal visible
    modal.style.minWidth = "100%"; // Set the width to 100%
    modal.style.justifyContent = "center"; // Center the modal vertically
    modal.style.alignItems = "center"; // Center the modal horizontally

    const modalDialog = document.createElement("div");
    modalDialog.className = "modal-dialog";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.backgroundColor = "#2e3944"; // Darker text color
    modalContent.style.minWidth = "100%"; // Set the width to 100%

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    const modalTitle = document.createElement("h5");
modalTitle.className = "modal-title";
modalTitle.innerText = "Logging in with token";
modalTitle.style.color = "#FFFFFF"; // White text color
modalTitle.style.fontWeight = "bold"; // Make the title bold
modalTitle.style.fontSize = "18px"; // Slightly larger font size

modalHeader.appendChild(modalTitle);

const tokenInput = document.createElement("input");
tokenInput.type = "text";
tokenInput.placeholder = "Enter your token";
tokenInput.style.width = "60%";
tokenInput.style.padding = "12px"; // Slightly more padding
tokenInput.style.border = "2px solid #4A90E2"; // Blue border
tokenInput.style.borderRadius = "8px";
tokenInput.style.fontSize = "16px";
tokenInput.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)"; // Subtle shadow
tokenInput.style.marginBottom = "15px";
tokenInput.style.marginTop = "15px";
tokenInput.style.marginLeft = "25px";
tokenInput.style.backgroundColor = "#FFFFFF"; // White background
tokenInput.style.color = "#333333"; // Dark gray text color
tokenInput.style.outline = "none"; // Remove default focus outline

// Add focus styles
tokenInput.addEventListener('focus', function() {
    this.style.borderColor = "#2E5AAC"; // Darker blue on focus
    this.style.boxShadow = "0 0 0 3px rgba(74, 144, 226, 0.3)"; // Blue glow effect
});

tokenInput.addEventListener('blur', function() {
    this.style.borderColor = "#4A90E2"; // Return to original border color
    this.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)"; // Return to original shadow
});

// Style the placeholder text
tokenInput.style.setProperty('::placeholder', 'color: #999999'); // Light gray placeholder text


    // Create a new container for the input and buttons
    const inputButtonContainer = document.createElement("div");
    inputButtonContainer.style.display = "flex"; // Enable flexbox
    inputButtonContainer.style.alignItems = "center"; // Center items vertically

    inputButtonContainer.style.margin = "10px 0"; // Margin to separate from modal edges

    // Append token input to the container
    inputButtonContainer.appendChild(tokenInput);

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";

    const loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.className = "btn btn-primary";
    loginButton.innerText = "Login";
    loginButton.style.marginLeft = "10px"; // Margin to the left of the login button
    loginButton.style.maxWidth = "15%"; // Full width
    loginButton.onclick = () => {
      const token = tokenInput.value;

      fetch(
        "https://api.jailbreakchangelogs.xyz/users/get/token?token=" + token
      )
        .then((response) => {
          if (!response.ok) {
            console.error("Unexpected response status:", response.status);
            return null;
          }
          return response.json();
        })
        .then((userData) => {
          if (!userData) return;
          deleteCookie("token");
          setCookie("token", token, 7); // Set the token cookie for 7 days
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          sessionStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.setItem("avatar", avatarURL);
          sessionStorage.setItem("userid", userData.id);
          closeModal(); // Close the modal after successful login
          window.location.reload(); // Reload the page to reflect the new user data
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    };

    const footerCloseButton = document.createElement("button");
    footerCloseButton.type = "button";
    footerCloseButton.className = "btn btn-secondary";
    footerCloseButton.innerText = "Close";
    footerCloseButton.style.marginLeft = "10px"; // Margin to the right of the close button
    footerCloseButton.style.maxWidth = "15%"; // Full width
    footerCloseButton.onclick = closeModal; // Close the modal on click

    // Append buttons to the input/button container
    inputButtonContainer.appendChild(loginButton);
    inputButtonContainer.appendChild(footerCloseButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(inputButtonContainer); // Append the input/button container

    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);

    // Append modal to body
    document.body.appendChild(modal);
  }

  // Function to close the modal
  function closeModal() {
    const modal = document.querySelector(".modal");
    const modalBackdrop = document.querySelector(".modal-backdrop");

    if (modal) {
      modal.remove(); // Remove modal
    }
    if (modalBackdrop) {
      modalBackdrop.remove(); // Remove backdrop
    }
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
});

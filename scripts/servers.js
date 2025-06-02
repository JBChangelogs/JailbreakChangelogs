// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const addServerForm = document.getElementById("addServerForm");
  if (addServerForm) {
    addServerForm.reset();
  }

  // Initialize date input state
  const dateInput = document.querySelector('[name="expiresAt"]');
  const neverExpiresCheckbox = document.getElementById("neverExpires");
  if (dateInput && neverExpiresCheckbox) {
    dateInput.disabled = neverExpiresCheckbox.checked;
    if (!neverExpiresCheckbox.checked) {
      dateInput.removeAttribute("disabled");
    }
  }

  document
    .getElementById("neverExpires")
    ?.addEventListener("change", function (e) {
      const dateInput = document.querySelector('[name="expiresAt"]');
      if (dateInput) {
        dateInput.disabled = e.target.checked;
        if (e.target.checked) {
          // Add tooltip
          if (!dateInput.hasAttribute("data-bs-toggle")) {
            dateInput.setAttribute("data-bs-toggle", "tooltip");
            dateInput.setAttribute("data-bs-placement", "top");
            dateInput.setAttribute(
              "title",
              'Disabled because "Never expires" is checked'
            );
            new bootstrap.Tooltip(dateInput);
          }
        } else {
          // Remove tooltip
          const tooltip = bootstrap.Tooltip.getInstance(dateInput);
          if (tooltip) {
            tooltip.dispose();
          }
          dateInput.removeAttribute("data-bs-toggle");
          dateInput.removeAttribute("data-bs-placement");
          dateInput.removeAttribute("title");
        }
      }
    });

  fetchServers();
});

// Toast notification helper
function showToast(message, type = "info") {
  try {
    switch (type) {
      case "success":
        notyf.success(message);
        break;
      case "error":
        notyf.error(message);
        break;
      case "warning":
        notyf.warning(message);
        break;
      default:
        notyf.info(message);
    }
  } catch (error) {
    console.log(`${type}: ${message}`);
    alert(message);
  }
}

// Copy link function with fallback
function copyLink(link) {
  if (!link) {
    showToast("Invalid server link", "error");
    return;
  }

  // Try using Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(link)
      .then(() => showToast("Server link copied to clipboard!", "success"))
      .catch(() => fallbackCopy(link));
  } else {
    fallbackCopy(link);
  }
}

// Fallback copy method
function fallbackCopy(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (successful) {
      showToast("Server link copied to clipboard!", "success");
    } else {
      throw new Error("Copy command failed");
    }
  } catch (error) {
    console.error("Fallback copy failed:", error);
    showToast("Failed to copy link. Please copy manually.", "error");
  }
}

// Fetch servers from API
async function fetchServers() {
  try {
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/servers/list?nocache=true"
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const servers = await response.json();
    const serverList = document.getElementById("serverList");
    const loading = document.getElementById("loading");

    if (loading) loading.remove();

    // Add total count display
    document.querySelector('.total-count').textContent = `Total Servers (${servers.length})`;

    if (!servers || servers.length === 0) {
      serverList.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-muted">No private servers available at the moment.</p>
        </div>
      `;
      return;
    }

    const serverCards = await Promise.all(
      servers.map((server, index) => createServerCard(server, index + 1))
    );
    serverList.innerHTML = ""; // Clear existing content
    serverCards.forEach((card) => serverList.appendChild(card));
  } catch (error) {
    console.error("Error fetching servers:", error);
    const serverList = document.getElementById("serverList");
    serverList.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger d-flex flex-column align-items-center justify-content-center gap-2 py-4">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="M12 16a1 1 0 1 0 1 1a1 1 0 0 0-1-1m10.67 1.47l-8.05-14a3 3 0 0 0-5.24 0l-8 14A3 3 0 0 0 3.94 22h16.12a3 3 0 0 0 2.61-4.53m-1.73 2a1 1 0 0 1-.88.51H3.94a1 1 0 0 1-.88-.51a1 1 0 0 1 0-1l8-14a1 1 0 0 1 1.78 0l8.05 14a1 1 0 0 1 .05 1.02ZM12 8a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1" />
</svg>
          <div class="d-flex flex-column align-items-center">
            <h5 class="mb-1">Couldn't fetch private servers</h5>
            <p class="mb-0">Please try again or <a href="mailto:support@jailbreakchangelogs.xyz" class="alert-link">contact us</a> if the problem persists.</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Fetch user information
async function fetchUserInfo(userId) {
  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get?id=${userId}`
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const userData = await response.json();
    return userData.global_name || userData.username || userId;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return userId;
  }
}

// server card element
async function createServerCard(server, number) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  // In createServerCard function, modify the expiration date check:
  const expirationDate =
    server.expires === "Never"
      ? "Never"
      : new Date(parseInt(server.expires) * 1000);
  const now = new Date();
  let timeLeftHtml;

  if (server.expires === "Never") {
    timeLeftHtml = "<span>Never</span>";
  } else {
    const timeLeft = expirationDate - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    const formattedExpirationDate = expirationDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    timeLeftHtml = `<span>${daysLeft} days</span>
    <span class="text-muted d-inline-block ms-1">(${formattedExpirationDate})</span>`;
  }

  const creationDate = new Date(
    parseInt(server.created_at) * 1000
  ).toLocaleDateString();
  const ownerName = await fetchUserInfo(server.owner);

  // Check if current user is the owner
  const token = getCookie("token");
  let isOwner = false;

  if (token) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/get/token?token=${encodeURIComponent(
          token
        )}` // token as query parameter
      );
      if (response.ok) {
        const userData = await response.json();
        if (userData) {
          // Add null check
          isOwner = userData.id === server.owner;
        }
      }
    } catch (error) {
      console.error("Error verifying ownership:", error);
      isOwner = false; // Explicitly set to false on error
    }
  }

  const ownerActions = isOwner
    ? `
  <button class="btn btn-outline-warning btn-sm" onclick="editServer('${server.id}')" 
    data-bs-toggle="tooltip" data-bs-placement="top" title="Edit Server">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="currentColor" d="m14.06 9l.94.94L5.92 19H5v-.92zm3.6-6c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z" />
</svg>
  </button>
  <button class="btn btn-outline-danger btn-sm" onclick="deleteServer('${server.link}')"
    data-bs-toggle="tooltip" data-bs-placement="top" title="Delete Server">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
</svg>
  </button>
`
    : "";

  col.innerHTML = `
    <div class="card server-card h-100" data-server-id="${server.id}">
      <div class="card-body">
        <div class="d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-center">
            <div class="server-link text-truncate me-2">
              <small class="text-muted fw-bold">Private Server #${number}</small>
            </div>
            <div class="d-flex gap-2">
              ${ownerActions}
              <button class="btn btn-outline-primary btn-sm copy-btn" data-link="${
                server.link
              }"
                data-bs-toggle="tooltip" data-bs-placement="top" title="Copy Link">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
	<rect width="24" height="24" fill="none" />
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
		<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
		<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
	</g>
</svg>
              </button>
              <a href="${
                server.link
              }" target="_blank" class="btn btn-primary btn-sm">
                Join
              </a>
            </div>
          </div>
          <div class="server-info">
          <div><small><span class="fw-bold">Created on:</span> ${creationDate}</small></div>
        <div>
          <small>
            <span class="fw-bold">Expires in:</span> 
            ${timeLeftHtml}
          </small>
        </div>
          <div><small><span class="fw-bold">Owner:</span> <a href="/users/${
            server.owner
          }" class="text-decoration-none">@${ownerName}</a></small></div>
          ${
            server.rules !== "N/A"
              ? `<div><small><span class="fw-bold">Rules:</span> ${server.rules}</small></div>`
              : ""
          }
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listener for copy button
  const copyBtn = col.querySelector(".copy-btn");
  copyBtn.addEventListener("click", () => copyLink(copyBtn.dataset.link));

  return col;
}
// edit and delete server functions
async function editServer(serverId) {
  try {
    // Get the modal and form
    const modal = new bootstrap.Modal(
      document.getElementById("addServerModal")
    );
    const form = document.getElementById("addServerForm");

    // Update modal title
    document.getElementById("addServerModalLabel").textContent = "Edit Server";

    // Find the server card that contains this server ID
    const serverCard = document.querySelector(`[data-server-id="${serverId}"]`);
    if (!serverCard) {
      throw new Error("Server not found");
    }

    // Get server data from the card
    const serverLink = serverCard.querySelector('.copy-btn').dataset.link;
    const serverRules = serverCard.querySelector('.server-info').textContent.includes('Rules:') 
      ? serverCard.querySelector('.server-info').textContent.split('Rules:')[1].trim()
      : 'N/A';
    const expiresText = serverCard.querySelector('.server-info').textContent.split('Expires in:')[1].split('Owner:')[0].trim();

    // Pre-fill the form with server details
    form.serverLink.value = serverLink;
    form.serverRules.value = serverRules === "N/A" ? "" : serverRules;

    // Handle expiration
    const neverExpiresCheckbox = document.getElementById("neverExpires");
    if (expiresText === "Never") {
      neverExpiresCheckbox.checked = true;
      form.expiresAt.disabled = true;
      form.expiresAt.value = "";
    } else {
      neverExpiresCheckbox.checked = false;
      form.expiresAt.disabled = false;
      // Extract date from the text (format: "X days (MMM DD, YYYY, HH:MM AM/PM)")
      const dateMatch = expiresText.match(/\(([^)]+)\)/);
      if (dateMatch) {
        const expirationDate = new Date(dateMatch[1]);
        const formattedDate = expirationDate.toISOString().slice(0, 16);
        form.expiresAt.value = formattedDate;
      }
    }

    // Change form submission handler
    form.onsubmit = (event) => handleEditServer(event, serverId);

    // Change button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Update Server";

    modal.show();
  } catch (error) {
    console.error("Error preparing edit form:", error);
    showToast(error.message || "Failed to prepare edit form", "error");
  }
}

async function handleAddServer(event) {
  event.preventDefault();

  const token = getCookie("token");
  if (!token) {
    showToast("Authentication required", "error");
    return;
  }

  const form = event.target;
  const neverExpires = document.getElementById("neverExpires").checked;
  const submitBtn = form.querySelector('button[type="submit"]');
  const spinner = submitBtn.querySelector(".spinner-border");

  const serverLink = form.serverLink.value;
  if (!serverLink.startsWith("https://www.roblox.com/share?code=")) {
    showToast(
      "Invalid server link format. Please use a valid Roblox private server link.",
      "error"
    );
    return;
  }

  submitBtn.disabled = true;
  if (spinner) spinner.classList.remove("d-none");

  try {
    const formData = {
      link: serverLink,
      rules: form.serverRules.value || "N/A",
      expires: neverExpires
        ? "Never"
        : Math.floor(
            new Date(form.expiresAt.value).getTime() / 1000
          ).toString(),
      owner: token,
    };

    // Only validate expiration if not "Never Expires"
    if (!neverExpires) {
      const expirationDate = new Date(form.expiresAt.value);
      const now = new Date();
      const daysDifference = Math.ceil(
        (expirationDate - now) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference < 5) {
        showToast(
          "Server expiration must be at least 5 days from now",
          "error"
        );
        return;
      }
    }

    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/servers/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (response.status === 409) {
      throw new Error("This server link already exists. Please submit a different link.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Failed to add server");
    }

    // Handle success
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addServerModal")
    );
    modal.hide();
    form.reset();
    await fetchServers();
    showToast("Server added successfully!", "success");
  } catch (error) {
    console.error("Error adding server:", error);
    showToast(
      error.message || "Failed to add server. Please try again.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    if (spinner) spinner.classList.add("d-none");
  }
}
async function handleEditServer(event, serverId) {
  event.preventDefault();

  const token = getCookie("token");
  if (!token) {
    showToast("Authentication required", "error");
    return;
  }

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const spinner = submitBtn.querySelector(".spinner-border");

  submitBtn.disabled = true;
  if (spinner) spinner.classList.remove("d-none");

  try {
    const serverLink = form.serverLink.value.trim();
    const neverExpires = document.getElementById("neverExpires").checked;
    const formData = {
      link: serverLink,
      rules: form.serverRules.value || "N/A",
      expires: neverExpires ? "Never" : Math.floor(new Date(form.expiresAt.value).getTime() / 1000).toString(),
      owner: token,
    };

    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/servers/update?id=${serverId}&token=${encodeURIComponent(
        token
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (response.status === 409) {
      throw new Error("This server link already exists. Please submit a different link.");
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Server returned ${response.status}: ${response.statusText}`
      );
    }

    // Handle success
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addServerModal")
    );
    modal.hide();
    resetModalToAddMode(form);
    await fetchServers();
    showToast("Server updated successfully!", "success");

  } catch (error) {
    console.error("Error updating server:", error);
    showToast(error.message || "Failed to update server", "error");
  } finally {
    submitBtn.disabled = false;
    if (spinner) spinner.classList.add("d-none");
  }
}

// Helper function to reset modal to add mode
// In resetModalToAddMode function:
function resetModalToAddMode(form) {
  document.getElementById("addServerModalLabel").textContent =
    "Add Private Server";
  form.reset();

  // Properly reset date input state
  const dateInput = form.querySelector('[name="expiresAt"]');
  const neverExpiresCheckbox = document.getElementById("neverExpires");
  if (dateInput && neverExpiresCheckbox) {
    dateInput.disabled = neverExpiresCheckbox.checked;
    if (!neverExpiresCheckbox.checked) {
      dateInput.removeAttribute("disabled");
    }
  }

  form.onsubmit = (event) => handleAddServer(event);
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = "Add Server";
}

// event listener for modal hidden event to reset form
document
  .getElementById("addServerModal")
  .addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("addServerForm");
    resetModalToAddMode(form);
  });

async function deleteServer(serverLink) {
  const token = getCookie("token");
  if (!token) {
    showToast("Authentication required", "error");
    return;
  }

  if (!confirm("Are you sure you want to delete this server?")) {
    return;
  }

  try {
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/servers/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: serverLink,
          owner: token
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete server");
    }

    if (response.ok) {
      await fetchServers();
      showToast("Server deleted successfully!", "success");
    }
  } catch (error) {
    console.error("Error deleting server:", error);
    showToast(error.message || "Failed to delete server", "error");
  }
}

// Check authentication and show modal
function checkAuthAndShowModal() {
  const token = getCookie("token");
  if (!token) {
    // Show login modal instead of redirecting
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
    loginModal.show();
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("addServerModal"));
  modal.show();
}

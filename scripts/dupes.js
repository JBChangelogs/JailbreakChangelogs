let dupesList = [];
let searchTimeouts = { duper: null, item: null };

// Format timestamp to readable date
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ordinal: true,
    })
    .replace(/(\d+)(?=(st|nd|rd|th))/, (_, n) => {
      const suffix = ["th", "st", "nd", "rd"][
        (n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10
      ];
      return `${n}${suffix}`;
    });
}

function parseValue(value) {
  if (!value) return 0;
  const str = value.toString().toLowerCase();
  if (str.endsWith("m")) {
    return parseFloat(str) * 1000000;
  } else if (str.endsWith("k")) {
    return parseFloat(str) * 1000;
  }
  return parseFloat(str) || 0;
}

// Modify searchItems function to handle both types
async function searchItems(searchTerm, type = "item") {
  if (type === "duper") {
    const results = [
      ...new Set(
        dupesList
          .filter((dupe) =>
            dupe.owner.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((dupe) => dupe.owner)
      ),
    ];
    return results;
  } else {
    try {
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/items/list"
      );
      if (!response.ok) throw new Error("Failed to fetch items");
      const items = await response.json();

      // Filter and sort by cash_value
      return items
        .filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => parseValue(b.cash_value) - parseValue(a.cash_value));
    } catch (error) {
      console.error("Error searching items:", error);
      notyf.error("Error searching items");
      return [];
    }
  }
}

// Display search results
function displaySearchResults(containerId, results, inputId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (results.length > 0) {
    const list = document.createElement("div");
    list.className = "search-suggestions";

    results.slice(0, 5).forEach((result) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = result;
      item.onclick = () => {
        document.getElementById(inputId).value = result;
        container.style.display = "none";
      };
      list.appendChild(item);
    });

    container.appendChild(list);
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

// Helper function to get item details by name
async function getItemByName(itemName, itemId) {
  try {
    // If we have itemId, prefer that for lookup
    if (itemId) {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/items/get?id=${itemId}`
      );
      if (!response.ok) throw new Error("Failed to fetch item");
      return await response.json();
    }

    // Otherwise look up by name
    if (!itemName) return null;

    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list"
    );
    if (!response.ok) throw new Error("Failed to fetch items");
    const items = await response.json();
    return items.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase()
    );
  } catch (error) {
    console.error("Error fetching item:", error);
    return null;
  }
}

// Calculate if item is duped
async function calculateDupe() {
  const resultsContent = document.getElementById("modalResultsContent");
  const duper = document.getElementById("duperSearch").value;
  const itemName = document.getElementById("itemSearch").value;

  // Get modal element and create instance if it doesn't exist
  const modalEl = document.getElementById("resultsModal");
  const modalInstance =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

  if (!duper) {
    notyf.error("Please enter owner name");
    return;
  }

  const matchingDupes = dupesList.filter(
    (dupe) => dupe.owner.toLowerCase() === duper.toLowerCase()
  );

  if (matchingDupes.length === 0) {
    resultsContent.innerHTML = `
      <div class="results-card not-dupe">
        <div class="results-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="none" />
            <path fill="#37b34a" d="M56.734 5.081c-8.437 7.302-15.575 14.253-22.11 23.322c-2.882 4-6.087 8.708-8.182 13.153c-1.196 2.357-3.352 6.04-4.087 9.581c-4.02-3.74-8.338-7.985-12.756-11.31c-3.149-2.369-12.219 2.461-8.527 5.239c6.617 4.977 12.12 11.176 18.556 16.375c2.692 2.172 8.658-2.545 10.06-4.524c4.602-6.52 5.231-14.49 8.585-21.602c5.121-10.877 14.203-19.812 23.17-27.571c5.941-5.541-.195-6.563-4.7-2.663" />
          </svg>
        </div>
        <h4>No dupes found for ${duper}!</h4>
        <p>Last recorded dupe: Never</p>
        <p>This user has no recorded dupes in our database.</p>
      </div>
    `;

    modalInstance.show();
    return;
  }

  // If no item name provided, show all duped items for this duper
  if (!itemName) {
    const dupeItems = await Promise.all(
      matchingDupes.map(async (dupe) => {
        const item = await getItemByName(null, dupe.item_id); // Use item_id instead
        return item ? { ...dupe, item } : null;
      })
    );

    // Filter out any null items
    const validDupeItems = dupeItems.filter((item) => item !== null);

    // Get the latest dupe date
    const latestDupeDate = validDupeItems.reduce(
      (latest, dupe) => (dupe.created_at > latest ? dupe.created_at : latest),
      validDupeItems[0]?.created_at || 0
    );

    resultsContent.innerHTML = `
      <div class="results-card is-dupe">
        <h4>Found ${validDupeItems.length} duped item${
      validDupeItems.length !== 1 ? "s" : ""
    } for ${duper}</h4>
        <p class="text-muted">Last recorded dupe: ${formatDate(
          latestDupeDate
        )}</p>
        <div class="duped-items-grid mt-4" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
          ${validDupeItems
            .map(
              (dupe) => `
            <div class="duped-item-card" style="background: rgba(236, 28, 36, 0.1); border-radius: 12px; border: 1px solid rgba(236, 28, 36, 0.2); padding: 1rem;">
              <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
                <img 
                  src="/assets/images/items/480p/${dupe.item.type.toLowerCase()}s/${
                dupe.item.name
              }.webp" 
                  class="w-100 h-100"
                  style="object-fit: contain;"
                  alt="${dupe.item.name}"
                  onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'"
                >
              </div>
              <div class="item-info">
                <h5 class="mb-2 text-truncate" title="${dupe.item.name}">${
                dupe.item.name
              }</h5>
                <small class="text-muted d-block">Recorded on: ${formatDate(
                  dupe.created_at
                )}</small>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    modalInstance.show();
    return;
  }

  const item = await getItemByName(itemName);
  if (!item) {
    notyf.error("Item not found");
    return;
  }

  const matches = dupesList.filter(
    (dupe) =>
      dupe.owner.toLowerCase() === duper.toLowerCase() &&
      dupe.item_id === item.id
  );

  if (matches.length > 0) {
    const latestDupe = matches.reduce((latest, dupe) =>
      dupe.created_at > latest.created_at ? dupe : latest
    );

    resultsContent.innerHTML = `
      <div class="results-card is-dupe">
        <h4>Found dupe for ${duper}</h4>
        <p class="text-muted">Last recorded dupe: ${formatDate(
          latestDupe.created_at
        )}</p>
        <div class="duped-items-grid mt-4" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
          <div class="duped-item-card" style="background: rgba(236, 28, 36, 0.1); border-radius: 12px; border: 1px solid rgba(236, 28, 36, 0.2); padding: 1rem;">
            <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
              <img 
                src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
      item.name
    }.webp" 
                class="w-100 h-100"
                style="object-fit: contain;"
                alt="${item.name}"
                onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'"
              >
            </div>
            <div class="item-info">
              <h5 class="mb-2 text-truncate" title="${item.name}">${
      item.name
    }</h5>
              <small class="text-muted d-block">Recorded on: ${formatDate(
                latestDupe.created_at
              )}</small>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    resultsContent.innerHTML = `
      <div class="results-card not-dupe">
        <div class="results-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="none" />
            <path fill="#37b34a" d="M56.734 5.081c-8.437 7.302-15.575 14.253-22.11 23.322c-2.882 4-6.087 8.708-8.182 13.153c-1.196 2.357-3.352 6.04-4.087 9.581c-4.02-3.74-8.338-7.985-12.756-11.31c-3.149-2.369-12.219 2.461-8.527 5.239c6.617 4.977 12.12 11.176 18.556 16.375c2.692 2.172 8.658-2.545 10.06-4.524c4.602-6.52 5.231-14.49 8.585-21.602c5.121-10.877 14.203-19.812 23.17-27.571c5.941-5.541-.195-6.563-4.7-2.663" />
          </svg>
        </div>
        <h4>No dupes found for ${duper}</h4>
        <p class="text-muted">No dupe record found for ${item.name}</p>
      </div>
    `;
  }

  modalInstance.show();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async function () {
  await fetchDupesList();

  const duperInput = document.getElementById("duperSearch");
  const itemInput = document.getElementById("itemSearch");

  // Setup clear buttons
  [duperInput, itemInput].forEach((input) => {
    const clearBtn = document.querySelector(`[data-input="${input.id}"]`);

    // Show clear button on page load if input has value
    clearBtn.style.display = input.value ? "flex" : "none";

    input.addEventListener("input", () => {
      clearBtn.style.display = input.value ? "flex" : "none";
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.style.display = "none";
      document.getElementById(
        `${input.id.replace("Search", "")}Results`
      ).style.display = "none";
    });
  });

  // Add input event listeners for showing/hiding clear buttons
  [duperInput, itemInput].forEach((input) => {
    const clearBtn = document.querySelector(`[data-input="${input.id}"]`);

    input.addEventListener("input", () => {
      clearBtn.style.display = input.value ? "flex" : "none";
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.style.display = "none";
      document.getElementById(
        `${input.id.replace("Search", "")}Results`
      ).style.display = "none";
    });
  });

  // Setup input handlers
  [
    { el: duperInput, type: "duper" },
    { el: itemInput, type: "item" },
  ].forEach(({ el, type }) => {
    // Add focus event listener
    el.addEventListener("focus", async () => {
      const searchTerm = el.value.trim();
      if (searchTerm.length > 0) {
        const results = await searchItems(searchTerm, type);
        const filteredResults = results.filter((item) =>
          type === "item"
            ? item.name.toLowerCase().startsWith(searchTerm.toLowerCase())
            : item.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        displaySearchResults(
          `${type}Results`,
          type === "item"
            ? filteredResults.map((item) => item.name)
            : filteredResults,
          `${type}Search`
        );
      }
    });

    // Existing input event listener
    el.addEventListener("input", async (e) => {
      clearTimeout(searchTimeouts[type]);
      const searchTerm = e.target.value.trim();

      // Only show suggestions if we have at least 1 character
      if (searchTerm.length > 0) {
        searchTimeouts[type] = setTimeout(async () => {
          const results = await searchItems(searchTerm, type);
          const filteredResults = results.filter((item) =>
            type === "item"
              ? item.name.toLowerCase().startsWith(searchTerm.toLowerCase())
              : item.toLowerCase().startsWith(searchTerm.toLowerCase())
          );
          displaySearchResults(
            `${type}Results`,
            type === "item"
              ? filteredResults.map((item) => item.name)
              : filteredResults,
            `${type}Search`
          );
        }, 300);
      } else {
        document.getElementById(`${type}Results`).style.display = "none";
      }
    });
  });

  // Setup calculate button
  document.getElementById("calculateBtn").addEventListener("click", () => {
    calculateDupe().catch((error) => {
      console.error("Error calculating dupe:", error);
      notyf.error("Error checking dupe status");
    });
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.matches(".search-input")) {
      document.getElementById("duperResults").style.display = "none";
      document.getElementById("itemResults").style.display = "none";
    }
  });

  // Handle URL parameters for auto-filling
  const urlParams = new URLSearchParams(window.location.search);
  const duper = urlParams.get("duper");
  const itemId = urlParams.get("itemId");

  if (duper && itemId) {
    // Fill in owner name
    document.getElementById("duperSearch").value = duper;
    document.querySelector('[data-input="duperSearch"]').style.display = "flex";

    try {
      // Fetch item details using the ID
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/items/get?id=${itemId}`
      );
      if (!response.ok) throw new Error("Failed to fetch item");
      const item = await response.json();

      if (item && item.name) {
        // Fill in item name
        document.getElementById("itemSearch").value = item.name;
        document.querySelector('[data-input="itemSearch"]').style.display =
          "flex";

        // Clean up URL before triggering calculation
        window.history.replaceState({}, "", "/dupes/calculator");

        // Scroll to calculator section with offset
        const calculatorSection = document.querySelector(".calculator-section");
        if (calculatorSection) {
          const offset = 200; // Offset in pixels to account for fixed header
          const elementPosition = calculatorSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }

        // Automatically trigger the calculation
        setTimeout(() => {
          document.getElementById("calculateBtn").click();
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  }

  // Update labels with correct required field indicators
  const duperLabel = document.querySelector('label[for="duperSearch"]');
  const itemLabel = document.querySelector('label[for="itemSearch"]');

  duperLabel.innerHTML = `
    Owner Name 
    <span class="text-danger">*</span>
  `;

  itemLabel.innerHTML = `
    Item Name 
    <span class="text-muted ms-1" 
          style="cursor: help;" 
          data-bs-toggle="tooltip" 
          data-bs-placement="right" 
          title="Optional - leave empty to see all duped items for the filled in user">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
      </svg>
    </span>
  `;

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Remove the modal size handler code and modal-dialog class manipulation
  const modalEl = document.getElementById("resultsModal");
  modalEl.classList.add("bd-example-modal-xl"); // Add the bootstrap xl modal class
  const modalDialog = modalEl.querySelector(".modal-dialog");
  modalDialog.classList.add("modal-xl"); // Add modal-xl class directly

  // Initialize modal
  const modalInstance = new bootstrap.Modal(modalEl);

  // Remove the adjustModalSize function and resize event listener since we're using Bootstrap's classes
});

// Fetch all dupes list
async function fetchDupesList() {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/dupes/list"
    );
    if (!response.ok) throw new Error("Failed to fetch dupes list");
    dupesList = await response.json();
  } catch (error) {
    console.error("Error fetching dupes:", error);
    notyf.error("Error loading dupes database");
  }
}

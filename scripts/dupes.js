let dupesList = [];
let allItems = [];
let searchTimeouts = { duper: null, item: null, modalSearch: null }; // Add modalSearch
let currentItemId = null;
let selectedItem = null;
let currentDuperName = null;

// Function to escape HTML special characters
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function (match) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

let displayedItems = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 32;

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill()
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost =
        str1[i - 1].toLowerCase() !== str2[j - 1].toLowerCase() ? 1 : 0;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// Calculate similarity percentage between two strings
function stringSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);
  return ((maxLength - distance) / maxLength) * 100;
}

// Find similar duper names
function findSimilarDupers(searchName, threshold = 60) {
  const similarDupers = new Map();

  // Force lowercase comparison
  const searchNameLower = searchName.toLowerCase();

  dupesList.forEach((dupe) => {
    const duperNameLower = dupe.owner.toLowerCase();

    // First check if name contains the search term
    if (duperNameLower.includes(searchNameLower)) {
      similarDupers.set(duperNameLower, {
        name: dupe.owner,
        similarity: 95, // High similarity for contained matches
      });
      return;
    }

    // Then check Levenshtein distance for other potential matches
    const similarity = stringSimilarity(searchNameLower, duperNameLower);

    if (similarity >= threshold && similarity < 100) {
      if (!similarDupers.has(duperNameLower)) {
        similarDupers.set(duperNameLower, {
          name: dupe.owner,
          similarity: similarity,
        });
      }
    }
  });

  const results = Array.from(similarDupers.values()).sort(
    (a, b) => b.similarity - a.similarity
  );

  return results;
}

function shuffleArray(array) {
  let currentIndex = array.length;
  while (currentIndex > 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

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

// Add this global variable at the top
let hasSelectedSuggestion = false;

// Modify extractSearchTerm function to handle partial type brackets
function extractSearchTerm(input) {
  // If input contains partial bracket, extract everything before it
  const match = input.match(/^(.*?)(?:\s*\[.*)?$/);
  return match ? match[1].trim() : input.trim();
}

// Add this helper function to normalize type case
function normalizeType(type) {
  if (!type) return null;

  // Map of common type variations to their correct form
  const typeMap = {
    vehicle: "Vehicle",
    vehicles: "Vehicle",
    rim: "Rim",
    rims: "Rim",
    spoiler: "Spoiler",
    spoilers: "Spoiler",
    texture: "Texture",
    textures: "Texture",
    hyperchrome: "HyperChrome",
    hyperchromes: "HyperChrome",
    horn: "Horn",
    horns: "Horn",
    drift: "Drift",
    drifts: "Drift",
    // Add other type variations as needed
  };

  const normalizedType = typeMap[type.toLowerCase()];
  return normalizedType || type; // If no mapping found, return original
}

// Modify searchItems function to handle both types
async function searchItems(searchTerm, type = "duper") {
  if (type === "duper") {
    // First get exact matches
    const exactMatches = dupesList
      .filter((dupe) =>
        dupe.owner.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((dupe) => dupe.owner);

    // If no exact matches and search term is long enough, find similar names
    if (exactMatches.length === 0 && searchTerm.length >= 3) {
      const similarDupers = findSimilarDupers(searchTerm, 70);

      return [
        ...new Set([...exactMatches, ...similarDupers.map((d) => d.name)]),
      ];
    }

    return [...new Set(exactMatches)];
  } else {
    try {
      const response = await fetch(
        "https://api.jailbreakchangelogs.xyz/items/list"
      );
      if (!response.ok) throw new Error("Failed to fetch items");
      const items = await response.json();

      // Extract just the name part if input contains type brackets
      const nameToSearch = extractSearchTerm(searchTerm);

      // Filter and sort by cash_value
      return items
        .filter((item) =>
          item.name.toLowerCase().includes(nameToSearch.toLowerCase())
        )
        .sort((a, b) => parseValue(b.cash_value) - parseValue(a.cash_value));
    } catch (error) {
      console.error("Error searching items:", error);
      notyf.error("Error searching items");
      return [];
    }
  }
}

// Modify displaySearchResults function to handle partial type input
function displaySearchResults(containerId, results, inputId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (results.length > 0) {
    const list = document.createElement("div");
    list.className = "search-suggestions";

    // Get current input value to check for partial type
    const currentInput = document.getElementById(inputId).value;
    const partialType = currentInput.match(/\[(.*?)(?:\])?$/);

    results.slice(0, 5).forEach((result) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";

      if (typeof result === "object") {
        // For items, filter by partial type if entered
        if (partialType && partialType[1]) {
          const searchType = partialType[1].trim().toLowerCase();
          if (!result.type.toLowerCase().startsWith(searchType)) {
            return; // Skip items that don't match partial type
          }
        }

        item.innerHTML = `
          ${result.name}
          <span class="text-muted ms-1">[${result.type}]</span>
        `;
        item.onclick = () => {
          const input = document.getElementById(inputId);
          input.value = `${result.name} [${result.type}]`;
          input.dataset.itemId = result.id; // Store item ID
          hasSelectedSuggestion = true;
          container.style.display = "none";
        };
      } else {
        // For dupers, just show the name
        item.textContent = result;
        item.onclick = () => {
          document.getElementById(inputId).value = result;
          hasSelectedSuggestion = true;
          container.style.display = "none";
        };
      }

      list.appendChild(item);
    });

    // Only show container if we have filtered results
    if (list.children.length > 0) {
      container.appendChild(list);
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  } else {
    container.style.display = "none";
  }
}

// Helper function to get item details by name
async function getItemByName(itemName, itemId, itemType = null) {
  try {
    // If we have itemId, prefer that for lookup
    if (itemId) {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/items/get?id=${itemId}`
      );
      if (!response.ok) throw new Error("Failed to fetch item");
      return await response.json();
    }

    // Otherwise look up by name
    if (!itemName) return null;

    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/items/list"
    );
    if (!response.ok) throw new Error("Failed to fetch items");
    const items = await response.json();

    // If type is provided, use it to filter results
    if (itemType) {
      return items.find(
        (item) =>
          item.name.toLowerCase() === itemName.toLowerCase() &&
          item.type.toLowerCase() === itemType.toLowerCase()
      );
    }

    // If no type provided, return first match
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
  const itemInput = document.getElementById("itemSearch");
  const fullItemText = itemInput.value;

  // Parse item name and type from input value (if provided)
  const match = fullItemText.match(/^(.*?)\s*\[(.*?)\]$/);
  const itemName = match ? match[1].trim() : fullItemText.trim();
  const itemType = match ? normalizeType(match[2].trim()) : null;

  // Get modal element and create instance if it doesn't exist
  const modalEl = document.getElementById("resultsModal");
  const modalInstance =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

  if (!duper) {
    notyf.error("Please enter owner name");
    return;
  }

  // Only validate item selection if an item name was entered
  if (
    fullItemText &&
    !hasSelectedSuggestion &&
    !matchesExistingItem(fullItemText)
  ) {
    notyf.error("Please select an item from the suggestions");
    return;
  }

  let matchingDupes = dupesList.filter(
    (dupe) => dupe.owner.toLowerCase() === duper.toLowerCase()
  );

  // If no exact matches and input is long enough, check for similar names
  if (matchingDupes.length === 0 && duper.length >= 3) {
    const similarDupers = findSimilarDupers(duper, 60); // Use same lower threshold

    if (similarDupers.length > 0) {
      // Get dupes for all similar names, sorted by similarity
      matchingDupes = similarDupers.flatMap((similarDuper) => {
        const dupes = dupesList.filter(
          (dupe) => dupe.owner.toLowerCase() === similarDuper.name.toLowerCase()
        );

        return dupes;
      });

      if (matchingDupes.length > 0) {
        const mostSimilar = similarDupers[0];
        let content = `
          <div class="results-card is-dupe" style="border-color: #ffa500;">
            <div class="results-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                <path fill="#ffa500" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h4>Found dupes under a similar name!</h4>
            <p class="text-warning">Did you mean: <strong>${
              mostSimilar.name
            }</strong>? (${mostSimilar.similarity.toFixed(1)}% match)</p>
        `;

        // Continue with existing dupe display logic...
        // ...rest of the existing dupe display code...

        resultsContent.innerHTML = content;
        document.getElementById("reportDupeBtn").style.display = "none";
        modalInstance.show();
        return;
      }
    }
  }

  // Get item details first if we have an item name
  let selectedItemForReport = null;
  if (itemName) {
    try {
      const searchUrl = `https://api.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
        itemName
      )}${itemType ? `&type=${encodeURIComponent(itemType)}` : ""}`;

      const itemResponse = await fetch(searchUrl);

      if (!itemResponse.ok) {
        console.error("Item fetch failed:", await itemResponse.text());
        notyf.error("Item not found");
        return;
      }

      const items = await itemResponse.json();

      if (Array.isArray(items)) {
        if (itemType) {
          // If type is specified, find exact match
          selectedItemForReport = items.find(
            (item) => item.type.toLowerCase() === itemType.toLowerCase()
          );
        } else {
          // If no type specified, take first item
          selectedItemForReport = items[0];
        }
      } else {
        // Single item returned
        selectedItemForReport = items;
      }

      if (!selectedItemForReport) {
        console.error("No matching item found");
        notyf.error("Item not found");
        return;
      }

      // Now use the correct item ID for fetching dupes
      if (selectedItemForReport.id) {
        const dupesResponse = await fetch(
          `https://api.jailbreakchangelogs.xyz/dupes/get?id=${selectedItemForReport.id}`
        );

        if (dupesResponse.ok) {
          const dupes = await dupesResponse.json();
        }
      }
    } catch (error) {
      console.error("Error in item lookup:", error);
      notyf.error("Error looking up item");
      return;
    }
  }

  if (matchingDupes.length === 0) {
    // Check for similar names
    const similarDupers = findSimilarDupers(duper);

    if (similarDupers.length > 0) {
      // Get dupes for the most similar name
      const mostSimilar = similarDupers[0];
      const similarDupes = dupesList.filter(
        (dupe) => dupe.owner.toLowerCase() === mostSimilar.name.toLowerCase()
      );

      let content = `
        <div class="results-card is-dupe" style="border-color: #ffa500;">
          <div class="results-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <path fill="#ffa500" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h4>Potential matches found!</h4>
          <p class="text-warning">We found similar usernames that have duped items:</p>
          <div class="similar-names mt-3">
            <p>Did you mean: <strong>${
              mostSimilar.name
            }</strong>? (${mostSimilar.similarity.toFixed(1)}% match)</p>
      `;

      if (selectedItemForReport || itemName) {
        // If specific item was searched
        const itemDupes = similarDupes.filter(
          (d) => !itemName || d.item_id === selectedItemForReport?.id
        );

        if (itemDupes.length > 0) {
          content += `<p class="text-warning">This item is duped by a similar username!</p>`;
        }
      } else {
        // Show all duped items for similar name
        content += `
          <div class="duped-items-grid mt-4" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
            ${await Promise.all(
              similarDupes.map(async (dupe) => {
                const item = await getItemByName(null, dupe.item_id);
                if (!item) return "";

                return `
                <div class="duped-item-card" style="background: rgba(255, 165, 0, 0.1); border-radius: 12px; border: 1px solid rgba(255, 165, 0, 0.3); padding: 1rem;">
                  <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; margin-bottom: 1rem;">
                    <img 
                      src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
                  item.name
                }.webp"
                      class="w-100 h-100"
                      style="object-fit: contain;"
                      alt="${item.name}"
                      onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'"
                    >
                  </div>
                  <div class="item-info">
                    <h5 class="mb-2 text-truncate" title="${item.name}">${
                  item.name
                }</h5>
                    <small class="text-muted d-block">Recorded on: ${formatDate(
                      dupe.created_at
                    )}</small>
                  </div>
                </div>
              `;
              })
            ).then((items) => items.join(""))}
          </div>
        `;
      }

      content += `</div></div>`;
      resultsContent.innerHTML = content;
    } else {
      // No similar names found - show original "no dupes" message
      resultsContent.innerHTML = `
      <div class="results-card not-dupe">
        <div class="results-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="none" />
            <path fill="#37b34a" d="M56.734 5.081c-8.437 7.302-15.575 14.253-22.11 23.322c-2.882 4-6.087 8.708-8.182 13.153c-1.196 2.357-3.352 6.04-4.087 9.581c-4.02-3.74-8.338-7.985-12.756-11.31c-3.149-2.369-12.219 2.461-8.527 5.239c6.617 4.977 12.12 11.176 18.556 16.375c2.692 2.172 8.658-2.545 10.06-4.524c4.602-6.52 5.231-14.49 8.585-21.602c5.121-10.877 14.203-19.812 23.17-27.571c5.941-5.541-.195-6.563-4.7-2.663" />
          </svg>
        </div>
        <h4>No dupes found for ${escapeHTML(duper)}!</h4>
        <p class="text-muted">Last recorded dupe: Never</p>
        <p>This user has no recorded dupes in our database.</p>
      </div>
    `;

      // Show report button and update text/functionality
      const reportBtn = document.getElementById("reportDupeBtn");
      reportBtn.style.display = "block";

      if (selectedItemForReport) {
        // If we have both username and item
        reportBtn.textContent = `Report ${selectedItemForReport.name} [${selectedItemForReport.type}] as Duped`;
        reportBtn.onclick = function () {
          showReportModal(selectedItemForReport.id, duper);
        };
      } else {
        // If we only have username
        reportBtn.textContent = "Report a Dupe";
        reportBtn.onclick = function () {
          showItemSelectionModal(duper);
        };
      }

      modalInstance.show();
      return;
    }
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
    } for ${escapeHTML(duper)}</h4>
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
                  onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'"
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

    // Hide report button since we're showing already duped items
    document.getElementById("reportDupeBtn").style.display = "none";

    modalInstance.show();
    return;
  }

  const item = await getItemByName(itemName, null, itemType);
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
        <h4>Found dupe for ${escapeHTML(duper)}</h4>
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
                onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'"
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

    // Hide report button since item is already duped
    document.getElementById("reportDupeBtn").style.display = "none";
  } else {
    resultsContent.innerHTML = `
      <div class="results-card not-dupe">
        <div class="results-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="none" />
            <path fill="#37b34a" d="M56.734 5.081c-8.437 7.302-15.575 14.253-22.11 23.322c-2.882 4-6.087 8.708-8.182 13.153c-1.196 2.357-3.352 6.04-4.087 9.581c-4.02-3.74-8.338-7.985-12.756-11.31c-3.149-2.369-12.219 2.461-8.527 5.239c6.617 4.977 12.12 11.176 18.556 16.375c2.692 2.172 8.658-2.545 10.06-4.524c4.602-6.52 5.231-14.49 8.585-21.602c5.121-10.877 14.203-19.812 23.17-27.571c5.941-5.541-.195-6.563-4.7-2.663" />
          </svg>
        </div>
        <h4>No dupes found for ${escapeHTML(duper)}</h4>
        <p class="text-muted">No dupe record found for ${escapeHTML(item.name)} [${escapeHTML(item.type)}]</p>
      </div>
    `;

    // Show and update report button text and functionality
    const reportBtn = document.getElementById("reportDupeBtn");
    reportBtn.style.display = "block";
    reportBtn.textContent = `Report ${item.name} [${item.type}] as Duped`;

    // Store the item ID and name in data attributes
    reportBtn.dataset.itemId = item.id;
    reportBtn.dataset.itemName = item.name;

    // Update onclick to pass both ID and name
    reportBtn.onclick = function () {
      showReportModal(item.id, duper);
    };
  }

  modalInstance.show();
}

async function showItemSelectionModal(ownerName = null) {
  if (!getCookie("token")) {
    notyf.error("You must be logged in to report dupes");
    return;
  }

  // Load items if not already loaded
  if (allItems.length === 0) {
    await loadAllItems();
  }

  // Store owner name if provided
  if (ownerName) {
    currentDuperName = ownerName;
  }

  // Reset pagination
  currentPage = 0;
  // Instead of sorting, shuffle the items
  displayedItems = shuffleArray([...allItems]);

  // Reset selection
  selectedItem = null;
  document.getElementById("proceedBtn").disabled = true;

  const searchInput = document.getElementById("itemSearchInput");
  if (searchInput) {
    searchInput.value = "";
  }

  // Show initial items
  displayItemsInModal();

  const modal = new bootstrap.Modal(
    document.getElementById("itemSelectionModal")
  );
  modal.show();

  // Attach infinite scroll after modal is shown
  setTimeout(attachInfiniteScroll, 100);
}

// Add new function to handle displaying items
function displayItemsInModal() {
  const resultsContainer = document.getElementById("itemSearchResults");
  const itemsToShow = displayedItems.slice(
    0,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Only update content if it's the first page
  if (currentPage === 0) {
    resultsContainer.innerHTML = itemsToShow.length
      ? `
        <div class="item-grid">
          ${itemsToShow
            .map(
              (item) => `
            <div class="item-card" onclick="selectItem(${item.id}, this)">
              ${getItemMediaElement(item, {
                containerClass: "item-media-container",
                imageClass: "item-image",
                size: "480p",
              })}
              <div class="card-body">
                <h5 title="${item.name}">${item.name}</h5>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `
      : '<p class="text-center mt-3">No items found</p>';
  } else {
    // Append new items when scrolling
    const itemGrid = resultsContainer.querySelector(".item-grid");
    if (itemGrid) {
      const newItems = displayedItems
        .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
        .map(
          (item) => `
          <div class="item-card" onclick="selectItem(${item.id}, this)">
            ${getItemMediaElement(item, {
              containerClass: "item-media-container",
              imageClass: "item-image",
              size: "480p",
            })}
            <div class="card-body">
              <h5 title="${item.name}">${item.name}</h5>
            </div>
          </div>
        `
        )
        .join("");
      itemGrid.insertAdjacentHTML("beforeend", newItems);
    }
  }
}

// Add scroll event listener when opening modal
function attachInfiniteScroll() {
  const modalBody = document
    .getElementById("itemSelectionModal")
    .querySelector(".modal-body");

  const handleScroll = () => {
    if (
      modalBody.scrollHeight - modalBody.scrollTop <=
        modalBody.clientHeight + 100 &&
      displayedItems.length > (currentPage + 1) * ITEMS_PER_PAGE
    ) {
      currentPage++;
      displayItemsInModal();
    }
  };

  modalBody.addEventListener("scroll", handleScroll);
}

// Add this function to search and display items in the modal
function searchAndDisplayItems(searchTerm) {
  if (!searchTerm) {
    // When no search term, show shuffled items instead of sorting
    displayedItems = shuffleArray([...allItems]);
  } else {
    searchTerm = searchTerm.toLowerCase();
    displayedItems = allItems.filter((item) =>
      item.name.toLowerCase().startsWith(searchTerm)
    );
  }

  // Reset pagination when searching
  currentPage = 0;
  displayItemsInModal();
}

// Add search input handler for modal
document.getElementById("itemSearchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimeouts.modalSearch);
  searchTimeouts.modalSearch = setTimeout(() => {
    searchAndDisplayItems(e.target.value);
  }, 300);
});

// Add this function near the top with other helper functions
function getItemMediaElement(item, options = {}) {
  const {
    containerClass = "",
    imageClass = "",
    size = "original",
    aspectRatio = "16/9",
  } = options;

  // Special case for horns
  if (item.type.toLowerCase() === "horn") {
    return `
      <div class="media-container ${containerClass}" style="aspect-ratio: ${aspectRatio};">
        <img src="/assets/audios/horn_thumbnail.webp"
             class="${imageClass || "img-fluid rounded thumbnail"}"
             alt="${item.name}"
             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
             onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">
      </div>`;
  }

  // Special case for HyperShift Lvl5
  if (item.name === "HyperShift Lvl5" && item.type === "HyperChrome") {
    return `
      <div class="media-container ${containerClass}" style="aspect-ratio: ${aspectRatio};">
        <img src="/assets/images/items/hyperchromes/HyperShift Lvl5.gif"
             class="${imageClass || "img-fluid rounded thumbnail"}"
             alt="${item.name}"
             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
             onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">
      </div>`;
  }

  // Default case for regular items
  const imagePath =
    size === "480p"
      ? `/assets/images/items/480p/${item.type.toLowerCase()}s/${
          item.name
        }.webp`
      : `/assets/images/items/${item.type.toLowerCase()}s/${item.name}.webp`;

  return `
    <div class="media-container ${containerClass}" style="aspect-ratio: ${aspectRatio};">
      <img src="${imagePath}"
           class="${imageClass || "img-fluid rounded thumbnail"}"
           alt="${item.name}"
           style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
           onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">
    </div>`;
}

function selectItem(itemId, element) {
  // Clear previous selection
  document.querySelectorAll(".item-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selected class to current item
  element.classList.add("selected");

  // Store selected item
  selectedItem = allItems.find((item) => item.id === itemId);
  currentItemId = itemId;

  // Enable proceed button
  document.getElementById("proceedBtn").disabled = false;
}

// Add proceedToReport function
function proceedToReport() {
  if (!selectedItem) {
    notyf.error("Please select an item first");
    return;
  }

  // Hide item selection modal
  const itemSelectionModal = bootstrap.Modal.getInstance(
    document.getElementById("itemSelectionModal")
  );
  itemSelectionModal.hide();

  // Show report modal with selected item and stored owner name
  showReportModal(selectedItem.id, currentDuperName);

  // Reset stored owner name
  currentDuperName = null;
}

// Add these functions before the DOMContentLoaded event listener
function addProofUrlField() {
  const container = document.getElementById("proofUrlsContainer");
  if (!container) {
    console.error("proofUrlsContainer not found");
    return;
  }

  // Get all proof URL fields
  const fieldCount = container.querySelectorAll(".input-group").length;

  if (fieldCount >= 5) {
    notyf.error("Maximum of 5 proof URLs allowed");
    return;
  }

  const newField = document.createElement("div");
  newField.className = "input-group mb-2";
  newField.innerHTML = `
    <input type="url" class="form-control proof-url" placeholder="Imgur URL">
    <button type="button" class="btn btn-outline-danger" onclick="removeProofUrlField(this)">×</button>
  `;

  container.appendChild(newField);
}

function removeProofUrlField(button) {
  const container = document.getElementById("proofUrlsContainer");
  const fields = container.querySelectorAll(".input-group");

  // Only allow removal if we have more than 1 field
  if (fields.length > 1) {
    button.closest(".input-group").remove();
  } else {
    notyf.error("At least one proof URL field is required");
  }
}

// Add this function before the DOMContentLoaded event listener
async function showReportModal(itemId, ownerName = null) {
  if (!getCookie("token")) {
    notyf.error("You must be logged in to report dupes");
    return;
  }

  // Always set the owner input value if provided
  const dupeUserInput = document.getElementById("dupeUserInput");
  if (ownerName) {
    dupeUserInput.value = ownerName;
  }

  // Clear previous inputs
  document.getElementById("dupeUserInput").value = ownerName || "";
  const proofUrlsContainer = document.getElementById("proofUrlsContainer");
  proofUrlsContainer.innerHTML = `
    <div class="input-group mb-2">
      <input type="url" class="form-control proof-url" placeholder="Imgur URL">
      <button type="button" class="btn btn-outline-danger" onclick="removeProofUrlField(this)">×</button>
    </div>
  `;

  // Store the selected item ID
  currentItemId = itemId;

  // Get and display the selected item
  try {
    const item = await getItemByName(null, itemId);
    if (item) {
      const selectedItemDisplay = document.getElementById(
        "selectedItemDisplay"
      );
      selectedItemDisplay.innerHTML = `
        <h6 class="text-muted mb-3">Reporting dupe for:</h6>
        ${getItemMediaElement(item, {
          containerClass: "mb-3",
          aspectRatio: "16/9",
          size: "480p",
        })}
        <h5 class="item-name">${item.name}</h5>
        <span class="item-type badge bg-secondary" style="font-weight: 600;">${
          item.type
        }</span>
      `;
    }
  } catch (error) {
    console.error("Error loading item details:", error);
  }

  // Show the report modal
  const reportModal = new bootstrap.Modal(
    document.getElementById("reportDupeModal")
  );
  reportModal.show();
}

function matchesExistingItem(input, type = "item") {
  if (!input) return false;

  // Parse the input value
  const match = input.match(/^(.*?)\s*\[(.*?)\]$/);
  if (!match) return false;

  const [_, itemName, itemType] = match;

  // Find matching item in our loaded items
  return allItems.some(
    (item) =>
      item.name.toLowerCase() === itemName.trim().toLowerCase() &&
      item.type.toLowerCase() === itemType.trim().toLowerCase()
  );
}

// Modify the displaySearchResults function to store last suggestions
let lastSuggestions = [];

function displaySearchResults(containerId, results, inputId) {
  // Store results for later validation
  if (containerId === "itemResults") {
    lastSuggestions = results;
  }

  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (results.length > 0) {
    const list = document.createElement("div");
    list.className = "search-suggestions";

    // Get current input value to check for partial type
    const currentInput = document.getElementById(inputId).value;
    const partialType = currentInput.match(/\[(.*?)(?:\])?$/);

    results.slice(0, 5).forEach((result) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";

      if (typeof result === "object") {
        // For items, filter by partial type if entered
        if (partialType && partialType[1]) {
          const searchType = partialType[1].trim().toLowerCase();
          if (!result.type.toLowerCase().startsWith(searchType)) {
            return; // Skip items that don't match partial type
          }
        }

        item.innerHTML = `
          ${result.name}
          <span class="text-muted ms-1">[${result.type}]</span>
        `;
        item.onclick = () => {
          const input = document.getElementById(inputId);
          input.value = `${result.name} [${result.type}]`;
          input.dataset.itemId = result.id; // Store item ID
          hasSelectedSuggestion = true;
          container.style.display = "none";
        };
      } else {
        // For dupers, just show the name
        item.textContent = result;
        item.onclick = () => {
          document.getElementById(inputId).value = result;
          hasSelectedSuggestion = true;
          container.style.display = "none";
        };
      }

      list.appendChild(item);
    });

    // Only show container if we have filtered results
    if (list.children.length > 0) {
      container.appendChild(list);
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  } else {
    container.style.display = "none";
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async function () {
  await Promise.all([fetchDupesList(), loadAllItems()]); // Load both dupes and items

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
      const searchTerm = extractSearchTerm(el.value);
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
            ? filteredResults // Pass full item objects instead of just names
            : filteredResults,
          `${type}Search`
        );
      }
    });

    // Existing input event listener
    el.addEventListener("input", async (e) => {
      clearTimeout(searchTimeouts[type]);
      const searchTerm = extractSearchTerm(e.target.value);

      // Reset hasSelectedSuggestion when typing
      hasSelectedSuggestion = false;

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
              ? filteredResults // Now passing the full item objects instead of just names
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
    hasSelectedSuggestion = true; // Mark as selected since we have valid params

    try {
      // Fetch item details using the ID
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/items/get?id=${itemId}`
      );
      if (!response.ok) throw new Error("Failed to fetch item");
      const item = await response.json();

      if (item && item.name) {
        // Fill in item name with type
        const itemInput = document.getElementById("itemSearch");
        itemInput.value = `${item.name} [${item.type}]`;
        itemInput.dataset.itemId = item.id;

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

  // Add input event listener to reset hasSelectedSuggestion
  document.getElementById("itemSearch").addEventListener("input", () => {
    hasSelectedSuggestion = false;
  });

  document.getElementById("duperSearch").addEventListener("input", () => {
    hasSelectedSuggestion = false;
  });

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

  // Add event listener for add proof URL button - with null check
  const addProofUrlBtn = document.getElementById("addProofUrlBtn");
  if (addProofUrlBtn) {
    addProofUrlBtn.addEventListener("click", addProofUrlField);
  }

  itemInput.addEventListener("input", (e) => {
    const exactMatch = matchesExistingItem(e.target.value);
    if (exactMatch) {
      hasSelectedSuggestion = true;
    }
  });
});

// Fetch all dupes list
async function fetchDupesList() {
  try {
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/dupes/list"
    );
    if (!response.ok) throw new Error("Failed to fetch dupes list");
    dupesList = await response.json();
  } catch (error) {
    console.error("Error fetching dupes:", error);
    notyf.error("Error loading dupes database");
  }
}

// Add this function to load items
async function loadAllItems() {
  try {
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/items/list"
    );
    if (!response.ok) throw new Error("Failed to fetch items");
    allItems = await response.json();
  } catch (error) {
    console.error("Error loading items:", error);
    notyf.error("Error loading items database");
  }
}

// Update submitDupeReport function with validation
async function submitDupeReport() {
  const dupeUser = document.getElementById("dupeUserInput").value.trim();
  const proofUrls = Array.from(document.getElementsByClassName("proof-url"))
    .map((input) => input.value.trim())
    .filter((url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.host === "imgur.com" || parsedUrl.host.endsWith(".imgur.com");
      } catch (e) {
        return false;
      }
    });

  const token = getCookie("token");
  if (!token) {
    notyf.error("You must be logged in to report dupes");
    return;
  }

  if (!dupeUser) {
    notyf.error("Please enter the duper's username");
    return;
  }

  if (proofUrls.length === 0) {
    notyf.error("Please provide at least one valid Imgur proof URL");
    return;
  }

  if (!currentItemId) {
    notyf.error("No item selected");
    return;
  }

  // Check if item is already reported as duped for this user
  const existingDupe = dupesList.find(
    (dupe) =>
      dupe.owner.toLowerCase() === dupeUser.toLowerCase() &&
      dupe.item_id === currentItemId
  );

  if (existingDupe) {
    notyf.error("This item has already been reported as duped for this user");
    return;
  }

  try {
    const requestBody = {
      owner: token,
      dupe_user: dupeUser,
      item_id: currentItemId,
      proof: proofUrls.join(", "),
    };

    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/dupes/report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (response.status === 409) {
      notyf.error("This item has already been reported as duped for this user");
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server error response:", errorData);
      throw new Error(errorData.message || "Failed to submit report");
    }

    const result = await response.json();

    notyf.success("Dupe report submitted successfully");
    const reportModal = bootstrap.Modal.getInstance(
      document.getElementById("reportDupeModal")
    );
    reportModal.hide();

    // Clear form
    document.getElementById("dupeUserInput").value = "";
    document
      .querySelectorAll(".proof-url")
      .forEach((input) => (input.value = ""));

    // Refresh dupes list
    await fetchDupesList();

    // Show confirmation and auto-close modal
    setTimeout(() => {
      const resultsModal = bootstrap.Modal.getInstance(
        document.getElementById("resultsModal")
      );
      if (resultsModal) {
        resultsModal.hide();
      }
    }, 1500);
  } catch (error) {
    console.error("Error submitting dupe report:", error);
    notyf.error(error.message || "Failed to submit dupe report");
  }
}

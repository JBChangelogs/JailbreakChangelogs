document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "https://api3.jailbreakchangelogs.xyz/changelogs/list";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const startDateBtn = document.getElementById("startDateBtn");
  const endDateBtn = document.getElementById("endDateBtn");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const applyFilterBtn = document.getElementById("applyDateFilter");
  const clearFilterBtn = document.getElementById("desktopClearDateFilter");
  const openModalBtn = document.getElementById("desktopOpenDateFilterModal");
  const mobileOpenModalBtn = document.getElementById(
    "mobileOpenDateFilterModal"
  );
  const dateFilterModal = new bootstrap.Modal(
    document.getElementById("dateFilterModal")
  );

  // Native references for search results and navbar
  const searchResultsContainer = document.querySelector("#search-results");
  const navbarCollapse = document.querySelector("#navbarContent");
  const debounceLatestChangelog = (function () {
    let timeoutId = null;
    const delay = 4700; // Same as random changelog delay for consistency

    return function (fn) {
      if (timeoutId) {
        return; // Exit if there's a pending action
      }

      fn(); // Execute the function

      // Set the timeout and store its ID
      timeoutId = setTimeout(() => {
        timeoutId = null; // Reset the timeout ID after delay
      }, delay);
    };
  })();

  // Initialize changelogs data and debounce timer
  let changelogsData = [];
  let currentFilterState = null;
  let debounceTimer;

  function escapeHtml(text) {
    // Create a temporary div to handle HTML encoding
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function updateChangelogBreadcrumb(changelogId) {
    const breadcrumbHtml = `
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item"><a href="/changelogs">Changelogs</a></li>
            <li class="breadcrumb-item active" aria-current="page">Changelog ${changelogId}</li>
        </ol>
    `;
    document.querySelector('nav[aria-label="breadcrumb"]').innerHTML =
      breadcrumbHtml;
  }

  document
    .querySelector("#latestChangelogBtn, #latestChangelogMobileBtn")
    .addEventListener("click", function () {
      const btn = this;

      // Check if button is already disabled
      if (btn.disabled) {
        return;
      }

      debounceLatestChangelog(() => {
        if (changelogsData && changelogsData.length > 0) {
          const latestChangelog = changelogsData[0];
          const currentChangelogId = parseInt(
            window.location.pathname.split("/").pop()
          );

          // Only proceed if we're not already on the latest changelog
          if (currentChangelogId !== latestChangelog.id) {
            const newUrl = `/changelogs/${latestChangelog.id}`;
            history.pushState({}, "", newUrl);
            displayChangelog(latestChangelog);
            updateChangelogBreadcrumb(latestChangelog.id);

            if (window.commentsManagerInstance) {
              window.commentsManagerInstance.clearComments();
              window.commentsManagerInstance.type = "changelog";
              window.commentsManagerInstance.itemId = latestChangelog.id;
              window.commentsManagerInstance.loadComments();
            }

            changelogToast("Showing latest changelog");
          }
        }
      });
      // Add visual feedback by disabling the button temporarily
      btn.disabled = true;
      btn.classList.add("disabled");

      // Re-enable the button after the delay
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove("disabled");
      }, 4700);
    });

  // Function to show the loading overlay
  function showLoadingOverlay() {
    document.querySelector("#loading-overlay").classList.add("show");
  }

  function hideLoadingOverlay() {
    document.querySelector("#loading-overlay").classList.remove("show");
  }

  showLoadingOverlay();
  mobileOpenModalBtn.addEventListener("click", function () {
    dateFilterModal.show();
  });

  // Open modal when clicking the "Select Date Range" button
  openModalBtn.addEventListener("click", function () {
    dateFilterModal.show();
  });

  // Function to create and open a date picker
  function openDatePicker(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    // Show the date input
    input.style.display = "block";
    button.style.display = "none";

    // Focus and click to open the date picker
    input.focus();
    input.click();

    // Add an event listener to hide the input when it loses focus
    input.addEventListener(
      "blur",
      function () {
        input.style.display = "none";
        button.style.display = "block";
      },
      { once: true }
    );
  }

  function updateButtonText(buttonId, date) {
    const btn = document.getElementById(buttonId);
    if (date) {
      const formattedDate = formatDateForButton(date);
      btn.querySelector("span").textContent = formattedDate;
    } else {
      btn.querySelector("span").textContent =
        buttonId === "startDateBtn" ? "Select Start Date" : "Select End Date";
    }
  }

  // Event listeners for the date buttons
  document.getElementById("startDateBtn").addEventListener("click", (e) => {
    e.preventDefault();
    openDatePicker("startDate", "startDateBtn");
  });

  document.getElementById("endDateBtn").addEventListener("click", (e) => {
    e.preventDefault();
    openDatePicker("endDate", "endDateBtn");
  });

  document.getElementById("startDate").addEventListener("change", function () {
    updateButtonText("startDateBtn", new Date(this.value));
    this.style.display = "none";
    document.getElementById("startDateBtn").style.display = "block";
  });

  document.getElementById("endDate").addEventListener("change", function () {
    updateButtonText("endDateBtn", new Date(this.value));
    this.style.display = "none";
    document.getElementById("endDateBtn").style.display = "block";
  });

  // Function to update button text
  function updateButtonText(buttonId, date) {
    const btn = document.getElementById(buttonId);
    if (date) {
      const formattedDate = formatDateForButton(date);
      btn.querySelector("span").textContent = formattedDate;
    } else {
      btn.querySelector("span").textContent =
        buttonId === "startDateBtn" ? "Select Start Date" : "Select End Date";
    }
  }

  // Function to format date for button display
  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Generates a formatted date range string based on provided start and end dates.
   *
   * @param {Date} startDate - The start date of the range
   * @param {Date} endDate - The end date of the range
   * @returns {string} A formatted string representing the date range.
   */
  function getDateRangeText(startDate, endDate) {
    // Helper function to format a date in the desired format (e.g., "Jan 1, 2023")
    const formatDate = (date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    // Check different combinations of start and end dates
    if (startDate && endDate) {
      // Both start and end dates are provided
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      // Only start date is provided
      return `From ${formatDate(startDate)}`;
    } else if (endDate) {
      // Only end date is provided
      return `Until ${formatDate(endDate)}`;
    }

    // Neither start nor end date is provided
    return "Invalid date range";
  }

  // Apply filter button click handler
  applyFilterBtn.addEventListener("click", function () {
    // Convert input values to Date objects, using UTC to avoid timezone issues
    // If no date is selected, the value will be null
    const startDate = startDateInput.value
      ? new Date(startDateInput.value + "T00:00:00Z")
      : null;
    const endDate = endDateInput.value
      ? new Date(endDateInput.value + "T00:00:00Z")
      : null;

    // Validate that at least one date is selected
    if (!startDate && !endDate) {
      alert("Please select at least one date before applying the filter.");
      return; // Exit the function if no dates are selected
    }

    // Filter changelogs based on the selected date range
    const filteredChangelogs = filterChangelogsByDate(startDate, endDate);

    // Determine the appropriate button text based on the selected date range
    let buttonText;
    if (startDate && endDate) {
      // Both start and end dates are selected
      buttonText = `${formatDateForButton(startDate)} - ${formatDateForButton(
        endDate
      )}`;
    } else if (startDate) {
      // Only start date is selected
      buttonText = `From ${formatDateForButton(startDate)}`;
    } else if (endDate) {
      // Only end date is selected
      buttonText = `Until ${formatDateForButton(endDate)}`;
    }

    // Store the current filter state for potential future use
    currentFilterState = buttonText;

    // Update the changelog dropdown with filtered results and new button text
    populateChangelogDropdown(filteredChangelogs, buttonText);

    // Open the changelog dropdown after a short delay
    // This delay ensures that the dropdown is populated before opening
    setTimeout(openChangelogDropdown, 100);

    // Hide the date filter modal after applying the filter
    dateFilterModal.hide();
  });

  // Clear filter button click handler
  clearFilterBtn.addEventListener("click", function () {
    startDateInput.value = "";
    endDateInput.value = "";
    updateButtonText("startDateBtn", null);
    updateButtonText("endDateBtn", null);
    currentFilterState = null; // Clear the filter state
    populateChangelogDropdown(changelogsData, "Select a Changelog");
    clearedFilterToast("The date filter has been cleared successfully!");
  });

  /// Function to populate the changelog dropdowns for mobile and desktop
  function populateChangelogDropdown(changelogs, buttonText) {
    const mobileDropdown = document.querySelector("#mobileChangelogList");
    const desktopDropdown = document.querySelector("#desktopChangelogList");
    const mobileDropdownButton = document.querySelector(
      "#mobileChangelogDropdown"
    );
    const desktopDropdownButton = document.querySelector(
      "#desktopChangelogDropdown"
    );

    mobileDropdown.innerHTML = "";
    desktopDropdown.innerHTML = "";

    if (changelogs.length === 0) {
      const noDataItem = `
      <li>
          <span class="dropdown-item-text">No data for selected dates</span>
      </li>
    `;
      mobileDropdown.innerHTML = noDataItem;
      desktopDropdown.innerHTML = noDataItem;
      mobileDropdownButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="me-2"><rect width="24" height="24" fill="none" /><path fill="currentColor" d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2zM4 9v10h16V9zm2 4h5v4H6z" /></svg>No data for selected dates';
      desktopDropdownButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="me-2"><rect width="24" height="24" fill="none" /><path fill="currentColor" d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2zM4 9v10h16V9zm2 4h5v4H6z" /></svg>No data for selected dates';
    } else {
      const sortedChangelogs = changelogs.sort((a, b) => b.id - a.id);

      sortedChangelogs.forEach((changelog) => {
        const fullTitle = changelog.title;
        const truncatedTitle = truncateText(fullTitle, 37);

        mobileDropdown.innerHTML += `
        <li class="w-100">
            <a class="dropdown-item changelog-dropdown-item w-100" href="?changelog=${changelog.id}" data-changelog-id="${changelog.id}" title="${fullTitle}">
                <span class="changelog-title">${truncatedTitle}</span>
            </a>
        </li>
      `;

        desktopDropdown.innerHTML += `
        <li class="w-100">
            <a class="dropdown-item changelog-dropdown-item w-100" href="?changelog=${changelog.id}" data-changelog-id="${changelog.id}">
                <span class="changelog-title">${fullTitle}</span>
            </a>
        </li>
      `;
      });

      // Update the dropdown button text
      if (buttonText) {
        const iconHtml =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="me-2"><rect width="24" height="24" fill="none" /><path fill="currentColor" d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2zM4 9v10h16V9zm2 4h5v4H6z" /></svg>';
        mobileDropdownButton.innerHTML = `${iconHtml}${buttonText}`;
        desktopDropdownButton.innerHTML = `${iconHtml}${buttonText}`;
      }

      // Add click event handlers for the dropdown items
      document.querySelectorAll(".changelog-dropdown-item").forEach((item) => {
        item.addEventListener("click", function (e) {
          e.preventDefault();
          const changelogId = this.dataset.changelogId;

          // Update the URL without reloading the page
          const newUrl = `/changelogs/${changelogId}`;
          history.pushState({}, "", newUrl);

          // Find the selected changelog
          const selectedChangelog = changelogs.find(
            (cl) => cl.id == changelogId
          );
          if (selectedChangelog) {
            displayChangelog(selectedChangelog);
            updateChangelogBreadcrumb(changelogId);
          }
        });
      });
    }
  }

  // Function to preprocess Markdown text
  const preprocessMarkdown = (markdown) => {
    return markdown
      .replace(/^ - /gm, "\n- ") // Format top-level list items
      .replace(/^ - - /gm, "\n  - ") // Format nested list items (indent with two spaces)
      .replace(/^## /gm, "\n## ") // Format second-level headers
      .replace(/^### /gm, "\n### ") // Format third-level headers
      .replace(/\(audio\) /g, "\n(audio) ") // Format audio references
      .replace(/\(video\) /g, "\n(video) ") // Format video references
      .replace(/\(image\) /g, "\n(image) "); // Format image references
  };

  // Function to dismiss the keyboard on mobile
  function dismissKeyboard() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  const searchInput = document.querySelector(
    'input[aria-label="Search changelogs"]'
  );
  const exampleQueries = document.querySelector("#exampleQueries");
  const clearButton = document.querySelector("#clearSearch");

  // Event listener for input in the search field
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer); // Clear the previous timer
    const query = this.value.trim(); // Get the trimmed query
    exampleQueries.classList.add("d-none"); // Hide example queries

    clearButton.style.display = query.length > 0 ? "block" : "none";

    if (query.length > 0) {
      // Only search if there's actual input
      debounceTimer = setTimeout(() => {
        performSearch(); // Call performSearch after the delay
      }, 300); // 300 milliseconds delay
    } else {
      // Clear search results when input is empty
      clearSearch();
    }
  });

  // Unified clear search function
  function clearSearch() {
    searchInput.value = "";
    searchInput.blur(); // Add blur() to remove focus
    clearButton.style.display = "none";
    searchResultsContainer.innerHTML = "";
    searchResultsContainer.style.display = "none";
    exampleQueries.classList.remove("d-none");
  }

  // Update clear button click handler
  clearButton.addEventListener("click", clearSearch);

  // Update keyboard event handler
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      focusOnSearchResults(); // Focus on the search results
      dismissKeyboard(); // Dismiss the keyboard on mobile
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearSearch();
    }
  });

  // Handle example query click
  document.querySelectorAll(".example-query").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent default action
      const query = this.textContent; // Get the example query text
      searchInput.value = query; // Set the search input to the example query
      clearButton.style.display = "block";
      performSearch(); // Perform the search
      exampleQueries.classList.add("d-none"); // Hide example queries
    });
  });

  // Show example queries when clicking on the search input
  searchInput.addEventListener("focus", function () {
    if (this.value.trim() === "") {
      exampleQueries.classList.remove("d-none"); // Show example queries if input is empty
    }
  });

  // Hide example queries when clicking outside the search input or example queries container
  document.addEventListener("click", function (event) {
    // Check if the click event is not triggered on the example queries themselves
    if (
      !exampleQueries.contains(event.target) &&
      // Check if the click event is not triggered on the search input
      !searchInput.contains(event.target)
    ) {
      // If all conditions are true, hide the example queries
      exampleQueries.classList.add("d-none"); // Hide if clicked outside
    }
  });

  // Hide example queries on page load if search input is empty
  document.addEventListener("DOMContentLoaded", function () {
    if (searchInput.value.trim() === "") {
      exampleQueries.classList.add("d-none"); // Hide example queries if input is empty
    }
  });

  // Function to focus on the first search result
  function focusOnSearchResults() {
    if (searchResultsContainer.children.length > 0) {
      searchResultsContainer.children[0].focus(); // Focus on the first result
    }
  }

  // Initialize Bootstrap dropdowns
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
  });

  /**
   * Formats a date object for display on a button.
   *
   * @param {Date} date - The date to be formatted.
   * @returns {string} A formatted date string (e.g., "Jan 1, 2023").
   */
  function formatDateForButton(date) {
    const options = {
      year: "numeric", // Include the full year (e.g., 2023)
      month: "short", // Use abbreviated month name (e.g., Jan)
      day: "numeric", // Include the day of the month
      timeZone: "UTC", // Use UTC to avoid time zone discrepancies
    };
    return date.toLocaleDateString("en-US", options);
  }

  /**
   * Parses a date from a changelog title string.
   *
   * @param {string} title - The changelog title containing the date (e.g., "January 1st 2023").
   * @returns {Date|null} A Date object representing the parsed date, or null if parsing fails.
   */
  function parseDateFromTitle(title) {
    // Object mapping month names to their numeric representations (0-11)
    const months = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    // Regular expression to match the date format in the title
    // Captures: (month name) (day) (year)
    // Ignores ordinal suffixes (st, nd, rd, th)
    const match = title.match(/(\w+)\s(\d+)(?:st|nd|rd|th)\s(\d{4})/);

    if (match) {
      // Destructure the matched groups
      const [, month, day, year] = match;

      // Create a new Date object using UTC to avoid timezone issues
      // months[month] converts the month name to its numeric value (0-11)
      return new Date(Date.UTC(parseInt(year), months[month], parseInt(day)));
    }

    // Return null if no valid date format is found in the title
    return null;
  }
  /**
   * Filters changelogs based on a given date range.
   *
   * @param {Date|null} startDate - The start date of the range (inclusive), or null if no start date.
   * @param {Date|null} endDate - The end date of the range (inclusive), or null if no end date.
   * @returns {Array} An array of changelog objects that fall within the specified date range.
   */
  function filterChangelogsByDate(startDate, endDate) {
    return changelogsData.filter((changelog) => {
      // Parse the date from the changelog title
      const changelogDate = parseDateFromTitle(changelog.title);

      // If the date couldn't be parsed, exclude this changelog
      if (!changelogDate) return false;

      // Apply different filtering logic based on the provided date range
      if (startDate && endDate) {
        // Both start and end dates provided: check if changelog is within range
        return changelogDate >= startDate && changelogDate <= endDate;
      } else if (startDate) {
        // Only start date provided: check if changelog is on or after start date
        return changelogDate >= startDate;
      } else if (endDate) {
        // Only end date provided: check if changelog is on or before end date
        return changelogDate <= endDate;
      }

      // If no dates are provided, include all changelogs
      return true;
    });
  }

  /**
   * Updates the text of the changelog dropdown buttons on both mobile and desktop views.
   *
   * @param {string} text - The text to display on the buttons. Use "default" for the default text.
   */
  function updateDropdownButton(text) {
    // Select the dropdown buttons for mobile and desktop views
    const mobileDropdownButton = document.querySelector(
      "#mobileChangelogDropdown"
    );
    const desktopDropdownButton = document.querySelector(
      "#desktopChangelogDropdown"
    );

    // Start with the calendar icon
    let buttonText =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="me-2"><rect width="24" height="24" fill="none" /><path fill="currentColor" d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2zM4 9v10h16V9zm2 4h5v4H6z" /></svg>';

    // Set the button text based on the input
    if (text === "default") {
      buttonText += "Select a Changelog";
    } else {
      buttonText += text;
    }

    // Update both mobile and desktop buttons with the new text
    mobileDropdownButton.innerHTML = buttonText;
    desktopDropdownButton.innerHTML = buttonText;
  }

  // Initialize the dropdown instance for Bootstrap
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
  });

  // Function to open the changelog dropdown
  function openChangelogDropdown() {
    const mobileDropdownEl = document.querySelector("#mobileChangelogDropdown"); // Mobile dropdown reference
    const desktopDropdownEl = document.querySelector(
      "#desktopChangelogDropdown"
    ); // Desktop dropdown reference

    // Get or create Bootstrap dropdown instances
    const mobileDropdownInstance =
      bootstrap.Dropdown.getOrCreateInstance(mobileDropdownEl);
    const desktopDropdownInstance =
      bootstrap.Dropdown.getOrCreateInstance(desktopDropdownEl);

    // Force the dropdown to show
    mobileDropdownInstance.show();
    desktopDropdownInstance.show();

    // Ensure the dropdown stays open
    setTimeout(() => {
      if (!mobileDropdownEl.classList.contains("show")) {
        mobileDropdownEl.dropdown("show");
      }
      if (!desktopDropdownEl.classList.contains("show")) {
        desktopDropdownEl.dropdown("show");
      }
    }, 100);
  }

  // Function to show a toast notification after copying the changelog
  function copiedChangelogToast(message) {
    notyf.success(message, "Changelog copied!");
  }

  // Toast function for clearing filters
  function clearedFilterToast(message) {
    notyf.success(message, "Filter cleared!");
  }

  // Toast function for latest changelog
  function changelogToast(message) {
    notyf.info(message, "Changelog");
  }

  // Function to highlight specific text in a string based on a query
  function highlightText(text, query) {
    // First escape HTML special characters
    let safeText = escapeHtml(text);

    // Check if this is a mention search
    const isMentionSearch = query.trim() === "has:mention";

    if (isMentionSearch) {
      // Only highlight mentions for has:mention searches
      safeText = safeText.replace(
        /@(\w+)/g,
        '<span class="highlight mention">@$1</span>'
      );
    } else {
      // For regular searches, highlight the search terms
      const words = query
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => escapeRegExp(word));

      const pattern = words.join("|");
      const regex = new RegExp(`(${pattern})`, "gi");
      safeText = safeText.replace(regex, '<span class="highlight">$1</span>');
    }

    return safeText;
  }

  // Helper function to escape special characters in regex
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Function to convert Markdown text to HTML
  const convertMarkdownToHtml = (markdown) => {
    // Handle inline italic formatting with color matching lead paragraphs
    markdown = markdown.replace(
      /\b_([^_]+)_\b/g,
      '<span style="font-style: italic; color: var(--content-paragraph);">$1</span>'
    );
    return markdown
      .split("\n") // Split the markdown into lines
      .map((line) => {
        line = line.trim(); // Trim whitespace from the line
        // Handle different Markdown syntaxes
        if (line.startsWith("# ")) {
          return `<h1 class="display-4 mb-4 text-custom-header border-bottom border-custom-header pb-2">${wrapMentions(
            line.substring(2)
          )}</h1>`; // Convert to H1
        } else if (line.startsWith("## ")) {
          return `<h2 class="display-5 mt-5 mb-3 text-custom-subheader">${wrapMentions(
            line.substring(3)
          )}</h2>`; // Convert to H2
        } else if (line.startsWith("- - ")) {
          return `<div class="d-flex mb-2 position-relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" class="position-absolute" style="left: 20px; top: 2px;">
                          <rect width="16" height="16" fill="none" />
                          <path fill="#748d92" fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5" />
                      </svg>
                      <p class="lead mb-0 ms-4 ps-4">${wrapMentions(
                        line.substring(4)
                      )}</p>
                  </div>`;
        } else if (line.startsWith("- ")) {
          return `<div class="d-flex mb-2 position-relative">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="position-absolute" style="left: 0; top: 2px;">
                                      <rect width="24" height="24" fill="none" />
                                      <g fill="none" stroke="#748d92" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                                          <path stroke-dasharray="20" stroke-dashoffset="20" d="M3 12h17.5">
                                              <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="20;0" />
                                          </path>
                                          <path stroke-dasharray="12" stroke-dashoffset="12" d="M21 12l-7 7M21 12l-7 -7">
                                              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.2s" values="12;0" />
                                          </path>
                                      </g>
                                  </svg>
                                  <p class="lead mb-0 ms-4 ps-1">${wrapMentions(
                                    line.substring(2)
                                  )}</p>
                              </div>`;
        } else if (
          line.startsWith("(audio)") ||
          line.startsWith("(video)") ||
          line.startsWith("(image)")
        ) {
          // Add class for media element and margin if it follows another media element
          const isMedia = true;
          const mediaElementClass = "media-element-spacing";

          if (line.startsWith("(video)")) {
            const videoUrl = line.substring(7).trim();
            return `<video class="${mediaElementClass}" controls preload="metadata" playsinline>
              <source src="${videoUrl}" type="video/webm">
              Your browser does not support the video tag.
            </video>`;
          } else if (line.startsWith("(image)")) {
            const imageUrl = line.substring(7).trim();
            return `<img src="${imageUrl}" alt="Image" class="${mediaElementClass}">`;
          } else if (line.startsWith("(audio)")) {
            const audioUrl = line.substring(7).trim();
            return `<audio class="${mediaElementClass}" controls>
              <source src="${audioUrl}" type="audio/mpeg">
            </audio>`;
          }
        } else {
          return `<p class="lead mb-2">${wrapMentions(line)}</p>`; // Default to paragraph
        }
      })
      .join(""); // Join all lines into a single HTML string
  };

  // Function to wrap mentions in a specific HTML structure
  const wrapMentions = (text) => {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention fw-bold"><span class="at">@</span><span class="username">$1</span></span>' // Highlight mentions
    );
  };

  // Replace this function in changelogs.js
  function processChangelogData(data) {
    changelogsData = data;

    if (Array.isArray(data) && data.length > 0) {
      populateChangelogDropdown(data);

      // Get the changelog ID from URL
      const pathSegments = window.location.pathname.split("/");
      const changelogId = pathSegments[pathSegments.length - 1];

      // Find the requested changelog in our data
      const selectedChangelog = data.find((cl) => cl.id == changelogId);

      if (selectedChangelog) {
        // Update breadcrumb and display changelog
        document.querySelector('nav[aria-label="breadcrumb"]').innerHTML = `
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="/">Home</a></li>
          <li class="breadcrumb-item"><a href="/changelogs">Changelogs</a></li>
          <li class="breadcrumb-item active" aria-current="page">Changelog ${selectedChangelog.id}</li>
        </ol>
      `;

        displayChangelog(selectedChangelog);

        // Initialize comments manager
        if (!window.commentsManagerInstance) {
          window.commentsManagerInstance = new CommentsManager(
            "changelog",
            changelogId
          );
          window.commentsManagerInstance.loadComments();
        }
      } else {
        // If changelog not found, display latest
        const latestChangelog = data[0];
        history.replaceState({}, "", `/changelogs/${latestChangelog.id}`);
        displayChangelog(latestChangelog);
        updateChangelogBreadcrumb(latestChangelog.id);
      }
    }
    hideLoadingOverlay();
  }

  // Make the function globally accessible
  window.fetchDataFromAPI = function () {
    showLoadingOverlay();
    return fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        processChangelogData(data);
      })
      .catch((error) => {
        console.error("Error fetching changelogs:", error);

        const errorMessage = getErrorMessage(error.status || 0);

        // Update main content using native DOM methods
        const contentElement = document.getElementById("content");
        contentElement.innerHTML = `
          <div class="api-error-container">
            <div class="api-error-icon">
         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64">
	<rect width="64" height="64" fill="none" />
	<path fill="#ffce31" d="M5.9 62c-3.3 0-4.8-2.4-3.3-5.3L29.3 4.2c1.5-2.9 3.9-2.9 5.4 0l26.7 52.5c1.5 2.9 0 5.3-3.3 5.3z" />
	<g fill="#231f20">
		<path d="m27.8 23.6l2.8 18.5c.3 1.8 2.6 1.8 2.9 0l2.7-18.5c.5-7.2-8.9-7.2-8.4 0" />
		<circle cx="32" cy="49.6" r="4.2" />
	</g>
</svg>
            </div>
            <h2 class="api-error-title">Unable to Load Data</h2>
            <p class="api-error-message">
              We're having trouble loading the changelog information. This might be due to a temporary connection issue or server maintenance.
            </p>
            <button class="api-retry-button" id="retryButton">Try Again</button>
            <p class="api-error-details">
              If the problem persists, please refresh the page or try again later.<br>
              You can check our service status at <a href="https://status.jailbreakchangelogs.xyz/" target="_blank" class="status-link">status.jailbreakchangelogs.xyz</a>
            </p>
          </div>
        `;

        // Update sidebar image
        document.getElementById("sidebarImage").innerHTML = `
          <div class="api-error-container">
            <div class="api-error-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64">
	<rect width="64" height="64" fill="none" />
	<path fill="#ffce31" d="M5.9 62c-3.3 0-4.8-2.4-3.3-5.3L29.3 4.2c1.5-2.9 3.9-2.9 5.4 0l26.7 52.5c1.5 2.9 0 5.3-3.3 5.3z" />
	<g fill="#231f20">
		<path d="m27.8 23.6l2.8 18.5c.3 1.8 2.6 1.8 2.9 0l2.7-18.5c.5-7.2-8.9-7.2-8.4 0" />
		<circle cx="32" cy="49.6" r="4.2" />
	</g>
</svg>
            </div>
            <h2 class="api-error-title">Unable to Load Changelog Image</h2>
          </div>
        `;

        // Add event listener after inserting the button
        document
          .getElementById("retryButton")
          ?.addEventListener("click", () => {
            fetchDataFromAPI();
          });

        hideLoadingOverlay();
      });
  };

  // Initial data fetch
  fetchDataFromAPI();

  function getErrorMessage(statusCode) {
    switch (statusCode) {
      case 404:
        return "The requested information could not be found. Please check back later.";
      case 403:
        return "You don't have permission to access this information. Please check your credentials.";
      case 500:
        return "We're experiencing server issues. Our team has been notified and is working on it.";
      case 0:
        return "Unable to connect to the server. Please check your internet connection.";
      default:
        return "We're having trouble loading the changelog information. This might be due to a temporary connection issue or server maintenance.";
    }
  }

  // Function to perform a search based on user input
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase(); // Get and normalize the search query

    let searchResults = []; // Initialize an array for search results

    if (query.startsWith("has:")) {
      // Handle special query for media types and mentions
      const queryType = query.split(":")[1].trim(); // Extract the type of query

      searchResults = changelogsData.filter((changelog) => {
        switch (queryType) {
          case "audio":
            return changelog.sections.includes("(audio)"); // Check for audio sections
          case "video":
            return changelog.sections.includes("(video)"); // Check for video sections
          case "image":
            return changelog.sections.includes("(image)"); // Check for image sections
          case "mention":
            return /@\w+/.test(changelog.sections); // Check for @ mentions
          default:
            return false; // Default case, no match
        }
      });
    } else {
      // Regular search
      searchResults = changelogsData.filter((changelog) => {
        const titleMatch = changelog.title.toLowerCase().includes(query); // Check if title matches
        const contentMatch =
          changelog.sections &&
          typeof changelog.sections === "string" &&
          changelog.sections.toLowerCase().includes(query); // Check if content matches
        return titleMatch || contentMatch; // Return true if either matches
      });
    }

    displaySearchResults(searchResults, query); // Display the search results
  }

  // Function to display search results based on the user's query
  function displaySearchResults(results, query) {
    searchResultsContainer.innerHTML = ""; // Clear previous results

    if (results.length === 0) {
      searchResultsContainer.innerHTML = '<p class="p-3">No results found.</p>'; // Show message if no results
    } else {
      const resultsList = document.createElement("ul");
      resultsList.className = "list-group list-group-flush"; // Create a list for results
      results.forEach((changelog) => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item custom-search-item"; // Create a list item

        let previewText = "";
        let highlightedPreview = "";

        if (query.startsWith("has:")) {
          // Handle special query for media types and mentions
          const mediaType = query.split(":")[1].trim();
          switch (mediaType) {
            case "audio":
            case "video":
            case "image":
              const mediaRegex = new RegExp(`\\(${mediaType}\\)`, "g"); // Create regex for media type
              const mediaCount = (changelog.sections.match(mediaRegex) || [])
                .length; // Count occurrences
              previewText = `${mediaCount} ${mediaType}${
                mediaCount !== 1 ? "s" : ""
              } found`; // Prepare preview text
              highlightedPreview = previewText; // No highlighting for media types
              break;
            case "mention":
              const mentionMatches = [
                ...new Set(changelog.sections.match(/@\w+/g) || []),
              ]; // Find unique mentions
              if (mentionMatches.length > 0) {
                previewText = `Mentions found: ${mentionMatches.join(", ")}`; // Prepare mention preview
                highlightedPreview = highlightText(previewText, query); // Highlight mentions
              } else {
                previewText = "No mentions found"; // No mentions case
                highlightedPreview = previewText;
              }
              break;
          }
        } else {
          // Regular search preview logic
          const cleanedSections = cleanContentForSearch(changelog.sections); // Clean content for search
          const queryPosition = cleanedSections.toLowerCase().indexOf(query); // Find query position
          if (queryPosition !== -1) {
            const startPos = Math.max(0, queryPosition - 50); // Determine start position for preview
            const endPos = Math.min(
              cleanedSections.length,
              queryPosition + query.length + 50
            ); // Determine end position
            previewText = cleanedSections.substring(startPos, endPos); // Create preview text
            if (startPos > 0) previewText = "..." + previewText; // Add ellipsis if needed
            if (endPos < cleanedSections.length) previewText += "..."; // Add ellipsis if needed
          } else {
            previewText =
              cleanedSections.substring(0, 100) +
              (cleanedSections.length > 100 ? "..." : ""); // Default preview
          }
          highlightedPreview = highlightText(previewText, query); // Highlight the preview text
        }

        const highlightedTitle = highlightText(changelog.title, query); // Highlight the changelog title

        // Create media labels based on available sections
        const hasAudio = changelog.sections.includes("(audio)");
        const hasVideo = changelog.sections.includes("(video)");
        const hasImage = changelog.sections.includes("(image)");
        const hasMention = /@\w+/.test(changelog.sections);
        const mediaLabels = [
          hasAudio ? '<span class="badge audio-badge me-1">Audio</span>' : "",
          hasVideo ? '<span class="badge video-badge me-1">Video</span>' : "",
          hasImage ? '<span class="badge image-badge me-1">Image</span>' : "",
          hasMention
            ? '<span class="badge mention-badge me-1">Mention</span>'
            : "",
        ].join("");

        listItem.innerHTML = `
                <h5 class="mb-1">${highlightText(
                  changelog.title,
                  query
                )} ${mediaLabels}</h5>
                <p class="mb-1 small">${highlightText(previewText, query)}</p>
            `;

        // Click event to display the selected changelog
        listItem.addEventListener("click", () => {
          // Update the URL without reloading the page
          const newUrl = `/changelogs/${changelog.id}`;
          history.pushState({}, "", newUrl);

          // Clear search when clicking a result
          clearSearch();

          // Display the selected changelog
          displayChangelog(changelog);
          updateChangelogBreadcrumb(changelog.id);

          // Update comments section
          if (window.commentsManagerInstance) {
            window.commentsManagerInstance.clearComments();
            window.commentsManagerInstance.type = "changelog";
            window.commentsManagerInstance.itemId = changelog.id;
            window.commentsManagerInstance.loadComments();
          }

          dismissKeyboard();
        });

        resultsList.appendChild(listItem); // Append the list item to the results list
      });
      searchResultsContainer.appendChild(resultsList); // Append the results list to the container
    }
    searchResultsContainer.style.display = "block"; // Show the search results container
  }

  // Prevent body scrolling when interacting with the search results container
  searchResultsContainer.addEventListener("wheel", function (event) {
    event.stopPropagation(); // Prevent the body from scrolling
  });

  searchResultsContainer.addEventListener("touchstart", function (event) {
    event.stopPropagation(); // Prevent body scrolling on touch devices
  });

  searchResultsContainer.addEventListener("touchmove", function (event) {
    event.stopPropagation(); // Prevent body scrolling on touch devices
  });

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  }

  function displayRandomChangelog() {
    if (changelogsData && changelogsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * changelogsData.length);
      const randomChangelog = changelogsData[randomIndex];

      // Update the URL without reloading the page
      const newUrl = `/changelogs/${randomChangelog.id}`;
      history.pushState({}, "", newUrl);

      displayChangelog(randomChangelog);
      updateChangelogBreadcrumb(randomChangelog.id); // Update the breadcrumb

      if (window.commentsManagerInstance) {
        window.commentsManagerInstance.clearComments();
        window.commentsManagerInstance.type = "changelog";
        window.commentsManagerInstance.itemId = randomChangelog.id;
        window.commentsManagerInstance.loadComments();
      }

      changelogToast("Showing a random changelog");
    } else {
      console.warn("No changelog data available to display a random entry.");
      changelogToast("No changelog data available.");
    }
  }

  const slowModeDelay = 4700;
  const buttons = ["#randomChangelogDesktopBtn", "#randomChangelogMobileBtn"]; // IDs of the buttons

  buttons.forEach(function (buttonSelector) {
    document
      .querySelector(buttonSelector)
      .addEventListener("click", function () {
        const btn = this; // Cache the button element

        // Check if the button is disabled
        if (btn.disabled) {
          return; // Exit if already in slow mode
        }

        displayRandomChangelog(); // Call the random changelog function

        // Disable the button and add a disabled class for styling
        btn.disabled = true;
        btn.classList.add("disabled");

        // Re-enable the button after the delay
        setTimeout(function () {
          btn.disabled = false;
          btn.classList.remove("disabled");
        }, slowModeDelay);
      });
  });

  // Function to clean content for search
  function cleanContentForSearch(content) {
    return content
      .replace(/- /g, " ") // Remove bullet points
      .replace(/- - /g, " ") // Remove double bullet points
      .replace(/### /g, " ") // Remove H3 headers
      .replace(/## /g, " ") // Remove H2 headers
      .replace(/\(audio\) /g, " ") // Remove audio tags
      .replace(/\(video\) /g, " ") // Remove video tags
      .replace(/\(image\) /g, " ") // Remove image tags
      .replace(/\(audio\)\s*\S+/g, "") // Remove audio file references
      .replace(/\(video\)\s*\S+/g, "") // Remove video file references
      .replace(/\(image\)\s*\S+/g, "") // Remove image file references
      .replace(/@(\w+)/g, "@$1") // Normalize mentions
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim(); // Trim leading and trailing whitespace
  }

  // Function to display the selected changelog
  function displayChangelog(changelog) {
    localStorage.setItem("selectedChangelogId", changelog.id);
    document.title = changelog.title;

    // Update comments header
    const commentsHeader = document.querySelector(".comment-header");
    if (commentsHeader) {
      commentsHeader.textContent = `Comments for ${changelog.title}`;
    }

    if (titleElement) {
      titleElement.textContent = changelog.title;
    }

    // Update image element if available
    if (changelog.image_url) {
      imageElement.src = changelog.image_url;
      imageElement.alt = `Image for ${changelog.title}`;
      imageElement.style.display = "block"; // Show image
    } else {
      imageElement.src = ""; // Clear the source
      imageElement.alt = ""; // Clear alt text when no image is present
      imageElement.style.display = "none"; // Hide image
    }

    let contentHtml = `<h1 class="display-4 mb-4">${changelog.title}</h1>`;

    if (changelog.sections) {
      const processedMarkdown = preprocessMarkdown(changelog.sections);
      const processedSections = convertMarkdownToHtml(processedMarkdown);
      contentHtml += processedSections;
      contentHtml += createNavigationLinks(changelog);
    } else {
      console.warn("No sections available for changelog.");
      contentHtml += '<p class="lead">No sections available.</p>';
    }

    // Use the stored filter state instead of checking the dropdown text
    if (currentFilterState) {
      updateDropdownButton(currentFilterState);
    } else {
      updateDropdownButton("default");
    }

    sectionsElement.innerHTML = contentHtml;
    const pathSegments = window.location.pathname.split("/");
    if (!isNaN(pathSegments[pathSegments.length - 1])) {
      pathSegments.pop();
    }
    const newPath = `${pathSegments.join("/")}/${changelog.id}`;
    window.history.pushState({}, "", newPath);

    const isLatestChangelog = changelog.id === changelogsData[0].id;
  }

  // Click event for changelog dropdown items
  // In changelogs.js - Update the dropdown click handler
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("changelog-dropdown-item")) {
      e.preventDefault();
      const changelogId = e.target.dataset.changelogId;
      const selectedChangelog = changelogsData.find(
        (cl) => cl.id == changelogId
      );

      if (selectedChangelog) {
        // Update the URL without reloading the page
        const newUrl = `/changelogs/${changelogId}`;
        history.pushState({}, "", newUrl);

        // Display the changelog
        displayChangelog(selectedChangelog);
        updateChangelogBreadcrumb(changelogId);

        // Update comments section
        if (window.commentsManagerInstance) {
          window.commentsManagerInstance.clearComments();
          window.commentsManagerInstance.type = "changelog";
          window.commentsManagerInstance.itemId = changelogId;
          window.commentsManagerInstance.loadComments();
        }

        // Close the dropdown
        const dropdown = bootstrap.Dropdown.getInstance(
          e.target.closest(".dropdown-menu").previousElementSibling
        );
        if (dropdown) {
          dropdown.hide();
        }
      }
    }
  });

  document.addEventListener("click", function (e) {
    // Find the closest quick-nav-link ancestor or the element itself
    const navLink = e.target.closest(".quick-nav-link");
    if (navLink) {
      e.preventDefault();
      const changelogId = navLink.dataset.changelogId;
      if (changelogId) {
        const changelog = changelogsData.find((cl) => cl.id == changelogId);
        if (changelog) {
          // Clear comments first
          if (window.commentsManagerInstance) {
            window.commentsManagerInstance.clearComments();
          }

          // Update URL and display new content
          const newUrl = `/changelogs/${changelogId}`;
          history.pushState({}, "", newUrl);
          displayChangelog(changelog);
          updateChangelogBreadcrumb(changelogId);

          // Update comments
          if (window.commentsManagerInstance) {
            window.commentsManagerInstance.type = "changelog";
            window.commentsManagerInstance.itemId = changelogId;
            window.commentsManagerInstance.loadComments();
          }
        }
      }
    }
  });

  function extractDate(title) {
    // Extract just the date portion before the "/"
    const parts = title.split("/");
    return parts[0].trim();
  }

  function createNavigationLinks(currentChangelog) {
    const currentIndex = changelogsData.findIndex(
      (cl) => cl.id === currentChangelog.id
    );
    const prevChangelog =
      currentIndex < changelogsData.length - 1
        ? changelogsData[currentIndex + 1]
        : null;
    const nextChangelog =
      currentIndex > 0 ? changelogsData[currentIndex - 1] : null;

    return `
        <nav class="changelog-navigation mt-5 border-top pt-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                ${
                  prevChangelog
                    ? `
                    <div class="nav-item">
                        <button class="btn btn-link quick-nav-link p-0" 
                           data-changelog-id="${prevChangelog.id}"
                           title="${prevChangelog.title}">
                            <div class="d-flex flex-column">
                                <small class="text-muted mb-1">Previous Changelog</small>
                                <div class="d-flex align-items-center gap-2">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                      <rect width="24" height="24" fill="none" />
                                      <g fill="none">
                                        <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                                        <path fill="currentColor" d="M3.283 10.94a1.5 1.5 0 0 0 0 2.12l5.656 5.658a1.5 1.5 0 1 0 2.122-2.122L7.965 13.5H19.5a1.5 1.5 0 0 0 0-3H7.965l3.096-3.096a1.5 1.5 0 1 0-2.122-2.121z" />
                                      </g>
                                    </svg>
                                    <span>${extractDate(
                                      prevChangelog.title
                                    )}</span>
                                </div>
                            </div>
                        </button>
                    </div>
                `
                    : ""
                }
                
                ${
                  nextChangelog
                    ? `
                    <div class="nav-item">
                        <button class="btn btn-link quick-nav-link p-0" 
                           data-changelog-id="${nextChangelog.id}"
                           title="${nextChangelog.title}">
                            <div class="d-flex flex-column">
                                <small class="text-muted mb-1">Next Changelog</small>
                                <div class="d-flex align-items-center gap-2">
                                    <span>${extractDate(
                                      nextChangelog.title
                                    )}</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                    <rect width="24" height="24" fill="none" />
                                    <g fill="none">
                                      <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                                      <path fill="currentColor" d="m15.06 5.283l5.657 5.657a1.5 1.5 0 0 1 0 2.12l-5.656 5.658a1.5 1.5 0 0 1-2.122-2.122l3.096-3.096H4.5a1.5 1.5 0 0 1 0-3h11.535L12.94 7.404a1.5 1.5 0 0 1 2.122-2.121Z" />
                                    </g>
                                  </svg>
                                </div>
                            </div>
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        </nav>
    `;
  }

  function handleNavigationClick(event, changelogId) {
    event.preventDefault();
    const changelog = changelogsData.find((cl) => cl.id === changelogId);
    if (changelog) {
      const newUrl = `/changelogs/${changelogId}`;
      history.pushState({}, "", newUrl);

      // First update the content
      displayChangelog(changelog);
      updateChangelogBreadcrumb(changelogId);

      // Update comments if necessary
      if (window.commentsManagerInstance) {
        window.commentsManagerInstance.clearComments();
        window.commentsManagerInstance.type = "changelog";
        window.commentsManagerInstance.itemId = changelogId;
        window.commentsManagerInstance.loadComments();
      }

      // Then scroll to content with a slight delay to ensure content is rendered
      setTimeout(() => {
        const contentElement = document.getElementById("content");
        if (contentElement) {
          contentElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }

  function formatDate(unixTimestamp) {
    // Check if timestamp is in seconds or milliseconds
    const isMilliseconds = unixTimestamp.toString().length > 10;
    const timestamp = isMilliseconds ? unixTimestamp : unixTimestamp * 1000;

    const date = new Date(timestamp);

    const options = {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    let formattedDate = date.toLocaleString("en-US", options);

    // Get the day of the month with the appropriate ordinal suffix
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    formattedDate = formattedDate.replace(day, `${day}${ordinalSuffix}`);

    return formattedDate;
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

  // Initialize Bootstrap dropdowns
  bootstrap.Dropdown.getOrCreateInstance(
    document.querySelector("#mobileChangelogDropdown")
  );
  bootstrap.Dropdown.getOrCreateInstance(
    document.querySelector("#desktopChangelogDropdown")
  );

  // State machine for error handling
  const ErrorState = {
    SUCCESS: "success",
    NOT_FOUND: "not_found",
    FORBIDDEN: "forbidden",
    SERVER_ERROR: "server_error",
    NETWORK_ERROR: "network_error",
  };

  function handleError(status) {
    switch (status) {
      case 404:
        return {
          state: ErrorState.NOT_FOUND,
          message: "The requested information could not be found.",
        };
      case 403:
        return {
          state: ErrorState.FORBIDDEN,
          message: "You don't have permission to access this information.",
        };
      case 500:
        return {
          state: ErrorState.SERVER_ERROR,
          message: "We're experiencing server issues.",
        };
      case 0:
        return {
          state: ErrorState.NETWORK_ERROR,
          message: "Unable to connect to the server.",
        };
      default:
        return {
          state: ErrorState.SERVER_ERROR,
          message: "An unknown error occurred.",
        };
    }
  }

  // Switch statement for handling media types
  function handleMediaType(type, changelog) {
    switch (type) {
      case "audio":
        return changelog.sections.includes("(audio)");
      case "video":
        return changelog.sections.includes("(video)");
      case "image":
        return changelog.sections.includes("(image)");
      case "mention":
        return /@\w+/.test(changelog.sections);
      default:
        return false;
    }
  }

  // Switch statement for markdown parsing
  function parseMarkdownElement(line) {
    switch (true) {
      case line.startsWith("# "):
        return createH1Element(line.substring(2));
      case line.startsWith("## "):
        return createH2Element(line.substring(3));
      case line.startsWith("- - "):
        return createNestedListItem(line.substring(4));
      case line.startsWith("- "):
        return createListItem(line.substring(2));
      case line.startsWith("(audio)"):
        return createAudioElement(line.substring(7));
      case line.startsWith("(video)"):
        return createVideoElement(line.substring(7));
      case line.startsWith("(image)"):
        return createImageElement(line.substring(7));
      default:
        return createParagraph(line);
    }
  }

  // Function to update quick stats
  function updateQuickStats(data) {
    if (Array.isArray(data) && data.length > 0) {
      // Sort data by date
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.title.split(" ").slice(-3).join(" "));
        const dateB = new Date(b.title.split(" ").slice(-3).join(" "));
        return dateB - dateA;
      });

      // Update latest update date
      const latestDate = new Date(
        sortedData[0].title.split(" ").slice(-3).join(" ")
      );
      document.querySelector("#latestUpdateDate").textContent =
        latestDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

      // Update total updates count
      document.querySelector("#totalUpdates").textContent = data.length;

      // Count major features (sections starting with "Added" or "New")
      let majorFeatureCount = 0;
      data.forEach((changelog) => {
        const sections = changelog.sections.split("\n");
        sections.forEach((section) => {
          if (section.includes("Added") || section.includes("New")) {
            majorFeatureCount++;
          }
        });
      });
      document.querySelector("#majorFeatures").textContent = majorFeatureCount;
    }
  }
});
function handleinvalidImage() {
  setTimeout(() => {
    const userId = this.id.replace("avatar-", "");
    const username = this.closest("li").querySelector("a").textContent;
    this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;
  }, 0);
}

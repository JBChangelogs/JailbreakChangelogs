$(document).ready(function () {
  // Get references to DOM elements
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/changelogs/list";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const CommentHeader = document.getElementById("comment-header");
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

  // Caching variables
  const CACHE_KEY = "changelogsCache";
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

  const desktopLatestChangelogBtn = document.getElementById(
    "desktopLatestChangelogBtn"
  );
  const mobileLatestChangelogBtn = document.getElementById(
    "mobileLatestChangelogBtn"
  );

  // jQuery references for search results and navbar
  const $searchResultsContainer = $("#search-results");
  const $navbarCollapse = $("#navbarContent");

  // Initialize changelogs data and debounce timer
  let changelogsData = [];
  let currentFilterState = null;
  let debounceTimer;

  function escapeHtml(text) {
    // First preserve any existing highlight spans by using temporary markers
    text = text.replace(
      /<span class="highlight">(.*?)<\/span>/g,
      "§§H§§$1§§/H§§"
    );
    text = text.replace(
      /<span class="highlight mention">(.*?)<\/span>/g,
      "§§M§§$1§§/M§§"
    );

    // Escape HTML entities
    const div = document.createElement("div");
    div.textContent = text;
    text = div.innerHTML;

    // Decode any existing HTML entities to prevent double encoding
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    // Restore highlight spans
    text = text.replace(
      /§§H§§(.*?)§§\/H§§/g,
      '<span class="highlight">$1</span>'
    );
    text = text.replace(
      /§§M§§(.*?)§§\/M§§/g,
      '<span class="highlight mention">$1</span>'
    );

    return text;
  }

  // Function to get cache from localStorage
  function getCache() {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : null;
  }

  // Function to set cache in localStorage
  function setCache(data) {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  }

  // Function to check if cache is expired
  function isCacheExpired(cacheTimestamp) {
    return Date.now() - cacheTimestamp > CACHE_EXPIRY;
  }

  // Displays the most recent changelog entry.
  function displayLatestChangelog() {
    if (changelogsData.length > 0) {
      const latestChangelog = changelogsData[0]; // Get the first (latest) changelog
      displayChangelog(latestChangelog); // Display the changelog content
      updateDropdownButton("default"); // Reset the dropdown button to its default state
      changelogToast("Showing latest changelog"); // Show a toast notification
    }
  }

  // Event listener for the desktop version of the "Latest Changelog" button
  desktopLatestChangelogBtn.addEventListener("click", displayLatestChangelog);

  // Event listener for the mobile version of the "Latest Changelog" button
  mobileLatestChangelogBtn.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default action if the button is a link
    displayLatestChangelog(); // Show the latest changelog
  });

  // Function to show the loading overlay
  function showLoadingOverlay() {
    loadingOverlay.classList.add("show");
  }

  // Function to hide the loading overlay
  function hideLoadingOverlay() {
    loadingOverlay.classList.remove("show");
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

  // Event listeners for the date inputs
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

  // Function to populate the changelog dropdowns for mobile and desktop
  function populateChangelogDropdown(changelogs, buttonText) {
    const $mobileDropdown = $("#mobileChangelogList");
    const $desktopDropdown = $("#desktopChangelogList");
    const $mobileDropdownButton = $("#mobileChangelogDropdown");
    const $desktopDropdownButton = $("#desktopChangelogDropdown");

    $mobileDropdown.empty();
    $desktopDropdown.empty();

    if (changelogs.length === 0) {
      const noDataItem = `
      <li>
          <span class="dropdown-item-text">No data for selected dates</span>
      </li>
    `;
      $mobileDropdown.append(noDataItem);
      $desktopDropdown.append(noDataItem);
      $mobileDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>No data for selected dates'
      );
      $desktopDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>No data for selected dates'
      );
    } else {
      const sortedChangelogs = changelogs.sort((a, b) => b.id - a.id);

      sortedChangelogs.forEach((changelog) => {
        const fullTitle = changelog.title;
        const truncatedTitle = truncateText(fullTitle, 37);

        $mobileDropdown.append(`
        <li class="w-100">
            <a class="dropdown-item changelog-dropdown-item w-100" href="#" data-changelog-id="${changelog.id}" title="${fullTitle}">
                <span class="changelog-title">${truncatedTitle}</span>
            </a>
        </li>
      `);

        $desktopDropdown.append(`
        <li class="w-100">
            <a class="dropdown-item changelog-dropdown-item w-100" href="#" data-changelog-id="${changelog.id}">
                <span class="changelog-title">${fullTitle}</span>
            </a>
        </li>
      `);
      });

      // Update the dropdown button text
      if (buttonText) {
        const iconHtml = '<i class="bi bi-calendar-event me-2"></i>';
        $mobileDropdownButton.html(`${iconHtml}${buttonText}`);
        $desktopDropdownButton.html(`${iconHtml}${buttonText}`);
      }
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

  // jQuery references for search input and UI elements
  const $searchInput = $('input[aria-label="Search changelogs"]');
  const $exampleQueries = $("#exampleQueries");
  const $clearButton = $("#clearSearch");

  // Event listener for input in the search field
  $searchInput.on("input", function () {
    clearTimeout(debounceTimer); // Clear the previous timer
    const query = $(this).val().trim(); // Get the trimmed query
    $exampleQueries.addClass("d-none"); // Hide example queries

    $clearButton.toggle(query.length > 0);

    if (query.length > 0) {
      // Only search if there's actual input
      debounceTimer = setTimeout(() => {
        performSearch(); // Call performSearch after the delay
      }, 300); // 300 milliseconds delay
    }
  });

  // Event listener for the clear button
  $clearButton.on("click", function () {
    $searchInput.val(""); // Clear the search input
    $clearButton.hide(); // Hide the clear button
    $searchResultsContainer.empty(); // Clear the search results
    $searchResultsContainer.hide();
    $exampleQueries.removeClass("d-none");

    // Trigger input event to update search results
    // $searchInput.trigger("input");

    // Focus back on the input
    $searchInput.focus();
  });

  // Handle Enter key press or mobile 'Go' button
  $searchInput.on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      focusOnSearchResults(); // Focus on the search results
      $clearButton.hide(); // Hide the clear button
      $searchInput.trigger("input"); // Trigger input event to update search
      dismissKeyboard(); // Dismiss the keyboard on mobile
    }
  });

  // Handle example query click
  $(".example-query").on("click", function (e) {
    e.preventDefault(); // Prevent default action
    const query = $(this).text(); // Get the example query text
    $searchInput.val(query); // Set the search input to the example query
    performSearch(); // Perform the search
    $exampleQueries.addClass("d-none"); // Hide example queries
  });

  // Show example queries when clicking on the search input
  $searchInput.on("focus", function () {
    if ($(this).val().trim() === "") {
      $exampleQueries.removeClass("d-none"); // Show example queries if input is empty
    }
  });

  // Hide example queries when clicking outside the search input or example queries container
  $(document).on("click", function (event) {
    // Check if the click event is not triggered on the example queries themselves
    if (
      !$exampleQueries.is(event.target) &&
      // Check if the click event is not triggered on any descendants of the example queries
      $exampleQueries.has(event.target).length === 0 &&
      // Check if the click event is not triggered on the search input
      !$(event.target).is($searchInput)
    ) {
      // If all conditions are true, hide the example queries
      $exampleQueries.addClass("d-none"); // Hide if clicked outside
    }
  });

  // Hide example queries on page load if search input is empty
  $(document).ready(function () {
    if ($searchInput.val().trim() === "") {
      $exampleQueries.addClass("d-none"); // Hide example queries if input is empty
    }
  });

  // Function to focus on the first search result
  function focusOnSearchResults() {
    if ($searchResultsContainer.children().length > 0) {
      $searchResultsContainer.children().first().focus(); // Focus on the first result
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
    const $mobileDropdownButton = $("#mobileChangelogDropdown");
    const $desktopDropdownButton = $("#desktopChangelogDropdown");

    // Start with the calendar icon
    let buttonText = '<i class="bi bi-calendar-event me-2"></i>';

    // Set the button text based on the input
    if (text === "default") {
      buttonText += "Select a Changelog";
    } else {
      buttonText += text;
    }

    // Update both mobile and desktop buttons with the new text
    $mobileDropdownButton.html(buttonText);
    $desktopDropdownButton.html(buttonText);
  }

  // Initialize the dropdown instance for Bootstrap
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
  });

  // Define buttons for copying changelog
  const mobileCopyChangelogBtn = $("#mobileCopyChangelog");
  const desktopCopyChangelogBtn = $("#desktopCopyChangelog");

  // Combined function to handle copying the changelog content
  function copyChangelog() {
    // Disable buttons to prevent spamming
    mobileCopyChangelogBtn.prop("disabled", true);
    desktopCopyChangelogBtn.prop("disabled", true);

    // Get the content of the changelog
    const changelogContent = $("#content").clone();

    // Get the current page URL
    const currentPageUrl = window.location.href;

    // Get the sidebar image URL
    const sidebarImageUrl = $("#sidebarImage").attr("src");

    // Process the content into an array
    let processedContent = [];

    // Add the title (h1) with '#' before it
    const title = changelogContent.find("h1.display-4").first().text().trim();
    processedContent.push("# " + title, ""); // '#' added before the title, Empty string for a blank line after title

    // Process other elements in the changelog
    changelogContent.children().each(function () {
      const $elem = $(this);
      if ($elem.is("h2")) {
        // Add two newlines before each h2 to separate sections
        processedContent.push("", "## " + $elem.text().trim(), "");
      } else if ($elem.is("p.lead")) {
        processedContent.push($elem.text().trim()); // Add lead paragraph text
      } else if ($elem.hasClass("d-flex")) {
        const text = $elem.find(".lead").text().trim();
        if ($elem.find(".bi-arrow-return-right").length > 0) {
          // Inline item indicator
          processedContent.push("  - " + text);
        } else if ($elem.find(".bi-arrow-right").length > 0) {
          // Regular item indicator
          processedContent.push("- " + text);
        } else {
          // Fallback for any items without hyphens
          processedContent.push("- " + text);
        }
      }
    });

    // Add custom message at the end with the current page URL
    processedContent.push(
      "",
      "",
      `This changelog was copied from ${currentPageUrl}`
    );

    // Join the processed content with newlines
    const cleanedContent = processedContent.join("\n");

    // Copy the cleaned content to the clipboard
    navigator.clipboard
      .writeText(cleanedContent)
      .then(() => {
        // Show the toast notification
        copiedChangelogToast("Changelog copied to clipboard!"); // Notify user of success
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err); // Log error if copy fails
        alert("Failed to copy changelog. Please try again."); // Alert user of failure
      })
      .finally(() => {
        // Re-enable buttons after a delay
        setTimeout(() => {
          mobileCopyChangelogBtn.prop("disabled", false);
          desktopCopyChangelogBtn.prop("disabled", false); // Re-enable both buttons
        }, 5000); // 5 seconds delay
      });
  }
  // Attach the combined function to both copy changelog buttons
  mobileCopyChangelogBtn.on("click", copyChangelog);
  desktopCopyChangelogBtn.on("click", copyChangelog);

  // Function to open the changelog dropdown
  function openChangelogDropdown() {
    const $mobileDropdownEl = $("#mobileChangelogDropdown"); // Mobile dropdown reference
    const $desktopDropdownEl = $("#desktopChangelogDropdown"); // Desktop dropdown reference

    // Get or create Bootstrap dropdown instances
    const mobileDropdownInstance = bootstrap.Dropdown.getOrCreateInstance(
      $mobileDropdownEl[0]
    );
    const desktopDropdownInstance = bootstrap.Dropdown.getOrCreateInstance(
      $desktopDropdownEl[0]
    );

    // Force the dropdown to show
    mobileDropdownInstance.show();
    desktopDropdownInstance.show();

    // Ensure the dropdown stays open
    setTimeout(() => {
      if (!$mobileDropdownEl.hasClass("show")) {
        $mobileDropdownEl.dropdown("show");
      }
      if (!$desktopDropdownEl.hasClass("show")) {
        $desktopDropdownEl.dropdown("show");
      }
    }, 100);
  }

  // Function to show a toast notification after copying the changelog
  function copiedChangelogToast(message) {
    toastr.success(message, "Changelog copied!", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }

  // Toast function for clearing filters
  function clearedFilterToast(message) {
    toastr.success(message, "Filter cleared!", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }

  // Toast function for latest changelog
  function changelogToast(message) {
    toastr.info(message, "Changelog", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }

  // Function to toggle the visibility of the clear button based on input
  function toggleClearButton() {
    $clearButton.toggle($searchInput.val().length > 0); // Show/hide clear button based on input length
  }

  // Function to hide search results and focus on the input
  function hideSearchResults() {
    $("#search-results").hide(); // Hide search results
    $searchInput.focus(); // Focus on the search input
  }

  // Function to clear the search input and reset UI elements
  function clearSearch() {
    $searchInput.val(""); // Clear the input value

    toggleClearButton(); // Update clear button visibility
    hideSearchResults(); // Hide search results
    dismissKeyboard(); // Dismiss the keyboard
  }

  // Function to highlight specific text in a string based on a query
  function highlightText(text, query) {
    // First escape any HTML in the original text
    let highlightedText = escapeHtml(text);

    const words = query
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0);

    // Highlight other query words in the text first
    words.forEach((word) => {
      if (word !== "has:" && word !== "mention") {
        // Modified regex to avoid matching within HTML tags
        const regex = new RegExp(`(?![^<]*>)(${word})`, "gi");
        highlightedText = highlightedText.replace(
          regex,
          '<span class="highlight">$1</span>'
        );
      }
    });

    // Highlight @mentions in the text last
    highlightedText = highlightedText.replace(
      /@(\w+)/g,
      '<span class="highlight mention">@$1</span>'
    );

    return highlightedText;
  }

  // Function to convert Markdown text to HTML
  const convertMarkdownToHtml = (markdown) => {
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
                          <i class="bi bi-arrow-return-right text-custom-icon position-absolute" style="left: 20px; font-size: 1.5rem;"></i>
                          <p class="lead mb-0 ms-4 ps-4">${wrapMentions(
                            line.substring(4)
                          )}</p>
                      </div>`; // Convert to styled list item
        } else if (line.startsWith("- ")) {
          return `<div class="d-flex mb-2 position-relative">
                          <i class="bi bi-arrow-right text-custom-icon position-absolute" style="left: 0; font-size: 1.5rem;"></i>
                          <p class="lead mb-0 ms-4 ps-1">${wrapMentions(
                            line.substring(2)
                          )}</p>
                      </div>`; // Convert to another styled list item
        } else if (line.startsWith("(audio)")) {
          const audioUrl = line.substring(7).trim(); // Extract audio URL
          const audioType = audioUrl.endsWith(".wav")
            ? "audio/wav"
            : "audio/mpeg"; // Determine audio type
          return `<audio class="w-100 mt-2 mb-2" controls><source src="${audioUrl}" type="audio/mpeg"></audio>`; // Create audio element
        } else if (line.startsWith("(image)")) {
          const imageUrl = line.substring(7).trim(); // Extract image URL
          return `<img src="${imageUrl}" alt="Image" class="img-fluid mt-2 mb-2 rounded" style="max-height: 270px;">`; // Create image element
        } else if (line.startsWith("(video)")) {
          const videoUrl = line.substring(7).trim();
          return `
            <video 
                class="video-responsive" 
                controls
                preload="metadata"
                playsinline
            >
                <source src="${videoUrl}" type="video/webm">
                Your browser does not support the video tag.
            </video>`;
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
  function processChangelogData(data) {
    changelogsData = data;

    if (Array.isArray(data) && data.length > 0) {
      populateChangelogDropdown(data);

      // Get changelogId from the URL path, e.g., /changelogs/{changelog id}
      const pathSegments = window.location.pathname.split("/");
      const changelogId = pathSegments[pathSegments.length - 1];

      // Find the requested changelog in the data
      let selectedChangelog = changelogId
        ? changelogsData.find((cl) => cl.id == changelogId)
        : null;

      // If no changelog is found, it will be handled by the server redirect
      if (selectedChangelog) {
        displayChangelog(selectedChangelog);

        // Toggle button visibility based on whether the selected changelog is the latest one
        const isLatestChangelog = selectedChangelog.id === data[0].id;
        desktopLatestChangelogBtn.style.display = isLatestChangelog
          ? "none"
          : "block";
        mobileLatestChangelogBtn.style.display = isLatestChangelog
          ? "none"
          : "block";
      }
    }

    hideLoadingOverlay();
  }

  function fetchDataFromAPI() {
    return $.getJSON(apiUrl)
      .done((data) => {
        setCache(data);
        processChangelogData(data);
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.error("Error fetching changelogs:", errorThrown);
        $("#content").html(
          "<p>Error loading changelogs. Please try again later.</p>"
        );
        hideLoadingOverlay();
      });
  }

  // Check cache before fetching
  const cachedData = getCache();
  if (cachedData && !isCacheExpired(cachedData.timestamp)) {
    processChangelogData(cachedData.data);
  } else {
    fetchDataFromAPI();
  }

  // Function to perform a search based on user input
  function performSearch() {
    const query = $searchInput.val().trim().toLowerCase(); // Get and normalize the search query

    if (query.length === 0) {
      hideSearchResults(); // Hide search results if the input is empty
      return; // Exit the function early
    }

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
    toggleClearButton(); // Update clear button visibility
  }

  // Function to hide the search results container and focus on the search input
  function hideSearchResults() {
    $searchResultsContainer.hide(); // Hide the search results container
    $searchInput.focus(); // Focus on the search input
  }

  // Function to display search results based on the user's query
  function displaySearchResults(results, query) {
    $searchResultsContainer.empty(); // Clear previous results

    if (results.length === 0) {
      $searchResultsContainer.html('<p class="p-3">No results found.</p>'); // Show message if no results
    } else {
      const $resultsList = $("<ul>").addClass("list-group list-group-flush"); // Create a list for results
      results.forEach((changelog) => {
        const $listItem = $("<li>").addClass(
          "list-group-item custom-search-item"
        ); // Create a list item

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

        $listItem.html(`
          <h5 class="mb-1">${escapeHtml(highlightedTitle)} ${mediaLabels}</h5>
          <p class="mb-1 small">${escapeHtml(highlightedPreview)}</p>
      `);
        // Click event to display the selected changelog
        $listItem.on("click", () => {
          displayChangelog(changelog); // Display the selected changelog
          clearSearch(); // Clear the search input
          dismissKeyboard(); // Dismiss the keyboard
        });

        $resultsList.append($listItem); // Append the list item to the results list
      });
      $searchResultsContainer.append($resultsList); // Append the results list to the container
    }
    $searchResultsContainer.show(); // Show the search results container
  }

  // Prevent body scrolling when interacting with the search results container
  $searchResultsContainer.on("wheel", function (event) {
    event.stopPropagation(); // Prevent the body from scrolling
  });

  $searchResultsContainer.on("touchstart touchmove", function (event) {
    event.stopPropagation(); // Prevent body scrolling on touch devices
  });
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  }

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
    reloadcomments();

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

    if (isLatestChangelog) {
      desktopLatestChangelogBtn.style.display = "none";
      mobileLatestChangelogBtn.style.display = "none";
    } else {
      desktopLatestChangelogBtn.style.display = "";
      mobileLatestChangelogBtn.style.display = "";
    }
  }

  // Click event for changelog dropdown items
  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault(); // Prevent default action
    const changelogId = $(this).data("changelog-id"); // Get changelog ID from data attribute
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId); // Find selected changelog

    if (selectedChangelog) {
      displayChangelog(selectedChangelog); // Display the selected changelog

      // Close the dropdown after selection
      const dropdown = bootstrap.Dropdown.getInstance(
        this.closest(".dropdown-menu").previousElementSibling
      );
      if (dropdown) {
        dropdown.hide();
      }
    } else {
      console.error("Selected changelog not found!");
    }
  });

  const CommentForm = document.getElementById("comment-form");
  const commentinput = document.getElementById("commenter-text");
  const commentbutton = document.getElementById("submit-comment");
  const avatarUrl = sessionStorage.getItem("avatar");
  const userdata = JSON.parse(sessionStorage.getItem("user"));
  const commentsList = document.getElementById("comments-list");
  const userid = sessionStorage.getItem("userid");
  if (userid) {
    commentinput.placeholder = "Comment as " + userdata.global_name;
    commentbutton.disabled = false;
    commentinput.disabled = false;
  } else {
    commentbutton.disabled = false;
    commentbutton.textContent = "Log in";
    commentbutton.addEventListener("click", function (event) {
      localStorage.setItem(
        "redirectAfterLogin",
        "/changelogs/" + localStorage.getItem("selectedChangelogId")
      ); // Store the redirect URL in local storage
      window.location.href = "/login"; // Redirect to login page
    });
  }

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
  function throw_error(message) {
    toastr.error(message, "Error creating comment.", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }
  function addComment(comment) {
    const listItem = document.createElement("li");
    listItem.classList.add("list-group-item", "d-flex", "align-items-start");

    const avatarElement = document.createElement("img");
    const defaultAvatarUrl = "/favicon.ico";
    avatarElement.src = avatarUrl.endsWith("null.png")
      ? defaultAvatarUrl
      : avatarUrl;
    avatarElement.classList.add("rounded-circle", "m-1");
    avatarElement.width = 32;
    avatarElement.height = 32;

    const commentContainer = document.createElement("div");
    commentContainer.classList.add("ms-2"); // Add margin to the left of the comment

    const usernameElement = document.createElement("a");
    usernameElement.href = `/users/${userdata.id}`; // Set the href to redirect to the user's page
    usernameElement.textContent = userdata.global_name; // Set the text to the user's global name
    usernameElement.classList.add("text-decoration-none");
    usernameElement.style.fontWeight = "bold"; // Make the text bold
    usernameElement.style.textDecoration = "none"; // Remove underline
    usernameElement.style.color = "#748d92"; // Use inherited color (usually the same as the surrounding text)

    const commentTextElement = document.createElement("p");
    commentTextElement.textContent = comment.value;
    commentTextElement.classList.add("mb-0"); // Remove default margin from <p>

    const date = Math.floor(Date.now() / 1000);
    const formattedDate = formatDate(date); // Assuming comment.date contains the date string
    const dateElement = document.createElement("small");
    dateElement.textContent = formattedDate; // Add the formatted date
    dateElement.classList.add("text-muted"); // Optional: Add a class for styling

    // Append elements to the comment container
    commentContainer.appendChild(usernameElement);
    commentContainer.appendChild(commentTextElement);
    commentContainer.appendChild(dateElement);

    // Append avatar and comment container to the list item
    listItem.appendChild(avatarElement);
    listItem.appendChild(commentContainer);

    // Prepend the new comment to the comments list

    const token = getCookie("token");

    // Post the comment to the server
    fetch("https://api.jailbreakchangelogs.xyz/comments/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: token,
        content: comment.value,
        item_id: localStorage.getItem("selectedChangelogId"),
        item_type: "changelog",
      }),
    })
      .then(async (response) => {
        const data = await response.json(); // Parse JSON response

        if (response.status === 429) {
          const cooldown = data.remaining;
          throw_error("Wait " + cooldown + " seconds before commenting again.");
          return; // Stop further execution
        }

        if (response.ok) {
          commentsList.prepend(listItem);
        } else {
          // Handle other non-429 errors (e.g., validation)
          throw_error(data.error || "An error occurred.");
        }
      })
      .catch((error) => {
        console.error(error);
        throw_error("An unexpected error occurred.");
      });
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

  let currentPage = 1; // Track the current page
  const commentsPerPage = 5; // Number of comments per page
  let comments = []; // Declare the comments array globally

  // Function to load comments
  function loadComments(commentsData) {
    comments = commentsData; // Assign the fetched comments to the global variable
    commentsList.innerHTML = ""; // Clear existing comments
    comments.sort((a, b) => b.date - a.date);

    // Calculate the total number of pages
    const totalPages = Math.ceil(comments.length / commentsPerPage);

    // Get the comments for the current page
    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const commentsToDisplay = comments.slice(startIndex, endIndex);

    const userDataPromises = commentsToDisplay.map((comment) => {
      return fetch(
        "https://api.jailbreakchangelogs.xyz/users/get?id=" + comment.user_id
      )
        .then((response) => response.json())
        .then((userData) => ({ comment, userData }))
        .catch((error) => {
          console.error("Error fetching user data:", error);
          return null;
        });
    });

    Promise.all(userDataPromises).then((results) => {
      const validResults = results.filter((result) => result !== null);

      validResults.forEach(({ comment, userData }) => {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

        const listItem = document.createElement("li");
        listItem.classList.add(
          "list-group-item",
          "d-flex",
          "align-items-start"
        );

        const avatarElement = document.createElement("img");
        const defaultAvatarUrl =
          "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg";

        avatarElement.src = avatarUrl.endsWith("null.png")
          ? defaultAvatarUrl
          : avatarUrl;
        avatarElement.classList.add("rounded-circle", "m-1");
        avatarElement.width = 32;
        avatarElement.height = 32;

        const commentContainer = document.createElement("div");
        commentContainer.classList.add("ms-2");

        const usernameElement = document.createElement("a");
        usernameElement.href = `/users/${userData.id}`; // Set the href to redirect to the user's page
        usernameElement.textContent = userData.global_name; // Set the text to the user's global name
        usernameElement.classList.add("text-decoration-none");
        usernameElement.style.fontWeight = "bold"; // Make the text bold
        usernameElement.style.textDecoration = "none"; // Remove underline
        usernameElement.style.color = "#748d92"; // Use inherited color (usually the same as the surrounding text)

        const commentTextElement = document.createElement("p");
        commentTextElement.textContent = comment.content;
        commentTextElement.classList.add("mb-0");

        const formattedDate = formatDate(comment.date);
        const dateElement = document.createElement("small");
        dateElement.textContent = formattedDate;
        dateElement.classList.add("text-muted");

        commentContainer.appendChild(usernameElement);
        commentContainer.appendChild(commentTextElement);
        commentContainer.appendChild(dateElement);
        listItem.appendChild(avatarElement);
        listItem.appendChild(commentContainer);
        commentsList.appendChild(listItem);
      });

      // Render pagination controls
      renderPaginationControls(totalPages);
    });
  }

  // Function to render pagination controls with arrows and input
  function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById("paginationControls");
    paginationContainer.innerHTML = ""; // Clear existing controls

    // Create left arrow button
    const leftArrow = document.createElement("button");
    leftArrow.textContent = "<";
    leftArrow.classList.add("btn", "btn-outline-primary", "m-1");
    leftArrow.disabled = currentPage === 1; // Disable if on the first page
    leftArrow.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadComments(comments); // Reload comments for the current page
      }
    });
    paginationContainer.appendChild(leftArrow);

    // Page number input
    const pageInput = document.createElement("input");
    pageInput.type = "number";
    pageInput.value = currentPage;
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.classList.add("form-control", "mx-1");
    pageInput.style.width = "60px"; // Set width for input
    pageInput.addEventListener("change", () => {
      const newPage = parseInt(pageInput.value);
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadComments(comments); // Reload comments for the new page
      } else {
        pageInput.value = currentPage; // Reset input if invalid
      }
    });
    paginationContainer.appendChild(pageInput);

    // Create right arrow button
    const rightArrow = document.createElement("button");
    rightArrow.textContent = ">";
    rightArrow.classList.add("btn", "btn-outline-primary", "m-1");
    rightArrow.disabled = currentPage === totalPages; // Disable if on the last page
    rightArrow.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadComments(comments); // Reload comments for the current page
      }
    });
    paginationContainer.appendChild(rightArrow);
  }

  function reloadcomments() {
    CommentHeader.textContent =
      "Comments For Changelog " + localStorage.getItem("selectedChangelogId");
    fetch(
      "https://api.jailbreakchangelogs.xyz/comments/get?type=changelog&id=" +
        localStorage.getItem("selectedChangelogId")
    )
      .then((response) => {
        if (!response.ok) {
          console.error("Unexpected response status:", response.status);
          return null; // Exit early if the response is not OK
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return; // Prevent further execution if the response was not OK

        // Check if data contains a message like "No comments found"
        if (data.message && data.message === "No comments found") {
          console.log(data.message);
          commentsList.innerHTML = "";
          return;
        }

        // Check if data contains the comments as an array
        if (Array.isArray(data)) {
          loadComments(data); // Load the comments if data is an array
        } else if (data.comments && Array.isArray(data.comments)) {
          loadComments(data.comments); // Load nested comments if available
        } else {
          console.error("Unexpected response format:", data); // Handle unexpected format
        }
      })
      .catch((error) => {
        console.error("Error fetching comments:", error); // Handle any errors
      });
  }

  CommentForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const comment = document.getElementById("commenter-text");
    addComment(comment);
    comment.value = ""; // Clear the comment input field
  });

  // Initialize Bootstrap dropdowns
  bootstrap.Dropdown.getOrCreateInstance($("#mobileChangelogDropdown")[0]);
  bootstrap.Dropdown.getOrCreateInstance($("#desktopChangelogDropdown")[0]);
});

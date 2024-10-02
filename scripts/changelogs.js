$(document).ready(function () {
  // Get references to DOM elements
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/changelogs/list";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const desktopLatestChangelogBtn = document.getElementById(
    "desktopLatestChangelogBtn"
  );
  const mobileLatestChangelogBtn = document.getElementById(
    "mobileLatestChangelogBtn"
  );
  // jQuery references for search results and navbar
  const $searchResultsContainer = $("#search-results");
  const $navbarCollapse = $("#navbarContent");

  // Get reference to the clear filter button
  const clearFilterBtn = document.getElementById("clearDateFilter");

  // Initialize Bootstrap modal for date filtering
  const dateFilterModal = new bootstrap.Modal(
    document.getElementById("dateFilterModal")
  );

  // Event listeners to open the date filter modal
  document
    .getElementById("mobileOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show();
    });

  document
    .getElementById("desktopOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show();
    });

  // Event listener for applying the date filter
  document
    .getElementById("applyDateFilter")
    .addEventListener("click", function () {
      const startDate = startDatePicker.getDate(); // Get start date
      const endDate = endDatePicker.getDate(); // Get end date

      // Validate that at least one date is selected
      if (!startDate && !endDate) {
        alert("Please select at least one date before applying the filter.");
      } else {
        const filteredChangelogs = filterChangelogsByDate(); // Filter changelogs by selected dates

        // Populate dropdown with filtered changelogs
        if (filteredChangelogs.length > 0) {
          populateChangelogDropdown(filteredChangelogs);
          // Update the button text to show the date range
          updateDropdownButton(getDateRangeText());
          setTimeout(openChangelogDropdown, 100); // Open dropdown after a short delay
        } else {
          populateChangelogDropdown([]); // Clear dropdown if no changelogs found
        }

        dateFilterModal.hide(); // Close the modal
      }
    });

  // Initialize changelogs data and debounce timer
  let changelogsData = [];
  let debounceTimer;

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

  // Show the loading overlay initially
  showLoadingOverlay();

  // Function to preprocess Markdown text
  const preprocessMarkdown = (markdown) =>
    markdown
      .replace(/ - /g, "\n- ") // Format list items
      .replace(/ - - /g, "\n- - ") // Format nested list items
      .replace(/## /g, "\n## ") // Format second-level headers
      .replace(/### /g, "\n### ") // Format third-level headers
      .replace(/\(audio\) /g, "\n(audio) ") // Format audio references
      .replace(/\(video\) /g, "\n(video) ") // Format video references
      .replace(/\(image\) /g, "\n(image) "); // Format image references

  // Function to dismiss the keyboard on mobile
  function dismissKeyboard() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  // jQuery references for search input and UI elements
  const $searchInput = $('input[aria-label="Search changelogs"]');
  const $exampleQueries = $("#exampleQueries");
  const $clearButton = $("#clear-search-button");

  // Event listener for input in the search field
  $searchInput.on("input", function () {
    clearTimeout(debounceTimer); // Clear the previous timer
    const query = $(this).val().trim(); // Get the trimmed query
    $exampleQueries.addClass("d-none"); // Hide example queries

    debounceTimer = setTimeout(() => {
      performSearch(); // Call performSearch after the delay
      toggleClearButton(); // Toggle clear button visibility
    }, 300); // 300 milliseconds delay
  });

  // Event listener for the clear button
  $clearButton.on("click", function () {
    $searchInput.val(""); // Clear the search input
    clearSearch(); // Call clearSearch function
  });

  // Handle Enter key press or mobile 'Go' button
  $searchInput.on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      focusOnSearchResults(); // Focus on the search results
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

  // Function to populate the changelog dropdowns for mobile and desktop
  function populateChangelogDropdown(changelogs) {
    const $mobileDropdown = $("#mobileChangelogList");
    const $desktopDropdown = $("#desktopChangelogList");

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
    }
  }

  // Initialize Bootstrap dropdowns
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
  });

  // Pikaday configuration for date picker
  var pikadayConfig = {
    format: "YYYY-MM-DD", // Date format
    showDaysInNextAndPreviousMonths: true, // Show days in adjacent months
    enableSelectionDaysInNextAndPreviousMonths: true, // Allow selection of days in adjacent months
    onSelect: function (date) {
      // Callback on date selection
      const fieldId = this._o.field.id; // Get the ID of the input field
      if (date) {
        // Adjust the date to local timezone
        const localDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000 // Convert to local time
        );
        document.getElementById(fieldId).value = localDate
          .toISOString()
          .split("T")[0]; // Set the value of the input field
      } else {
        document.getElementById(fieldId).value = ""; // Clear the input field if no date is selected
      }
    },
  };

  // Function to update the button text based on the selected date
  function updateButtonText(fieldId) {
    const btn = document.getElementById(fieldId + "Btn"); // Get the button element
    const dateString = document.getElementById(fieldId).value; // Get the date input value
    if (dateString) {
      const date = new Date(dateString); // Create a Date object
      const formattedDate = formatDateForButton(date); // Format the date for display
      btn.querySelector("span").textContent = formattedDate; // Update button text
    } else {
      // Set default button text based on the field ID
      btn.querySelector("span").textContent =
        fieldId === "startDate" ? "Select Start Date" : "Select End Date";
    }
  }

  // Function to format the date for the button display
  function formatDateForButton(date) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC", // Use UTC timezone
    };
    return date.toLocaleDateString("en-US", options); // Format date as a string
  }

  // Function to update the changelog list based on selected dates
  function updateChangelogList() {
    const startDate = startDatePicker.getDate(); // Get the start date from the picker
    const endDate = endDatePicker.getDate(); // Get the end date from the picker

    if (startDate || endDate) {
      const filteredChangelogs = filterChangelogsByDate(); // Filter changelogs by date

      if (filteredChangelogs.length > 0) {
        populateChangelogDropdown(filteredChangelogs); // Populate dropdown with filtered changelogs
        updateDropdownButton("filtered"); // Update the dropdown button state
        setTimeout(openChangelogDropdown, 100); // Open dropdown after a brief delay
      } else {
        populateChangelogDropdown([]); // Populate dropdown with no data
        updateDropdownButton("No data for selected dates"); // Update button text
      }
    } else {
      populateChangelogDropdown(changelogsData); // Populate dropdown with all changelogs
      updateDropdownButton("default"); // Set button to default state
    }
  }

  // Initialize the start date picker with Pikaday
  var startDatePicker = new Pikaday({
    ...pikadayConfig, // Spread existing configuration
    field: document.getElementById("startDate"), // Input field for start date
    trigger: document.getElementById("startDateBtn"), // Button to trigger date picker
    onSelect: function () {
      updateButtonText("startDate"); // Update button text on date selection
      updateChangelogList(); // Update changelog list based on new date
    },
  });

  // Initialize the end date picker with Pikaday
  var endDatePicker = new Pikaday({
    ...pikadayConfig, // Spread existing configuration
    field: document.getElementById("endDate"), // Input field for end date
    trigger: document.getElementById("endDateBtn"), // Button to trigger date picker
    onSelect: function () {
      updateButtonText("endDate"); // Update button text on date selection
      updateChangelogList(); // Update changelog list based on new date
    },
  });

  // Modify the event listener for the dropdown button to prevent default behavior
  $(document).on(
    "click",
    "#mobileChangelogDropdown, #desktopChangelogDropdown",
    function (e) {
      const buttonText = $(this).text().trim(); // Get the text of the clicked dropdown
      if (buttonText === "No data for selected dates") {
        e.preventDefault(); // Prevent default action if no data is available
        e.stopPropagation(); // Stop the event from bubbling up
      }
    }
  );

  // Update the dropdown button text based on the provided text
  function updateDropdownButton(text) {
    const $mobileDropdownButton = $("#mobileChangelogDropdown"); // Mobile dropdown reference
    const $desktopDropdownButton = $("#desktopChangelogDropdown"); // Desktop dropdown reference

    // Check if the text is default and set button text accordingly
    if (text === "default") {
      $mobileDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>View Changelogs'
      );
      $desktopDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>View Changelogs'
      );
    } else {
      $mobileDropdownButton.html(
        `<i class="bi bi-calendar-event me-2"></i>${text}`
      );
      $desktopDropdownButton.html(
        `<i class="bi bi-calendar-event me-2"></i>${text}`
      );
    }

    // Initialize the dropdown instance for Bootstrap
    var dropdownElementList = [].slice.call(
      document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
    );
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
    });
  }

  // Open date filter modal when the button is clicked
  document
    .getElementById("mobileOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show(); // Show the date filter modal
    });
  document
    .getElementById("desktopOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show(); // Show the date filter modal
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

    // Add the sidebar image URL if available
    if (sidebarImageUrl) {
      processedContent.push("", "Media:", sidebarImageUrl);
    }

    // Add custom message at the end with the current page URL
    processedContent.push(
      "",
      "",
      "This changelog was copied from jailbreakchangelogs.xyz",
      `Source: ${currentPageUrl}`
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

  // Function to get a formatted date range text
  function getDateRangeText() {
    const startDate = startDatePicker.getDate(); // Get start date
    const endDate = endDatePicker.getDate(); // Get end date

    // Format the date range based on available dates
    if (startDate && endDate) {
      return `From: ${formatDate(startDate)} - To: ${formatDate(endDate)}`;
    } else if (startDate) {
      return `From: ${formatDate(startDate)}`;
    } else if (endDate) {
      return `To: ${formatDate(endDate)}`;
    }
    return "Select Start Date and End Date"; // Default message if no dates are selected
  }

  // Function to format a date into a readable string
  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

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

  // Function to clear the date filter
  function clearDateFilter() {
    startDatePicker.setDate(null); // Reset start date
    endDatePicker.setDate(null); // Reset end date

    // Update button texts
    updateButtonText("startDate");
    updateButtonText("endDate");

    // Hide the date filter modal
    dateFilterModal.hide();

    // Populate changelog dropdown with all data
    populateChangelogDropdown(changelogsData);

    // Show the toast notification for clearing the filter
    clearedFilterToast("The date filter has been cleared successfully!");
  }

  // Function to handle clearing the filter with spam prevention
  function handleClearDateFilter(event) {
    event.preventDefault(); // Prevent default button action

    // Disable buttons to prevent spamming
    document
      .querySelectorAll("#mobileClearDateFilter, #desktopClearDateFilter")
      .forEach((button) => {
        button.disabled = true; // Disable each button
      });

    clearDateFilter(); // Call the function to clear the date filter

    // Re-enable buttons after 5 seconds
    setTimeout(() => {
      document
        .querySelectorAll("#mobileClearDateFilter, #desktopClearDateFilter")
        .forEach((button) => {
          button.disabled = false; // Re-enable each button
        });
    }, 4000); // 4 seconds delay
  }

  // Attach the event listener to both clear date filter buttons
  document
    .querySelectorAll("#mobileClearDateFilter, #desktopClearDateFilter")
    .forEach((button) => {
      button.addEventListener("click", handleClearDateFilter); // Add click event listener
    });

  // Function to filter changelogs based on selected date range
  function filterChangelogsByDate() {
    let startDate = startDatePicker.getDate(); // Get the start date
    let endDate = endDatePicker.getDate(); // Get the end date

    // If no dates are selected, return all changelogs
    if (!startDate && !endDate) {
      updateDropdownButton("default");
      return changelogsData; // Return all changelogs
    }

    // Normalize the start date to UTC
    if (startDate) {
      startDate = new Date(
        Date.UTC(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )
      );
    }
    // Normalize the end date to UTC, set to the end of the day
    if (endDate) {
      endDate = new Date(
        Date.UTC(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999
        )
      );
    }

    // Filter changelogs based on date range
    return changelogsData.filter((changelog) => {
      const changelogDate = parseDateFromTitle(changelog.title); // Parse the date from the changelog title
      if (!changelogDate) return false; // If no date found, exclude this changelog

      // Check if the changelog date falls within the selected range
      if (startDate && endDate) {
        return changelogDate >= startDate && changelogDate <= endDate;
      } else if (startDate) {
        return changelogDate >= startDate;
      } else if (endDate) {
        return changelogDate <= endDate;
      }
      return true; // Default case, include the changelog
    });
  }

  // Function to parse the date from the changelog title
  function parseDateFromTitle(title) {
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

    // Match the date format in the title
    const match = title.match(/(\w+)\s(\d+)(?:st|nd|rd|th)\s(\d{4})/);
    if (match) {
      const [, month, day, year] = match; // Destructure the matched groups
      return new Date(Date.UTC(parseInt(year), months[month], parseInt(day))); // Return date object
    }
    return null; // Return null if no match
  }

  // Function to update the dropdown button text based on filtering
  function updateDropdownButton(text) {
    const $dropdownButton = $("#changelogDropdown"); // Reference to the dropdown button
    if (text === "default") {
      $dropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>View Changelogs'
      );
    } else if (text === "filtered") {
      $dropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>Filtered Changelogs'
      );
    } else {
      $dropdownButton.html(`<i class="bi bi-calendar-event me-2"></i>${text}`);
    }
  }

  // Modify the event listener for the dropdown button
  $(document).on("click", "#changelogDropdown", function (e) {
    const buttonText = $(this).text().trim(); // Get the current button text
    if (buttonText === "No data for selected dates") {
      e.preventDefault(); // Prevent default action if there's no data
      e.stopPropagation(); // Stop event propagation
    }
  });

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
    const words = query
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0); // Split query into words

    let highlightedText = text; // Initialize highlighted text

    // Highlight @mentions in the text
    highlightedText = highlightedText.replace(
      /@(\w+)/g,
      '<span class="highlight mention">@$1</span>'
    );

    // Highlight other query words in the text
    words.forEach((word) => {
      if (word !== "has:" && word !== "mention") {
        const regex = new RegExp(`(${word})`, "gi"); // Create a regex for the word
        highlightedText = highlightedText.replace(
          regex,
          '<span class="highlight">$1</span>' // Highlight the word
        );
      }
    });

    return highlightedText; // Return the highlighted text
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
          return `<audio class="w-100 mt-2 mb-2" controls><source src="${audioUrl}" type="${audioType}"></audio>`; // Create audio element
        } else if (line.startsWith("(image)")) {
          const imageUrl = line.substring(7).trim(); // Extract image URL
          return `<img src="${imageUrl}" alt="Image" class="img-fluid mt-2 mb-2 rounded" style="max-height: 270px;">`; // Create image element
        } else if (line.startsWith("(video)")) {
          const videoUrl = line.substring(7).trim(); // Extract video URL
          return `<video class="w-100 mt-2 mb-2 rounded" style="max-height: 500px;" controls><source src="${videoUrl}" type="video/mp4"></video>`; // Create video element
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

  // Fetch changelog data from the API
  $.getJSON(apiUrl)
    .done((data) => {
      // Store the fetched data globally for later use
      changelogsData = data;

      // Check if we received valid data
      if (Array.isArray(data) && data.length > 0) {
        // Populate the changelog dropdown with the fetched data
        populateChangelogDropdown(data);

        // Get the 'id' parameter from the URL, if present
        const urlParams = new URLSearchParams(window.location.search);
        const changelogId = urlParams.get("id");

        let selectedChangelog;

        // If an ID is provided in the URL, find the corresponding changelog
        if (changelogId) {
          selectedChangelog = changelogsData.find((cl) => cl.id == changelogId);
        }

        // If no changelog was found with the provided ID, or no ID was provided,
        // default to the latest changelog (first in the array)
        if (!selectedChangelog) {
          selectedChangelog = data[0];
        }

        // Display the selected or latest changelog
        displayChangelog(selectedChangelog);

        // Make the "Latest Changelog" buttons visible by default
        // This ensures they're shown when viewing older changelogs
        desktopLatestChangelogBtn.style.display = "block";
        mobileLatestChangelogBtn.style.display = "block";

        // If the displayed changelog is the latest one, hide the "Latest Changelog" buttons
        // as they're not needed when already viewing the latest changelog
        if (selectedChangelog.id === data[0].id) {
          desktopLatestChangelogBtn.style.display = "none";
          mobileLatestChangelogBtn.style.display = "none";
        }
      }

      // Hide the loading overlay once everything is loaded and displayed
      hideLoadingOverlay();
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      // Log the error for debugging purposes
      console.error("Error fetching changelogs:", errorThrown);

      // Display a user-friendly error message
      $("#content").html(
        "<p>Error loading changelogs. Please try again later.</p>"
      );

      // Hide the loading overlay even if there's an error
      hideLoadingOverlay();
    });

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
        const mediaLabels = [
          hasAudio ? '<span class="badge audio-badge me-1">Audio</span>' : "",
          hasVideo ? '<span class="badge video-badge me-1">Video</span>' : "",
          hasImage ? '<span class="badge image-badge me-1">Image</span>' : "",
        ].join("");

        $listItem.html(`
              <h5 class="mb-1">${highlightedTitle} ${mediaLabels}</h5>
              <p class="mb-1 small">${highlightedPreview}</p>
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
    localStorage.setItem("selectedChangelogId", changelog.id); // Store selected changelog ID in local storage

    document.title = changelog.title; // Set document title to just the changelog title
    reloadcomments();

    if (titleElement) {
      titleElement.textContent = changelog.title; // Update title element
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

    let contentHtml = `<h1 class="display-4 mb-4">${changelog.title}</h1>`; // Initialize content HTML

    if (changelog.sections) {
      const processedMarkdown = preprocessMarkdown(changelog.sections); // Preprocess markdown
      const processedSections = convertMarkdownToHtml(processedMarkdown); // Convert markdown to HTML
      contentHtml += processedSections; // Append processed sections to content HTML
    } else {
      console.warn("No sections available for changelog."); // Log warning if no sections
      contentHtml += '<p class="lead">No sections available.</p>'; // Show message if no sections
    }

    const dropdownText = $("#mobileChangelogDropdown").text().trim();
    if (
      dropdownText !== "Filtered Changelogs" &&
      dropdownText !== "No data for selected dates"
    ) {
      updateDropdownButton("default"); // Update dropdown button if not filtered
    }

    sectionsElement.innerHTML = contentHtml; // Update sections element with content HTML

    // Update the URL with the ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("id", changelog.id);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );
    // Check if the currently displayed changelog is the latest one
    const isLatestChangelog = changelog.id === changelogsData[0].id;

    // Hide the "Latest Changelog" buttons if we're already showing the latest changelog
    if (isLatestChangelog) {
      desktopLatestChangelogBtn.style.display = "none";
      mobileLatestChangelogBtn.style.display = "none";
    } else {
      desktopLatestChangelogBtn.style.display = ""; // Reset to default display value
      mobileLatestChangelogBtn.style.display = ""; // Reset to default display value
    }
  }

  // Back to Top button functionality
  const backToTopButton = $("#backToTop");

  // Show or hide the back to top button based on scroll position
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      backToTopButton.addClass("show"); // Show button if scrolled down
    } else {
      backToTopButton.removeClass("show"); // Hide button if at the top
    }
  });

  // Click event for back to top button
  backToTopButton.on("click", function (e) {
    e.preventDefault(); // Prevent default action
    $("html, body").animate({ scrollTop: 0 }, 100); // Smooth scroll to top
  });
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
  const CommentHeader = document.getElementById("comment-header");
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
        "/changelogs.html?id=" + localStorage.getItem("selectedChangelogId")
      ); // Store the redirect URL in local storage
      window.location.href = "/login.html"; // Redirect to login page
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
    const defaultAvatarUrl = '/favicon.ico';
    avatarElement.src = avatarUrl.endsWith('null.png') ? defaultAvatarUrl : avatarUrl;    avatarElement.classList.add("rounded-circle", "m-1");
    avatarElement.width = 32;
    avatarElement.height = 32;

    const commentContainer = document.createElement("div");
    commentContainer.classList.add("ms-2"); // Add margin to the left of the comment

    const usernameElement = document.createElement("strong");
    usernameElement.textContent = userdata.global_name;

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
      return fetch("https://api.jailbreakchangelogs.xyz/users/get?id=" + comment.user_id)
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
        listItem.classList.add("list-group-item", "d-flex", "align-items-start");
  
        const avatarElement = document.createElement("img");
        const defaultAvatarUrl = '/favicon.ico';

        avatarElement.src = avatarUrl.endsWith('null.png') ? defaultAvatarUrl : avatarUrl;
        avatarElement.classList.add("rounded-circle", "m-1");
        avatarElement.width = 32;
        avatarElement.height = 32;
  
        const commentContainer = document.createElement("div");
        commentContainer.classList.add("ms-2");
  
        const usernameElement = document.createElement("strong");
        usernameElement.textContent = userData.global_name;
  
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

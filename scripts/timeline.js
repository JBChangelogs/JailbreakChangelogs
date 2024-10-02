$(document).ready(function () {
  // Get reference to the loading overlay element
  const loadingOverlay = document.getElementById("loading-overlay");

  // API endpoint for fetching changelogs
  const apiUrl = "https://api.jailbreakchangelogs.xyz/changelogs/list";

  // jQuery selectors for important elements
  const $timeline = $("#timeline");
  const $footer = $("footer");

  // Constants for local storage caching
  const CACHE_KEY = "changelog_data";
  const CACHE_EXPIRY = 60 * 60 * 1000; // Cache expiry set to 1 hour in milliseconds

  // State variables
  let isLoading = false; // Tracks whether data is currently being loaded
  let lastScrollTop = 0; // Stores the last known scroll position
  let footerTimeout; // Used for delaying footer visibility on scroll

  // Check if the timeline element exists in the DOM
  if ($timeline.length === 0) {
    console.error("Timeline element not found");
    return;
  }

  // Retrieve cached data from local storage if available and not expired
  function getCachedData() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
    return null;
  }

  // Store data in local storage with current timestamp
  function setCachedData(data) {
    const cacheObject = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
  }

  // Toggle visibility of the loading overlay
  function toggleLoadingOverlay(show) {
    loadingOverlay.classList.toggle("show", show);
  }
  /**
   * Converts custom markdown syntax to HTML.
   * This function processes each line of the markdown input and converts it to the appropriate HTML structure.
   * It handles various elements like headers, list items, and media embeds.
   *
   * @param {string} markdown - The input markdown string to be converted
   * @returns {string} The resulting HTML string
   */
  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .split("\n")
      .map((line) => {
        line = line.trim();

        // Ignore lines starting with (video), (audio), or (image)
        if (
          line.startsWith("(video)") ||
          line.startsWith("(audio)") ||
          line.startsWith("(image)")
        ) {
          return ""; // Return an empty string to effectively remove these lines
        }
        if (line.startsWith("# ")) {
          // Convert main headers (# )
          // Create an h1 element with custom classes for styling
          return `<h1 class="display-4 mb-4 text-custom-header border-bottom border-custom-header pb-2">${wrapMentions(
            line.substring(2)
          )}</h1>`;
        }
        // Convert subheaders (## )
        else if (line.startsWith("## ")) {
          // Create an h2 element with custom classes for styling
          return `<h2 class="display-5 mt-5 mb-3 text-custom-subheader">${wrapMentions(
            line.substring(3)
          )}</h2>`;
        }
        // Convert nested list items (- - )
        else if (line.startsWith("- - ")) {
          // Create a nested list item with custom icon and styling
          return `<div class="d-flex mb-2 position-relative">
                <i class="bi bi-arrow-return-right text-custom-icon position-absolute" style="left: 20px; font-size: 1.5rem;"></i>
                <p class="lead mb-0 ms-4 ps-4">${wrapMentions(
                  line.substring(4)
                )}</p>
              </div>`;
        }
        // Convert list items (- )
        else if (line.startsWith("- ")) {
          // Create a list item with custom icon and styling
          return `<div class="d-flex mb-2 position-relative">
                <i class="bi bi-arrow-right text-custom-icon position-absolute" style="left: 0; font-size: 1.5rem;"></i>
                <p class="lead mb-0 ms-4 ps-1">${wrapMentions(
                  line.substring(2)
                )}</p>
              </div>`;
        }
        // Convert regular text lines
        else {
          // Wrap regular text in a paragraph with lead class
          return `<p class="lead mb-2">${wrapMentions(line)}</p>`;
        }
      })
      .filter((line) => line !== "") // Remove any empty strings (i.e., the ignored lines)
      .join(""); // Join all processed lines into a single HTML string
  };

  // Wrap @mentions with special formatting
  const wrapMentions = (text) => {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention fw-bold"><span class="at">@</span><span class="username">$1</span></span>'
    );
  };

  // Format the title of a changelog entry
  function formatTitle(title) {
    const parts = title.split("/");
    let mainTitle = parts[0].trim();
    let subtitle = parts[1] ? parts[1].trim() : "";

    // Check if the title starts with a date (e.g., "September 30th 2023")
    const dateMatch = mainTitle.match(
      /^([A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)? \d{4})/
    );
    if (dateMatch) {
      const date = dateMatch[1];
      // Wrap the date in a muted span
      mainTitle = mainTitle.replace(
        date,
        `<span class="text-muted">${date}</span>`
      );
    }

    // Format the main title with bold text and larger font
    let formattedTitle = `<span class="fw-bold" style="font-size: 1.2em;">${mainTitle}</span>`;
    // Add subtitle if it exists
    if (subtitle) {
      formattedTitle += `<br><span class="text-uppercase" style="font-size: 0.9em;">${subtitle}</span>`;
    }

    return formattedTitle;
  }

  // Back to Top button functionality
  const backToTopButton = $("#backToTop");

  // Show/hide the Back to Top button based on scroll position
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      backToTopButton.addClass("show");
    } else {
      backToTopButton.removeClass("show");
    }
  });

  // Smooth scroll to top when Back to Top button is clicked
  backToTopButton.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 100);
  });

  // Handle click events on changelog dropdown items
  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const changelogId = $(this).data("changelog-id");
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId);
    if (selectedChangelog) {
      displayChangelog(selectedChangelog);
    }
  });

  // Create a timeline entry for a changelog
  function createTimelineEntry(changelog, index) {
    if (!changelog || !changelog.title) return ""; // Skip empty entries
    const sideClass = index % 2 === 0 ? "left" : "right";

    let sectionsHtml = "";
    if (changelog.sections && typeof changelog.sections === "string") {
      // Process the markdown content
      const processedMarkdown = changelog.sections
        .replace(/ - /g, "\n- ")
        .replace(/ - - /g, "\n- - ")
        .replace(/## /g, "\n## ")
        .replace(/### /g, "\n### ");

      // Convert processed markdown to HTML
      sectionsHtml = convertMarkdownToHtml(processedMarkdown);
    }

    const formattedTitle = formatTitle(changelog.title);

    return `
    <div class="timeline-entry-container ${sideClass}" style="display: none;">
      <div class="timeline-entry">
        <h3 class="entry-title mb-3 text-custom-header">${formattedTitle}</h3>
        <div class="accordion timeline-accordion" id="accordion-${index}">
          <div class="accordion-item">
            <h2 class="accordion-header" id="heading-${index}">
              <button class="accordion-button timeline-accordion-button view-details-btn collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                View Details
              </button>
            </h2>
            <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${index}" data-bs-parent="#accordion-${index}">
              <div class="accordion-body">
                <div>${sectionsHtml}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="timeline-line"></div>
    </div>
  `;
  }

  // Set up the text change for accordion buttons
  function setupAccordionButtonText() {
    // Select all footer and timeline accordion buttons
    $(".footer-accordion-button, .timeline-accordion-button").each(function () {
      const $button = $(this);
      const $collapse = $($button.data("bs-target"));

      // Function to update button text based on collapse state
      function updateButtonText() {
        $button.text(
          $collapse.hasClass("show") ? "Close Details" : "View Details"
        );
      }

      // Initial text setup
      updateButtonText();

      // Update text when collapse state changes
      $collapse.on("show.bs.collapse hide.bs.collapse", updateButtonText);
    });
  }
  // Fade in timeline entries gradually
  function fadeInEntries(start, end) {
    $timeline
      .find(".timeline-entry-container")
      .slice(start, end)
      .each((index, element) => {
        $(element)
          .delay(index * 100) // Stagger the fade-in effect
          .fadeIn(500); // Fade in over 500ms
      });
  }

  // Complete the loading process
  function finishLoading() {
    isLoading = false;
    toggleLoadingOverlay(false); // Hide the loading overlay
    setTimeout(() => $footer.removeClass("hide"), 300); // Show the footer after a short delay
  }

  /**
   * Loads all changelog entries, either from cache or from the API.
   * This function manages the loading state, shows/hides the loading overlay,
   * and delegates to either cached data processing or fresh data fetching.
   */
  function loadAllEntries() {
    if (isLoading) return; // Prevent multiple simultaneous loads
    isLoading = true;

    toggleLoadingOverlay(true); // Show loading overlay
    $footer.addClass("hide"); // Hide the footer during loading

    const cachedData = getCachedData();
    if (cachedData) {
      processData(cachedData, true); // Use cached data if available
      finishLoading();
      return;
    }

    $.getJSON(apiUrl)
      .done((data) => {
        setCachedData(data); // Cache the newly fetched data
        processData(data, false); // Process the fresh data
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.error("Error fetching changelogs:", errorThrown);
        $timeline.append(
          "<p>Error loading changelogs. Please try again later.</p>"
        );
      })
      .always(() => {
        finishLoading();
      });
  }

  // Process the changelog data and render it
  function processData(data, isCached) {
    if (Array.isArray(data) && data.length > 0) {
      const validData = data.filter((entry) => entry && entry.title);
      if (validData.length > 0) {
        const entriesHtml = validData.map(createTimelineEntry).join("");
        $timeline.html(entriesHtml);

        if (isCached) {
          // If data is from cache, show all entries immediately
          $timeline.find(".timeline-entry-container").show();
        } else {
          // If it's fresh data, use the fade-in effect
          fadeInEntries(0, validData.length);
        }

        setupAccordionButtonText();

        // Open the first accordion item by default
        $timeline
          .find(".accordion-button")
          .first()
          .removeClass("collapsed")
          .attr("aria-expanded", "true");
        $timeline.find(".accordion-collapse").first().addClass("show");
      } else {
        console.log("No valid entries found");
        $timeline.html("<p>No changelogs found.</p>");
      }
    } else {
      console.log("Invalid or empty data");
      $timeline.html("<p>No changelogs found.</p>");
    }
  }

  // Initialize the page by loading all entries
  loadAllEntries();

  // Handle footer visibility on scroll
  $(window).on("scroll", function () {
    const st = $(this).scrollTop();
    if (st > lastScrollTop) {
      $footer.addClass("hide"); // Hide footer when scrolling down
      clearTimeout(footerTimeout);
    } else {
      clearTimeout(footerTimeout);
      footerTimeout = setTimeout(() => {
        $footer.removeClass("hide"); // Show footer when scrolling up (with delay)
      }, 500);
    }
    lastScrollTop = st <= 0 ? 0 : st; // Update last scroll position
  });
  
});

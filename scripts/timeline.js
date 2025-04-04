$(document).ready(function () {
  // Get reference to the loading overlay element
  const loadingOverlay = document.getElementById("loading-overlay");

  // API endpoint for fetching changelogs
  const apiUrl = "https://api.jailbreakchangelogs.xyz/changelogs/list";

  // jQuery selectors for important elements
  const $timeline = $("#timeline");
  const $footer = $("footer");

  const backToTopButton = document.getElementById("back-to-top");
  // Show button when scrolling down 300px
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = "flex";
    } else {
      backToTopButton.style.display = "none";
    }
  });

  // Scroll to top when button is clicked
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // State variables
  let isLoading = false; // Tracks whether data is currently being loaded
  let lastScrollTop = 0; // Stores the last known scroll position
  let footerTimeout; // Used for delaying footer visibility on scroll

  // Check if the timeline element exists in the DOM
  if ($timeline.length === 0) {
    console.error("Timeline element not found");
    return;
  }

  // Toggle visibility of the loading overlay
  function toggleLoadingOverlay(show) {
    loadingOverlay.classList.toggle("show", show);
  }

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

  // Handle click events on changelog dropdown items
  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const changelogId = $(this).data("changelog-id");
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId);
    if (selectedChangelog) {
      displayChangelog(selectedChangelog);
    }
  });

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const spinner = img.previousElementSibling;

          // Show spinner immediately when intersecting
          spinner.style.display = "block";

          // Only proceed if we have a data-src and it's different from current src
          if (img.dataset.src && img.src !== img.dataset.src) {
            // Pre-load the image
            const tempImage = new Image();

            tempImage.onload = () => {
              img.src = img.dataset.src;
              img.style.opacity = "1";
              img.classList.add("loaded");
              spinner.style.display = "none";
            };

            tempImage.onerror = () => {
              img.src = img.dataset.defaultSrc;
              img.style.opacity = "1";
              img.classList.add("loaded");
              spinner.style.display = "none";
            };

            tempImage.src = img.dataset.src;
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.1,
    }
  );

  // Create a timeline entry for a changelog
  function createTimelineEntry(changelog, index) {
    if (!changelog || !changelog.title) return "";
    const sideClass = index % 2 === 0 ? "left" : "right";
    const formattedTitle = formatTitle(changelog.title);
    const defaultImage =
      "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat";
    const imageUrl = changelog.image_url || defaultImage;

    return `
      <div class="timeline-entry-container ${sideClass}" style="display: none;">
        <div class="timeline-entry">
          <h3 class="entry-title mb-3 text-custom-header">${formattedTitle}</h3>
          <a href="/changelogs/${changelog.id}" class="changelog-link">
            <div class="image-container">
              <div class="image-spinner"></div>
              <img 
                src=""
                data-src="${imageUrl}"
                data-default-src="${defaultImage}"
                class="changelog-image"
                alt=""
                width="1920"
                height="1080"
              >
            </div>
          </a>
        </div>
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

    $.getJSON(apiUrl)
      .done((data) => {
        processData(data); // Process the fresh data
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

  // Add this helper function to parse dates correctly
  function parseDateFromTitle(title) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const match = title
      .split("/")[0]
      .trim()
      .match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/);
    if (match) {
      const month = monthNames.indexOf(match[1]);
      const day = parseInt(match[2]);
      const year = parseInt(match[3]);
      return new Date(year, month, day);
    }
    return new Date(0); // fallback for invalid dates
  }

  // Process the changelog data and render it
  function processData(data) {
    if (Array.isArray(data) && data.length > 0) {
      const validData = data
        .filter((entry) => entry && entry.title)
        .sort((a, b) => {
          const dateA = parseDateFromTitle(a.title);
          const dateB = parseDateFromTitle(b.title);
          return dateB - dateA;
        });

      if (validData.length > 0) {
        const entriesHtml = validData.map(createTimelineEntry).join("");
        $timeline.html(entriesHtml);

        // Initialize lazy loading for images after HTML is added
        // Increased timeout to ensure DOM is ready
        setTimeout(() => {
          const images = document.querySelectorAll(".changelog-image");
          images.forEach((img) => {
            imageObserver.observe(img);
          });
        }, 300);

        fadeInEntries(0, validData.length);
      } else {
        $timeline.html("<p>No changelogs found.</p>");
      }
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

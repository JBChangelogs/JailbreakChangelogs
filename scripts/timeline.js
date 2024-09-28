$(document).ready(function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const $timeline = $("#timeline");
  const $footer = $("footer");
  let isLoading = false;
  let lastScrollTop = 0;
  let footerTimeout;

  if ($timeline.length === 0) {
    console.error("Timeline element not found");
    return;
  }

  function toggleLoadingOverlay(show) {
    loadingOverlay.classList.toggle("show", show);
  }

  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .split("\n")
      .map((line) => {
        line = line.trim();
        if (line.startsWith("# ")) {
          return `<h1 class="display-4 mb-4 text-custom-header border-bottom border-custom-header pb-2">${wrapMentions(
            line.substring(2)
          )}</h1>`;
        } else if (line.startsWith("## ")) {
          return `<h2 class="display-5 mt-5 mb-3 text-custom-subheader">${wrapMentions(
            line.substring(3)
          )}</h2>`;
        } else if (line.startsWith("- - ")) {
          return `<div class="d-flex mb-2 position-relative">
                    <i class="bi bi-arrow-return-right text-custom-icon position-absolute" style="left: 20px; font-size: 1.5rem;"></i>
                    <p class="lead mb-0 ms-4 ps-4">${wrapMentions(
                      line.substring(4)
                    )}</p>
                  </div>`;
        } else if (line.startsWith("- ")) {
          return `<div class="d-flex mb-2 position-relative">
                    <i class="bi bi-arrow-right text-custom-icon position-absolute" style="left: 0; font-size: 1.5rem;"></i>
                    <p class="lead mb-0 ms-4 ps-1">${wrapMentions(
                      line.substring(2)
                    )}</p>
                  </div>`;
        } else if (line.startsWith("(audio)")) {
          const audioUrl = line.substring(7).trim();
          const audioType = audioUrl.endsWith(".wav")
            ? "audio/wav"
            : "audio/mpeg";
          return `<audio class="w-100 mt-2 mb-2" controls><source src="${audioUrl}" type="${audioType}"></audio>`;
        } else if (line.startsWith("(image)")) {
          const imageUrl = line.substring(7).trim();
          return `<img src="${imageUrl}" alt="Image" class="img-fluid mt-2 mb-2 rounded" style="max-height: 500px;">`;
        } else if (line.startsWith("(video)")) {
          const videoUrl = line.substring(7).trim();
          return `<video class="w-100 mt-2 mb-2 rounded" style="max-height: 500px;" controls><source src="${videoUrl}" type="video/mp4"></video>`;
        } else {
          return `<p class="lead mb-2">${wrapMentions(line)}</p>`;
        }
      })
      .join("");
  };

  const wrapMentions = (text) => {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention fw-bold"><span class="at">@</span><span class="username">$1</span></span>'
    );
  };

  function formatTitle(title) {
    const parts = title.split("/");
    let mainTitle = parts[0].trim();
    let subtitle = parts[1] ? parts[1].trim() : "";

    const dateMatch = mainTitle.match(
      /^([A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)? \d{4})/
    );
    if (dateMatch) {
      const date = dateMatch[1];
      mainTitle = mainTitle.replace(
        date,
        `<span class="text-muted">${date}</span>`
      );
    }

    let formattedTitle = `<span class="fw-bold" style="font-size: 1.2em;">${mainTitle}</span>`;
    if (subtitle) {
      formattedTitle += `<br><span class="text-uppercase" style="font-size: 0.9em;">${subtitle}</span>`;
    }

    return formattedTitle;
  }

  // Back to Top button functionality
  const backToTopButton = $("#backToTop");

  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      backToTopButton.addClass("show");
    } else {
      backToTopButton.removeClass("show");
    }
  });

  backToTopButton.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 100);
  });

  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const changelogId = $(this).data("changelog-id");
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId);
    if (selectedChangelog) {
      displayChangelog(selectedChangelog);
    }
  });

  function createTimelineEntry(changelog, index) {
    if (!changelog || !changelog.title) return ""; // Skip empty entries
    const sideClass = index % 2 === 0 ? "left" : "right";

    let sectionsHtml = "";
    if (changelog.sections && typeof changelog.sections === "string") {
      const processedMarkdown = changelog.sections
        .replace(/ - /g, "\n- ")
        .replace(/ - - /g, "\n- - ")
        .replace(/## /g, "\n## ")
        .replace(/### /g, "\n### ")
        .replace(/\(audio\) /g, "\n(audio) ")
        .replace(/\(video\) /g, "\n(video) ")
        .replace(/\(image\) /g, "\n(image) ");

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
              ${
                changelog.image_url
                  ? `<img src="${changelog.image_url}" alt="${changelog.title}" class="img-fluid mb-3">`
                  : ""
              }
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

  function setupAccordionButtonText() {
    $(".footer-accordion-button, .timeline-accordion-button").each(function () {
      const $button = $(this);
      const $collapse = $($button.data("bs-target"));

      function updateButtonText() {
        $button.text(
          $collapse.hasClass("show") ? "Close Details" : "View Details"
        );
      }
      // ...
    });
  }
  function fadeInEntries(start, end) {
    $timeline
      .find(".timeline-entry-container")
      .slice(start, end)
      .each((index, element) => {
        $(element)
          .delay(index * 100)
          .fadeIn(500);
      });
  }

  function loadAllEntries() {
    if (isLoading) return;
    isLoading = true;

    toggleLoadingOverlay(true);
    $footer.addClass("hide");

    $.getJSON(apiUrl)
      .done((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const validData = data.filter((entry) => entry && entry.title);
          if (validData.length > 0) {
            const entriesHtml = validData.map(createTimelineEntry).join("");
            $timeline.html(entriesHtml);
            fadeInEntries(0, validData.length);
            setupAccordionButtonText();

            // Open the first accordion item
            $timeline
              .find(".accordion-button")
              .first()
              .removeClass("collapsed")
              .attr("aria-expanded", "true");
            $timeline.find(".accordion-collapse").first().addClass("show");
          } else {
            $timeline.append("<p>No changelogs found.</p>");
          }
        } else {
          $timeline.append("<p>No changelogs found.</p>");
        }
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.error("Error fetching changelogs:", errorThrown);
        $timeline.append(
          "<p>Error loading changelogs. Please try again later.</p>"
        );
      })
      .always(() => {
        isLoading = false;
        toggleLoadingOverlay(false);
        setTimeout(() => $footer.removeClass("hide"), 300);
      });
  }

  loadAllEntries();

  $(window).on("scroll", function () {
    const st = $(this).scrollTop();
    if (st > lastScrollTop) {
      $footer.addClass("hide");
      clearTimeout(footerTimeout);
    } else {
      clearTimeout(footerTimeout);
      footerTimeout = setTimeout(() => {
        $footer.removeClass("hide");
      }, 500);
    }
    lastScrollTop = st <= 0 ? 0 : st;
  });
});

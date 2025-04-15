document.addEventListener("DOMContentLoaded", function () {
  // DOM element references
  const seasonDetailsContainer = document.querySelector("#season-details");
  const carouselInner = document.querySelector("#carousel-inner");
  const seasonList = document.querySelector("#seasonList");
  const latestSeason = 25;

  // Function to show the loading overlay
  function showLoadingOverlay() {
    document.querySelector("#loading-overlay").classList.add("show");
  }

  function hideLoadingOverlay() {
    document.querySelector("#loading-overlay").classList.remove("show");
  }

  function getCountdownColor(days, isDoubleXP, isFutureSeason = false) {
    if (isFutureSeason) return "#4CAF50"; // Green color for future seasons
    if (isDoubleXP) return "#FFB636"; // Warmer orange for double XP period
    if (days <= 7) return "#FF6B6B"; // Softer red for urgent (7 days or less)
    if (days <= 14) return "#FFD93D"; // Brighter yellow for warning (14 days or less)
    return "#A8B3BC"; // Softer gray-blue for default
  }

  function updateBreadcrumb(season) {
    const seasonBreadcrumb = document.querySelector(".season-breadcrumb");
    if (seasonBreadcrumb) {
      seasonBreadcrumb.textContent = `Season ${season}`;
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function fetchAllSeasons() {
    return fetchWithTimeout("https://api.jailbreakchangelogs.xyz/seasons/list", {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    })
    .then((response) => {
      if (!response.ok) {
        // Let the server handle API errors by reloading the page
        window.location.reload();
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching seasons:", error);
      throw error;
    });
  }

  // Add fetchWithTimeout utility function
  function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, {
      ...options,
      signal: controller.signal,
    })
    .finally(() => clearTimeout(timeoutId));
  }

  function loadAllData() {
    showLoadingOverlay();
    return fetchAllSeasons()
      .then((seasons) => {
        populateSeasonDropdown(seasons);
        setInterval(() => updateCountdowns(seasons), 1000);
        return [seasons, seasons.find((s) => s.season === latestSeason)];
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        hideLoadingOverlay();
        // Remove custom error UI - let the server handle errors
        window.location.reload();
      });
  }

  function displayErrorState(title, message) {
    const container = document.getElementById("content");
    if (!container) return;

    container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <div class="d-flex align-items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64" class="me-3">
            <rect width="64" height="64" fill="none" />
            <path fill="#ffce31" d="M5.9 62c-3.3 0-4.8-2.4-3.3-5.3L29.3 4.2c1.5-2.9 3.9-2.9 5.4 0l26.7 52.5c1.5 2.9 0 5.3-3.3 5.3z" />
            <g fill="#231f20">
              <path d="m27.8 23.6l2.8 18.5c.3 1.8 2.6 1.8 2.9 0l2.7-18.5c.5-7.2-8.9-7.2-8.4 0" />
              <circle cx="32" cy="49.6" r="4.2" />
            </g>
          </svg>
          <h4 class="alert-heading mb-0">${title}</h4>
        </div>
        <p class="mb-3">${message}</p>
        <div class="d-flex align-items-center">
          <button class="btn btn-outline-danger me-3" onclick="window.location.reload()">
            Try Again
          </button>
          <a href="https://status.jailbreakchangelogs.xyz" target="_blank" class="text-danger">
            Check Service Status
          </a>
        </div>
      </div>
    `;

    // Also update the season list dropdown
    const seasonList = document.querySelector("#seasonList");
    if (seasonList) {
      seasonList.innerHTML = '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>';
    }
  }

  // Function to populate the season dropdown menu
  function populateSeasonDropdown(seasonData) {
    if (!Array.isArray(seasonData) || seasonData.length === 0) {
      console.error("Invalid or empty season data:", seasonData);
      seasonList.innerHTML =
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>';
      return;
    }

    seasonList.innerHTML = "";

    // Filter out seasons with no rewards and sort by season number descending
    const validSeasons = seasonData
      .filter((season) => season.rewards !== "No rewards found")
      .sort((a, b) => b.season - a.season);

    const seasonListHTML = validSeasons
      .map(
        (season) => `
      <li class="w-100">
        <a class="dropdown-item season-dropdown-item w-100" 
           href="/seasons/${season.season}" 
           data-season-id="${season.season}">
          <span class="badge me-2" style="background-color: #124E66; color: #D3D9D4">
            Season ${season.season}
          </span>
          ${season.title}
        </a>
      </li>
    `
      )
      .join("");

    seasonList.innerHTML = seasonListHTML;
  }

  function displaySeasonDetails(season, seasonData) {
    localStorage.setItem("selectedSeason", season);

    // Calculate duration and format dates
    const startDate = new Date(parseInt(seasonData.start_date) * 1000);
    const now = new Date();
    const isFutureSeason = startDate > now;

    // Format dates
    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    // Handle future season vs current/past season date display
    let datesHTML;
    if (isFutureSeason) {
      datesHTML = `
        <div class="season-dates mb-3">
          <p class="mb-1"><strong>Start Date:</strong> ${formatDate(
            startDate
          )}</p>
        </div>`;
    } else {
      const endDate = new Date(parseInt(seasonData.end_date) * 1000);
      const durationDays = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24)
      );
      datesHTML = `
        <div class="season-dates mb-3">
          <p class="mb-1"><strong>Start Date:</strong> ${formatDate(
            startDate
          )}</p>
          <p class="mb-1"><strong>End Date:</strong> ${formatDate(endDate)}</p>
          <p class="mb-1"><strong>Duration:</strong> ${durationDays} days</p>
        </div>`;
    }

    seasonDetailsContainer.innerHTML = `
      <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${
      seasonData.title
    }</h2>
      <div class="season-description-container">
          ${datesHTML}
          <div class="season-description-body text-center"> 
              ${
                seasonData.description
                  ? `<p class="season-description-text">${seasonData.description}</p>`
                  : `
                      <div class="no-description">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                            <rect width="24" height="24" fill="none" />
                            <path fill="currentColor" d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59 8-8-8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2z" />
                          </svg>
                          <p class="text-muted">No description available.</p>
                      </div>`
              }
          </div>
      </div>
    `;

    // Update comments header
    if (window.commentsManagerInstance) {
      window.commentsManagerInstance.updateCommentsHeader();
    }

    if (seasonData.rewards && seasonData.rewards.length > 0) {
      // Sort rewards by requirement
      const sortedRewards = [...seasonData.rewards].sort((a, b) => {
        // Helper function to extract level number from requirement
        const getLevelNumber = (req) => {
          const match = req.match(/Level (\d+)/);
          return match ? parseInt(match[1]) : Infinity;
        };

        // Helper function to extract percentage from requirement
        const getPercentage = (req) => {
          const match = req.match(/Top (\d+)%/);
          return match ? parseInt(match[1]) : -1;
        };

        const aLevel = getLevelNumber(a.requirement);
        const bLevel = getLevelNumber(b.requirement);

        const aPercent = getPercentage(a.requirement);
        const bPercent = getPercentage(b.requirement);

        // If both are percentage requirements
        if (aPercent !== -1 && bPercent !== -1) {
          return bPercent - aPercent; // Lower percentage comes first
        }
        // If only one is a percentage requirement, it goes last
        if (aPercent !== -1) return 1;
        if (bPercent !== -1) return -1;
        // Otherwise sort by level number
        return aLevel - bLevel;
      });

      const rewardsHTML = sortedRewards
        .map((reward, index) => {
          const isBonus = reward.bonus === "True";
          const isExclusive = reward.exclusive === "True";
          const bonusBadge = isBonus
            ? `<span class="badge rounded-pill fs-6 fs-md-5" style="background-color: #748D92; color: #212A31">Bonus</span>`
            : "";
          const requirementBadge = `<span class="badge rounded-pill fs-6 fs-md-5" style="background-color: #124E66; color: #D3D9D4">${reward.requirement}</span>`;

          const exclusiveStar = isExclusive
            ? `<span class="exclusive-star" data-bs-toggle="tooltip" data-bs-custom-class="exclusive" title="Season Pass Exclusive">★</span>`
            : "";

          return `
            <div class="reward-item ${isBonus ? "bonus-reward" : ""}" 
                 style="--animation-order: ${index}">
              <div class="reward-content">
                <h6 class="reward-title">${reward.item}${exclusiveStar}</h6>
                <div class="reward-badges">
                  ${bonusBadge}
                  ${requirementBadge}
                </div>
              </div>
            </div>`;
        })
        .join("");

      seasonDetailsContainer.insertAdjacentHTML(
        "beforeend",
        `
          <div class="rewards-container">
            <h3 class="rewards-title">Season Rewards</h3>
            <div class="rewards-list">${rewardsHTML}</div>
          </div>`
      );

      // Initialize tooltips after content is added
      const tooltips = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltips.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    } else {
      seasonDetailsContainer.insertAdjacentHTML(
        "beforeend",
        '<p class="text-warning">No rewards data available.</p>'
      );
    }

    // Hide loading overlay after everything is displayed
    hideLoadingOverlay();
  }

  // Helper function to format the description
  function formatDescription(description) {
    return `<p class="season-description-paragraph">${description}</p>`;
  }

  // Function to update the carousel with reward images
  function updateCarousel(rewards) {
    carouselInner.innerHTML = "";

    if (!rewards || rewards.length === 0) {
      carouselInner.innerHTML = `
        <div class="carousel-item active rounded">
          <div class="d-flex align-items-center justify-content-center" style="height: 300px; background-color: #1a2228;">
            <p class="text-light">Reward images not available</p>
          </div>
        </div>`;
      return;
    }

    const filteredRewards = rewards.filter((reward) => {
      const isLevelRequirement = reward.requirement.startsWith("Level");
      const isBonus = reward.bonus === "True";
      return !(isLevelRequirement && isBonus);
    });

    if (filteredRewards.length === 0) {
      carouselInner.innerHTML = `
        <div class="carousel-item active rounded">
          <div class="d-flex align-items-center justify-content-center" style="height: 300px; background-color: #f8f9fa;">
            <p class="text-muted">No eligible reward images to display</p>
          </div>
        </div>`;
      return;
    }

    carouselInner.innerHTML = filteredRewards
      .map(
        (reward, index) => `
      <div class="carousel-item ${index === 0 ? "active" : ""} rounded"> 
        <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${
          reward.item
        }">
      </div>
    `
      )
      .join("");
  }

  function loadSeasonDetails(season) {
    return fetchAllSeasons()
      .then((allSeasons) => {
        const seasonData = allSeasons.find(
          (s) => s.season === parseInt(season)
        );

        if (!seasonData || seasonData.rewards === "No rewards found") {
          // Redirect to latest season if trying to access unreleased season
          const newUrl = `${window.location.origin}/seasons/${latestSeason}`;
          window.history.replaceState({}, "", newUrl);
          return loadSeasonDetails(latestSeason);
        }

        if (seasonData) {
          displaySeasonDetails(season, seasonData);
          updateCarousel(seasonData.rewards);
          updateBreadcrumb(season);
          document.title = `Season ${season} - ${seasonData.title}`;
        } else {
          throw new Error("Season not found");
        }
        return false;
      })
      .catch((error) => {
        console.error("Error loading season details:", error);
        displayErrorMessage(
          "Unable to load season details. Please try again later."
        );
        return false;
      });
  }

  function displayErrorMessage(message) {
    seasonDetailsContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${message}</p>
      </div>
    `;
    updateCarousel([]); // Clear the carousel
    updateBreadcrumb("Error");
    document.title = "Error - Season Details";
  }

  // Add event listener for season selection
  document.addEventListener("click", function (e) {
    if (e.target.closest(".season-dropdown-item")) {
      e.preventDefault();
      const selectedSeason = e.target.closest(".season-dropdown-item").dataset
        .seasonId;

      const newUrl = `/seasons/${selectedSeason}`;
      window.history.pushState({}, "", newUrl);

      if (window.commentsManagerInstance) {
        window.commentsManagerInstance.clearComments();
        window.commentsManagerInstance.type = "season";
        window.commentsManagerInstance.itemId = selectedSeason;
        window.commentsManagerInstance.loadComments();
      } else {
        window.commentsManagerInstance = new CommentsManager(
          "season",
          selectedSeason
        );
        window.commentsManagerInstance.loadComments();
      }

      loadSeasonDetails(parseInt(selectedSeason));
    }
  });

  loadAllData()
    .then(([seasons, latestSeason]) => {
      populateSeasonDropdown(seasons);
      const pathSegments = window.location.pathname.split("/");
      let seasonNumber = pathSegments[pathSegments.length - 1];

      if (
        !seasonNumber ||
        isNaN(seasonNumber) ||
        !seasons.some((desc) => desc.season === parseInt(seasonNumber))
      ) {
        seasonNumber = latestSeason.season.toString();
        const newUrl = `${window.location.origin}/seasons/${seasonNumber}`;
        window.history.replaceState({}, "", newUrl);
      }

      if (!window.commentsManagerInstance) {
        window.commentsManagerInstance = new CommentsManager(
          "season",
          seasonNumber
        );
        window.commentsManagerInstance.loadComments();
      }

      return loadSeasonDetails(parseInt(seasonNumber));
    })

    .catch((error) => {
      console.error("Failed to fetch data:", error);
      seasonDetailsContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Unable to Load Season Data</h4>
          <p>We're having trouble fetching the season information. Please try refreshing the page or check back later.</p>
        </div>`;
      seasonList.innerHTML =
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>';
    });

  function formatDate(unixTimestamp) {
    // Convert UNIX timestamp to milliseconds by multiplying by 1000
    const date = new Date(unixTimestamp * 1000);

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

  function handleinvalidImage() {
    setTimeout(() => {
      const userId = this.id.replace("avatar-", "");
      const username = this.closest("li").querySelector("a").textContent;
      this.src = "assets/default-avatar.png";
    }, 0);
  }

  function formatTimeDifference(timeRemaining) {
    if (!timeRemaining) return null;
    return {
      days: Math.floor(timeRemaining / 86400),
      hours: Math.floor((timeRemaining % 86400) / 3600),
      minutes: Math.floor((timeRemaining % 3600) / 60),
      seconds: Math.floor(timeRemaining % 60),
    };
  }

  function updateCountdowns(seasons) {
    const currentTime = Math.floor(Date.now() / 1000);
    const currentSeason = seasons.find((s) => s.season === latestSeason);
    const nextSeason = seasons.find((s) => s.season === latestSeason + 1);

    // Current season countdown
    if (currentSeason) {
      const timeToStart = parseInt(currentSeason.start_date) - currentTime;
      const timeToEnd = parseInt(currentSeason.end_date) - currentTime;
      const isFutureSeason = timeToStart > 0;

      const columnClass = !nextSeason
        ? "col-12 col-md-6 mb-3 mx-auto"
        : "col-12 col-md-6 mb-3";

      document.querySelector(
        "#current-season-countdown"
      ).parentElement.className = columnClass;

      if (isFutureSeason) {
        // Handle countdown to season start
        const remaining = formatTimeDifference(timeToStart);
        updateCountdownDisplay(
          "current-season-countdown",
          remaining,
          `Season ${currentSeason.season} / ${currentSeason.title} starts in:`
        );
      } else if (timeToEnd <= 0) {
        // Handle ended season
        document.querySelector("#current-season-countdown").innerHTML = `
          <div class="season-countdown">
            <h3 class="countdown-title">Season ${currentSeason.season} / ${
          currentSeason.title
        } has ended</h3>
            <div class="countdown-timer justify-content-center">
              <div class="countdown-item">
                <span style="color: ${getCountdownColor(0)}">00</span>
                <span class="countdown-label">Days</span>
              </div>
              <div class="countdown-item">
                <span style="color: ${getCountdownColor(0)}">00</span>
                <span class="countdown-label">Hours</span>
              </div>
              <div class="countdown-item">
                <span style="color: ${getCountdownColor(0)}">00</span>
                <span class="countdown-label">Minutes</span>
              </div>
              <div class="countdown-item">
                <span style="color: ${getCountdownColor(0)}">00</span>
                <span class="countdown-label">Seconds</span>
              </div>
            </div>
          </div>
        `;
      } else {
        // Handle active season
        const remaining = formatTimeDifference(timeToEnd);
        const daysRemaining = Math.ceil(timeToEnd / (24 * 60 * 60));
        const title =
          daysRemaining <= 5
            ? `Season ${currentSeason.season} / ${currentSeason.title} Double XP ends in:`
            : `Season ${currentSeason.season} / ${currentSeason.title} ends in:`;

        updateCountdownDisplay(
          "current-season-countdown",
          remaining,
          title,
          daysRemaining <= 5
        );
      }
    }

    // Next season countdown
    const nextSeasonContainer = document.querySelector(
      "#next-season-countdown"
    ).parentElement;
    if (!nextSeason) {
      nextSeasonContainer.style.display = "none";
    } else {
      nextSeasonContainer.style.display = "block";
      if (!nextSeason.start_date && nextSeason.end_date) {
        const timeToEnd = parseInt(nextSeason.end_date) - currentTime;
        if (timeToEnd <= 0) {
          document.querySelector("#next-season-countdown").innerHTML = `
            <div class="season-countdown">
              <h3 class="countdown-title">Season ${nextSeason.season} / ${nextSeason.title} submissions have closed</h3>
              <div class="submission-notice" style="padding-top: 0;">
                <a href="https://www.reddit.com/r/JailbreakCreations/comments/1jptlh2/season_26_entries_jungle_adventure/?sort=new" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="btn btn-sm btn-outline-info">
                  <i class="fas fa-external-link-alt me-1"></i>View Season ${nextSeason.season} Submissions
                </a>
              </div>
            </div>`;
        } else {
          const remaining = formatTimeDifference(timeToEnd);
          updateCountdownDisplay(
            "next-season-countdown",
            remaining,
            `Season ${nextSeason.season} / ${nextSeason.title} submissions close in:`
          );
        }
      } else {
        // Also update this part to include the full text
        document.querySelector("#next-season-countdown").innerHTML = `
          <div class="season-countdown">
            <h3 class="countdown-title">Season ${nextSeason.season} / ${nextSeason.title} submissions have closed</h3>
            <div class="submission-notice" style="padding-top: 0;">
              <a href="https://www.reddit.com/r/JailbreakCreations/comments/1jptlh2/season_26_entries_jungle_adventure/?sort=new" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="btn btn-sm btn-outline-info">
                <i class="fas fa-external-link-alt me-1"></i>View Season ${nextSeason.season} Submissions
              </a>
            </div>
          </div>`;
      }
    }
  }

  function updateCountdownDisplay(
    elementId,
    timeRemaining,
    title,
    isDoubleXP = false
  ) {
    if (!timeRemaining) return;

    const isFutureSeason = title.includes("starts in:");
    const countdownColor = getCountdownColor(
      timeRemaining.days,
      isDoubleXP,
      isFutureSeason
    );
    const isNextSeasonCountdown = elementId === "next-season-countdown";
    const isSubmissionsOpen = title.includes("submissions close in:");

    // Create submission notice for next season only when submissions are open
    const submissionNotice =
      isNextSeasonCountdown && isSubmissionsOpen
        ? `
      <div class="submission-notice">
        <a href="https://www.reddit.com/r/JailbreakCreations/comments/1jptlh2/season_26_entries_jungle_adventure/?sort=new" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="btn btn-sm btn-outline-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Submit a Creation
        </a>
      </div>
    `
        : "";

    document.querySelector(`#${elementId}`).innerHTML = `
      <div class="season-countdown">
        <h3 class="countdown-title">${title}</h3>
        <div class="countdown-timer">
          <div class="countdown-item">
            <span style="color: ${countdownColor}">${timeRemaining.days
      .toString()
      .padStart(2, "0")}</span>
            <span class="countdown-label">Days</span>
          </div>
          <div class="countdown-item">
            <span style="color: ${countdownColor}">${timeRemaining.hours
      .toString()
      .padStart(2, "0")}</span>
            <span class="countdown-label">Hours</span>
          </div>
          <div class="countdown-item">
            <span style="color: ${countdownColor}">${timeRemaining.minutes
      .toString()
      .padStart(2, "0")}</span>
            <span class="countdown-label">Minutes</span>
          </div>
          <div class="countdown-item">
            <span style="color: ${countdownColor}">${timeRemaining.seconds
      .toString()
      .padStart(2, "0")}</span>
            <span class="countdown-label">Seconds</span>
          </div>
        </div>
        ${submissionNotice}
      </div>
    `;
  }
});

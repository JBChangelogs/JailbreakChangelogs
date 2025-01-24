$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown
  // let userdata = null;
  let latestSeason = null;

  // Function to show the loading overlay
  function showLoadingOverlay() {
    $("#loading-overlay").addClass("show");
  }

  function hideLoadingOverlay() {
    $("#loading-overlay").removeClass("show");
  }

  function getCountdownColor(days) {
    if (days <= 7) return "#FF4444"; // Red for 7 days or less
    if (days <= 14) return "#e4c61d"; // Yellow for 14 days or less
    return "#D3D9D4"; // Default color
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
    return fetch("https://api3.jailbreakchangelogs.xyz/seasons/list")
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.error("Error fetching seasons:", error);
        throw error;
      });
  }

  function loadAllData() {
    const latestSeasonPromise = fetch(
      "https://api3.jailbreakchangelogs.xyz/seasons/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    )
      .then((response) => response.json())
      .then((latestSeasonData) => {
        if (!latestSeasonData.start_date || !latestSeasonData.end_date) {
          console.error("Missing date information in latest season data");
        }

        if (window.countdownInterval) {
          clearInterval(window.countdownInterval);
        }

        window.countdownInterval = updateCountdown(
          latestSeasonData.start_date,
          latestSeasonData.end_date,
          latestSeasonData.season,
          latestSeasonData.title
        );
        return latestSeasonData;
      })
      .catch((error) => {
        console.error("Error fetching latest season:", error);
        return null;
      });

    return Promise.all([fetchAllSeasons(), latestSeasonPromise])
      .then(([seasons, latest]) => {
        latestSeason = latest;
        return [seasons, latest];
      })
      .catch((error) => {
        console.error("Error in Promise.all:", error);
        throw error;
      });
  }
  // Function to populate the season dropdown menu
  function populateSeasonDropdown(seasonData) {
    if (!Array.isArray(seasonData) || seasonData.length === 0) {
      console.error("Invalid or empty season data:", seasonData);
      $seasonList.html(
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>'
      );
      return;
    }

    $seasonList.empty();

    seasonData.forEach((season) => {
      const listItem = $(`
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
        `);
      $seasonList.append(listItem);
    });
  }

  function displaySeasonDetails(season, seasonData) {
    localStorage.setItem("selectedSeason", season);

    // Calculate duration and format dates
    const startDate = new Date(parseInt(seasonData.start_date) * 1000);
    const endDate = new Date(parseInt(seasonData.end_date) * 1000);
    const durationDays = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );

    // Format dates to "Jan 10, 2025" style
    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    // Get color based on remaining days
    const now = new Date();
    const remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const countdownColor = getCountdownColor(remainingDays);

    $seasonDetailsContainer.html(`
      <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
      <div class="season-description-container">
          <div class="season-dates mb-3">
             <p class="mb-1"><strong>Start Date:</strong> ${formatDate(
               startDate
             )}</p>
             <p class="mb-1"><strong>End Date:</strong> ${formatDate(
               endDate
             )}</p>
             <p class="mb-1"><strong>Duration:</strong> ${durationDays} days</p>
          </div>
          <div class="season-description-body text-center"> 
              ${
                seasonData.description
                  ? `<p class="season-description-text">${seasonData.description}</p>`
                  : `
                      <div class="no-description">
                          <i class="bi bi-info-circle text-muted mb-2" style="font-size: 2rem;"></i>
                          <p class="text-muted">No description available.</p>
                      </div>`
              }
          </div>
      </div>
    `);

    // Update comments header
    if (window.commentsManagerInstance) {
      window.commentsManagerInstance.updateCommentsHeader();
    }

    $seasonDetailsContainer.html(`
        <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
        <div class="season-description-container">
            <div class="season-dates mb-3">
               <p class="mb-1"><strong>Start Date:</strong> ${formatDate(
                 startDate
               )}</p>
               <p class="mb-1"><strong>End Date:</strong> ${formatDate(
                 endDate
               )}</p>
               <p class="mb-1"><strong>Duration:</strong> ${durationDays} days</p>
            </div>
            <div class="season-description-body text-center"> 
                ${
                  seasonData.description
                    ? `<p class="season-description-text">${seasonData.description}</p>`
                    : `
                        <div class="no-description">
                            <i class="bi bi-info-circle text-muted mb-2" style="font-size: 2rem;"></i>
                            <p class="text-muted">No description available.</p>
                        </div>`
                }
            </div>
        </div>
      `);

    // Update comments header
    if (window.commentsManagerInstance) {
      window.commentsManagerInstance.updateCommentsHeader();
    }

    if (seasonData.rewards && seasonData.rewards.length > 0) {
      const rewardsHTML = seasonData.rewards
        .map((reward, index) => {
          const isBonus = reward.bonus === "True";
          const bonusBadge = isBonus
            ? `<span class="badge rounded-pill fs-6 fs-md-5" style="background-color: #748D92; color: #212A31">Bonus</span>`
            : "";
          const requirementBadge = `<span class="badge rounded-pill fs-6 fs-md-5" style="background-color: #124E66; color: #D3D9D4">${reward.requirement}</span>`;

          return `
              <div class="reward-item ${
                isBonus ? "bonus-reward" : ""
              }" style="--animation-order: ${index}">
                <div class="reward-content">
                  <h6 class="reward-title">${reward.item}</h6>
                  <div class="reward-badges">
                    ${bonusBadge}
                    ${requirementBadge}
                  </div>
                </div>
              </div>`;
        })
        .join("");

      $seasonDetailsContainer.append(`
          <div class="rewards-container">
            <h3 class="rewards-title">Season Rewards</h3>
            <div class="rewards-list">${rewardsHTML}</div>
          </div>`);
    } else {
      $seasonDetailsContainer.append(
        '<p class="text-warning">No rewards data available.</p>'
      );
    }
  }

  // Helper function to format the description
  function formatDescription(description) {
    return `<p class="season-description-paragraph">${description}</p>`;
  }

  // Function to update the carousel with reward images
  function updateCarousel(rewards) {
    // Clear any existing carousel items
    $carouselInner.empty();

    if (!rewards || rewards.length === 0) {
      // No rewards data available, show a placeholder or message
      const placeholderItem = $(`
        <div class="carousel-item active rounded">
          <div class="d-flex align-items-center justify-content-center" style="height: 300px; background-color: #1a2228;">
            <p class="text-light">Reward images not available</p>
          </div>
        </div>
      `);

      $carouselInner.append(placeholderItem);
      return;
    }

    // Filter rewards based on the criteria
    const filteredRewards = rewards.filter((reward) => {
      const isLevelRequirement = reward.requirement.startsWith("Level");
      const isBonus = reward.bonus === "True";
      return !(isLevelRequirement && isBonus);
    });

    if (filteredRewards.length === 0) {
      // No rewards left after filtering, show a message
      const noRewardsItem = $(`
        <div class="carousel-item active rounded">
          <div class="d-flex align-items-center justify-content-center" style="height: 300px; background-color: #f8f9fa;">
            <p class="text-muted">No eligible reward images to display</p>
          </div>
        </div>
      `);
      $carouselInner.append(noRewardsItem);
      return;
    }

    // Iterate through each filtered reward
    filteredRewards.forEach((reward, index) => {
      const isActive = index === 0 ? "active" : "";
      const carouselItem = $(`
        <div class="carousel-item ${isActive} rounded"> 
          <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${reward.item}">
        </div>
      `);
      $carouselInner.append(carouselItem);
    });
  }

  function updateCountdown(startDate, endDate, seasonNumber, seasonTitle) {
    // Show loading overlay immediately when function starts
    showLoadingOverlay();

    const startTimestamp = parseInt(startDate);
    const endTimestamp = parseInt(endDate);
    const $countdownDays = $("#countdown-days");
    const $countdownHours = $("#countdown-hours");
    const $countdownMinutes = $("#countdown-minutes");
    const $countdownSeconds = $("#countdown-seconds");
    const $countdownMode = $("#countdown-mode");
    const $seasonNumber = $("#season-number");
    const $seasonTitle = $("#season-title");

    $seasonNumber.text(seasonNumber);
    $seasonTitle.text(seasonTitle);

    function calculateTimeRemaining(targetDate) {
      const now = Math.floor(Date.now() / 1000);
      const difference = targetDate - now;

      if (difference <= 0) return null;

      const days = Math.floor(difference / 86400);
      const hours = Math.floor((difference % 86400) / 3600);
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = Math.floor(difference % 60);

      return { days, hours, minutes, seconds };
    }

    let initialUpdateDone = false;

    function updateTimer() {
      const currentTime = Math.floor(Date.now() / 1000);
      let timeRemaining;

      // Before season starts
      if (currentTime < startTimestamp) {
        timeRemaining = calculateTimeRemaining(startTimestamp);
        $countdownMode.text("Starts in");
      }
      // During season
      else if (currentTime < endTimestamp) {
        timeRemaining = calculateTimeRemaining(endTimestamp);
        $countdownMode.text("Ends in");
      }
      // After season ended
      else {
        $countdownMode.text("Season Ended");
        $countdownDays.text("00");
        $countdownHours.text("00");
        $countdownMinutes.text("00");
        $countdownSeconds.text("00");

        // Hide loading overlay if this is the first update
        if (!initialUpdateDone) {
          hideLoadingOverlay();
          initialUpdateDone = true;
        }
        return;
      }

      if (timeRemaining) {
        const countdownColor = getCountdownColor(timeRemaining.days);

        // Apply the color to the countdown numbers
        $countdownDays.css("color", countdownColor);
        $countdownHours.css("color", countdownColor);
        $countdownMinutes.css("color", countdownColor);
        $countdownSeconds.css("color", countdownColor);

        // Update the countdown numbers
        $countdownDays.text(timeRemaining.days.toString().padStart(2, "0"));
        $countdownHours.text(timeRemaining.hours.toString().padStart(2, "0"));
        $countdownMinutes.text(
          timeRemaining.minutes.toString().padStart(2, "0")
        );
        $countdownSeconds.text(
          timeRemaining.seconds.toString().padStart(2, "0")
        );

        // Hide loading overlay after first successful update
        if (!initialUpdateDone) {
          hideLoadingOverlay();
          initialUpdateDone = true;
        }
      }
    }

    // Initial update
    updateTimer();

    // Update every second
    return setInterval(updateTimer, 1000);
  }

  function loadSeasonDetails(season) {
    return fetchAllSeasons()
      .then((allSeasons) => {
        const seasonData = allSeasons.find(
          (s) => s.season === parseInt(season)
        );
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
    $seasonDetailsContainer.html(`
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${message}</p>
      </div>
    `);
    updateCarousel([]); // Clear the carousel
    updateBreadcrumb("Error");
    document.title = "Error - Season Details";
  }

  // Add event listener for season selection
  $(document).on("click", ".season-dropdown-item", function (e) {
    e.preventDefault();
    const selectedSeason = $(this).data("season-id");

    // Update the URL with the selected season
    const newUrl = `/seasons/${selectedSeason}`;
    window.history.pushState({}, "", newUrl);

    // Properly update the CommentsManager with new season ID
    if (window.commentsManagerInstance) {
      window.commentsManagerInstance.clearComments();
      window.commentsManagerInstance.type = "season";
      window.commentsManagerInstance.itemId = selectedSeason;
      window.commentsManagerInstance.loadComments(); // Reload comments with new ID
    } else {
      // Create new instance if it doesn't exist
      window.commentsManagerInstance = new CommentsManager(
        "season",
        selectedSeason
      );
      window.commentsManagerInstance.loadComments();
    }

    loadSeasonDetails(parseInt(selectedSeason));
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
      $seasonDetailsContainer.html(`
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Unable to Load Season Data</h4>
          <p>We're having trouble fetching the season information. Please try refreshing the page or check back later.</p>
        </div>
      `);
      $seasonList.html(
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>'
      );
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
      this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
        username
      )}&bold=true&format=svg`;
    }, 0);
  }
});

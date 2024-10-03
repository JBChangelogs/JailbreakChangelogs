$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown
  const API_BASE_URL =
    "https://api.jailbreakchangelogs.xyz/seasons/get?season=";

  async function fetchSpecificSeason(seasonId) {
    try {
      const response = await fetch(`${API_BASE_URL}${seasonId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch season details:", error);
      return {
        title: `Season ${seasonId}`,
        description:
          "Season details are currently unavailable. Please try again later.",
      };
    }
  }
  function toggleLoadingOverlay(show) {
    if (show) {
      $loadingOverlay.show();
    } else {
      $loadingOverlay.hide();
    }
  }

  function cacheRewardImages(seasonNumber, rewards) {
    const cacheKey = `rewardImages_${seasonNumber}`;
    localStorage.setItem(cacheKey, JSON.stringify(rewards));
    localStorage.setItem(`${cacheKey}_time`, new Date().getTime());
    console.log(`Cached reward images for season ${seasonNumber}`);
  }

  function fetchSeasonRewards(seasonNumber) {
    const cacheKey = `rewardImages_${seasonNumber}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const currentTime = new Date().getTime();

    if (cachedData && cacheTime && currentTime - cacheTime < 3600000) {
      console.log(`Using cached rewards data for season ${seasonNumber}`);
      return Promise.resolve(JSON.parse(cachedData));
    }

    console.log(`Fetching fresh rewards data for season ${seasonNumber}`);
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `https://api.jailbreakchangelogs.xyz/rewards/get?season=${seasonNumber}`,
        method: "GET",
        dataType: "json",
        success: function (data) {
          console.log(`Received fresh rewards data for season ${seasonNumber}`);
          cacheRewardImages(seasonNumber, data);
          resolve(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.error(
            `Failed to fetch rewards for season ${seasonNumber}:`,
            errorThrown
          );
          reject(
            new Error(`Failed to fetch rewards for season ${seasonNumber}`)
          );
        },
      });
    });
  }

  // Function to fetch season descriptions from the API
  function fetchSeasonDescription() {
    return $.ajax({
      url: "https://api.jailbreakchangelogs.xyz/seasons/list",
      method: "GET",
      dataType: "json",
      timeout: 10000, // Add a timeout to prevent long waits
    })
      .then(function (response) {
        if (Array.isArray(response)) {
          return response;
        } else if (response && Array.isArray(response.seasons)) {
          return response.seasons;
        } else {
          throw new Error("Unexpected response format");
        }
      })
      .catch(function (error) {
        console.error("Failed to fetch season descriptions:", error);
        throw error; // Re-throw the error to be caught by the main error handler
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

    $seasonList.empty(); // Clear existing items

    seasonData.forEach((season) => {
      const listItem = $(`
        <li class="w-100">
          <a class="dropdown-item changelog-dropdown-item w-100" href="?season=${season.season}">
            <span class="badge bg-primary me-2">Season ${season.season}</span> 
            ${season.title}
          </a>
        </li>
      `);
      $seasonList.append(listItem);
    });
  }

  function displaySeasonDetails(season, seasonData, rewardsData) {
    localStorage.setItem("selectedSeason", season);

    // Check if seasonData is available
    if (!seasonData || !seasonData.title) {
      $seasonDetailsContainer.html(`
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">Season ${season} Details Unavailable</h4>
          <p>We couldn't retrieve the details for this season. The information might be temporarily unavailable.</p>
        </div>
      `);
      disableComments(
        "Comments are unavailable due to an error loading season data."
      );
      return;
    }

    // Populate the season details container
    $seasonDetailsContainer.html(`
      <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
      <div class="season-description-container">
        <div class="season-description-body">
          <p class="season-description-text">${
            seasonData.description || "No description available."
          }</p>
        </div>
      </div>
      <h3 class="prizes-title display-5 custom-prizes-title mb-4">Season Rewards</h3>
    `);

    // Check if rewardsData is available and not empty
    if (rewardsData && rewardsData.length > 0) {
      // Filter rewards for the current season
      const rewards = rewardsData.filter(
        (reward) => reward.season_number === parseInt(season)
      );

      if (rewards.length > 0) {
        // Generate HTML for season rewards
        const rewardsHTML = rewards
          .map((reward) => {
            const isBonus = reward.bonus === "True";
            const bonusBadge = isBonus
              ? `<span class="badge bg-warning text-dark rounded-pill fs-6 fs-md-5">Bonus</span>`
              : "";
            const requirementBadge = `<span class="badge bg-primary rounded-pill fs-6 fs-md-5">${reward.requirement}</span>`;

            return `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <h6 class="fw-bold fs-6 fs-md-5">${reward.item}</h6>
            <div class="d-flex align-items-center">
              ${bonusBadge}
              ${requirementBadge}
            </div>
          </li>`;
          })
          .join("");

        // Append the rewards list to the season details container
        $seasonDetailsContainer.append(
          `<ul class="list-group season-rewards">${rewardsHTML}</ul>`
        );

        // Enable comments
        reloadcomments();
      } else {
        // If no rewards for this season, display a message and disable comments
        $seasonDetailsContainer.append(
          '<p class="text-warning">No rewards data available for this season.</p>'
        );
        disableComments(
          "Comments are unavailable because no rewards data is available for this season."
        );
      }
    } else {
      // If no rewards data at all, display a message and disable comments
      $seasonDetailsContainer.append(
        '<p class="text-warning">No rewards data available.</p>'
      );
      disableComments(
        "Comments are unavailable because no rewards data is available."
      );
    }
  }

  // Helper function to disable comments
  function disableComments(message) {
    $("#comments-list").html(`<p class="text-muted">${message}</p>`);
    $("#comment-form").hide();
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

  // Smooth scroll to top when the Back to Top button is clicked
  backToTopButton.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 100);
  });

  async function loadSeasonDetails(season, seasonRewards) {
    try {
      const seasonCacheKey = `seasonDetails_${season}`;
      const rewardsCacheKey = `rewardImages_${season}`;
      const cachedSeasonData = localStorage.getItem(seasonCacheKey);
      const cachedRewardsData = localStorage.getItem(rewardsCacheKey);
      const seasonCacheTime = localStorage.getItem(`${seasonCacheKey}_time`);
      const rewardsCacheTime = localStorage.getItem(`${rewardsCacheKey}_time`);
      const currentTime = new Date().getTime();

      let seasonData;
      let rewardsData;
      let needsFreshData = false;

      // Check if we have cached data and it's less than 1 hour old
      if (
        cachedSeasonData &&
        seasonCacheTime &&
        currentTime - seasonCacheTime < 3600000
      ) {
        seasonData = JSON.parse(cachedSeasonData);
      } else {
        needsFreshData = true;

        seasonData = await fetchSpecificSeason(season);

        // Cache the new data
        localStorage.setItem(seasonCacheKey, JSON.stringify(seasonData));
        localStorage.setItem(`${seasonCacheKey}_time`, currentTime);
      }

      if (
        cachedRewardsData &&
        rewardsCacheTime &&
        currentTime - rewardsCacheTime < 3600000
      ) {
        rewardsData = JSON.parse(cachedRewardsData);
      } else {
        needsFreshData = true;

        rewardsData = seasonRewards;

        // Cache the new rewards data
        cacheRewardImages(season, rewardsData);
      }

      // Display season details
      displaySeasonDetails(season, seasonData, rewardsData);

      // Always update carousel, it will handle cases with no rewards
      updateCarousel(rewardsData);

      return needsFreshData;
    } catch (error) {
      console.error(`Failed to load season ${season} details:`, error);
      $seasonDetailsContainer.html(`
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">Season ${season} Details Partially Available</h4>
          <p>We couldn't retrieve all the details for this season. Some information might be temporarily unavailable.</p>
        </div>
      `);
      // Still try to display rewards and carousel if available
      if (seasonRewards && seasonRewards.length > 0) {
        displaySeasonDetails(
          season,
          { title: `Season ${season}`, description: "Description unavailable" },
          seasonRewards
        );
        updateCarousel(seasonRewards);
      }
      return true; // Indicate that there was an error, so we should hide the loading overlay
    }
  }
  // Add event listener for season selection
  $seasonList.on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const selectedSeason = $(this).attr("href").split("=")[1];

    // Update the URL with the selected season
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("season", selectedSeason);
    window.history.pushState({}, "", newUrl);

    // Only show loading overlay if we're fetching fresh data
    toggleLoadingOverlay(true);

    fetchSeasonRewards(selectedSeason)
      .then((seasonRewards) => {
        return loadSeasonDetails(parseInt(selectedSeason), seasonRewards);
      })
      .then((needsFreshData) => {
        if (!needsFreshData) {
          toggleLoadingOverlay(false);
        }
      })
      .catch((error) => {
        console.error(
          `Failed to fetch rewards for season ${selectedSeason}:`,
          error
        );
        return loadSeasonDetails(parseInt(selectedSeason), []);
      })
      .finally(() => {
        toggleLoadingOverlay(false);
        try {
          reloadcomments();
        } catch (error) {
          console.error("Failed to load comments:", error);
          $("#comments-list").html(
            '<p class="text-muted">Unable to load comments at this time.</p>'
          );
        }
      });
  });

  $.when(fetchSeasonDescription())
    .done((seasonDescriptions) => {
      // Populate the dropdown with season items
      populateSeasonDropdown(seasonDescriptions);

      // Get season number from URL
      const urlParams = new URLSearchParams(window.location.search);
      let seasonNumber = urlParams.get("season");

      // Find the latest season
      const latestSeason = Math.max(
        ...seasonDescriptions.map((desc) => desc.season)
      );

      if (
        !seasonNumber ||
        !seasonDescriptions.some(
          (desc) => desc.season === parseInt(seasonNumber)
        )
      ) {
        seasonNumber = latestSeason.toString();
      }

      // Fetch rewards for the specific season and then load details
      fetchSeasonRewards(seasonNumber)
        .then((seasonRewards) => {
          // Load details for the specified season
          return loadSeasonDetails(parseInt(seasonNumber), seasonRewards);
        })
        .catch((error) => {
          console.error(
            `Failed to fetch rewards for season ${seasonNumber}:`,
            error
          );
          // Still load season details with an empty rewards array
          return loadSeasonDetails(parseInt(seasonNumber), []);
        })
        .finally(() => {
          // Ensure the loading overlay is hidden
          toggleLoadingOverlay(false);

          // Attempt to load comments
          try {
            reloadcomments();
          } catch (error) {
            console.error("Failed to load comments:", error);
            $("#comments-list").html(
              '<p class="text-muted">Unable to load comments at this time.</p>'
            );
          }
        });
    })
    .fail((error) => {
      console.error("Failed to fetch season descriptions:", error);

      // Display an error message to the user
      $seasonDetailsContainer.html(`
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Unable to Load Season Data</h4>
        <p>We're having trouble fetching the season information. Please try refreshing the page or check back later.</p>
      </div>
    `);

      // Clear the season dropdown
      $seasonList.html(
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>'
      );

      // Hide the loading overlay
      $loadingOverlay.hide();

      // Disable comments section
      $("#comments-list").html(
        '<p class="text-muted">Comments are unavailable due to an error loading season data.</p>'
      );
      $("#comment-form").hide();
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
        "/seasons?season=" + localStorage.getItem("selectedSeason")
      ); // Store the redirect URL in local storage
      window.location.href = "/login"; // Redirect to login page
    });
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
        item_id: localStorage.getItem("selectedSeason"),
        item_type: "season",
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
        const defaultAvatarUrl = "/favicon.ico";
        avatarElement.src = avatarUrl.endsWith("null.png")
          ? defaultAvatarUrl
          : avatarUrl;
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
      "Comments For Season " + localStorage.getItem("selectedSeason");
    fetch(
      "https://api.jailbreakchangelogs.xyz/comments/get?type=season&id=" +
        localStorage.getItem("selectedSeason")
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
    console.log(comment.value);
    addComment(comment);
    comment.value = ""; // Clear the comment input field
  });
});

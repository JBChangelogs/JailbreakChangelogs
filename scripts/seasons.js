$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown


  // Function to fetch season descriptions from the API
  function fetchSeasonDescription() {
    return $.ajax({
      url: "https://api.jailbreakchangelogs.xyz/seasons/list",
      method: "GET",
      dataType: "json",
      error: function (jqXHR, textStatus, errorThrown) {
        console.error("Failed to fetch season descriptions:", errorThrown);
        return [];
      },
    });
  }

  // Function to fetch season rewards from the API
  function fetchSeasonRewards() {
    return $.ajax({
      url: "https://api.jailbreakchangelogs.xyz/rewards/list",
      method: "GET",
      dataType: "json",
      error: function (jqXHR, textStatus, errorThrown) {
        console.error("Failed to fetch season rewards:", errorThrown);
        return [];
      },
    });
  }

  // Function to populate the season dropdown menu
  function populateSeasonDropdown(seasonData) {
    seasonData.forEach((season) => {
      const listItem = $(`
        <li class="w-100">
          <a class="dropdown-item changelog-dropdown-item w-100" href="?id=${season.season}">
            <span class="badge bg-primary me-2">Season ${season.season}</span> 
            ${season.title}
          </a>
        </li>
      `);
      $seasonList.append(listItem);
    });
  }

  // Function to display season details and rewards
  function displaySeasonDetails(season, descriptionData, rewardsData) {
    // Find the season data from the description data
    const seasonData = descriptionData.find((desc) => desc.season === season);
    localStorage.setItem("selectedSeason", season);
    reloadcomments();
    // Filter rewards for the current season
    const rewards = rewardsData.filter(
      (reward) => reward.season_number === season
    );

    if (!seasonData) {
      console.warn(`No description found for season ${season}`);
      return;
    }

    // Populate the season details container
    $seasonDetailsContainer.html(`
  <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
  <div class="season-description-container">
    <div class="season-description-body">
      <p class="season-description-text">${seasonData.description}</p>
    </div>
  </div>
  <h3 class="prizes-title display-5 custom-prizes-title mb-4">Season Rewards</h3>
`);

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
  }
  // Helper function to format the description
  function formatDescription(description) {
    return `<p class="season-description-paragraph">${description}</p>`;
  }

  // Function to update the carousel with reward images
  function updateCarousel(rewards) {
    // Clear any existing carousel items
    $carouselInner.empty();

    // Filter rewards based on the new criteria
    const filteredRewards = rewards.filter((reward) => {
      // Check if the reward should be excluded
      const isLevelRequirement = reward.requirement.startsWith("Level");
      const isBonus = reward.bonus === "True";

      // Include the reward if it's not a level requirement or not a bonus
      return !(isLevelRequirement && isBonus);
    });

    // Iterate through each filtered reward
    filteredRewards.forEach((reward, index) => {
      // Determine if this is the first (active) carousel item
      const isActive = index === 0 ? "active" : "";

      // Create a new carousel item using a template literal
      const carouselItem = $(`
      <div class="carousel-item ${isActive} rounded"> 
          <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${reward.item}">
      </div>
      `);

      // Append the new carousel item to the carousel inner container
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

  // Function to load and display season details
  async function loadSeasonDetails(season, seasonDescriptions, seasonRewards) {
    try {
      // Check if the season exists in the API
      const seasonExists = seasonDescriptions.some(
        (desc) => desc.season === season
      );

      if (!seasonExists) {
        // If the season doesn't exist, redirect to the latest season
        const latestSeason = Math.max(
          ...seasonDescriptions.map((desc) => desc.season)
        );
        window.location.href = `${window.location.pathname}?id=${latestSeason}`;
        return;
      }

      // Display season details and update the carousel
      displaySeasonDetails(season, seasonDescriptions, seasonRewards);
      const rewardsForSeason = seasonRewards.filter(
        (reward) => reward.season_number === season
      );
      updateCarousel(rewardsForSeason);
      $loadingOverlay.hide();
    } catch (error) {
      console.error(`Failed to load season ${season} details:`, error);
    }
  }

  // Fetch both season descriptions and rewards
  $.when(fetchSeasonDescription(), fetchSeasonRewards())
    .done((seasonDescriptionsResponse, seasonRewardsResponse) => {
      const seasonDescriptions = seasonDescriptionsResponse[0]; // Unwrap response
      const seasonRewards = seasonRewardsResponse[0]; // Unwrap response

      // Populate the dropdown with season items
      populateSeasonDropdown(seasonDescriptions);

      // Get season number from URL (e.g., ?id=340)
      const urlParams = new URLSearchParams(window.location.search);
      const seasonNumber = urlParams.get("id");

      if (!seasonNumber) {
        // If no season is specified, redirect to the latest season
        const latestSeason = Math.max(
          ...seasonDescriptions.map((desc) => desc.season)
        );
        window.location.href = `${window.location.pathname}?id=${latestSeason}`;
      } else {
        // Load details for the specified season
        loadSeasonDetails(
          parseInt(seasonNumber),
          seasonDescriptions,
          seasonRewards
        );
      }
    })
    .fail(() => {
      console.error("Failed to fetch one or more resources.");
    })
    .always(() => {
      $loadingOverlay.hide(); // Hide loading overlay
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
        "/seasons.html?id=" + localStorage.getItem("selectedSeason")
      ); // Store the redirect URL in local storage
      window.location.href = "/login.html"; // Redirect to login page
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
    const defaultAvatarUrl = '/favicon.ico';

    avatarElement.src = avatarUrl.endsWith('null.png') ? defaultAvatarUrl : avatarUrl;
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

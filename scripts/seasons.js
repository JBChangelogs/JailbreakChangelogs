$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown
  let lastCommentTime = 0;
  const SLOWMODE_DELAY = 30000; // 30 seconds in milliseconds
  // Configure Toastr
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: true,
    positionClass: "toast-bottom-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };

  // Load lastCommentTime from localStorage
  lastCommentTime = parseInt(localStorage.getItem("lastCommentTime")) || 0;

  // Function to save lastCommentTime to localStorage
  function saveLastCommentTime() {
    localStorage.setItem("lastCommentTime", lastCommentTime.toString());
  }

  // Function to fetch season descriptions from the API
  function fetchSeasonDescription() {
    return $.ajax({
      url: "https://api.jailbreakchangelogs.xyz/get_seasons",
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
      url: "https://api.jailbreakchangelogs.xyz/list_rewards",
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
    } catch (error) {
      console.error(`Failed to load season ${season} details:`, error);
    }
  }

  // Show loading overlay
  $loadingOverlay.show();

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

  const userid = sessionStorage.getItem("userid");
  const CommentForm = document.getElementById("comment-form");
  const CommentHeader = document.getElementById("comment-header");
  const commentinput = document.getElementById("commenter-text");
  const commentbutton = document.getElementById("submit-comment");
  const profilepicture = document.getElementById("profile-picture");
  const avatarUrl = sessionStorage.getItem("avatar");
  const userdata = JSON.parse(sessionStorage.getItem("user"));
  const commentsList = document.getElementById("comments-list");
  if (userid) {
    console.log(avatarUrl);
    profilepicture.src = avatarUrl;
    commentinput.placeholder = "Comment as " + userdata.global_name;
    commentbutton.disabled = true;
    commentinput.disabled = true;
  } else {
    commentbutton.disabled = true;
    commentbutton.textContent = "Log in";
    commentbutton.addEventListener("click", function (event) {
      localStorage.setItem(
        "redirectAfterLogin",
        "/seasons.html?id=" + localStorage.getItem("selectedSeason")
      ); // Store the redirect URL in local storage
      window.location.href = "/login.html"; // Redirect to login page
    });
  }

  function addComment(comment) {
    const currentTime = Date.now();
    if (currentTime - lastCommentTime < SLOWMODE_DELAY) {
      const remainingTime = Math.ceil(
        (SLOWMODE_DELAY - (currentTime - lastCommentTime)) / 1000
      );
      toastr.warning(
        `Please wait ${remainingTime} seconds before posting another comment.`,
        "Slowmode Active"
      );
      return;
    }

    const listItem = document.createElement("li");
    listItem.classList.add("list-group-item", "d-flex", "align-items-start");

    const avatarElement = document.createElement("img");
    avatarElement.src = avatarUrl;
    avatarElement.classList.add("rounded-circle", "m-1");
    avatarElement.width = 32;
    avatarElement.height = 32;

    const commentContainer = document.createElement("div");
    commentContainer.classList.add("ms-2");

    const usernameElement = document.createElement("strong");
    usernameElement.textContent = userdata.global_name;

    const commentTextElement = document.createElement("p");
    commentTextElement.textContent = comment.value;
    commentTextElement.classList.add("mb-0");

    const date = Math.floor(Date.now() / 1000);
    const formattedDate = formatDate(date);
    const dateElement = document.createElement("small");
    dateElement.textContent = formattedDate;
    dateElement.classList.add("text-muted");

    commentContainer.appendChild(usernameElement);
    commentContainer.appendChild(commentTextElement);
    commentContainer.appendChild(dateElement);

    listItem.appendChild(avatarElement);
    listItem.appendChild(commentContainer);

    commentsList.prepend(listItem);

    fetch("https://api.jailbreakchangelogs.xyz/add_comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: userid,
        content: comment.value,
        item_id: localStorage.getItem("selectedSeason"),
        item_type: "season",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        lastCommentTime = currentTime;
        saveLastCommentTime();
        toastr.success(
          "Your comment has been posted successfully!",
          "Comment Posted"
        );
      })
      .catch((error) => {
        console.error("Error adding comment:", error);
        toastr.error("Failed to post your comment. Please try again.", "Error");
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

  function loadComments(comments) {
    commentsList.innerHTML = ""; // Clear existing comments
    comments.sort((a, b) => b.date - a.date);

    const userDataPromises = comments.map((comment) => {
      return fetch(
        "https://api.jailbreakchangelogs.xyz/get_user?id=" + comment.author
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
        avatarElement.src = avatarUrl;
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

        const divider = document.createElement("hr");

        commentContainer.appendChild(usernameElement);
        commentContainer.appendChild(commentTextElement);
        commentContainer.appendChild(dateElement);

        listItem.appendChild(avatarElement);
        listItem.appendChild(commentContainer);

        commentsList.appendChild(listItem);
      });
    });
  }

  function reloadcomments() {
    CommentHeader.textContent =
      "Comments For Season " + localStorage.getItem("selectedSeason");
    fetch(
      "https://api.jailbreakchangelogs.xyz/get_comments?type=season&id=" +
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
    if (comment.value.trim() === "") return;
    addComment(comment);
    comment.value = ""; // Clear the comment input field
  });
});

let searchTimeout;
document.addEventListener("DOMContentLoaded", () => {
  // console.log("DOM fully loaded and parsed");

  const contentElement = document.getElementById("content");
  const pageSelectElement = document.getElementById("pageSelect");
  // const pageInfoElement = document.getElementById("pageInfo");
  const imageElement = document.querySelector(".sidebar-image");
  const themeToggle = document.getElementById("theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "light";
  const searchForm = document.getElementById("search-form");
  const body = document.body;
  const itemsPerPage = 1;
  let currentPage = 1;
  let totalPages;
  let changelogItems = [];

  // console.log("Variables initialized");

  const logoImage = document.getElementById("logo");
  let hasLoggedPlayError = false;
  let hasLoggedPauseError = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        logoImage.src = logoImage.dataset.src;
        try {
          logoImage.play();
        } catch (error) {
          if (!hasLoggedPlayError) {
            console.log(
              "Note: logoImage.play is not available, but functionality should still work."
            );
            hasLoggedPlayError = true;
          }
        }
      } else {
        try {
          logoImage.pause();
        } catch (error) {
          if (!hasLoggedPauseError) {
            console.log(
              "Note: logoImage.pause is not available, but functionality should still work."
            );
            hasLoggedPauseError = true;
          }
        }
      }
    },
    { threshold: 1.0 }
  );

  observer.observe(logoImage);

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          imageObserver.unobserve(img);
        }
      });
    },
    { threshold: 0.1 }
  );

  // console.log("Observers set up");

  window.updateSidebarImage = (pageNumber) => {
    // console.log("Updating sidebar image for page:", pageNumber);
    fetch("data/sidebar_images.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((imageData) => {
        const image = imageData.find((img) => img.order_index === pageNumber);
        const imageUrl = image
          ? image.url
          : "https://res.cloudinary.com/dt6ym6zrw/image/upload/v1722811458/16ff8b3a-92de-43d6-ae92-094ad17f74a5.png";
        // console.log("Selected image URL:", imageUrl);

        const imageElement = document.querySelector(".sidebar-image");
        if (imageElement) {
          imageElement.dataset.src = imageUrl;
          imageObserver.observe(imageElement);
        } else {
          console.error("Sidebar image element not found");
        }
      })
      .catch((error) => {
        console.error("Error updating sidebar image:", error);
      });
  };

  // Initialize with the first image
  updateSidebarImage(1);

  // console.log("Fetching changelog data...");
  fetch(
    "https://raw.githubusercontent.com/JBChangelogs/JailbreakChangelogs/main/changelogs/2-8-24.txt",
    {
      mode: "cors",
    }
  )
    .then((response) => response.text())
    .then((data) => {
      const lines = data.split("\n");
      let currentItem = "";
      let currentDate = "";

      lines.forEach((line) => {
        if (line.startsWith("# ")) {
          if (currentItem) {
            changelogItems.push({ content: currentItem, date: currentDate });
            currentItem = "";
          }
          currentDate = line.substring(2);
          currentItem = `<h1>${wrapMentions(line.substring(2))}</h1>`;
        } else if (line.startsWith("- - ")) {
          currentItem += `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> ${wrapMentions(
            line.substring(4)
          )}</p>`;
        } else if (line.startsWith("## ")) {
          currentItem += `<h2>${wrapMentions(line.substring(3))}</h2>`;
        } else if (line.startsWith("- ")) {
          currentItem += `<p><span class="bullet">•</span> ${wrapMentions(
            line.substring(2)
          )}</p>`;
        } else if (line.startsWith("- - - ")) {
          currentItem += `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> ${wrapMentions(
            line.substring(4)
          )}</p>`;
        } else {
          currentItem += `<p>${wrapMentions(line)}</p>`;
        }
      });

      if (currentItem) {
        changelogItems.push({ content: currentItem, date: currentDate });
      }

      changelogItems = changelogItems.reverse();
      totalPages = Math.ceil(changelogItems.length / itemsPerPage) || 1;

      // Load the saved page or default to 1
      currentPage = loadSavedPage();

      // console.log("Changelog processed, rendering...");
      renderChangelogs();
      renderPagination();
      adjustSelectWidth();
      updateSidebarImage(currentPage);
      // console.log("Initial render complete");
    })
    .catch((error) => {
      console.error("Error fetching the changelog:", error);
      contentElement.innerHTML =
        "<p>Error loading changelog. Please try again later.</p>";
    });

  function wrapMentions(text) {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention"><span class="at">@</span>$1</span>'
    );
  }

  function renderChangelogs() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = changelogItems.slice(startIndex, endIndex);

    let contentHtml = "";
    currentItems.forEach((item) => {
      contentHtml += item.content;
    });

    contentElement.innerHTML = contentHtml;
  }

  function renderPagination() {
    pageSelectElement.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const date = changelogItems[i - 1].date;
      const option = document.createElement("option");
      option.value = i;
      option.textContent = truncateText(`${i} - ${date}`, 30);
      option.title = `${i} - ${date}`;
      option.selected = i === currentPage;
      pageSelectElement.appendChild(option);
    }
    // pageInfoElement.textContent = `${currentPage} / ${totalPages}`;
  }

  function adjustSelectWidth() {
    const selectElement = document.getElementById("pageSelect");
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden";
    tempSpan.style.position = "absolute";
    tempSpan.style.whiteSpace = "nowrap";
    tempSpan.innerHTML = selectedOption.textContent; // Use truncated text
    document.body.appendChild(tempSpan);
    const optionWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    selectElement.style.width = `${optionWidth + 100}px`; // Increased padding to account for ellipsis
  }

  function performSearch(shouldScroll = false) {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm.length === 0) {
      clearSearch();
      return;
    }

    try {
      const filteredItems = changelogItems.filter(
        (item) =>
          item.content.toLowerCase().includes(searchTerm) ||
          item.date.toLowerCase().includes(searchTerm)
      );

      if (filteredItems.length > 0) {
        renderSearchResults(filteredItems);
      } else {
        searchResultsContainer.innerHTML =
          "<div class='search-results-content'><p>No results found.</p></div>";
      }
      searchResultsContainer.style.display = "flex";

      if (shouldScroll) {
        scrollToSearchResults();
      }
    } catch (error) {
      console.error("Error in performSearch:", error);
      searchResultsContainer.innerHTML =
        "<div class='search-results-content'><p>An error occurred while searching. Please try again.</p></div>";
      searchResultsContainer.style.display = "block";

      if (shouldScroll) {
        scrollToSearchResults();
      }
    }
  }

  function clearSearch() {
    searchInput.value = "";
    searchResultsContainer.style.display = "none";
  }

  function scrollToSearchResults() {
    if (window.innerWidth <= 768) {
      // Adjust this value based on your mobile breakpoint
      setTimeout(() => {
        const searchResultsContainer = document.getElementById("searchResults");
        if (
          searchResultsContainer &&
          searchResultsContainer.style.display !== "none"
        ) {
          searchResultsContainer.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300); // 300ms delay, adjust as needed
    }
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  let currentFocusIndex = -1;

  function handleArrowKeys(e) {
    const results = document.querySelectorAll(".search-result-item");
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentFocusIndex = (currentFocusIndex + 1) % results.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentFocusIndex =
        (currentFocusIndex - 1 + results.length) % results.length;
    } else if (e.key === "Enter" && currentFocusIndex !== -1) {
      e.preventDefault();
      selectSearchResult(results[currentFocusIndex]);
      return;
    } else {
      return;
    }

    updateFocus(results);
  }

  function updateFocus(results) {
    results.forEach((result, index) => {
      if (index === currentFocusIndex) {
        result.classList.add("focused");
        result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        result.classList.remove("focused");
      }
    });
  }

  function selectSearchResult(result) {
    const pageNumber = parseInt(result.dataset.page);
    if (pageNumber > 0) {
      goToPage(pageNumber);
      clearSearch();
      scrollToSearchResults();
    }
  }

  document.addEventListener("keydown", handleArrowKeys);

  // Add click event listeners to search results
  document
    .getElementById("searchResults")
    .addEventListener("click", function (e) {
      const clickedResult = e.target.closest(".search-result-item");
      if (clickedResult) {
        selectSearchResult(clickedResult);
      }
    });

  function saveCurrentPage(page) {
    localStorage.setItem("currentChangelogPage", page);
  }

  function loadSavedPage() {
    return parseInt(localStorage.getItem("currentChangelogPage")) || 1;
  }

  function renderSearchResults(results) {
    // console.log("Rendering search results:", results);
    let resultsHtml = "<div class='search-results-content'>";
    results.forEach((item) => {
      resultsHtml += `
        <div class="search-result-item" data-page="${
          changelogItems.indexOf(item) + 1
        }">
          <strong>${item.date}</strong>
          <p>${truncateText(item.content.replace(/<[^>]*>/g, ""), 100)}</p>

        </div>
      `;
    });
    resultsHtml += "</div>";
    searchResultsContainer.innerHTML = resultsHtml;
    searchResultsContainer.style.display = "block";

    // Add click event listeners to search result items
    const resultItems = searchResultsContainer.querySelectorAll(
      ".search-result-item"
    );
    resultItems.forEach((item) => {
      item.addEventListener("click", function () {
        const pageNumber = parseInt(this.dataset.page);
        goToPage(pageNumber);
        clearSearch();
      });
    });
  }

  window.goToPage = (pageNumber) => {
    currentPage = Number(pageNumber);
    renderChangelogs();
    renderPagination();
    adjustSelectWidth();
    updateSidebarImage(currentPage);
    clearSearch();
    saveCurrentPage(currentPage);
  };

  body.classList.toggle("dark-theme", currentTheme === "dark");

  // Function to update theme
  function updateTheme(theme) {
    body.classList.toggle("dark-theme", theme === "dark");
    localStorage.setItem("theme", theme);
    updateThemeIcon();
  }

  // Function to update theme icon
  function updateThemeIcon() {
    const isDark = body.classList.contains("dark-theme");
    const sunIcon = themeToggle.querySelector(".light-icon");
    const moonIcon = themeToggle.querySelector(".dark-icon");

    if (isDark) {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    } else {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    }
  }

  // Set initial theme
  updateTheme(currentTheme);

  // Theme toggle event listener
  themeToggle.addEventListener("click", () => {
    const newTheme = body.classList.contains("dark-theme") ? "light" : "dark";
    updateTheme(newTheme);
  });

  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const clearSearchButton = document.getElementById("clearSearch");
  const searchResultsContainer = document.getElementById("searchResults");

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (searchInput.value.length > 0) {
        performSearch(false); // Pass false to indicate not to scroll
      } else {
        clearSearch();
      }
    }, 150);
  });

  searchButton.addEventListener("click", performSearch);
  clearSearchButton.addEventListener("click", clearSearch);

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    performSearch(true); // Pass true to indicate scrolling
    searchInput.blur();
  });

  searchButton.addEventListener("click", function (e) {
    e.preventDefault();
    performSearch(true); // Pass true to indicate scrolling
    searchInput.blur();
  });

  searchInput.addEventListener("search", function (e) {
    performSearch(true);
    searchInput.blur(); // Dismiss keyboard
  });

  pageSelectElement.addEventListener("change", (e) => {
    goToPage(e.target.value);
  });
  // console.log("Script execution completed");
});

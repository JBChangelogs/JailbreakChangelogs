document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const contentElement = document.getElementById("content");
  const paginationElement = document.getElementById("pagination");
  const imageElement = document.querySelector(".sidebar-image");
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "light";
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const clearSearchButton = document.getElementById("clear-search");
  const searchResultsContainer = document.getElementById("search-results");

  const itemsPerPage = 1;
  let currentPage = 1;
  let totalPages;
  let changelogItems = [];

  console.log("Variables initialized");

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

  console.log("Observers set up");

  fetch("data/image_urls.json")
    .then((response) => response.json())
    .then((imageUrls) => {
      window.updateSidebarImage = (pageNumber) => {
        const imageUrl =
          imageUrls[pageNumber - 1] ||
          "https://res.cloudinary.com/dt6ym6zrw/image/upload/v1722811458/16ff8b3a-92de-43d6-ae92-094ad17f74a5.png";
        imageElement.dataset.src = imageUrl;
        imageObserver.observe(imageElement);
      };

      updateSidebarImage(1);
    })
    .catch((error) => {
      console.error(
        "Error fetching the image URLs for the sidebar image:",
        error
      );
    });

  console.log("Fetching changelog data...");
  fetch(
    "https://raw.githubusercontent.com/JBChangelogs/JailbreakChangelogs/main/changelogs/2-8-24.txt",
    {
      mode: "cors",
    }
  )
    .then((response) => response.text())
    .then((data) => {
      console.log("Changelog data received, processing...");
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
          currentItem = `<h1>${line.substring(2)}</h1>`;
        } else if (line.startsWith("- - ")) {
          currentItem += `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> ${line.substring(
            4
          )}</p>`;
        } else if (line.startsWith("## ")) {
          currentItem += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith("- ")) {
          currentItem += `<p><span class="bullet">•</span> ${line.substring(
            2
          )}</p>`;
        } else if (line.startsWith("- - - ")) {
          currentItem += `<p><span class="bullet">•</span> <span class="sub-bullet">•</span>  ${line.substring(
            4
          )}</p>`;
        } else {
          currentItem += `<p>${line}</p>`;
        }
      });

      if (currentItem) {
        changelogItems.push({ content: currentItem, date: currentDate });
      }

      changelogItems = changelogItems.reverse();
      totalPages = Math.ceil(changelogItems.length / itemsPerPage) || 1;

      console.log("Changelog processed, rendering...");
      renderChangelogs();
      renderPagination();
      adjustSelectWidth();
      console.log("Initial render complete");
    })
    .catch((error) => {
      console.error("Error fetching the changelog:", error);
      contentElement.innerHTML =
        "<p>Error loading changelog. Please try again later.</p>";
    });

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
    let paginationHtml = "";

    paginationHtml += `<select id="pageSelect" class="pagination-select" onchange="goToPage(this.value)">`;
    for (let i = 1; i <= totalPages; i++) {
      const date = changelogItems[i - 1].date;
      paginationHtml += `<option value="${i}" ${
        i === currentPage ? "selected" : ""
      }>${i} - ${date}</option>`;
    }
    paginationHtml += `</select>`;

    paginationElement.innerHTML = paginationHtml;
  }

  function adjustSelectWidth() {
    const selectElement = document.getElementById("pageSelect");
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden";
    tempSpan.style.position = "absolute";
    tempSpan.style.whiteSpace = "nowrap";
    tempSpan.innerHTML = selectedOption.text;
    document.body.appendChild(tempSpan);
    const optionWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    selectElement.style.width = `${optionWidth + 20}px`;
  }

  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredItems = changelogItems.filter(
      (item) =>
        item.content.toLowerCase().includes(searchTerm) ||
        item.date.toLowerCase().includes(searchTerm)
    );

    if (filteredItems.length > 0) {
      renderSearchResults(filteredItems);
    } else {
      searchResultsContainer.innerHTML = "<p>No results found.</p>";
    }
    searchResultsContainer.style.display = "block";
  }

  function renderSearchResults(results) {
    let resultsHtml = "";
    results.forEach((item, index) => {
      resultsHtml += `
        <div class="search-result-item" data-page="${
          changelogItems.indexOf(item) + 1
        }">
          <strong>${item.date}</strong>
          <p>${item.content.substring(0, 100)}...</p>
        </div>
      `;
    });
    searchResultsContainer.innerHTML = resultsHtml;

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

  function clearSearch() {
    searchInput.value = "";
    searchResultsContainer.style.display = "none";
  }

  window.goToPage = (pageNumber) => {
    currentPage = Number(pageNumber);
    renderChangelogs();
    renderPagination();
    adjustSelectWidth();
    updateSidebarImage(currentPage);
  };
  body.classList.toggle("dark-theme", currentTheme === "dark");

  // Function to update theme icon
  function updateThemeIcon() {
    const isDark = body.classList.contains("dark-theme");
    const iconName = isDark ? "sun" : "moon";
    themeToggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
    lucide.createIcons();
  }

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      performSearch();
    } else if (searchInput.value.length > 2) {
      performSearch(); // Perform search as user types (after 3 characters)
    } else if (searchInput.value.length === 0) {
      clearSearch();
    }
  });

  // Initial icon update
  updateThemeIcon();
  clearSearchButton.addEventListener("click", clearSearch);

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-theme");
    const newTheme = body.classList.contains("dark-theme") ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    updateThemeIcon();
  });

  console.log("Script execution completed");
});

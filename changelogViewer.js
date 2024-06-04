document.addEventListener("DOMContentLoaded", () => {
  const contentElement = document.getElementById("content");
  const paginationElement = document.getElementById("pagination");

  const itemsPerPage = 1;
  let currentPage = 1;
  let totalPages;
  let changelogItems = [];

  fetch(
    "https://raw.githubusercontent.com/JBChangelogs/JailbreakChangelogs/main/changelogs/20-4-24.txt",
    { mode: "cors" }
  )
    .then((response) => response.text())
    .then((data) => {
      const lines = data.split("\n");

      let currentItem = "";
      let inCommunityNote = false;

      lines.forEach((line) => {
        if (line.startsWith("## Community Note")) {
          inCommunityNote = true;
          currentItem += `<div class="community-note">`;
        } else if (inCommunityNote && line.trim() === "") {
          inCommunityNote = false;
          currentItem += "</div>";
        } else if (inCommunityNote) {
          currentItem += `<p>${line}</p>`;
        } else if (line.startsWith("# ")) {
          if (currentItem) {
            changelogItems.push(currentItem);
            currentItem = "";
          }
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
        } else if (line.startsWith("> > ")) {
          currentItem += `<h3 class="centered-line">${line.substring(4)}</h3>`;
        } else {
          currentItem += `<p>${line}</p>`;
        }
      });

      if (currentItem) {
        changelogItems.push(currentItem);
      }

      changelogItems.reverse();
      totalPages = Math.ceil(changelogItems.length / itemsPerPage);
      renderChangelogs();
      renderPagination();
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
      contentHtml += item;
    });

    contentElement.innerHTML = contentHtml;
  }

  function renderPagination() {
    let paginationHtml = "";

    if (currentPage > 1) {
      paginationHtml += `<button onclick="goToPage(${
        currentPage - 1
      })">Previous</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<button onclick="goToPage(${i})" ${
        i === currentPage ? 'class="active"' : ""
      }>${i}</button>`;
    }

    if (currentPage < totalPages) {
      paginationHtml += `<button onclick="goToPage(${
        currentPage + 1
      })">Next</button>`;
      paginationHtml += `<button onclick="goToPage(${totalPages})">>></button>`;
    }

    paginationElement.innerHTML = paginationHtml;
  }

  window.goToPage = (pageNumber) => {
    currentPage = pageNumber;
    renderChangelogs();
    renderPagination();
  };
});

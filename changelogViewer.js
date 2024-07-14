document.addEventListener("DOMContentLoaded", () => {
  const contentElement = document.getElementById("content");
  const paginationElement = document.getElementById("pagination");

  const itemsPerPage = 1;
  let currentPage = 1;
  let totalPages;
  let changelogItems = [];

  fetch(
    "https://raw.githubusercontent.com/JBChangelogs/JailbreakChangelogs/main/changelogs/23-6-24.txt",
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
      renderChangelogs();
      renderPagination();
      adjustSelectWidth();
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

  window.goToPage = (pageNumber) => {
    currentPage = Number(pageNumber);
    renderChangelogs();
    renderPagination();
    adjustSelectWidth();
  };
});

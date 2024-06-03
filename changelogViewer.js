document.addEventListener("DOMContentLoaded", () => {
  const contentElement = document.getElementById("content");

  const sortSelectElement = document.getElementById("sort-select");

  fetch(
    "https://raw.githubusercontent.com/JBChangelogs/JailbreakChangelogs/main/changelogs/20-4-24.txt"
  )
    .then((response) => response.text())

    .then((data) => {
      const lines = data.split("\n");

      let contentHtml = "";
      lines.forEach((line) => {
        if (line.startsWith("### LATEST CHANGELOG")) {
          const text = line.replace(/^### /, "");
          contentHtml += `<h1 style="color: red; animation: blink 1.5s infinite;"><span style="color: red; font-size: 1.2em;">&#9679;</span> ${text}</h1><br>`;
        } else if (line.startsWith("# ")) {
          contentHtml += `<h1>${line.substring(2)}</h1>`;
        } else if (line.startsWith("## ")) {
          contentHtml += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith("- ")) {
          contentHtml += `<li>${line.substring(2)}</li>`;
        } else if (line.startsWith("- - ")) {
          contentHtml += `<ul><li>${line.substring(4)}</li></ul>`;
        } else if (line.startsWith("- - - ")) {
          contentHtml += `<ul><ul><li>${line.substring(6)}</li></ul></ul>`;
        } else if (line.startsWith("> > ")) {
          contentHtml += `<h3 class="centered-line">${line.substring(4)}</h3>`;
        }
      });

      contentElement.innerHTML = `<ul>${contentHtml}</ul>`;

      // Add event listener to the sort select element

      sortSelectElement.addEventListener("change", () => {
        const sortOrder = sortSelectElement.value;

        const listItems = contentElement.querySelectorAll("li");

        // Sort the list items based on the selected order

        if (sortOrder === "ascending") {
          listItems.forEach((item, index) => {
            item.style.order = index;
          });
        } else if (sortOrder === "descending") {
          listItems.forEach((item, index) => {
            item.style.order = listItems.length - index - 1;
          });
        }
      });
    })

    .catch((error) => console.error("Error fetching the changelog:", error));
});

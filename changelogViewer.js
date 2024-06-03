document.addEventListener("DOMContentLoaded", () => {
  const contentElement = document.getElementById("content");

  fetch(
    "https://raw.githubusercontent.com/JBChangelogs/JailbreakChangelogs/main/changelogs/20-4-24.txt",
    { mode: "cors" }
  )
    .then((response) => response.text())
    .then((data) => {
      const lines = data.split("\n");
      let contentHtml = "";

      lines.forEach((line) => {
        if (line.startsWith("### LATEST CHANGELOG")) {
          const text = line.replace(/^### /, "");
          contentHtml += `<h1 style="color: red; animation: blink 1.5s infinite;"><span style="color: red; font-size: 1.2em;">&#9679;</span> ${text}</h1>`;
        } else if (line.startsWith("# ")) {
          contentHtml += `<h1>${line.substring(2)}</h1>`;
        } else if (line.startsWith("## ")) {
          contentHtml += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith("- ")) {
          contentHtml += `<p><span class="bullet">•</span> ${line.substring(
            2
          )}</p>`;
        } else if (line.startsWith("- - ")) {
          contentHtml += `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> ${line.substring(
            4
          )}</p>`;
        } else if (line.startsWith("- - - ")) {
          contentHtml += `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> <span class="sub-sub-bullet">•</span> ${line.substring(
            6
          )}</p>`;
        } else if (line.startsWith("> > ")) {
          contentHtml += `<h3 class="centered-line">${line.substring(4)}</h3>`;
        } else {
          contentHtml += `<p>${line}</p>`;
        }
      });

      contentElement.innerHTML = contentHtml;
    })
    .catch((error) => {
      console.error("Error fetching the changelog:", error);
      contentElement.innerHTML =
        "<p>Error loading changelog. Please try again later.</p>";
    });
});

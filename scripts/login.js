function checkAndStoreReportIssue() {
  const urlParams = new URLSearchParams(window.location.search);
  const referrerParams = new URLSearchParams(
    document.referrer.split("?")[1] || ""
  );

  if (urlParams.has("report-issue") || referrerParams.has("report-issue")) {
    localStorage.setItem("reportIssueRedirect", "true");
  }
}

$(document).ready(function () {
  checkAndStoreReportIssue();

  const ageCheck = $("#ageCheck");
  const tosCheck = $("#tosCheck");
  const loginButton = $("#login-button");

  // Keep button disabled
  loginButton.prop("disabled", true);

  ageCheck.change(function () {
    // Do nothing - login disabled
  });

  tosCheck.change(function () {
    // Do nothing - login disabled
  });

  const DiscordLoginButton = document.getElementById("login-button");
  DiscordLoginButton.addEventListener("click", () => {
    // Do nothing - login disabled
  });

  // Show maintenance message if someone tries to access with code
  if (window.location.search.includes("code=")) {
    notyf.error("Sign-ups are currently disabled for maintenance.");
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }
});

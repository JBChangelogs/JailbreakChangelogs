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

  // Store redirect URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get("redirect");
  if (redirectUrl) {
    localStorage.setItem("loginRedirect", redirectUrl);
  }

  const ageCheck = $("#ageCheck");
  const tosCheck = $("#tosCheck");
  const loginButton = $("#login-button");

  function updateLoginButton() {
    loginButton.prop(
      "disabled",
      !(ageCheck.prop("checked") && tosCheck.prop("checked"))
    );
  }

  ageCheck.change(updateLoginButton);
  tosCheck.change(updateLoginButton);

  const currentDomain = window.location.hostname;
  let OauthRedirect;

  if (currentDomain === "jailbreakchangelogs.xyz") {
    OauthRedirect =
      "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Fjailbreakchangelogs.xyz%2Flogin&scope=identify&prompt=none";
  } else if (currentDomain === "testing.jailbreakchangelogs.xyz") {
    OauthRedirect =
      "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Ftesting.jailbreakchangelogs.xyz%2Flogin&scope=identify";
  } else {
    OauthRedirect =
      "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Ftesting.jailbreakchangelogs.xyz%2Flogin&scope=identify";
  }

  const DiscordLoginButton = document.getElementById("login-button");
  // Only store the path if it's not /login and not a Discord OAuth URL
  const currentPath = window.location.pathname + window.location.search;
  if (
    currentPath !== "/login" &&
    !currentPath.includes("/login") &&
    !window.location.href.includes("discord.com")
  ) {
    if (window.location.search.includes("report-issue")) {
      localStorage.setItem("reportIssueRedirect", "true");
    }
    localStorage.setItem("loginRedirect", currentPath);
  }

  DiscordLoginButton.addEventListener("click", () => {
    console.log("Redirecting to Discord OAuth...");
    window.location.href = OauthRedirect;
  });

  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    fetch("https://api3.jailbreakchangelogs.xyz/auth?code=" + code, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => {
        if (response.status === 403) {
          throw new Error("banned");
        }
        if (!response.ok) {
          throw new Error("network");
        }
        return response.json();
      })
      .then((userData) => {
        if (userData && userData.id && userData.avatar) {
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          window.setCookie("token", userData.token, 7);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("avatar", avatarURL);
          localStorage.setItem("userid", userData.id);

          // Check for report-issue first
          if (localStorage.getItem("reportIssueRedirect")) {
            localStorage.removeItem("reportIssueRedirect");
            window.location.href = "/?report-issue&freshlogin=true";
            return;
          }

          // Then check for regular redirect
          const storedRedirect = localStorage.getItem("loginRedirect");
          if (storedRedirect) {
            window.location.href = `${storedRedirect}${
              storedRedirect.includes("?") ? "&" : "?"
            }freshlogin=true`;
            localStorage.removeItem("loginRedirect");
            return;
          }

          // Default to home with welcome message
          window.location.href = "/?freshlogin=true";
          return;
        }
      })
      .catch((error) => {
        if (error.message === "banned") {
          notyf.error(
            "Your account has been banned from Jailbreak Changelogs."
          );
          setTimeout(() => {
            window.location.href = "/";
          }, 3500);
        } else {
          console.error("Login error:", error);
          window.location.href = "/";
        }
      });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const ageCheck = document.getElementById("ageCheck");
  const tosCheck = document.getElementById("tosCheck");
  const loginButton = document.getElementById("login-button");

  // Initialize tooltip
  const tooltip = new bootstrap.Tooltip(loginButton, {
    title: "Please agree to the terms and confirm your age",
    trigger: "hover",
    placement: "top",
  });

  function updateLoginButton() {
    const isValid = ageCheck.checked && tosCheck.checked;
    loginButton.disabled = !isValid;

    // Show/hide tooltip based on button state
    if (isValid) {
      tooltip.disable();
    } else {
      tooltip.enable();
    }
  }

  ageCheck.addEventListener("change", updateLoginButton);
  tosCheck.addEventListener("change", updateLoginButton);

  // ...rest of existing login code...
});

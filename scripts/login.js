function checkAndStoreReportIssue() {
  const urlParams = new URLSearchParams(window.location.search);
  const referrerParams = new URLSearchParams(
    document.referrer.split("?")[1] || ""
  );

  if (urlParams.has("report-issue") || referrerParams.has("report-issue")) {
    localStorage.setItem("reportIssueRedirect", "true");
  }
}

function isValidRedirectUrl(url) {
  try {
    // Only allow relative paths or URLs to our domains
    if (url.startsWith('/')) {
      return true;
    }

    const allowedDomains = [
      'jailbreakchangelogs.xyz',
      'testing.jailbreakchangelogs.xyz'
    ];
    
    const urlObj = new URL(url, window.location.origin);
    return allowedDomains.includes(urlObj.hostname) && urlObj.pathname.startsWith('/');
  } catch {
    return false;
  }
}

$(document).ready(function () {
  checkAndStoreReportIssue();

  // Store redirect URL if present and valid
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get("redirect");
  if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
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

  // Add OAuth flow logging
  const LoginLogger = {
    debug: true,
    log(step, details) {
      if (this.debug) {
        console.log(`[Login:${step}]`, details);
      }
    },
  };

  // Store original path before OAuth redirect
  if (
    !window.location.pathname.startsWith("/login") &&
    !(new URL(window.location.href).host === "discord.com")
  ) {
    LoginLogger.log(
      "redirect",
      "Storing current path: " + window.location.pathname
    );
    localStorage.setItem(
      "loginRedirect",
      window.location.pathname + window.location.search
    );
  }

  // Handle Discord OAuth redirect
  DiscordLoginButton.addEventListener("click", () => {
    LoginLogger.log("oauth", "Initiating Discord OAuth...");
    window.location.href = OauthRedirect;
  });

  // Process OAuth callback
  if (window.location.search.includes("code=")) {
    (async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      LoginLogger.log("auth", "Processing OAuth code");

      try {
        const response = await fetch(
          "https://api3.jailbreakchangelogs.xyz/auth?code=" + code,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        // Handle response status
        if (response.status === 403) {
          LoginLogger.log("error", "User is banned");
          notyf.error(
            "Your account has been banned from Jailbreak Changelogs."
          );
          setTimeout(() => (window.location.href = "/"), 3500);
          return;
        }

        if (!response.ok) {
          throw new Error(`Auth failed: ${response.status}`);
        }

        const userData = await response.json();
        LoginLogger.log("success", "Auth successful, setting up session");

        if (!userData?.id || !userData?.token) {
          throw new Error("Invalid user data");
        }

        // Set up session
        window.setCookie("token", userData.token, 7);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userid", userData.id);

        if (userData.avatar) {
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          localStorage.setItem("avatar", avatarURL);
        }

        LoginLogger.log("redirect", "Handling post-login redirect");

        // Handle redirects in order of priority
        if (localStorage.getItem("reportIssueRedirect")) {
          LoginLogger.log("redirect", "Redirecting to report issue");
          localStorage.removeItem("reportIssueRedirect");
          window.location.href = "/?report-issue&freshlogin=true";
          return;
        }

        const storedRedirect = localStorage.getItem("loginRedirect");
        if (storedRedirect && isValidRedirectUrl(storedRedirect)) {
          const validatedRedirectUrl = new URL(storedRedirect, window.location.origin);
          LoginLogger.log(
            "redirect",
            `Redirecting to stored path: ${validatedRedirectUrl.pathname}`
          );
          window.location.href = `${validatedRedirectUrl.pathname}${
            validatedRedirectUrl.search ? "&" : "?"
          }freshlogin=true`;
          localStorage.removeItem("loginRedirect");
          return;
        }

        // Default redirect
        LoginLogger.log("redirect", "Redirecting to homepage");
        window.location.href = "/?freshlogin=true";
      } catch (error) {
        LoginLogger.log("error", `Auth error: ${error.message}`);
        notyf.error("An error occurred during login. Please try again.");
        setTimeout(() => (window.location.href = "/"), 3500);
      }
    })();
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
});

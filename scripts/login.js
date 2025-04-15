// Storage check logger
const StorageLogger = {
  debug: true,
  log(step, details) {
    if (this.debug) {
      console.log(`[Storage:${step}]`, details);
    }
  }
};

function checkAndStoreReportIssue() {
  const urlParams = new URLSearchParams(window.location.search);
  const referrerParams = new URLSearchParams(document.referrer.split("?")[1] || "");

  if (urlParams.has("report-issue") || referrerParams.has("report-issue")) {
    try {
      localStorage.setItem("reportIssueRedirect", "true");
    } catch (e) {
      StorageLogger.log("error", "Failed to store report issue redirect: " + e.message);
    }
  }
}

function isLocalStorageAvailable() {
  StorageLogger.log("check", "Testing localStorage availability...");
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    StorageLogger.log("check", "localStorage is available");
    return true;
  } catch (e) {
    StorageLogger.log("check", "localStorage is NOT available: " + e.message);
    return false;
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

$(document).ready(function() {
  StorageLogger.log("init", "Initializing login page...");
  
  const ageCheck = $("#ageCheck");
  const tosCheck = $("#tosCheck");
  const loginButton = $("#login-button");

  // Initialize tooltip
  const tooltip = new bootstrap.Tooltip(loginButton[0], {
    title: "Please agree to the terms and confirm your age",
    trigger: "hover",
    placement: "top",
  });

  // Immediately check localStorage and disable login if not available
  if (!isLocalStorageAvailable()) {
    StorageLogger.log("init", "Disabling login functionality");
    loginButton.prop("disabled", true)
              .attr("title", "Login is not available in private browsing mode");
    tooltip.dispose(); // Remove existing tooltip
    new bootstrap.Tooltip(loginButton[0], {
      title: "Login is not available in private browsing mode",
      trigger: "hover",
      placement: "top"
    });
    notyf.warning("This website requires cookies to log you in. Please disable private browsing or incognito mode to continue.");
    
    // Also disable checkboxes
    ageCheck.add(tosCheck).prop("disabled", true);
    return;
  }
  
  function updateLoginButton() {
    const shouldEnable = ageCheck.prop("checked") && tosCheck.prop("checked");
    StorageLogger.log("button", `Updating login button state: ${shouldEnable ? "enabled" : "disabled"}`);
    loginButton.prop("disabled", !shouldEnable);

    if (shouldEnable) {
      tooltip.disable();
    } else {
      tooltip.enable();
    }
  }

  // Bind change events
  ageCheck.add(tosCheck).on("change", updateLoginButton);

  // Rest of the login functionality
  StorageLogger.log("init", "Initializing normal login functionality");
  checkAndStoreReportIssue();

  // Store redirect URL if present and valid
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get("redirect");
  if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
    localStorage.setItem("loginRedirect", redirectUrl);
  }

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
      "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Fjailbreakchangelogs.xyz%2Flogin&scope=identify";
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
          "https://api.testing.jailbreakchangelogs.xyz/auth",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
              origin: "https://testing.jailbreakchangelogs.xyz"
            })
          }
        );

        // Handle error responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          LoginLogger.log("error", `Status: ${response.status}, Message: ${errorData.message || 'Unknown error'}`);

          switch (response.status) {
            case 403:
              notyf.error("You are banned from Jailbreak ChangeLogs.");
              break;
            case 404:
              notyf.error("Owner not found.");
              break;
            case 409:
              notyf.error("Account is linked to another Discord account.");
              break;
            case 422:
              notyf.error(errorData.message || "Missing required information.");
              break;
            case 500:
              if (errorData.message) {
                notyf.error(errorData.message);
              } else {
                notyf.error("An internal server error occurred.");
              }
              break;
            default:
              notyf.error("An unexpected error occurred during login.");
          }
          
          setTimeout(() => (window.location.href = "/"), 3500);
          return;
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

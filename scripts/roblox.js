document.addEventListener("DOMContentLoaded", function () {
  const ageCheck = document.getElementById("ageCheck");
  const tosCheck = document.getElementById("tosCheck");
  const loginButton = document.getElementById("button");

  // Initialize tooltip
  const tooltip = new bootstrap.Tooltip(loginButton, {
    title: "Please agree to the terms and confirm your age",
    trigger: "hover",
    placement: "top",
  });

  if (window.location.href.includes("/roblox")) {
    console.log("Detected roblox page access");
    const token = getCookie("token");
    console.log("Token status:", token ? "REDACTED" : "Not found");

    if (!token) {
      notyf.error(
        "You need to connect your Discord account first before linking your Roblox account."
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
      return;
    }
  }

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

  const redirect =
    "https://authorize.roblox.com/?client_id=8033575152059272055&redirect_uri=https://jailbreakchangelogs.xyz/roblox&scope=openid%20profile&response_type=code";
  const test_redirect =
    "https://authorize.roblox.com/?client_id=8033575152059272055&redirect_uri=https://testing.jailbreakchangelogs.xyz/roblox&scope=openid%20profile&response_type=code";

  loginButton.addEventListener("click", () => {
    console.log("Redirecting to Roblox OAuth...");
    window.location.href = redirect;
  });

  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    console.log("Code:", code);
    const token = getCookie("token");
    let url;
    if (token) {
      url = `https://api3.jailbreakchangelogs.xyz/auth/roblox?code=${code}&owner=${token}`;
    } else {
      window.location.href = "/";
    }
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("network");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        notyf.success("Your Roblox account has been successfully connected!");
        setTimeout(() => {
          window.location.href = "/";
        }, 4500);
      })
      .catch((error) => {
        notyf.error(
          "An error occurred while connecting your Roblox account. Please try again."
        );
        setTimeout(() => {
          window.location.href = "/";
        }, 4500);
      });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const ageCheck = document.getElementById("ageCheck");
  const tosCheck = document.getElementById("tosCheck");
  const loginButton = document.getElementById("button");
  if (window.location.href.includes("/roblox")) {
    console.log("Detected roblox page access");
    const token = Cookies.get("token");
    console.log("Token status:", token ? "REDACTED" : "Not found");

    if (!token) {
      console.log("No token - redirecting to login");
      // Show toast notification
      toastr.warning(
        "You need to connect your Discord account first before linking your Roblox account.",
        "Discord Connection Required",
        {
          positionClass: "toast-bottom-right",
          timeOut: 3000,
          closeButton: true,
          progressBar: true,
          onHidden: function () {
            // Redirect after toast is hidden
            window.location.href = "/login";
          },
        }
      );
      return;
    }
  }

  function updateLoginButton() {
    loginButton.disabled = !(ageCheck.checked && tosCheck.checked);
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
    const token = Cookies.get("token");
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
        // Show success message
        toastr.success(
          "Your Roblox account has been successfully connected!",
          "Success",
          {
            positionClass: "toast-bottom-right",
            timeOut: 3000,
            closeButton: true,
            progressBar: true,
            onHidden: function () {
              // Redirect to home page after showing success message
              window.location.href = "/";
            },
          }
        );
      })
      .catch((error) => {
        // Show error message
        toastr.error(
          "An error occurred while connecting your Roblox account. Please try again.",
          "Error",
          {
            positionClass: "toast-bottom-right",
            timeOut: 3000,
            closeButton: true,
            progressBar: true,
            onHidden: function () {
              // Redirect to home page after showing error
              window.location.href = "/";
            },
          }
        );
      });
  }
});

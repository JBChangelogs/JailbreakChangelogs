document.addEventListener("DOMContentLoaded", function () {
  toastr.options = {
    positionClass: "toast-top-right",
    closeButton: true,
    progressBar: true,
    preventDuplicates: true,
    timeOut: 3000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
    // Prevent layout shifts
    newestOnTop: false,
    maxOpened: 1,
    // Fixed positioning
    containerId: "toast-container",
    // Add some margin from the top
    toastClass: "toast",
    target: "body",
    containerId: "toast-container",
    // Prevent toast from expanding viewport
    maxWidth: "100%",
    width: "auto",
    // Ensure toast container stays within viewport
    tapToDismiss: true,
    onShown: function () {
      // Force the toast container to stay within viewport
      const container = document.getElementById(toastr.options.containerId);
      if (container) {
        container.style.maxWidth = "100vw";
        container.style.width = "auto";
        container.style.right = "0";
        container.style.bottom = "0";
        container.style.position = "fixed";
      }
    },
  };
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
            onHidden: function () {
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

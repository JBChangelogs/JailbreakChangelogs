document.addEventListener("DOMContentLoaded", function () {
  const redeemButton = document.getElementById("redeem-button");
  const codeInput = document.getElementById("code-input");

  // Check for code parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');

  if (codeParam) {
    // Auto-fill the code input
    codeInput.value = codeParam;
  }

  redeemButton.addEventListener("click", async function () {
    const code = codeInput.value.trim();

    if (!code) {
      notyf.error("Please enter a code");
      return;
    }

    // Get token from cookies
    const token = getCookie("token");

    if (!token) {
      notyf.error("You must be logged in to redeem codes");
      return;
    }

    // Disable button and show loading state
    redeemButton.disabled = true;
    redeemButton.classList.add("loading");
    redeemButton.textContent = "Redeeming...";

    try {
      const response = await fetch(
        "https://api.jailbreakchangelogs.xyz/codes/redeem",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner: token,
            code: code,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        notyf.success("Code redeemed successfully!");
        if (!codeParam) {
          codeInput.value = ""; // Only clear input if it wasn't from URL parameter
        }
      } else if (response.status === 404) {
        notyf.error("Invalid Code");
      } else {
        notyf.error(response.status === 409 ? "The code has already been redeemed" : (data.message || "An error occurred redeeming the code"));
      }
    } catch (error) {
      notyf.error("An error occurred while redeeming the code");
    } finally {
      // Reset button state
      redeemButton.disabled = false;
      redeemButton.classList.remove("loading");
      redeemButton.textContent = "Redeem";
    }
  });

  // Allow enter key to submit
  codeInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      redeemButton.click();
    }
  });
});

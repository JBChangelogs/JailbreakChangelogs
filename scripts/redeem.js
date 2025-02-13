document.addEventListener("DOMContentLoaded", function () {
  const redeemButton = document.getElementById("redeem-button");
  const codeInput = document.getElementById("code-input");

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
        "https://api3.jailbreakchangelogs.xyz/codes/redeem",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            code: code,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        notyf.success("Code redeemed successfully!");
        codeInput.value = ""; // Clear input
      } else {
        notyf.error(data.message || "Failed to redeem code");
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

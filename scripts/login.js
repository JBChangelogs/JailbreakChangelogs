$(document).ready(function () {
  function setCookie(name, value, days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Set expiration time
    let expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/"; // Set cookie with expiration and path
  }

  // Function to get a cookie value
  const OauthRedirect =
    "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Fjailbreakchangelogs.xyz%2Flogin&scope=identify";
  const DiscordLoginButton = document.getElementById("login-button");
  DiscordLoginButton.addEventListener("click", () => {
    console.log("Redirecting to Discord OAuth...");
    window.location.href = OauthRedirect;
  });
  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    fetch("https://api.jailbreakchangelogs.xyz/auth?code=" + code, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
      .then((userData) => {
        const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        setCookie("token", userData.token, 7);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("avatar");
        sessionStorage.removeItem("userid");
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("avatar", avatarURL);
        sessionStorage.setItem("userid", userData.id);
        redirect = localStorage.getItem("redirectAfterLogin");
        if (redirect === null) {
          window.location.href = "/";
        } else {
          window.location.href = redirect;
          localStorage.removeItem("redirectAfterLogin");
        }
      });
  }
});

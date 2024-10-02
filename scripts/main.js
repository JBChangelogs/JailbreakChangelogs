
document.addEventListener("DOMContentLoaded", () => {
  // Inject the Speed Insights code on every page load
    const path = window.location.pathname;
    
    if (path.endsWith(".html")) {
      const cleanUrl = path.replace(".html", "");
      window.history.pushState({}, "", cleanUrl);
    }
    const avatarUrl = sessionStorage.getItem("avatar");

    function getCookie(name) {
      let cookieArr = document.cookie.split(";");
      for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if (name === cookiePair[0].trim()) {
          return decodeURIComponent(cookiePair[1]);
        }
      }
      return null;
    }

    const token = getCookie("token");
    const userid = sessionStorage.getItem("userid");

    if (token && !userid) {
      fetch("https://api.jailbreakchangelogs.xyz/users/get/token?token=" + token)
       .then((response) => {
          if (!response.ok) {
            console.error("Unexpected response status:", response.status);
            return null;
          }
          return response.json();
        })
       .then((userData) => {
          if (!userData) return;
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          sessionStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.setItem("avatar", avatarURL);
          sessionStorage.setItem("userid", userData.id);      
          window.location.reload()
        })
       .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    } 
    const profilepicture = document.getElementById("profile-picture");
    const mobileprofilepicture = document.getElementById(
      "profile-picture-mobile"
    );

    if (!profilepicture && !mobileprofilepicture) {
      return;
    }
    
    if (userid) {
      profilepicture.src = avatarUrl;
      mobileprofilepicture.src = avatarUrl;
    }


  });
  

document.addEventListener("DOMContentLoaded", () => {

// Function to determine if we should fetch new version data
function shouldFetchVersionData() {
  // Get the timestamp of the last fetch from local storage
  const lastFetch = localStorage.getItem('lastVersionFetch');
  // Get the current timestamp
  const currentTime = new Date().getTime();
  
  // If we've never fetched or it's been more than 1 hour since last fetch
  if (!lastFetch || (currentTime - parseInt(lastFetch)) > 60 * 60 * 1000) {
    // We should fetch new data
    return true;
  }

  // We should use cached data
  return false;
}

// Function to update the version information on the page
function updateVersionInfo() {
  // Retrieve cached version data from local storage
  const cachedData = localStorage.getItem('versionData');
  // Retrieve the timestamp of the last fetch
  const lastFetch = localStorage.getItem('lastVersionFetch');

  // If we have cached data and shouldn't fetch new data
  if (cachedData && !shouldFetchVersionData()) {
    // Parse the cached data
    const data = JSON.parse(cachedData);
    // Update the DOM with cached data
    document.getElementById("last-updated").textContent = data.date;
    document.getElementById("version-number").textContent = data.version;
  } else {
    // We need to fetch new data
    fetch("https://api.jailbreakchangelogs.xyz/version/website")
      .then((response) => response.json())
      .then((data) => {
        // Update the DOM with new data
        document.getElementById("last-updated").textContent = data.date;
        document.getElementById("version-number").textContent = data.version;
      
        // Cache the new data
        localStorage.setItem('versionData', JSON.stringify(data));
        // Update the last fetch timestamp
        localStorage.setItem('lastVersionFetch', new Date().getTime().toString());
      })
      .catch((error) => {
        // Log any errors that occur during the fetch
        console.error('Error fetching version data:', error);
      });
  }
}

  updateVersionInfo();

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
        window.location.reload();
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

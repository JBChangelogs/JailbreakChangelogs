const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5500; // Set the port
const fs = require("fs");
const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 25;

app.use((req, res, next) => {
  res.locals.req = req;
  next();
});

// Serve your static HTML, CSS, and JS files
const DATA_SOURCE_URL =
  "https://badimo.nyc3.digitaloceanspaces.com/trade/frequency/snapshot/month/latest.json";

app.use(express.static(path.join(__dirname, "../")));
app.use(
  cors({
    origin: "https://jailbreakchangelogs.xyz",
  })
);

// Serve the changelogs.html file
app.get("/trade-data", async (req, res) => {
  try {
    // Fetch data from the external API
    const response = await fetch(DATA_SOURCE_URL, {
      timeout: 5000, // Set a 5-second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Send the fetched data as JSON response
    res.json(data);
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching data:", error.message);

    // Send an appropriate error response
    if (error.name === "AbortError") {
      res.status(504).json({ error: "Request timeout" });
    } else if (error.message.includes("HTTP error!")) {
      res.status(502).json({ error: "External API error" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the directory for your EJS files

app.get("/changelogs", async (req, res) => {
  try {
    // Fetch the latest changelog ID from the new endpoint
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/changelogs/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch latest changelog");
    }

    const data = await response.json();
    res.redirect(`/changelogs/${data.id}`);
  } catch (error) {
    console.error("Error fetching latest changelog:", error);
    res.status(500).send("Error loading changelog");
  }
});

app.get("/owner/check/:user", (req, res) => {
  const user = req.params.user; // Get the user ID from the URL parameter
  const owners = ["1019539798383398946", "659865209741246514"];
  const isOwner = owners.includes(user);
  if (!isOwner) {
    res.status(403).json({ error: "Unauthorized" });
  }
  res.status(200).json({ isOwner });
});

app.get("/changelogs/:changelog", async (req, res) => {
  let changelogId = req.params.changelog;
  console.log(`Fetching changelog with ID: ${changelogId}`);

  try {
    // First try to fetch the requested changelog
    const apiUrl = `https://api.jailbreakchangelogs.xyz/changelogs/get?id=${changelogId}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    // If not found, fetch the latest changelog
    if (response.status === 404) {
      const latestResponse = await fetch(
        "https://api.jailbreakchangelogs.xyz/changelogs/latest",
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      if (!latestResponse.ok) {
        throw new Error("Failed to fetch latest changelog");
      }

      const latestData = await latestResponse.json();
      // Redirect to the latest changelog
      return res.redirect(`/changelogs/${latestData.id}`);
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const { title, image_url } = data;

    res.render("changelogs", {
      title,
      image_url,
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Changelogs_Logo.webp",
      logoAlt: "Changelogs Page Logo",
      changelogId,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching changelog data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons", async (req, res) => {
  try {
    // Fetch the latest season ID from the new endpoint
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/seasons/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch latest season");
    }

    const data = await response.json();
    res.redirect(`/seasons/${data.season}`);
  } catch (error) {
    console.error("Error fetching latest season:", error);
    res.status(500).send("Error loading season");
  }
});

app.get("/seasons/:season", async (req, res) => {
  let seasonId = req.params.season;
  const apiUrl = `https://api.jailbreakchangelogs.xyz/seasons/get?season=${seasonId}`;
  const rewardsUrl = `https://api.jailbreakchangelogs.xyz/rewards/get?season=${seasonId}`;

  try {
    // If invalid season ID, fetch the latest season
    const seasonResponse = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (!seasonResponse.ok) {
      const latestResponse = await fetch(
        "https://api.jailbreakchangelogs.xyz/seasons/latest",
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      if (!latestResponse.ok) {
        throw new Error("Failed to fetch latest season");
      }

      const latestData = await latestResponse.json();
      return res.redirect(`/seasons/${latestData.season}`);
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });
    if (!response.ok) {
      return res.render("seasons", {
        season: "???",
        title: "Season not found",
        image_url:
          "https://cdn.jailbreakchangelogs.xyz/images/changelogs/348.webp",
        logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Seasons_Logo.webp",
        logoAlt: "Jailbreak Seasons Logo",
        seasonId,
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }
    const rewardsResponse = await fetch(rewardsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });
    if (!rewardsResponse.ok) {
      return res.render("seasons", {
        season: "???",
        title: "Season not found",
        image_url:
          "https://cdn.jailbreakchangelogs.xyz/images/changelogs/348.webp",
        logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Seasons_Logo.webp",
        logoAlt: "Jailbreak Seasons Logo",
        seasonId,
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    const data = await response.json();
    const rewardsData = await rewardsResponse.json();

    // Find the Level 10 reward
    const level_10_reward = rewardsData.find(
      (reward) => reward.requirement === "Level 10"
    );

    // Ensure we got the reward before accessing properties
    let image_url =
      "https://cdn.jailbreakchangelogs.xyz/images/changelogs/348.webp";
    if (level_10_reward) {
      image_url = level_10_reward.link;
    }

    const { season, title } = data; // Adjust the destructured properties based on the API response structure
    res.render("seasons", {
      season,
      title,
      image_url,
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Seasons_Logo.webp",
      logoAlt: "Jailbreak Seasons Logo",
      seasonId,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    }); // Render the seasons page with the retrieved data
  } catch (error) {
    console.error("Error fetching season data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/bot", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("bot", {
    title: "Discord Bot / Changelogs",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Discord_Bot_Logo.webp ",
    logoAlt: "Discord Bot Page Logo",
    image,
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/faq", (req, res) => {
  res.render("faq", {
    title: "User FAQ",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/FAQ_Logo.webp",
    logoAlt: "FAQ Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/privacy", (req, res) => {
  res.render("privacy", {
    title: "Privacy Policy / Changelogs",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Privacy_Logo.webp",
    logoAlt: "Privacy Policy Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/tos", (req, res) => {
  res.render("tos", {
    title: "Terms Of Service / Changelogs",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Tos_Logo.webp",
    logoAlt: "TOS Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/botinvite", (req, res) => {
  res.render("botinvite");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/users/:user/followers", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params
  const response = await fetch(
    `https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  );

  if (!response.ok) {
    return res.status(response.status).send("Error fetching user settings");
  }
  let showfollowers = true;

  const data = await response.json();
  if (data.hide_followers === 0) {
    showfollowers = false;
  } else {
    showfollowers = true;
  }
  if (!user) {
    return res.render("usersearch", {
      title: "User Search / Changelogs",
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }

  fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz", // Add your origin
    },
  })
    .then((response) => response.json())
    .then((userData) => {
      if (userData.error) {
        const defaultUserID = "659865209741246514"; // Set your default changelog ID here
        return res.redirect(`/users/${defaultUserID}/followers`);
      }
      // Render the page only after the data is fetched
      const avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
      res.render("followers", {
        userData,
        avatar,
        showfollowers,
        title: "Followers / Changelogs",
        logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
        logoAlt: "Users Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);

      // Optionally render an error page or send a response with an error message
      res.status(500).send("Error fetching user data");
    });
});

app.get("/users/:user/following", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params
  const response = await fetch(
    `https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  );

  if (!response.ok) {
    return res.status(response.status).send("Error fetching user settings");
  }
  let showfollowing = true;

  const data = await response.json();
  if (data.hide_following === 0) {
    showfollowing = false;
  } else {
    showfollowing = true;
  }
  if (!user) {
    return res.render("usersearch", {
      title: "User Search / Changelogs",
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }

  fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz", // Add your origin
    },
  })
    .then((response) => response.json())
    .then((userData) => {
      if (userData.error) {
        const defaultUserID = "659865209741246514"; // Set your default changelog ID here
        return res.redirect(`/users/${defaultUserID}/following`);
      }
      // Render the page only after the data is fetched
      const avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
      res.render("following", {
        userData,
        avatar,
        showfollowing,
        title: "Users - Following",
        logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
        logoAlt: "Users Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);

      // Optionally render an error page or send a response with an error message
      res.status(500).send("Error fetching user data");
    });
});

// Render search page
app.get("/users", (req, res) => {
  res.render("usersearch", {
    title: "Users",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
    logoAlt: "Users Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

// Route to render a specific user profile
const getAvatar = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" }); // Use HEAD to just check the existence of the resource
    if (response.status === 404) {
      // If 404, return placeholder
      return "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg";
    }
    // If avatar exists, return the original avatar URL
    return url;
  } catch (error) {
    // In case of error, return the placeholder
    console.error("Error fetching avatar:", error);
    return "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg";
  }
};

// Route to render a specific user profile
app.get("/users/:user", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params

  if (!user) {
    return res.render("usersearch", {
      title: "Users",
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }

  // Fetch user settings and user data concurrently
  const settingsFetch = fetch(
    `https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  ).then((response) => response.json());

  const userFetch = fetch(
    `https://api.jailbreakchangelogs.xyz/users/get?id=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  ).then((response) => response.json());

  try {
    // Use Promise.all to wait for both fetch requests to resolve
    const [settings1, userData] = await Promise.all([settingsFetch, userFetch]);

    const booleanSettings = {
      ...settings1,
      profile_public: Boolean(settings1.profile_public),
      show_recent_comments: Boolean(settings1.show_recent_comments),
      hide_following: Boolean(settings1.hide_following),
      hide_followers: Boolean(settings1.hide_followers),
      banner_discord: Boolean(settings1.banner_discord),
    };

    const settings = {
      ...booleanSettings,
      profile_public: !booleanSettings.profile_public,
      show_recent_comments: !booleanSettings.show_recent_comments,
      hide_following: !booleanSettings.hide_following,
      hide_followers: !booleanSettings.hide_followers,
      banner_discord: !booleanSettings.banner_discord,
    };

    if (userData.error) {
      const defaultUserID = "659865209741246514";
      return res.redirect(`/users/${defaultUserID}`);
    }

    // Assemble avatar URL
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

    // Check if avatar exists and get the correct URL (or placeholder)
    const avatar = await getAvatar(avatarUrl);

    // Render the page only after both data sets are fetched
    res.render("users", {
      userData,
      avatar,
      settings,
      title: "User Profile",
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp",
      logoAlt: "User Profile Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching user data or settings:", error);
    res.status(500).send("Error fetching user data");
  }
});

app.get("/timeline", (req, res) => {
  res.render("timeline", {
    title: "Timeline / Changelogs",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Timeline_Logo.webp",
    logoAlt: "Timeline Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/tradetracker", (req, res) => {
  res.render("tradetracker", {
    title: "Trade Tracker",
    logoUrl:
      "https://cdn.jailbreakchangelogs.xyz/logos/Trade_Tracker_Logo.webp",
    logoAlt: "Trade Tracker Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("index", {
    title: "Home / Changelogs",
    logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Homepage_Logo.webp",
    logoAlt: "Home Page Logo",
    image,
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/api", (req, res) => {
  res.redirect("/");
});

app.get("/faq.png", (req, res) => {
  res.sendFile(path.join(__dirname, "../FAQ.png"));
});

app.get("/icon-512.png", (req, res) => {
  res.sendFile(path.join(__dirname, "../icon-512.png"));
});

// Handle unknown routes by serving index.html
app.get("*", (req, res) => {
  res.redirect("/");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Export the app for Vercel's serverless functions
module.exports = app;

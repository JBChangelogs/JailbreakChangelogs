const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5500; // Set the port
const fs = require("fs");
const cookieParser = require("cookie-parser");
const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 25;

// Serve your static HTML, CSS, and JS files
const DATA_SOURCE_URL =
  "https://badimo.nyc3.digitaloceanspaces.com/trade/frequency/snapshot/month/latest.json";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://jailbreakchangelogs.xyz");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use((req, res, next) => {
  res.locals.req = req;
  next();
});

app.use(express.static(path.join(__dirname, "../")));
app.use(
  cors({
    origin: "https://jailbreakchangelogs.xyz",
  })
);

app.use(cookieParser());

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
    const latestId = 351;
    res.redirect(`/changelogs/${latestId}`);
  } catch (error) {
    console.error("Error fetching latest changelog:", error);
    // Fallback to a default ID if the API request fails
    res.redirect("/changelogs/348");
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
  let changelogId = req.params.changelog || 1;

  try {
    // Fetch both latest and requested changelog data in parallel
    const [latestResponse, requestedResponse] = await Promise.all([
      fetch("https://api3.jailbreakchangelogs.xyz/changelogs/latest", {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }),
      fetch(
        `https://api3.jailbreakchangelogs.xyz/changelogs/get?id=${changelogId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      ),
    ]);

    if (!latestResponse.ok || !requestedResponse.ok) {
      throw new Error("Failed to fetch changelog data");
    }

    const [latestData, requestedData] = await Promise.all([
      latestResponse.json(),
      requestedResponse.json(),
    ]);

    const latestId = latestData.id;

    // If no changelog ID is provided or invalid, redirect to latest
    if (!changelogId || changelogId > latestId) {
      return res.redirect(`/changelogs/${latestId}`);
    }

    const responseData = {
      changelogId,
      latestId,
      title: requestedData.title,
      image_url: requestedData.image_url,
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
      logoAlt: "Changelogs Page Logo",
      embed_color: 0x134d64,
      isLatest: changelogId === latestId,
      canonicalUrl: "https://jailbreakchangelogs.xyz/changelogs",
      metaDescription: `View detailed changelog information for Jailbreak update ${requestedData.title}. Track new features, vehicles, and game improvements.`,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
      type: "changelog",
      itemId: changelogId,
    };

    // Handle Discord bot requests differently
    if (
      req.headers["user-agent"]?.includes("DiscordBot") ||
      req.query.format === "discord"
    ) {
      res.json(responseData);
    } else {
      res.render("changelogs", responseData);
    }
  } catch (error) {
    console.error("Error fetching changelog data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons", async (req, res) => {
  try {
    const latestSeason = 24;
    res.redirect(`/seasons/${latestSeason}`);
  } catch (error) {
    console.error("Error fetching latest season:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons/:season", async (req, res) => {
  let seasonId = req.params.season;
  const apiUrl = `https://api3.jailbreakchangelogs.xyz/seasons/get?season=${seasonId}`;
  const rewardsUrl = `https://api3.jailbreakchangelogs.xyz/rewards/get?season=${seasonId}`;
  const latestSeason = 24;
  try {
    // Then fetch the requested season
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (response.status === 404 || !response.ok) {
      // Redirect to latest season if requested one doesn't exist
      return res.redirect(`/seasons/${latestSeason}`);
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
        image_url: "/assets/images/changelogs/346.webp",
        logoUrl: "/assets/logos/JB Changelogs Banner.webp",
        logoAlt: "Jailbreak Seasons Logo",
        seasonId,
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
        type: "season",
        itemId: seasonId,
      });
    }

    const data = await response.json();
    const rewardsData = await rewardsResponse.json();

    // Find the Level 10 reward
    const level_10_reward = rewardsData.find(
      (reward) => reward.requirement === "Level 10"
    );

    // Ensure we got the reward before accessing properties
    let image_url = "/assets/images/changelogs/346.webp";
    if (level_10_reward) {
      image_url = level_10_reward.link;
    }

    const { season, title } = data; // Adjust the destructured properties based on the API response structure
    res.render("seasons", {
      season,
      title,
      image_url,
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
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

app.get("/trading", (req, res) => {
  res.render("trading", {
    title: "Trading / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
    logoAlt: "Trading Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

// In index.js
app.get("/trading/ad/:tradeId", (req, res) => {
  const tradeId = req.params.tradeId;
  res.render("trade-ad", {
    title: `Trade #${tradeId} - Jailbreak Trading`,
    metaDescription: `View trade details for Trade #${tradeId}. Check item values and trade status.`,
    canonicalUrl: `https://jailbreakchangelogs.xyz/trading/ad/${tradeId}`,
    logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
    logoAlt: "Trading Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
    tradeId,
  });
});

app.get("/bot", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 12) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("bot", {
    title: "Discord Bot / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Bot Page Logo",
    image,
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/values", async (req, res) => {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    const allItems = await response.json();

    res.render("values", {
      title: "Values / Changelogs",
      logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
      logoAlt: "Values Page Logo",
      allItems,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.render("values", {
      title: "Values / Changelogs",
      logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
      logoAlt: "Values Page Logo",
      allItems: [],
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }
});

app.get("/values/calculator", (req, res) => {
  res.render("calculator", {
    title: "Value Calculator / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
    logoAlt: "Values Calculator Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/servers", (req, res) => {
  res.render("servers", {
    title: "Private Servers / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Servers Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/item/:type/:item", async (req, res) => {
  let itemName = decodeURIComponent(req.params.item)
    .trim()
    .replace(/\s+/g, " ");
  let itemType = decodeURIComponent(req.params.type).trim().toLowerCase();
  const formattedUrlType = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  const apiUrl = `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
    itemName
  )}&type=${itemType}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    const item = await response.json();

    // Enhanced SEO data
    const seoData = {
      pageTitle: `${itemName} - Jailbreak ${formattedUrlType} Value & Details | JailbreakChangelogs`,
      metaDescription:
        item.description && item.description !== "N/A"
          ? item.description
          : `Get the latest value and details for ${itemName} in Roblox Jailbreak. View current price, trading history, rarity status, and market trends.`,
      canonicalUrl: `https://jailbreakchangelogs.xyz/item/${formattedUrlType.toLowerCase()}/${encodeURIComponent(
        itemName
      )}`,
      breadcrumbs: [
        { name: "Home", url: "/" },
        { name: "Values", url: "/values" },
        {
          name: `${formattedUrlType}s`,
          url: `/values?sort=${formattedUrlType.toLowerCase()}s`,
        },
        {
          name: itemName,
          url: `/item/${formattedUrlType.toLowerCase()}/${encodeURIComponent(
            itemName
          )}`,
        },
      ],
    };

    // If item not found, return error page with SEO data
    if (response.status === 404 || item.error) {
      return res.render("item", {
        ...seoData,
        title: seoData.pageTitle,
        logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
        logoAlt: "Item Page Logo",
        itemName,
        itemType,
        formattedUrlType,
        error: true,
        image_url: "/assets/logos/JB Changelogs (Collab).webp",
        item: {
          name: itemName,
          image: "/assets/logos/JB Changelogs (Collab).webp",
        },
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    // Generate image URL for the item
    let image_url;
    if (item.type === "Drift") {
      image_url = `/assets/images/items/drifts/thumbnails/${item.name}.webp`;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      image_url = `/assets/images/items/hyperchromes/HyperShift.webm`;
    } else {
      const pluralType = `${item.type.toLowerCase()}s`;
      image_url = `/assets/images/items/${pluralType}/${item.name}.webp`;
    }
    item.image = image_url;

    // Render page with SEO data
    res.render("item", {
      ...seoData,
      title: seoData.pageTitle,
      logoUrl: "/assets/logos/JB Changelogs (Collab).webp",
      logoAlt: "Item Page Logo",
      itemName: item.name,
      itemType,
      formattedUrlType,
      item,
      image_url,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.render("item", {
      title: `${itemName} - Error | JailbreakChangelogs`,
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
      logoAlt: "Item Page Logo",
      itemName,
      itemType,
      formattedUrlType,
      error: true,
      errorMessage: "Internal Server Error",
      image_url: "/assets/logos/JB Changelogs Banner.webp",
      item: {
        name: itemName,
        image: "/assets/logos/JB Changelogs Banner.webp",
      },
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }
});

// Keep the old route for backward compatibility
app.get("/item/:item", async (req, res) => {
  const itemName = decodeURIComponent(req.params.item);

  // First, fetch the item without type to maintain backward compatibility
  const apiUrl = `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
    itemName
  )}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const item = await response.json();
    // Redirect to the new URL structure with the correct type
    res.redirect(`/item/${item.type.toLowerCase()}/${itemName}`);
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/faq", (req, res) => {
  res.render("faq", {
    title: "User FAQ",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "FAQ Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/privacy", (req, res) => {
  res.render("privacy", {
    title: "Privacy Policy / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Privacy Policy Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/tos", (req, res) => {
  res.render("tos", {
    title: "Terms Of Service / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "TOS Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/botinvite", (req, res) => {
  res.render("botinvite");
});

app.get("/roblox", (req, res) => {
  res.render("roblox", {
    title: "Roblox Authentication / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Roblox Auth Page Logo",
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Discord Authentication / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Login Page Logo",
  });
});

app.get("/users/:user/followers", async (req, res) => {
  const requestedUser = req.params.user;
  const token = req.cookies?.token;

  try {
    // Step 1: Get the logged-in user's ID from token
    let loggedInUserId;
    if (token) {
      try {
        const userDataResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`,
          {
            headers: {
              "Content-Type": "application/json",
              Origin: "https://jailbreakchangelogs.xyz",
            },
          }
        );

        if (userDataResponse.ok) {
          const userData = await userDataResponse.json();
          loggedInUserId = userData.id;
        }
      } catch (error) {
        console.error("Error fetching user data from token:", error);
      }
    }

    // Step 2: Get user settings
    const settingsResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/settings?user=${requestedUser}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!settingsResponse.ok) {
      return res
        .status(settingsResponse.status)
        .send("Error fetching user settings");
    }

    const settings = await settingsResponse.json();

    // Step 3: Check access permissions
    const isProfileOwner = requestedUser === loggedInUserId;

    const isPrivateAndNotLoggedIn =
      settings.profile_public === 0 && !loggedInUserId;
    const isPrivateAndNotOwner =
      settings.profile_public === 0 && !isProfileOwner;
    const isHiddenAndNotOwner =
      settings.hide_followers === 1 && !isProfileOwner;

    if (
      isPrivateAndNotLoggedIn ||
      isPrivateAndNotOwner ||
      isHiddenAndNotOwner
    ) {
      return res.redirect(`/users/${requestedUser}`);
    }

    // Step 4: Fetch user data
    const userResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${requestedUser}`,
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    const userData = await userResponse.json();

    if (userData.error) {
      const defaultUserID = "659865209741246514";
      return res.redirect(`/users/${defaultUserID}/followers`);
    }

    // Step 5: Get avatar URL
    const avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.webp?size=4096`;

    // Step 6: Render the followers page
    res.render("followers", {
      userData,
      avatar,
      showfollowers: true,
      isPrivate: false,
      path: req.path,
      title: "Followers / Changelogs",
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
      logoAlt: "Users Page Logo",
      user: req.user || null,
      settings,
      isProfileOwner,
      loggedInUserId,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error in followers route:", error);
    console.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/users/:user/following", async (req, res) => {
  const requestedUser = req.params.user;
  const token = req.cookies?.token;

  try {
    // Step 1: Get the logged-in user's ID from token
    let loggedInUserId;
    if (token) {
      try {
        const userDataResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`,
          {
            headers: {
              "Content-Type": "application/json",
              Origin: "https://jailbreakchangelogs.xyz",
            },
          }
        );

        if (userDataResponse.ok) {
          const userData = await userDataResponse.json();
          loggedInUserId = userData.id;
        }
      } catch (error) {
        console.error("Error fetching user data from token:", error);
      }
    }

    // Step 2: Get user settings
    const settingsResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/settings?user=${requestedUser}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!settingsResponse.ok) {
      return res
        .status(settingsResponse.status)
        .send("Error fetching user settings");
    }

    const settings = await settingsResponse.json();

    // Step 3: Check access permissions
    const isProfileOwner = requestedUser === loggedInUserId;

    const isPrivateAndNotLoggedIn =
      settings.profile_public === 0 && !loggedInUserId;
    const isPrivateAndNotOwner =
      settings.profile_public === 0 && !isProfileOwner;
    const isHiddenAndNotOwner =
      settings.hide_following === 1 && !isProfileOwner;

    if (
      isPrivateAndNotLoggedIn ||
      isPrivateAndNotOwner ||
      isHiddenAndNotOwner
    ) {
      return res.redirect(`/users/${requestedUser}`);
    }

    // Step 4: Fetch user data
    const userResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${requestedUser}`,
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    const userData = await userResponse.json();

    if (userData.error) {
      const defaultUserID = "659865209741246514";
      return res.redirect(`/users/${defaultUserID}/following`);
    }

    // Step 5: Get avatar URL
    const avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

    // Step 6: Render the following page
    res.render("following", {
      userData,
      avatar,
      showfollowing: true,
      isPrivate: false,
      path: req.path,
      title: "Following / Changelogs",
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
      logoAlt: "Users Page Logo",
      user: req.user || null,
      settings,
      isProfileOwner,
      loggedInUserId,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error in following route:", error);
    console.error(error.stack);
    res.status(500).send("Internal Server Error");
  }
});

// Render search page
app.get("/users", (req, res) => {
  res.render("usersearch", {
    title: "Users / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Users Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

// Route to render a specific user profile
const getAvatar = async (userId, avatarHash, username) => {
  const defaultAvatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${username}&bold=true&format=svg`;

  if (!avatarHash) {
    return defaultAvatarUrl;
  }

  const fetchAvatar = async (format) => {
    const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=4096`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  };

  try {
    // Try GIF first for animated avatars
    const gifUrl = await fetchAvatar("gif");
    if (gifUrl) {
      return gifUrl;
    }

    // Then try WebP for static avatars
    const webpUrl = await fetchAvatar("webp");
    if (webpUrl) {
      return webpUrl;
    }

    return defaultAvatarUrl;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return defaultAvatarUrl;
  }
};

app.get("/users/:user", async (req, res) => {
  const user = req.params.user;
  const token = req.cookies?.token;
  if (!user) {
    return res.render("usersearch", {
      title: "Users / Changelogs",
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
      logoAlt: "Users Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }

  try {
    // Step 1: Get user data and settings first
    const [settings, userData] = await Promise.all([
      fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${user}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      ).then((response) => response.json()),
      fetch(`https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`, {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }).then((response) => response.json()),
    ]);

    // Step 2: Verify token and get logged-in user's ID
    let loggedInUserId = null;
    if (token) {
      try {
        const tokenResponse = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`,
          {
            headers: {
              "Content-Type": "application/json",
              Origin: "https://jailbreakchangelogs.xyz",
            },
          }
        );

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          loggedInUserId = tokenData.id;
        } else {
          console.log("Invalid token");
        }
      } catch (error) {
        console.error("Token verification error:", error);
      }
    }

    // Step 3: Check profile access
    const isProfileOwner = loggedInUserId === user;
    const isPrivateProfile = settings.profile_public === 0;
    const canAccessProfile = !isPrivateProfile || isProfileOwner;

    // Get avatar
    const avatar = await getAvatar(
      userData.id,
      userData.avatar,
      userData.username
    );

    if (!canAccessProfile) {
      // Render private profile view
      return res.render("users", {
        userData: {
          ...userData,
          username: userData.username,
          id: userData.id,
        },
        avatar,
        settings,
        title: "Private Profile / Changelogs",
        logoUrl: "/assets/logos/JB Changelogs Banner.webp",
        logoAlt: "User Profile Logo",
        isPrivateProfile: true,
        isProfileOwner: false,
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    // Render full profile for authorized access
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    res.render("users", {
      userData,
      avatar,
      settings,
      title: "User Profile / Changelogs",
      logoUrl: "/assets/logos/JB Changelogs Banner.webp",
      logoAlt: "User Profile Logo",
      isPrivateProfile: false,
      isProfileOwner,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error in profile route:", error);
    res.status(500).send("Error fetching user data");
  }
});

app.get("/timeline", (req, res) => {
  res.render("timeline", {
    title: "Timeline / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Timeline Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/tradetracker", (req, res) => {
  res.render("tradetracker", {
    title: "Trade Tracker / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
    logoAlt: "Trade Tracker Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 12) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("index", {
    title: "Home / Changelogs",
    logoUrl: "/assets/logos/JB Changelogs Banner.webp",
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
  const timestamp = new Date().toLocaleString();
  console.log(`
\x1b[34m┌────────────────────────────────────────────────┐
\x1b[34m│\x1b[32m  🚀 Server launched and ready for action! 🚀    \x1b[34m│
\x1b[34m│                                                │
\x1b[34m│\x1b[33m  🌍 Listening at: \x1b[36mhttp://localhost:${PORT}        \x1b[34m│
\x1b[34m│\x1b[35m  ⚡ Environment: Production                        \x1b[34m│
\x1b[34m│\x1b[32m  🕒 Started at: ${timestamp}      \x1b[34m│
\x1b[34m└────────────────────────────────────────────────┘\x1b[0m`);
});

// Export the app for Vercel's serverless functions
module.exports = app;

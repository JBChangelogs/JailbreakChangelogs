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

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
};

// Add this helper function at the top with other utility functions
const safeJsonParse = async (response) => {
  try {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON response:", text.substring(0, 100));
      throw new Error("Invalid JSON response from server");
    }
  } catch (e) {
    throw new Error("Failed to read response");
  }
};

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

app.use("/assets", (req, res, next) => {
  // 1 year cache for assets
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  res.setHeader("Expires", oneYearFromNow.toUTCString());
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    res.setHeader("Expires", oneYearFromNow.toUTCString());
  }
  next();
});

app.use(express.static(path.join(__dirname, "../")));
app.use(
  cors({
    origin: "https://jailbreakchangelogs.xyz",
  })
);

app.use(cookieParser());

app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "URL query parameter is required" });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch the URL" });
    }

    // Set the same content type as the fetched resource
    res.setHeader("Content-Type", response.headers.get("content-type"));

    // Pipe the response stream directly to the client
    response.body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the URL" });
  }
});

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
    // Use Promise.race with timeout for parallel requests
    const [latestResponse, requestedResponse] = await Promise.all([
      fetchWithTimeout(
        "https://api3.jailbreakchangelogs.xyz/changelogs/latest",
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      ),
      fetchWithTimeout(
        `https://api3.jailbreakchangelogs.xyz/changelogs/get?id=${changelogId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      ),
    ]);

    // Check if the requested changelog exists
    if (!requestedResponse.ok) {
      // If changelog not found, render 404 page
      return res.status(404).render("error", {
        title: "404 - Changelog Not Found",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
        logoAlt: "404 Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    // Continue with existing logic if changelog exists
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
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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
    if (error.message === "Request timed out") {
      return res.status(503).render("error", {
        title: "503 - Service Unavailable",
        message:
          "The server is taking too long to respond. Please try again later.",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
        logoAlt: "Error Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }
    return res.status(500).render("error", {
      title: "500 - Server Error",
      message: "The server encountered an error while processing your request.",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "Error Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
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
    const [response, rewardsResponse] = await Promise.all([
      fetchWithTimeout(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }),
      fetchWithTimeout(rewardsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }),
    ]);

    if (response.status === 404) {
      return res.status(404).render("error", {
        title: "404 - Season Not Found",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
        logoAlt: "404 Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    if (!response.ok) {
      // Redirect to latest season if requested one doesn't exist
      return res.redirect(`/seasons/${latestSeason}`);
    }

    if (rewardsResponse.status === 404) {
      return res.status(404).render("error", {
        title: "404 - Season Not Found",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
        logoAlt: "404 Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    if (!rewardsResponse.ok) {
      return res.render("seasons", {
        season: "???",
        title: "Season not found",
        image_url:
          "https://jailbreakchangelogs.xyz/assets/images/changelogs/346.webp",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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

    // Generate image URLs for embedding
    const baseImageUrl =
      "https://jailbreakchangelogs.xyz/assets/images/seasons";

    // Get level 10 reward
    const level10Image = `${baseImageUrl}/${seasonId}/10.webp`;

    // Generate array of available level numbers (2-9)
    const availableLevels = Array.from({ length: 8 }, (_, i) => i + 2);

    // Randomly select 3 unique levels
    const selectedLevels = [];
    while (selectedLevels.length < 3 && availableLevels.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableLevels.length);
      selectedLevels.push(availableLevels.splice(randomIndex, 1)[0]);
    }

    // Create array of image URLs including level 10 and random selections
    const imageUrls = [
      level10Image,
      ...selectedLevels.map(
        (level) => `${baseImageUrl}/${seasonId}/${level}.webp`
      ),
    ];

    const { season, title } = data;
    res.render("seasons", {
      season,
      title,
      image_urls: imageUrls, // Pass array of image URLs to template
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "Jailbreak Seasons Logo",
      seasonId,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching season data:", error);
    if (error.message === "Request timed out") {
      return res.status(503).render("error", {
        title: "503 - Service Unavailable",
        message:
          "The server is taking too long to respond. Please try again later.",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
        logoAlt: "Error Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }
    return res.status(500).render("error", {
      title: "500 - Server Error",
      message: "The server encountered an error while processing your request.",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "Error Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }
});

app.get("/trading", (req, res) => {
  res.render("trading", {
    title: "Trading - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
    logoAlt: "Trading Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

// In index.js
app.get("/trading/ad/:tradeId", (req, res) => {
  const tradeId = req.params.tradeId;
  res.render("trade-ad", {
    title: `Trade #${tradeId} - Changelogs`,
    metaDescription: `View trade details for Trade #${tradeId}. Check item values and trade status.`,
    canonicalUrl: `https://jailbreakchangelogs.xyz/trading/ad/${tradeId}`,
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
    logoAlt: "Trading Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
    tradeId,
  });
});

app.get("/bot", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 12) + 1;
  const image = `https://jailbreakchangelogs.xyz/assets/backgrounds/background${randomNumber}.webp`;
  res.render("bot", {
    title: "Discord Bot - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Bot Page Logo",
    image,
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/values", async (req, res) => {
  try {
    const response = await fetchWithTimeout(
      "https://api3.jailbreakchangelogs.xyz/items/list",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const allItems = await safeJsonParse(response);

    if (!Array.isArray(allItems)) {
      throw new Error("Invalid data format received");
    }

    res.render("values", {
      title: "Roblox Jailbreak Values - Changelogs",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
      logoAlt: "Values Page Logo",
      allItems,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(503).render("error", {
      title: "503 - Service Unavailable",
      message:
        error.message === "Request timed out"
          ? "The server is taking too long to respond. Please try again later."
          : "Unable to load items at this time. Please try again later.",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "Error Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }
});

app.get("/values/calculator", (req, res) => {
  res.render("calculator", {
    title: "Value Calculator - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
    logoAlt: "Values Calculator Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/servers", (req, res) => {
  res.render("servers", {
    title: "Private Servers - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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

    // If item not found, return error page with generic title/description
    if (response.status === 404 || item.error) {
      return res.render("item", {
        title: "Item Not Found - Changelogs",
        metaDescription:
          "This item does not exist. Check our values page for a complete list of available items.",
        canonicalUrl: "https://jailbreakchangelogs.xyz/values",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        logoAlt: "Item Page Logo",
        itemName: "Item Not Found",
        itemType,
        formattedUrlType,
        error: true,
        embedImageUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        image_url:
          "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        item: {
          name: "Item Not Found",
          image:
            "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        },
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    // Generate embed image URL - use absolute URLs for embeds
    let embedImageUrl;
    if (item.type === "Drift") {
      embedImageUrl = `https://jailbreakchangelogs.xyz/assets/images/items/drifts/thumbnails/${item.name}.webp`;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      embedImageUrl = `https://jailbreakchangelogs.xyz/assets/images/items/hyperchromes/HyperShift.gif`;
    } else if (item.type === "Horn") {
      embedImageUrl = `https://jailbreakchangelogs.xyz/assets/audios/horn_thumbnail.webp`;
    } else {
      const pluralType = `${item.type.toLowerCase()}s`;
      embedImageUrl = `https://jailbreakchangelogs.xyz/assets/images/items/${pluralType}/${item.name}.webp`;
    }

    // Enhanced SEO data
    const seoData = {
      pageTitle: `${itemName} - Roblox Jailbreak`,
      metaDescription:
        item.description && item.description !== "N/A"
          ? item.description
          : `Get the latest value and details for ${itemName} in Roblox Jailbreak. View current price, trading history, rarity status, and market trends.`,
      canonicalUrl: `https://jailbreakchangelogs.xyz/item/${formattedUrlType.toLowerCase()}/${encodeURIComponent(
        itemName
      )}`,
      embedImageUrl: embedImageUrl,
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

    // If item not found, return error page with default image
    if (response.status === 404 || item.error) {
      return res.render("item", {
        ...seoData,
        title: seoData.pageTitle,
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        logoAlt: "Item Page Logo",
        itemName,
        itemType,
        formattedUrlType,
        error: true,
        embedImageUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        image_url:
          "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        item: {
          name: itemName,
          image:
            "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
        },
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    // Generate relative image URL for page display
    let image_url;
    if (item.type === "Drift") {
      image_url = `https://jailbreakchangelogs.xyz/assets/images/items/drifts/thumbnails/${item.name}.webp`;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      image_url = `https://jailbreakchangelogs.xyz/assets/images/items/hyperchromes/HyperShift.webm`;
    } else {
      const pluralType = `${item.type.toLowerCase()}s`;
      image_url = `https://jailbreakchangelogs.xyz/assets/images/items/${pluralType}/${item.name}.webp`;
    }
    item.image = image_url;

    // Render page with both relative and absolute image URLs
    res.render("item", {
      ...seoData,
      title: seoData.pageTitle,
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Logo_Collab_Background.webp",
      logoAlt: "Item Page Logo",
      itemName: item.name,
      itemType,
      formattedUrlType,
      item,
      image_url,
      embedImageUrl: seoData.embedImageUrl,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.render("item", {
      title: `${itemName} - Error - Changelogs`,
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "Item Page Logo",
      itemName,
      itemType,
      formattedUrlType,
      error: true,
      errorMessage: "Internal Server Error",
      image_url:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      embedImageUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      item: {
        name: itemName,
        image:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "FAQ Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/privacy", (req, res) => {
  res.render("privacy", {
    title: "Privacy Policy / Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Privacy Policy Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/tos", (req, res) => {
  res.render("tos", {
    title: "Terms Of Service / Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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
    title: "Roblox Authentication - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Roblox Auth Page Logo",
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Discord Authentication - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Login Page Logo",
  });
});

const getAvatar = async (userId, avatarHash, username) => {
  const defaultAvatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=300&rounded=true&name=${encodeURIComponent(
    username
  )}&bold=true&format=png`;

  if (!avatarHash) {
    return defaultAvatarUrl;
  }

  try {
    const url = `https://api.codetabs.com/v1/proxy/?quest=https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : defaultAvatarUrl;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return defaultAvatarUrl;
  }
};

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
    const avatar = await getAvatar(
      userData.id,
      userData.avatar,
      userData.username
    );

    // Step 6: Render the followers page
    res.render("followers", {
      userData,
      avatar,
      showfollowers: true,
      isPrivate: false,
      path: req.path,
      title: "Followers - Changelogs",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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
    const avatar = await getAvatar(
      userData.id,
      userData.avatar,
      userData.username
    );

    // Step 6: Render the following page
    res.render("following", {
      userData,
      avatar,
      showfollowing: true,
      isPrivate: false,
      path: req.path,
      title: "Following / Changelogs",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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
    title: "Users - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Users Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

// Route to render a specific user profile
app.get("/users/:user", async (req, res) => {
  const user = req.params.user;
  const token = req.cookies?.token;

  // First check if user parameter is a valid number
  if (!user || !/^\d+$/.test(user)) {
    return res.status(404).render("error", {
      title: "404 - User Not Found",
      message: "The requested user profile could not be found.",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "404 Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }

  try {
    // Step 1: Get user data from API
    const userResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`,
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    // Handle user not found
    if (userResponse.status === 404 || userResponse.status === 422) {
      return res.status(404).render("error", {
        title: "404 - User Not Found",
        message: "The requested user profile could not be found.",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
        logoAlt: "404 Page Logo",
        MIN_TITLE_LENGTH,
        MIN_DESCRIPTION_LENGTH,
      });
    }

    // Verify the response is valid JSON before parsing
    const userData = await userResponse.text();
    let parsedUserData;
    try {
      parsedUserData = JSON.parse(userData);
    } catch (e) {
      console.error("Failed to parse user data:", e);
      throw new Error("Invalid response from user API");
    }

    // Step 2: Get user settings
    const settingsResponse = await fetch(
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
    );

    // Parse settings with error handling
    const settingsData = await settingsResponse.text();
    let settings;
    try {
      settings = JSON.parse(settingsData);
    } catch (e) {
      console.error("Failed to parse settings data:", e);
      throw new Error("Invalid response from settings API");
    }

    // Step 3: Verify token and get logged-in user's ID
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

    // Step 4: Check profile access
    const isProfileOwner = loggedInUserId === user;
    const isPrivateProfile = settings.profile_public === 0;
    const canAccessProfile = !isPrivateProfile || isProfileOwner;

    // Get avatar
    const avatar = await getAvatar(
      parsedUserData.id,
      parsedUserData.avatar,
      parsedUserData.username
    );

    if (!canAccessProfile) {
      // Render private profile view
      return res.render("users", {
        userData: {
          ...parsedUserData,
          username: parsedUserData.username,
          id: parsedUserData.id,
        },
        avatar,
        settings,
        title: "Private Profile - Changelogs",
        logoUrl:
          "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
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
      userData: parsedUserData,
      avatar,
      settings,
      title: "User Profile - Changelogs",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "User Profile Logo",
      isPrivateProfile: false,
      isProfileOwner,
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  } catch (error) {
    console.error("Error in profile route:", error);
    return res.status(500).render("error", {
      title: "500 - Server Error",
      message:
        "An error occurred while loading the user profile. Please try again later.",
      logoUrl:
        "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
      logoAlt: "Error Page Logo",
      MIN_TITLE_LENGTH,
      MIN_DESCRIPTION_LENGTH,
    });
  }
});

app.get("/timeline", (req, res) => {
  res.render("timeline", {
    title: "Timeline - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Timeline Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/tradetracker", (req, res) => {
  res.render("tradetracker", {
    title: "Trade Tracker - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Trade Tracker Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/roadmap", (req, res) => {
  res.render("roadmap", {
    title: "Roadmap - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Roadmap Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/redeem", (req, res) => {
  res.render("redeem", {
    title: "Reedem A Code - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Redeem Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/dupes/calculator", (req, res) => {
  res.render("dupes", {
    title: "Find Duped Items / Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Dupes Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 12) + 1;
  const image = `https://jailbreakchangelogs.xyz/assets/backgrounds/background${randomNumber}.webp`;
  res.render("index", {
    title: "Home / Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Home Page Logo",
    image,
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/api", (req, res) => {
  res.redirect("/");
});

app.get("/settings", (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    res.redirect("/login");
    return;
  }

  res.render("settings", {
    title: "Settings - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Settings Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

app.get("/exploiters", (req, res) => {
  res.render("exploiters", {
    title: "Find Exploiters - Changelogs",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "Exploiters Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
});

// Handle unknown routes by serving 404 page
app.get("*", (req, res) => {
  res.status(404).render("error", {
    title: "404 - Page Not Found",
    message:
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
    logoUrl:
      "https://jailbreakchangelogs.xyz/assets/logos/Banner_Background.webp",
    logoAlt: "404 Page Logo",
    MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
  });
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

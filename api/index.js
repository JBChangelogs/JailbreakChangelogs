const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5500; // Set the port
const fs = require('fs');
// Serve your static HTML, CSS, and JS files
const DATA_SOURCE_URL =
  "https://badimo.nyc3.digitaloceanspaces.com/trade/frequency/snapshot/month/latest.json";

app.use(express.static(path.join(__dirname, '../')));
app.use(cors({
  origin: 'https://jailbreakchangelogs.xyz'
}));
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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the directory for your EJS files

app.get('/changelogs', async (req, res) => {
  let changelogId = req.query.id || 1;
  console.log(`Fetching changelog with ID: ${changelogId}`);
  const apiUrl = `https://api.jailbreakchangelogs.xyz/changelogs/get?id=${changelogId}`;

  try {
    const response = await fetch(apiUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://jailbreakchangelogs.xyz'
        },
      }
    ); 
    if (response.status === 404) {
      res.render('changelogs', { title: 'Changelog not found', image_url: 'https://res.cloudinary.com/dsvlphknq/image/upload/v1727054787/changelogs/changelog-image-287.png' }); 
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const { title, image_url } = data;

    res.render('changelogs', { title, image_url });

  } catch (error) {
    console.error("Error fetching changelog data:", error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/seasons', async (req, res) => {
  let seasonId = req.query.id || 1; // Default to season 1 if no ID is provided
  const apiUrl = `https://api.jailbreakchangelogs.xyz/seasons/get?season=${seasonId}`; 
  const rewardsUrl = `https://api.jailbreakchangelogs.xyz/rewards/get?season=${seasonId}`; 

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://jailbreakchangelogs.xyz',
      },
    }); 
    if (!response.ok) {
      return res.render('seasons', { season: '???', title: 'Season not found', image_url: 'https://res.cloudinary.com/dsvlphknq/image/upload/v1727054787/changelogs/changelog-image-287.png' }); 
    }
    const rewardsResponse = await fetch(rewardsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://jailbreakchangelogs.xyz',
      },
    });
    if (!rewardsResponse.ok) {
      return res.render('seasons', { season: '???', title: 'Season not found', image_url: 'https://res.cloudinary.com/dsvlphknq/image/upload/v1727054787/changelogs/changelog-image-287.png'}); 
    }

    const data = await response.json();
    const rewardsData = await rewardsResponse.json();
    
    // Find the Level 10 reward
    const level_10_reward = rewardsData.find(reward => reward.requirement === "Level 10");

    // Ensure we got the reward before accessing properties
    let image_url = 'https://res.cloudinary.com/dsvlphknq/image/upload/v1727054787/changelogs/changelog-image-287.png';
    if (level_10_reward) {
      image_url = level_10_reward.link;
    }

    const { season, title } = data; // Adjust the destructured properties based on the API response structure
    res.render('seasons', { season, title, image_url }); // Render the seasons page with the retrieved data

  } catch (error) {
    console.error("Error fetching season data:", error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/timeline', (req, res) => {
  res.sendFile(path.join(__dirname, '../timeline.html'));
});

app.get('/bot', (req, res) => {
  res.sendFile(path.join(__dirname, '../bot.html'));
});

app.get('/keys', (req, res) => {
  res.sendFile(path.join(__dirname, '../keys.html'));
});

app.get('/tradetracker', (req, res) => {
  res.sendFile(path.join(__dirname, '../tradetracker.html'));
});

app.get('/botinvite', (req, res) => {
  res.sendFile(path.join(__dirname, '../botinvite.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../privacy.html'));
});

app.get('/tos', (req, res) => {
  res.sendFile(path.join(__dirname, '../tos.html'));
});

// Handle unknown routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Export the app for Vercel's serverless functions
module.exports = app;

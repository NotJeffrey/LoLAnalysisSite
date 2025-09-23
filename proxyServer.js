const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const API_KEY = process.env.RIOT_API_KEY || "RGAPI-09eeb9d2-d57f-4cfe-b45a-503eeb94a045";
const BASE_URL = "https://americas.api.riotgames.com";

async function getPlayerPUUID(playerName, tagLine) {
  try {
    const response = await axios.get(`${BASE_URL}/riot/account/v1/accounts/by-riot-id/${playerName}/${tagLine}`, {
      params: { api_key: API_KEY }
    });
    console.log(response.data);
    return response.data.puuid;
  } catch (err) {
    console.error("Error fetching PUUID:", err.message);
    throw err;
  }
}

app.get('/past5Games', async (req, res) => {
  try {
    const { username, tag } = req.query;
    
    const PUUID = await getPlayerPUUID(username, tag);
    console.log("PUUID:", PUUID);
    
    const gameIdsResponse = await axios.get(`${BASE_URL}/lol/match/v5/matches/by-puuid/${PUUID}/ids`, {
      params: { api_key: API_KEY, count: 5 }
    });
    const gameIds = gameIdsResponse.data;
    console.log("Game IDs:", gameIds);
    
    const matchDataArray = await Promise.all(gameIds.map(async (matchId) => {
      const matchResponse = await axios.get(`${BASE_URL}/lol/match/v5/matches/${matchId}`, {
        params: { api_key: API_KEY }
      });
      return matchResponse.data;
    }));
    
    res.json(matchDataArray);
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
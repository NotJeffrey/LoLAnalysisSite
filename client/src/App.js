import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [searchText, setSearchText] = useState("");
  const [tagSearchText, setTagSearchText] = useState("");
  const [gameList, setGameList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedGames, setExpandedGames] = useState({});

  async function getPlayerGames(event) {
    event.preventDefault();
    if (!searchText || !tagSearchText) {
      setError("Please enter both username and tag.");
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('Initiating API call with params:', { username: searchText, tag: tagSearchText });

    try {
      console.time('API call duration');
      const response = await axios.get("http://localhost:4000/past5Games", {
        params: { username: searchText, tag: tagSearchText }
      });
      console.timeEnd('API call duration');

      console.log('API response:', response);
      console.log('Number of games received:', response.data.length);

      setGameList(response.data);
      setExpandedGames({});

      console.log('Game list updated in state');
    } catch (error) {
      console.error("Error fetching data:", error);
      console.log('Error details:', error.response?.data || 'No additional error details');
      setError("Failed to fetch game data. Please try again.");
    } finally {
      setIsLoading(false);
      console.log('Loading state set to false');
    }
  }

  const toggleGameExpansion = (gameIndex) => {
    setExpandedGames(prev => ({
      ...prev,
      [gameIndex]: !prev[gameIndex]
    }));
    console.log(`Game ${gameIndex + 1} expansion toggled`);
  }

  const getChampionImageUrl = (championName) => {
    return `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/${championName}.png`;
  };

  const renderPlayerStats = (player, isWinner) => {
    if (!player.summonerName) {
      console.warn('Player with blank name detected:', player);
    }
    return (
      <div className={`player-stats ${isWinner ? 'winner' : 'loser'}`}>
        <img 
          src={getChampionImageUrl(player.championName)} 
          alt={`${player.championName} icon`} 
          className="champion-icon"
        />
        <div className="player-name">{player.summonerName || 'Unknown Player'}</div>
        <div className="player-stats-details">
          <span>KDA: {player.kills} / {player.deaths} / {player.assists}</span>
        </div>
      </div>
    );
  }

  const renderGameStats = (gameData, queriedPlayer) => {
    const queriedTeamId = queriedPlayer.teamId;
    const isQueriedTeamWinner = gameData.info.teams.find(team => team.teamId === queriedTeamId).win;

    const queriedTeam = gameData.info.participants.filter(p => p.teamId === queriedTeamId);
    const opposingTeam = gameData.info.participants.filter(p => p.teamId !== queriedTeamId);

    console.log('Queried Team:', queriedTeam);
    console.log('Opposing Team:', opposingTeam);

    return (
      <>
        <div className="team queried-team">
          <h4>{isQueriedTeamWinner ? 'Winning' : 'Losing'} Team (Queried Player's Team)</h4>
          {queriedTeam.map((player, index) => (
            <div key={index}>
              {renderPlayerStats(player, isQueriedTeamWinner)}
            </div>
          ))}
        </div>
        <div className="team opposing-team">
          <h4>{!isQueriedTeamWinner ? 'Winning' : 'Losing'} Team</h4>
          {opposingTeam.map((player, index) => (
            <div key={index}>
              {renderPlayerStats(player, !isQueriedTeamWinner)}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="App">
      <h1>League Stats</h1>
      <form onSubmit={getPlayerGames}>
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Enter username"
          required
        />
        <label htmlFor="tag">Tag:</label>
        <input
          id="tag"
          type="text"
          value={tagSearchText}
          onChange={(e) => setTagSearchText(e.target.value)}
          placeholder="Enter tag"
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get past 5 games'}
        </button>
      </form>

      {error && <p role="alert" className="error-message">{error}</p>}

      {isLoading && <p>Loading game data...</p>}

      {!isLoading && gameList.length > 0 && (
        <section aria-label="Game Results">
          <h2>Game Results for {searchText}#{tagSearchText}</h2>
          {gameList.map((gameData, index) => {
            const queriedPlayer = gameData.info.participants.find(
              p => p.summonerName.toLowerCase() === searchText.toLowerCase()
            );
            const queriedTeamId = queriedPlayer.teamId;
            const isQueriedTeamWinner = gameData.info.teams.find(team => team.teamId === queriedTeamId).win;
            
            return (
              <article 
                key={index} 
                className={`game-card ${isQueriedTeamWinner ? 'winner' : 'loser'}`}
              >
                <div className="game-header">
                  <div className="game-title-container">
                    <h3>Game {index + 1} - {isQueriedTeamWinner ? 'Victory' : 'Defeat'}</h3>
                    {!expandedGames[index] && (
                      <div className="preview-stats">
                        <div className="champion-info">
                          <img 
                            src={getChampionImageUrl(queriedPlayer.championName)} 
                            alt={`${queriedPlayer.championName} icon`} 
                            className="champion-icon"
                          />
                          <div className="champion-name">{queriedPlayer.championName}</div>
                        </div>
                        <div className="kda">
                          {queriedPlayer.kills} / {queriedPlayer.deaths} / {queriedPlayer.assists}
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className={`dropdown-toggle ${expandedGames[index] ? 'expanded' : ''}`} 
                    onClick={() => toggleGameExpansion(index)}
                    aria-expanded={expandedGames[index]}
                    aria-controls={`game-${index}-details`}
                  >
                    <span className="sr-only">
                      {expandedGames[index] ? 'Hide' : 'Show'} Other Players
                    </span>
                  </button>
                </div>
                <div 
                  id={`game-${index}-details`} 
                  className={`game-details ${expandedGames[index] ? 'expanded' : ''}`}
                >
                  {renderGameStats(gameData, queriedPlayer)}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!isLoading && gameList.length === 0 && <p>No game data available.</p>}
    </div>
  );
}

export default App;
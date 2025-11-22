import { useState, useEffect, useCallback } from 'react';
import PlayerList from '../components/PlayerList';
import DraftBoard from '../components/DraftBoard';
import playersData from '../data/players.json';
import './MockDraft.css';

const TEAM_COLORS = ['#00ff88', '#ff6b6b', '#4ecdc4', '#f9ca24', '#a29bfe'];

function MockDraft() {
  const { players, positions, captains } = playersData;
  const [gameState, setGameState] = useState('setup'); // setup, drafting, complete
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [captainOrder, setCaptainOrder] = useState([...captains]);
  const [teams, setTeams] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [draftOrder, setDraftOrder] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [tierPlayers, setTierPlayers] = useState({});
  const [unrankedPlayers, setUnrankedPlayers] = useState([]);
  const [userTeamIndex, setUserTeamIndex] = useState(0);

  // Load tier list from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('tierListData');
    if (savedData) {
      const { tiers: savedTiers, tierPlayers: savedTierPlayers, unrankedPlayers: savedUnranked } = JSON.parse(savedData);
      setTiers(savedTiers);
      setTierPlayers(savedTierPlayers);
      setUnrankedPlayers(savedUnranked);
    } else {
      // Default: all players unranked
      setTiers([]);
      setTierPlayers({});
      setUnrankedPlayers(players.map(p => p.id));
    }
  }, [players]);

  // Move captain up in order
  const moveCaptainUp = (index) => {
    if (index === 0) return;
    const newOrder = [...captainOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setCaptainOrder(newOrder);
  };

  // Move captain down in order
  const moveCaptainDown = (index) => {
    if (index === captainOrder.length - 1) return;
    const newOrder = [...captainOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setCaptainOrder(newOrder);
  };

  const initializeDraft = () => {
    if (!selectedCaptain) {
      alert('팀장을 선택해주세요.');
      return;
    }

    // Find user's team index
    const userIdx = captainOrder.findIndex(c => c.id === selectedCaptain.id);
    setUserTeamIndex(userIdx);

    // Initialize empty teams for each captain
    const initialTeams = captainOrder.map(captain => ({
      captain,
      TOP: null,
      MID: null,
      ADC: null,
      SUP: null
    }));
    setTeams(initialTeams);

    // Create snake draft order
    const order = [];
    const numTeams = captainOrder.length;
    for (let round = 0; round < 4; round++) {
      if (round % 2 === 0) {
        for (let team = 0; team < numTeams; team++) {
          order.push({ teamIndex: team, round });
        }
      } else {
        for (let team = numTeams - 1; team >= 0; team--) {
          order.push({ teamIndex: team, round });
        }
      }
    }
    setDraftOrder(order);
    setCurrentPickIndex(0);
    setGameState('drafting');
  };

  const getAllDraftedPlayers = useCallback(() => {
    return teams.flatMap(team =>
      [team.TOP, team.MID, team.ADC, team.SUP].filter(p => p !== null)
    );
  }, [teams]);

  const getCurrentTeamIndex = useCallback(() => {
    if (gameState !== 'drafting' || currentPickIndex >= draftOrder.length) return -1;
    return draftOrder[currentPickIndex].teamIndex;
  }, [gameState, currentPickIndex, draftOrder]);

  const getAvailablePositions = useCallback(() => {
    if (gameState !== 'drafting') return [];
    const currentTeam = teams[getCurrentTeamIndex()];
    if (!currentTeam) return [];
    return positions.filter(pos => !currentTeam[pos.id]);
  }, [gameState, teams, getCurrentTeamIndex, positions]);

  // AI pick logic based on tier list
  const makeAIPick = useCallback(() => {
    const currentTeamIdx = getCurrentTeamIndex();
    if (currentTeamIdx === -1 || currentTeamIdx === userTeamIndex) return null;

    const currentTeam = teams[currentTeamIdx];
    const draftedPlayers = getAllDraftedPlayers();
    const draftedIds = draftedPlayers.map(p => p.id);

    // Get available positions for current team
    const availablePos = positions
      .filter(pos => !currentTeam[pos.id])
      .map(pos => pos.id);

    // Helper function to find available player from a list
    const findAvailablePlayer = (playerIds) => {
      const available = playerIds.filter(playerId => {
        const player = players.find(p => p.id === playerId);
        return player &&
               !draftedIds.includes(player.id) &&
               availablePos.includes(player.position);
      });

      if (available.length === 0) return null;

      // Random selection from same tier (no order within tier)
      const randomIndex = Math.floor(Math.random() * available.length);
      return players.find(p => p.id === available[randomIndex]);
    };

    // Check each tier in order (highest to lowest)
    for (const tier of tiers) {
      const tierPlayerIds = tierPlayers[tier.id] || [];
      const player = findAvailablePlayer(tierPlayerIds);
      if (player) return player;
    }

    // Finally check unranked players
    const unrankedPlayer = findAvailablePlayer(unrankedPlayers);
    if (unrankedPlayer) return unrankedPlayer;

    return null;
  }, [getCurrentTeamIndex, userTeamIndex, teams, getAllDraftedPlayers, positions, tiers, tierPlayers, unrankedPlayers, players]);

  const handleSelectPlayer = useCallback((player, isAI = false) => {
    if (gameState !== 'drafting') return;

    const currentPick = draftOrder[currentPickIndex];
    const currentTeam = teams[currentPick.teamIndex];

    // If not AI, check if it's user's turn
    if (!isAI && currentPick.teamIndex !== userTeamIndex) {
      return;
    }

    // Check if this position is already filled
    if (currentTeam[player.position]) {
      if (!isAI) {
        alert(`이미 ${positions.find(p => p.id === player.position)?.name} 포지션이 선택되었습니다.`);
      }
      return;
    }

    // Update team
    const newTeams = [...teams];
    newTeams[currentPick.teamIndex] = {
      ...newTeams[currentPick.teamIndex],
      [player.position]: player
    };
    setTeams(newTeams);

    // Move to next pick
    const nextPickIndex = currentPickIndex + 1;
    if (nextPickIndex >= draftOrder.length) {
      setGameState('complete');
    } else {
      setCurrentPickIndex(nextPickIndex);
    }
  }, [gameState, draftOrder, currentPickIndex, teams, userTeamIndex, positions]);

  // Process AI picks
  useEffect(() => {
    if (gameState !== 'drafting') return;

    const currentTeamIdx = getCurrentTeamIndex();
    if (currentTeamIdx === -1) return;

    // If it's AI's turn, make a pick after a delay
    if (currentTeamIdx !== userTeamIndex) {
      const timer = setTimeout(() => {
        const aiPick = makeAIPick();
        if (aiPick) {
          handleSelectPlayer(aiPick, true);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [gameState, currentPickIndex, getCurrentTeamIndex, userTeamIndex, makeAIPick, handleSelectPlayer]);

  const handleReset = () => {
    setGameState('setup');
    setTeams([]);
    setCurrentPickIndex(0);
    setDraftOrder([]);
    setSelectedCaptain(null);
  };

  const isUserTurn = () => {
    return gameState === 'drafting' && getCurrentTeamIndex() === userTeamIndex;
  };

  if (gameState === 'setup') {
    return (
      <div className="mock-draft">
        <div className="setup-container">
          <h2>모의 드래프트</h2>
          <p>팀장을 선택하고 모의 드래프트를 진행하세요. 다른 팀장들은 AI가 티어 순위대로 선택합니다.</p>

          <div className="setup-form">
            <div className="form-group">
              <label>내가 플레이할 팀장 선택</label>
              <div className="captain-select-grid">
                {captains.map(captain => (
                  <button
                    key={captain.id}
                    className={`captain-select-btn ${selectedCaptain?.id === captain.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCaptain(captain)}
                  >
                    {captain.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>드래프트 순서 설정</label>
              <div className="captain-order-list">
                {captainOrder.map((captain, index) => (
                  <div
                    key={captain.id}
                    className={`captain-order-item ${captain.id === selectedCaptain?.id ? 'is-user' : ''}`}
                  >
                    <span className="order-number">{index + 1}</span>
                    <span className="captain-name">
                      {captain.name}
                      {captain.id === selectedCaptain?.id && <span className="user-badge">YOU</span>}
                    </span>
                    <div className="order-controls">
                      <button
                        onClick={() => moveCaptainUp(index)}
                        disabled={index === 0}
                        className="order-btn"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveCaptainDown(index)}
                        disabled={index === captainOrder.length - 1}
                        className="order-btn"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="draft-info">
              <h4>드래프트 방식</h4>
              <p>스네이크 드래프트 (4라운드)</p>
              <small>1R: 1→2→3→4→5 / 2R: 5→4→3→2→1 / 3R: 1→2→3→4→5 / 4R: 5→4→3→2→1</small>
            </div>

            {tiers.length === 0 || Object.values(tierPlayers).every(arr => arr.length === 0) ? (
              <div className="tier-warning">
                티어에 배치된 플레이어가 없습니다. 티어 설정 페이지에서 플레이어를 배치해주세요.
              </div>
            ) : null}

            <button
              className="start-btn"
              onClick={initializeDraft}
              disabled={!selectedCaptain}
            >
              드래프트 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTeamIdx = getCurrentTeamIndex();
  const currentTeam = currentTeamIdx >= 0 ? teams[currentTeamIdx] : null;

  return (
    <div className="mock-draft">
      <div className="simulation-header">
        <div className="header-info">
          <h2>모의 드래프트</h2>
          {gameState === 'drafting' && currentTeam && (
            <div className="current-turn">
              <span
                className="turn-indicator"
                style={{ backgroundColor: TEAM_COLORS[currentTeamIdx] }}
              />
              <span>
                {currentTeam.captain.name} 팀장의 차례
                {currentTeamIdx === userTeamIndex && <span className="your-turn-badge">YOUR TURN</span>}
              </span>
              <span className="pick-counter">
                ({currentPickIndex + 1}/{draftOrder.length} 픽)
              </span>
            </div>
          )}
          {gameState === 'complete' && (
            <div className="complete-banner">드래프트 완료!</div>
          )}
        </div>
        <button className="reset-btn" onClick={handleReset}>
          다시 시작
        </button>
      </div>

      <div className="simulation-content">
        <div className="teams-panel">
          {teams.map((team, index) => (
            <DraftBoard
              key={team.captain.id}
              team={team}
              positions={positions}
              teamName={`${team.captain.name} 팀${index === userTeamIndex ? ' (YOU)' : ''}`}
              teamColor={TEAM_COLORS[index]}
              isActive={index === currentTeamIdx}
            />
          ))}
        </div>

        <div className="player-panel">
          <div className="player-list-wrapper">
            <h4>선수 목록</h4>
            {gameState === 'drafting' && isUserTurn() && (
              <div className="available-positions">
                선택 가능: {getAvailablePositions().map(p => p.name).join(', ')}
              </div>
            )}
            {gameState === 'drafting' && !isUserTurn() && (
              <div className="waiting-message">
                AI가 선택 중...
              </div>
            )}
            <PlayerList
              players={players}
              onSelectPlayer={(player) => handleSelectPlayer(player, false)}
              draftedPlayers={getAllDraftedPlayers()}
              positions={positions}
              disabled={!isUserTurn()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockDraft;

import { useState, useEffect } from 'react';
import PlayerList from '../components/PlayerList';
import DraftBoard from '../components/DraftBoard';
import playersData from '../data/players.json';
import './SimulationMode.css';

const TEAM_COLORS = ['#00ff88', '#ff6b6b', '#4ecdc4', '#f9ca24', '#a29bfe'];

function SimulationMode() {
  const { players, positions, captains } = playersData;
  const [gameState, setGameState] = useState('setup'); // setup, drafting, complete
  const [captainOrder, setCaptainOrder] = useState([...captains]);
  const [teams, setTeams] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [draftOrder, setDraftOrder] = useState([]);
  const [draftType, setDraftType] = useState('snake'); // 'snake' or 'linear'
  const [customNames, setCustomNames] = useState({});
  const [draggedCaptain, setDraggedCaptain] = useState(null);

  // Load custom names from localStorage
  useEffect(() => {
    const savedNames = localStorage.getItem('customPlayerNames');
    if (savedNames) {
      setCustomNames(JSON.parse(savedNames));
    }
  }, []);

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
    // Initialize empty teams for each captain
    const initialTeams = captainOrder.map(captain => ({
      captain,
      TOP: null,
      MID: null,
      ADC: null,
      SUP: null
    }));
    setTeams(initialTeams);

    // Create draft order based on type
    const order = [];
    const numTeams = captainOrder.length;
    for (let round = 0; round < 4; round++) {
      if (draftType === 'snake') {
        // Snake draft: 1→2→3→4→5, 5→4→3→2→1, ...
        if (round % 2 === 0) {
          for (let team = 0; team < numTeams; team++) {
            order.push({ teamIndex: team, round });
          }
        } else {
          for (let team = numTeams - 1; team >= 0; team--) {
            order.push({ teamIndex: team, round });
          }
        }
      } else {
        // Linear draft: 1→2→3→4→5, 1→2→3→4→5, ...
        for (let team = 0; team < numTeams; team++) {
          order.push({ teamIndex: team, round });
        }
      }
    }
    setDraftOrder(order);
    setCurrentPickIndex(0);
    setGameState('drafting');
  };

  const handleSelectPlayer = (player) => {
    if (gameState !== 'drafting') return;

    const currentPick = draftOrder[currentPickIndex];
    const currentTeam = teams[currentPick.teamIndex];

    // Check if this position is already filled for this team
    if (currentTeam[player.position]) {
      alert(`이미 ${positions.find(p => p.id === player.position)?.name} 포지션이 선택되었습니다.`);
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
  };

  const handleReset = () => {
    setGameState('setup');
    setTeams([]);
    setCurrentPickIndex(0);
    setDraftOrder([]);
  };

  // Drag handlers for captain order
  const handleCaptainDragStart = (e, index) => {
    setDraggedCaptain(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCaptainDragEnd = () => {
    setDraggedCaptain(null);
  };

  const handleCaptainDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCaptainDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedCaptain === null || draggedCaptain === targetIndex) return;

    const newOrder = [...captainOrder];
    const [draggedItem] = newOrder.splice(draggedCaptain, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setCaptainOrder(newOrder);
    setDraggedCaptain(null);
  };

  const getAllDraftedPlayers = () => {
    return teams.flatMap(team =>
      [team.TOP, team.MID, team.ADC, team.SUP].filter(p => p !== null)
    );
  };

  const getCurrentTeamIndex = () => {
    if (gameState !== 'drafting' || currentPickIndex >= draftOrder.length) return -1;
    return draftOrder[currentPickIndex].teamIndex;
  };

  const getAvailablePositions = () => {
    if (gameState !== 'drafting') return [];
    const currentTeam = teams[getCurrentTeamIndex()];
    if (!currentTeam) return [];
    return positions.filter(pos => !currentTeam[pos.id]);
  };

  if (gameState === 'setup') {
    return (
      <div className="simulation-mode">
        <div className="setup-container">
          <h2>드래프트 시뮬레이션</h2>
          <p>팀장들의 드래프트 순서를 설정하고 시작하세요</p>

          <div className="setup-form">
            <div className="form-group">
              <label>드래프트 방식</label>
              <div className="draft-type-buttons">
                <button
                  className={`draft-type-btn ${draftType === 'snake' ? 'active' : ''}`}
                  onClick={() => setDraftType('snake')}
                >
                  스네이크
                </button>
                <button
                  className={`draft-type-btn ${draftType === 'linear' ? 'active' : ''}`}
                  onClick={() => setDraftType('linear')}
                >
                  정방향
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>드래프트 순서 설정</label>
              <div className="captain-order-list">
                {captainOrder.map((captain, index) => (
                  <div
                    key={captain.id}
                    className={`captain-order-item ${draggedCaptain === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleCaptainDragStart(e, index)}
                    onDragEnd={handleCaptainDragEnd}
                    onDragOver={handleCaptainDragOver}
                    onDrop={(e) => handleCaptainDrop(e, index)}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    <span className="order-number">{index + 1}</span>
                    <span className="captain-name">{captain.name}</span>
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
              <p>{draftType === 'snake' ? '스네이크 드래프트' : '정방향 드래프트'} (4라운드)</p>
              <small>
                {draftType === 'snake'
                  ? '1R: 1→2→3→4→5 / 2R: 5→4→3→2→1 / 3R: 1→2→3→4→5 / 4R: 5→4→3→2→1'
                  : '1R: 1→2→3→4→5 / 2R: 1→2→3→4→5 / 3R: 1→2→3→4→5 / 4R: 1→2→3→4→5'}
              </small>
            </div>

            <button className="start-btn" onClick={initializeDraft}>
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
    <div className="simulation-mode">
      <div className="simulation-header">
        <div className="header-info">
          <h2>드래프트 시뮬레이션</h2>
          {gameState === 'drafting' && currentTeam && (
            <div className="current-turn">
              <span
                className="turn-indicator"
                style={{ backgroundColor: TEAM_COLORS[currentTeamIdx] }}
              />
              <span>{currentTeam.captain.name} 팀장의 차례</span>
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
              teamName={`${team.captain.name} 팀`}
              teamColor={TEAM_COLORS[index]}
              isActive={index === currentTeamIdx}
              customNames={customNames}
            />
          ))}
        </div>

        <div className="player-panel">
          <div className="player-list-wrapper">
            <h4>선수 목록</h4>
            {gameState === 'drafting' && (
              <div className="available-positions">
                선택 가능: {getAvailablePositions().map(p => p.name).join(', ')}
              </div>
            )}
            <PlayerList
              players={players}
              onSelectPlayer={handleSelectPlayer}
              draftedPlayers={getAllDraftedPlayers()}
              positions={positions}
              customNames={customNames}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulationMode;

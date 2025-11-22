import { useState, useEffect } from 'react';
import playersData from '../data/players.json';
import './TierRanking.css';

const POSITION_COLORS = {
  TOP: '#ff6b6b',
  JGL: '#4ecdc4',
  MID: '#45b7d1',
  ADC: '#f9ca24',
  SUP: '#a29bfe'
};

const DEFAULT_TIERS = [
  { id: 'tier-s', name: 'S', color: '#ff7f7f' },
  { id: 'tier-a', name: 'A', color: '#ffbf7f' },
  { id: 'tier-b', name: 'B', color: '#ffdf7f' },
  { id: 'tier-c', name: 'C', color: '#7fff7f' },
  { id: 'tier-d', name: 'D', color: '#7fbfff' }
];

function TierRanking() {
  const { players, positions } = playersData;
  const [tiers, setTiers] = useState([]);
  const [tierPlayers, setTierPlayers] = useState({});
  const [unrankedPlayers, setUnrankedPlayers] = useState([]);
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [editingTier, setEditingTier] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [customNames, setCustomNames] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('tierListData');
    if (savedData) {
      const { tiers: savedTiers, tierPlayers: savedTierPlayers, unrankedPlayers: savedUnranked } = JSON.parse(savedData);
      setTiers(savedTiers);
      setTierPlayers(savedTierPlayers);
      setUnrankedPlayers(savedUnranked);
    } else {
      // Initialize with defaults
      setTiers(DEFAULT_TIERS);
      const initialTierPlayers = {};
      DEFAULT_TIERS.forEach(tier => {
        initialTierPlayers[tier.id] = [];
      });
      setTierPlayers(initialTierPlayers);
      setUnrankedPlayers(players.map(p => p.id));
    }
  }, [players]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (tiers.length > 0) {
      localStorage.setItem('tierListData', JSON.stringify({
        tiers,
        tierPlayers,
        unrankedPlayers
      }));
    }
  }, [tiers, tierPlayers, unrankedPlayers]);

  // Load custom names from localStorage
  useEffect(() => {
    const savedNames = localStorage.getItem('customPlayerNames');
    if (savedNames) {
      setCustomNames(JSON.parse(savedNames));
    }
  }, []);

  // Save custom names to localStorage
  useEffect(() => {
    if (Object.keys(customNames).length > 0) {
      localStorage.setItem('customPlayerNames', JSON.stringify(customNames));
    }
  }, [customNames]);

  // Drag handlers
  const handleDragStart = (e, playerId) => {
    setDraggedPlayer(playerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTier = (e, tierId) => {
    e.preventDefault();
    if (!draggedPlayer) return;

    // Remove from current location
    const newTierPlayers = { ...tierPlayers };
    Object.keys(newTierPlayers).forEach(key => {
      newTierPlayers[key] = newTierPlayers[key].filter(id => id !== draggedPlayer);
    });
    const newUnranked = unrankedPlayers.filter(id => id !== draggedPlayer);

    // Add to new tier
    if (!newTierPlayers[tierId]) {
      newTierPlayers[tierId] = [];
    }
    newTierPlayers[tierId].push(draggedPlayer);

    setTierPlayers(newTierPlayers);
    setUnrankedPlayers(newUnranked);
    setDraggedPlayer(null);
  };

  const handleDropOnUnranked = (e) => {
    e.preventDefault();
    if (!draggedPlayer) return;

    // Remove from tiers
    const newTierPlayers = { ...tierPlayers };
    Object.keys(newTierPlayers).forEach(key => {
      newTierPlayers[key] = newTierPlayers[key].filter(id => id !== draggedPlayer);
    });

    // Add to unranked if not already there
    if (!unrankedPlayers.includes(draggedPlayer)) {
      setUnrankedPlayers([...unrankedPlayers.filter(id => id !== draggedPlayer), draggedPlayer]);
    }

    setTierPlayers(newTierPlayers);
    setDraggedPlayer(null);
  };

  // Player name editing
  const handlePlayerDoubleClick = (playerId, currentName) => {
    setEditingPlayer(playerId);
    setEditingPlayerName(customNames[playerId] || currentName);
  };

  const handlePlayerNameChange = (e) => {
    setEditingPlayerName(e.target.value);
  };

  const handlePlayerNameSave = (playerId) => {
    if (editingPlayerName.trim()) {
      setCustomNames({
        ...customNames,
        [playerId]: editingPlayerName.trim()
      });
    }
    setEditingPlayer(null);
    setEditingPlayerName('');
  };

  const handlePlayerNameKeyDown = (e, playerId) => {
    if (e.key === 'Enter') {
      handlePlayerNameSave(playerId);
    } else if (e.key === 'Escape') {
      setEditingPlayer(null);
      setEditingPlayerName('');
    }
  };

  const getDisplayName = (player) => {
    return customNames[player.id] || player.name;
  };

  // Tier management
  const addTier = () => {
    const newTierId = `tier-${Date.now()}`;
    const newTier = {
      id: newTierId,
      name: `티어 ${tiers.length + 1}`,
      color: '#888888'
    };
    setTiers([...tiers, newTier]);
    setTierPlayers({ ...tierPlayers, [newTierId]: [] });
  };

  const removeTier = (tierId) => {
    // Move players back to unranked
    const playersToMove = tierPlayers[tierId] || [];
    setUnrankedPlayers([...unrankedPlayers, ...playersToMove]);

    // Remove tier
    setTiers(tiers.filter(t => t.id !== tierId));
    const newTierPlayers = { ...tierPlayers };
    delete newTierPlayers[tierId];
    setTierPlayers(newTierPlayers);
  };

  const startEditingTier = (tier) => {
    setEditingTier(tier.id);
    setEditingName(tier.name);
  };

  const saveTierName = (tierId) => {
    setTiers(tiers.map(t =>
      t.id === tierId ? { ...t, name: editingName || t.name } : t
    ));
    setEditingTier(null);
    setEditingName('');
  };

  const updateTierColor = (tierId, color) => {
    setTiers(tiers.map(t =>
      t.id === tierId ? { ...t, color } : t
    ));
  };

  const resetAll = () => {
    setTiers(DEFAULT_TIERS);
    const initialTierPlayers = {};
    DEFAULT_TIERS.forEach(tier => {
      initialTierPlayers[tier.id] = [];
    });
    setTierPlayers(initialTierPlayers);
    setUnrankedPlayers(players.map(p => p.id));
  };

  const getPlayerById = (id) => {
    return players.find(p => p.id === id);
  };

  const filterPlayers = (playerIds) => {
    if (filterPosition === 'ALL') return playerIds;
    return playerIds.filter(id => {
      const player = getPlayerById(id);
      return player && player.position === filterPosition;
    });
  };

  const renderPlayerCard = (playerId) => {
    const player = getPlayerById(playerId);
    if (!player) return null;

    if (filterPosition !== 'ALL' && player.position !== filterPosition) {
      return null;
    }

    return (
      <div
        key={player.id}
        className={`player-card ${draggedPlayer === player.id ? 'dragging' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(e, player.id)}
        onDragEnd={handleDragEnd}
      >
        <span
          className="position-badge"
          style={{ backgroundColor: POSITION_COLORS[player.position] }}
        >
          {player.position}
        </span>
        {editingPlayer === player.id ? (
          <input
            type="text"
            className="player-name-input"
            value={editingPlayerName}
            onChange={handlePlayerNameChange}
            onKeyDown={(e) => handlePlayerNameKeyDown(e, player.id)}
            onBlur={() => handlePlayerNameSave(player.id)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="player-name"
            onDoubleClick={() => handlePlayerDoubleClick(player.id, player.name)}
            title="더블클릭하여 이름 수정"
          >
            {getDisplayName(player)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="tier-ranking">
      <div className="tier-container">
        <h2>플레이어 티어 리스트</h2>
        <p>플레이어들을 티어에 드래그하여 배치하세요. 같은 티어 내에서는 동등하게 취급됩니다. </p>
        <p>플레이어 카드의 이름 부분을 더블클릭하여 이름을 변경할 수도 있습니다.</p>

        <div className="tier-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterPosition === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterPosition('ALL')}
            >
              전체
            </button>
            {positions.map(pos => (
              <button
                key={pos.id}
                className={`filter-btn ${filterPosition === pos.id ? 'active' : ''}`}
                onClick={() => setFilterPosition(pos.id)}
                style={{
                  '--pos-color': POSITION_COLORS[pos.id]
                }}
              >
                {pos.name}
              </button>
            ))}
          </div>
          <div className="control-buttons">
            <button className="add-tier-btn" onClick={addTier}>
              + 티어 추가
            </button>
            <button className="reset-btn" onClick={resetAll}>
              초기화
            </button>
          </div>
        </div>

        <div className="tier-list-container">
          {tiers.map(tier => (
            <div key={tier.id} className="tier-row">
              <div
                className="tier-label"
                style={{ backgroundColor: tier.color }}
              >
                {editingTier === tier.id ? (
                  <input
                    type="text"
                    className="tier-name-input"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveTierName(tier.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTierName(tier.id);
                      if (e.key === 'Escape') {
                        setEditingTier(null);
                        setEditingName('');
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="tier-name"
                    onClick={() => startEditingTier(tier)}
                    title="클릭하여 이름 변경"
                  >
                    {tier.name}
                  </span>
                )}
                <div className="tier-actions">
                  <input
                    type="color"
                    value={tier.color}
                    onChange={(e) => updateTierColor(tier.id, e.target.value)}
                    className="color-picker"
                    title="색상 변경"
                  />
                  <button
                    className="remove-tier-btn"
                    onClick={() => removeTier(tier.id)}
                    title="티어 삭제"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div
                className="tier-content"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnTier(e, tier.id)}
              >
                {(tierPlayers[tier.id] || []).map(playerId => renderPlayerCard(playerId))}
              </div>
            </div>
          ))}
        </div>

        <div className="unranked-section">
          <h3>미분류 플레이어</h3>
          <div
            className="unranked-pool"
            onDragOver={handleDragOver}
            onDrop={handleDropOnUnranked}
          >
            {unrankedPlayers.map(playerId => renderPlayerCard(playerId))}
            {filterPlayers(unrankedPlayers).length === 0 && (
              <div className="empty-message">
                {unrankedPlayers.length === 0
                  ? '모든 플레이어가 배치되었습니다'
                  : '해당 포지션의 미분류 플레이어가 없습니다'}
              </div>
            )}
          </div>
        </div>

        <div className="tier-info">
          <p>티어 이름을 클릭하여 변경할 수 있습니다. AI는 높은 티어의 플레이어를 우선 선택합니다.</p>
        </div>
      </div>
    </div>
  );
}

export default TierRanking;

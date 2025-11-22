import { useState } from 'react';
  import PlayerCard from './PlayerCard';
  import './PlayerList.css';

  function PlayerList({ players, onSelectPlayer, draftedPlayers = [], positions, disabled = false, customNames = {} }) {
    const [filterPosition, setFilterPosition] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPlayers = players.filter(player => {
      const positionMatch = filterPosition === 'ALL' || player.position === filterPosition;
      const displayName = customNames[player.id] || player.name;
      const searchMatch = displayName.toLowerCase().includes(searchTerm.toLowerCase());
      return positionMatch && searchMatch;
    });

    const isDrafted = (playerId) => draftedPlayers.some(p => p && p.id === playerId);
    const isDisabled = (playerId) => disabled || isDrafted(playerId);

    return (
      <div className="player-list">
        <div className="filters">
          <input
            type="text"
            placeholder="선수 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="position-filter-buttons">
            <button
              className={`position-filter-btn ${filterPosition === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterPosition('ALL')}
            >
              전체
            </button>
            {positions.map(pos => (
              <button
                key={pos.id}
                className={`position-filter-btn ${filterPosition === pos.id ? 'active' : ''}`}
                onClick={() => setFilterPosition(pos.id)}
              >
                {pos.name}
              </button>
            ))}
          </div>
        </div>

        <div className="players-grid">
          {filteredPlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onSelect={onSelectPlayer}
              disabled={isDisabled(player.id)}
              customNames={customNames}
            />
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="no-results">
            검색 결과가 없습니다
          </div>
        )}
      </div>
    );
  }

  export default PlayerList;
import './PlayerCard.css';

  function PlayerCard({ player, onSelect, disabled, selected, customNames = {} }) {
    const positionColors = {
      TOP: '#ff6b6b',
      JGL: '#4ecdc4',
      MID: '#45b7d1',
      ADC: '#f9ca24',
      SUP: '#a29bfe'
    };

    const displayName = customNames[player.id] || player.name;

    return (
      <div
        className={`player-card ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}`}
        onClick={() => !disabled && onSelect && onSelect(player)}
      >
        <div
          className="position-badge"
          style={{ backgroundColor: positionColors[player.position] }}
        >
          {player.position}
        </div>
        <div className="player-info">
          <h4 className="player-name">{displayName}</h4>
          <p className="player-team">{player.team}</p>
        </div>
      </div>
    );
  }

  export default PlayerCard;
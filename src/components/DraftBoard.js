import './DraftBoard.css';

  function DraftBoard({ team, positions, teamName = "나의 팀", teamColor = "#00ff88", isActive = false, customNames = {} }) {
    return (
      <div className={`draft-board ${isActive ? 'active' : ''}`}>
        <div className="board-header" style={{ borderColor: teamColor }}>
          <h3>{teamName}</h3>
          {isActive && <span className="active-badge">선택 중</span>}
        </div>
        <div className="slots">
          {positions.map(pos => {
            const player = team[pos.id];
            const displayName = player ? (customNames[player.id] || player.name) : null;
            return (
              <div key={pos.id} className={`slot ${player ? 'filled' : ''}`}>
                <div className="slot-position">{pos.name}</div>
                {player ? (
                  <div className="slot-player">
                    <span className="slot-player-name">{displayName}</span>
                  </div>
                ) : (
                  <div className="slot-empty">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  export default DraftBoard;
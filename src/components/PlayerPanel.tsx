import type { Player, TerritoryState, PlayerId, ContinentDefinition } from '../engine/types';

interface PlayerPanelProps {
  players: Player[];
  territories: Record<string, TerritoryState>;
  continents: ContinentDefinition[];
  currentPlayerIndex: PlayerId;
}

export function PlayerPanel({
  players,
  territories,
  continents,
  currentPlayerIndex,
}: PlayerPanelProps) {
  return (
    <div className="player-panel">
      <h3>Players</h3>
      {players.map((player) => {
        const owned = Object.values(territories).filter(
          (t) => t.owner === player.id
        );
        const totalArmies = owned.reduce((sum, t) => sum + t.armies, 0);
        const ownedContinents = continents.filter((c) =>
          c.territoryIds.every((tid) => territories[tid]?.owner === player.id)
        );
        const isCurrent = player.id === currentPlayerIndex;

        return (
          <div
            key={player.id}
            className={`player-card ${isCurrent ? 'current' : ''} ${player.isEliminated ? 'eliminated' : ''}`}
            style={{ borderLeftColor: player.color }}
          >
            <div className="player-header">
              <span
                className="player-dot"
                style={{ background: player.color }}
              />
              <span className="player-name">{player.name}</span>
              {player.type === 'ai' && <span className="ai-badge">AI</span>}
              {player.isEliminated && <span className="eliminated-badge">OUT</span>}
            </div>
            {!player.isEliminated && (
              <div className="player-stats">
                <div>{owned.length} territories</div>
                <div>{totalArmies} armies</div>
                {ownedContinents.length > 0 && (
                  <div className="continent-bonuses">
                    {ownedContinents.map((c) => (
                      <span key={c.id} className="continent-tag">
                        {c.name} (+{c.bonus})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import type { Player, Phase } from '../engine/types';

interface TurnIndicatorProps {
  player: Player;
  phase: Phase;
  turnNumber: number;
  reinforcementsRemaining: number;
}

const PHASE_LABELS: Record<Phase, string> = {
  reinforce: 'Reinforce',
  attack: 'Attack',
  fortify: 'Fortify',
};

export function TurnIndicator({
  player,
  phase,
  turnNumber,
  reinforcementsRemaining,
}: TurnIndicatorProps) {
  return (
    <div className="turn-indicator">
      <div className="turn-info">
        <span className="turn-number">Turn {turnNumber}</span>
        <span className="phase-badge" style={{ background: player.color }}>
          {PHASE_LABELS[phase]}
        </span>
      </div>
      <div className="current-player">
        <span
          className="player-dot"
          style={{ background: player.color }}
        />
        <span className="player-name">{player.name}'s Turn</span>
        {player.type === 'ai' && <span className="ai-badge">AI</span>}
      </div>
      {phase === 'reinforce' && reinforcementsRemaining > 0 && (
        <div className="reinforcements-info">
          {reinforcementsRemaining} armies to place
        </div>
      )}
    </div>
  );
}

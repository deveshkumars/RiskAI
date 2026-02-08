import type { Player } from '../engine/types';

interface GameOverScreenProps {
  winner: Player;
  onNewGame: () => void;
}

export function GameOverScreen({ winner, onNewGame }: GameOverScreenProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h2>Game Over!</h2>
        <div className="winner-info">
          <span
            className="winner-dot"
            style={{ background: winner.color }}
          />
          <span className="winner-name">{winner.name} Wins!</span>
        </div>
        <button className="start-btn" onClick={onNewGame}>
          New Game
        </button>
      </div>
    </div>
  );
}

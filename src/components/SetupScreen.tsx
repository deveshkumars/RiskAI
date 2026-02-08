import { useState } from 'react';
import type { Player, PlayerId } from '../engine/types';
import { PLAYER_COLORS, PLAYER_NAMES } from '../engine/constants';

interface SetupScreenProps {
  onStartGame: (players: Player[]) => void;
}

export function SetupScreen({ onStartGame }: SetupScreenProps) {
  const [playerTypes, setPlayerTypes] = useState<Array<'human' | 'ai'>>([
    'human',
    'ai',
    'ai',
  ]);
  const [playerNames, setPlayerNames] = useState<string[]>([
    ...PLAYER_NAMES,
  ]);

  const handleStart = () => {
    const players: Player[] = playerTypes.map((type, i) => ({
      id: i as PlayerId,
      name: playerNames[i] || PLAYER_NAMES[i],
      color: PLAYER_COLORS[i],
      type,
      isEliminated: false,
    }));
    onStartGame(players);
  };

  return (
    <div className="setup-screen">
      <h1>Risk</h1>
      <h2>Territory Control Board Game</h2>

      <div className="setup-players">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="setup-player"
            style={{ borderLeftColor: PLAYER_COLORS[i] }}
          >
            <div className="setup-player-header">
              <span
                className="player-dot"
                style={{ background: PLAYER_COLORS[i] }}
              />
              <input
                className="player-name-input"
                value={playerNames[i]}
                onChange={(e) => {
                  const names = [...playerNames];
                  names[i] = e.target.value;
                  setPlayerNames(names);
                }}
              />
            </div>
            <div className="setup-type-toggle">
              <button
                className={`type-btn ${playerTypes[i] === 'human' ? 'active' : ''}`}
                onClick={() => {
                  const types = [...playerTypes];
                  types[i] = 'human';
                  setPlayerTypes(types);
                }}
              >
                Human
              </button>
              <button
                className={`type-btn ${playerTypes[i] === 'ai' ? 'active' : ''}`}
                onClick={() => {
                  const types = [...playerTypes];
                  types[i] = 'ai';
                  setPlayerTypes(types);
                }}
              >
                AI
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="start-btn" onClick={handleStart}>
        Start Game
      </button>
    </div>
  );
}

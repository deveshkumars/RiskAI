import { useEffect, useRef } from 'react';
import type { LogEntry, Player } from '../engine/types';

interface GameLogProps {
  logs: LogEntry[];
  players: Player[];
}

export function GameLog({ logs, players }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const recentLogs = logs.slice(-50);

  return (
    <div className="game-log">
      <h3>Game Log</h3>
      <div className="log-entries">
        {recentLogs.map((log, i) => (
          <div key={i} className="log-entry">
            <span
              className="log-dot"
              style={{ background: players[log.playerIndex]?.color ?? '#888' }}
            />
            <span className="log-message">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

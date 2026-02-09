import type {
  GameState,
  GameAction,
  MapData,
} from '../engine/types';
import { DiceDisplay } from './DiceDisplay';

interface ActionPanelProps {
  state: GameState;
  mapData: MapData;
  validActions: GameAction[];
  selectedTerritory: string | null;
  onAction: (action: GameAction) => void;
  isHumanTurn: boolean;
  aiThought?: string | null;
}

export function ActionPanel({
  state,
  mapData,
  validActions,
  selectedTerritory,
  onAction,
  isHumanTurn,
  aiThought,
}: ActionPanelProps) {
  const { phase, reinforcementsRemaining, lastCombatResult } = state;
  const getName = (id: string) =>
    mapData.territories.find((t) => t.id === id)?.name ?? id;

  if (!isHumanTurn) {
    return (
      <div className="action-panel">
        <div className="ai-thinking">AI is thinking...</div>
        {aiThought && (
          <div className="ai-thought-bubble">
            <span className="ai-thought-icon">💭</span>
            <span className="ai-thought-text">{aiThought}</span>
          </div>
        )}
        {lastCombatResult && <DiceDisplay combat={lastCombatResult} />}
      </div>
    );
  }

  if (phase === 'reinforce') {
    return (
      <div className="action-panel">
        <h3>Reinforce Phase</h3>
        <p>Click a territory you own to place armies. ({reinforcementsRemaining} remaining)</p>
        {selectedTerritory &&
          state.territories[selectedTerritory]?.owner === state.currentPlayerIndex && (
            <div className="action-buttons">
              {[1, Math.ceil(reinforcementsRemaining / 2), reinforcementsRemaining]
                .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                .map((count) => (
                  <button
                    key={count}
                    className="action-btn"
                    onClick={() =>
                      onAction({
                        type: 'reinforce',
                        territoryId: selectedTerritory,
                        armies: count,
                      })
                    }
                  >
                    +{count} on {getName(selectedTerritory)}
                  </button>
                ))}
            </div>
          )}
      </div>
    );
  }

  if (phase === 'attack') {
    return (
      <div className="action-panel">
        <h3>Attack Phase</h3>
        <p>Select one of your territories to attack from, then click an enemy neighbor.</p>
        {selectedTerritory && (
          <div className="selected-info">
            Selected: {getName(selectedTerritory)} (
            {state.territories[selectedTerritory]?.armies ?? 0} armies)
          </div>
        )}
        {selectedTerritory && (
          <div className="attack-targets">
            {validActions
              .filter(
                (a) => a.type === 'attack' && a.from === selectedTerritory
              )
              .map((a) => {
                if (a.type !== 'attack') return null;
                return (
                  <button
                    key={a.to}
                    className="action-btn attack-btn"
                    onClick={() => onAction(a)}
                  >
                    Attack {getName(a.to)} (
                    {state.territories[a.to]?.armies ?? 0}) with {a.attackDice}{' '}
                    dice
                  </button>
                );
              })}
          </div>
        )}
        <button
          className="action-btn skip-btn"
          onClick={() => onAction({ type: 'skip_phase' })}
        >
          End Attacks
        </button>
        {lastCombatResult && <DiceDisplay combat={lastCombatResult} />}
      </div>
    );
  }

  if (phase === 'fortify') {
    return (
      <div className="action-panel">
        <h3>Fortify Phase</h3>
        <p>Select a territory to move armies from, then click a connected territory.</p>
        {selectedTerritory && (
          <div className="selected-info">
            Selected: {getName(selectedTerritory)} (
            {state.territories[selectedTerritory]?.armies ?? 0} armies)
          </div>
        )}
        {selectedTerritory && (
          <div className="fortify-targets">
            {validActions
              .filter(
                (a) => a.type === 'fortify' && a.from === selectedTerritory
              )
              .map((a) => {
                if (a.type !== 'fortify') return null;
                return (
                  <button
                    key={a.to}
                    className="action-btn fortify-btn"
                    onClick={() => onAction(a)}
                  >
                    Move {a.armies} to {getName(a.to)}
                  </button>
                );
              })}
          </div>
        )}
        <button
          className="action-btn skip-btn"
          onClick={() => onAction({ type: 'skip_phase' })}
        >
          Skip Fortify
        </button>
      </div>
    );
  }

  return null;
}

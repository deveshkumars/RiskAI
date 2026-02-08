import type { CombatResult } from '../engine/types';

interface DiceDisplayProps {
  combat: CombatResult | null;
}

function Die({ value, color }: { value: number; color: string }) {
  return (
    <span className="die" style={{ background: color }}>
      {value}
    </span>
  );
}

export function DiceDisplay({ combat }: DiceDisplayProps) {
  if (!combat) return null;

  return (
    <div className="dice-display">
      <div className="dice-row">
        <span className="dice-label">Attacker:</span>
        {combat.attackerDice.map((v, i) => (
          <Die key={i} value={v} color="#e74c3c" />
        ))}
        <span className="dice-loss">-{combat.attackerLosses}</span>
      </div>
      <div className="dice-row">
        <span className="dice-label">Defender:</span>
        {combat.defenderDice.map((v, i) => (
          <Die key={i} value={v} color="#3498db" />
        ))}
        <span className="dice-loss">-{combat.defenderLosses}</span>
      </div>
      {combat.territoryConquered && (
        <div className="conquest-banner">Territory Conquered!</div>
      )}
    </div>
  );
}

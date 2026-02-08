import { DICE_SIDES } from './constants';

export interface CombatRollResult {
  attackerRolls: number[];
  defenderRolls: number[];
  attackerLosses: number;
  defenderLosses: number;
}

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * DICE_SIDES) + 1
  ).sort((a, b) => b - a);
}

export function resolveCombat(
  attackDiceCount: number,
  defendArmies: number
): CombatRollResult {
  const defendDiceCount = Math.min(2, defendArmies);
  const attackerRolls = rollDice(attackDiceCount);
  const defenderRolls = rollDice(defendDiceCount);

  let attackerLosses = 0;
  let defenderLosses = 0;
  const comparisons = Math.min(attackerRolls.length, defenderRolls.length);

  for (let i = 0; i < comparisons; i++) {
    if (attackerRolls[i] > defenderRolls[i]) {
      defenderLosses++;
    } else {
      attackerLosses++; // ties go to defender
    }
  }

  return { attackerRolls, defenderRolls, attackerLosses, defenderLosses };
}

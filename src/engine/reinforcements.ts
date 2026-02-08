import type { PlayerId, TerritoryState, ContinentDefinition } from './types';
import { MIN_REINFORCEMENTS } from './constants';

export function calculateReinforcements(
  playerId: PlayerId,
  territories: Record<string, TerritoryState>,
  continents: ContinentDefinition[]
): number {
  const ownedTerritories = Object.values(territories).filter(
    (t) => t.owner === playerId
  ).length;

  let reinforcements = Math.max(MIN_REINFORCEMENTS, Math.floor(ownedTerritories / 3));

  // Continent bonuses
  for (const continent of continents) {
    const ownsAll = continent.territoryIds.every(
      (tid) => territories[tid]?.owner === playerId
    );
    if (ownsAll) {
      reinforcements += continent.bonus;
    }
  }

  return reinforcements;
}

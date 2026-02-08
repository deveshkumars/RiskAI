import type { Player, PlayerId, TerritoryState, MapData } from './types';
import { INITIAL_ARMIES_PER_PLAYER } from './constants';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function distributeTerritories(
  players: Player[],
  mapData: MapData
): Record<string, TerritoryState> {
  const territoryIds = shuffle(mapData.territories.map((t) => t.id));
  const territories: Record<string, TerritoryState> = {};

  // Round-robin distribution
  territoryIds.forEach((tid, index) => {
    const playerId = (index % players.length) as PlayerId;
    territories[tid] = { owner: playerId, armies: 1 };
  });

  // Distribute remaining armies randomly across owned territories
  for (const player of players) {
    const owned = Object.entries(territories)
      .filter(([, t]) => t.owner === player.id)
      .map(([id]) => id);

    let remaining = INITIAL_ARMIES_PER_PLAYER - owned.length;
    while (remaining > 0) {
      const randomTerritory = owned[Math.floor(Math.random() * owned.length)];
      territories[randomTerritory].armies++;
      remaining--;
    }
  }

  return territories;
}

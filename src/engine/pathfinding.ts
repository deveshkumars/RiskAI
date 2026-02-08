import type { PlayerId, TerritoryState } from './types';

/**
 * BFS to check if two territories are connected through
 * territories owned by the same player.
 */
export function areConnected(
  from: string,
  to: string,
  owner: PlayerId,
  territories: Record<string, TerritoryState>,
  adjacency: Record<string, string[]>
): boolean {
  if (from === to) return true;

  const visited = new Set<string>();
  const queue: string[] = [from];
  visited.add(from);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency[current] || [];

    for (const neighbor of neighbors) {
      if (neighbor === to) return true;
      if (!visited.has(neighbor) && territories[neighbor]?.owner === owner) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

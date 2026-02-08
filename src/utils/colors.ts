import type { PlayerId } from '../engine/types';
import { PLAYER_COLORS } from '../engine/constants';

export function getPlayerColor(playerId: PlayerId): string {
  return PLAYER_COLORS[playerId];
}

export function getPlayerColorWithAlpha(playerId: PlayerId, alpha: number): string {
  const hex = PLAYER_COLORS[playerId];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

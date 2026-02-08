import type { GameState, GameAction, MapData, SerializedGameState } from './types';

function actionToString(action: GameAction, state: GameState, mapData: MapData): string {
  const getName = (id: string) =>
    mapData.territories.find((t) => t.id === id)?.name ?? id;

  switch (action.type) {
    case 'reinforce':
      return `Place ${action.armies} army/armies on ${getName(action.territoryId)}`;
    case 'attack': {
      const fromArmies = state.territories[action.from]?.armies ?? 0;
      const toArmies = state.territories[action.to]?.armies ?? 0;
      return `Attack from ${getName(action.from)} (${fromArmies}) → ${getName(action.to)} (${toArmies}) with ${action.attackDice} dice`;
    }
    case 'fortify': {
      return `Fortify: move ${action.armies} from ${getName(action.from)} → ${getName(action.to)}`;
    }
    case 'skip_phase':
      return `Skip ${state.phase} phase`;
  }
}

export function serializeGameState(
  state: GameState,
  mapData: MapData,
  validActions: GameAction[]
): SerializedGameState {
  const lines: string[] = [];
  const player = state.players[state.currentPlayerIndex];

  lines.push('=== RISK GAME STATE ===');
  lines.push(
    `Turn: ${state.turnNumber} | Phase: ${state.phase.toUpperCase()} | Current Player: ${player.name} (${player.color})`
  );
  if (state.phase === 'reinforce') {
    lines.push(`Reinforcements remaining: ${state.reinforcementsRemaining}`);
  }
  lines.push('');

  // Players
  lines.push('--- PLAYERS ---');
  for (const p of state.players) {
    const territoryCount = Object.values(state.territories).filter(
      (t) => t.owner === p.id
    ).length;
    const armyCount = Object.values(state.territories)
      .filter((t) => t.owner === p.id)
      .reduce((sum, t) => sum + t.armies, 0);
    const marker = p.id === state.currentPlayerIndex ? ' [CURRENT TURN]' : '';
    const eliminated = p.isEliminated ? ' [ELIMINATED]' : '';
    lines.push(
      `${p.name}: ${territoryCount} territories, ${armyCount} armies${marker}${eliminated}`
    );
  }
  lines.push('');

  // Continents
  lines.push('--- CONTINENTS ---');
  for (const continent of mapData.continents) {
    const ownerCounts: Record<number, number> = {};
    for (const tid of continent.territoryIds) {
      const owner = state.territories[tid]?.owner;
      if (owner !== undefined) {
        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
      }
    }
    const total = continent.territoryIds.length;
    const parts: string[] = [];
    for (const p of state.players) {
      const count = ownerCounts[p.id] || 0;
      if (count > 0) {
        if (count === total) {
          parts.push(`${p.name} controls ALL (bonus +${continent.bonus} active!)`);
        } else {
          parts.push(`${p.name} ${count}/${total}`);
        }
      }
    }
    lines.push(`${continent.name} (bonus +${continent.bonus}): ${parts.join(', ')}`);
  }
  lines.push('');

  // Territories grouped by continent
  lines.push('--- TERRITORIES ---');
  for (const continent of mapData.continents) {
    lines.push(`[${continent.name}]`);
    for (const tid of continent.territoryIds) {
      const tDef = mapData.territories.find((t) => t.id === tid)!;
      const tState = state.territories[tid];
      const ownerName = state.players[tState.owner].name;
      const adjNames = tDef.adjacentTo
        .map((a) => mapData.territories.find((t) => t.id === a)?.name ?? a)
        .join(', ');
      lines.push(
        `  ${tDef.name}: ${ownerName}, ${tState.armies} armies (adjacent: ${adjNames})`
      );
    }
  }
  lines.push('');

  // Valid actions
  lines.push('--- VALID ACTIONS ---');
  validActions.forEach((action, i) => {
    lines.push(`${i + 1}. ${actionToString(action, state, mapData)}`);
  });
  lines.push('');
  lines.push(`Choose an action (1-${validActions.length}):`);

  // Last combat
  if (state.lastCombatResult) {
    const cr = state.lastCombatResult;
    const fromName =
      mapData.territories.find((t) => t.id === cr.attackingTerritory)?.name ?? cr.attackingTerritory;
    const toName =
      mapData.territories.find((t) => t.id === cr.defendingTerritory)?.name ?? cr.defendingTerritory;
    lines.push('');
    lines.push('--- LAST COMBAT ---');
    lines.push(
      `Attack from ${fromName} → ${toName}: [${cr.attackerDice.join(',')}] vs [${cr.defenderDice.join(',')}] → Attacker lost ${cr.attackerLosses}, Defender lost ${cr.defenderLosses}${cr.territoryConquered ? ' (CONQUERED!)' : ''}`
    );
  }

  const text = lines.join('\n');

  const json = JSON.stringify({
    turn: state.turnNumber,
    phase: state.phase,
    currentPlayer: state.currentPlayerIndex,
    reinforcementsRemaining: state.reinforcementsRemaining,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      eliminated: p.isEliminated,
    })),
    territories: state.territories,
    validActions,
    lastCombat: state.lastCombatResult,
  });

  return { text, json };
}

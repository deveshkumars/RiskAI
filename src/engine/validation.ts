import type {
  GameState,
  GameAction,
  ValidationResult,
  ReinforceAction,
  AttackAction,
  FortifyAction,
  MapData,
} from './types';
import { areConnected } from './pathfinding';

export function validateAction(
  state: GameState,
  action: GameAction,
  mapData: MapData
): ValidationResult {
  switch (action.type) {
    case 'reinforce':
      return validateReinforce(state, action);
    case 'attack':
      return validateAttack(state, action, mapData);
    case 'fortify':
      return validateFortify(state, action, mapData);
    case 'skip_phase':
      return validateSkip(state);
  }
}

function validateReinforce(
  state: GameState,
  action: ReinforceAction
): ValidationResult {
  if (state.phase !== 'reinforce') {
    return { valid: false, reason: 'Not in reinforce phase' };
  }

  const territory = state.territories[action.territoryId];
  if (!territory) {
    return { valid: false, reason: 'Territory does not exist' };
  }

  if (territory.owner !== state.currentPlayerIndex) {
    return { valid: false, reason: 'You do not own this territory' };
  }

  if (action.armies < 1) {
    return { valid: false, reason: 'Must place at least 1 army' };
  }

  if (action.armies > state.reinforcementsRemaining) {
    return { valid: false, reason: 'Not enough reinforcements remaining' };
  }

  return { valid: true };
}

function validateAttack(
  state: GameState,
  action: AttackAction,
  mapData: MapData
): ValidationResult {
  if (state.phase !== 'attack') {
    return { valid: false, reason: 'Not in attack phase' };
  }

  const fromTerritory = state.territories[action.from];
  const toTerritory = state.territories[action.to];

  if (!fromTerritory || !toTerritory) {
    return { valid: false, reason: 'Territory does not exist' };
  }

  if (fromTerritory.owner !== state.currentPlayerIndex) {
    return { valid: false, reason: 'You do not own the attacking territory' };
  }

  if (toTerritory.owner === state.currentPlayerIndex) {
    return { valid: false, reason: 'Cannot attack your own territory' };
  }

  const adjacent = mapData.adjacency[action.from] || [];
  if (!adjacent.includes(action.to)) {
    return { valid: false, reason: 'Territories are not adjacent' };
  }

  if (fromTerritory.armies <= action.attackDice) {
    return {
      valid: false,
      reason: 'Must have more armies than dice used (need to leave at least 1)',
    };
  }

  if (action.attackDice < 1 || action.attackDice > 3) {
    return { valid: false, reason: 'Must use 1-3 attack dice' };
  }

  return { valid: true };
}

function validateFortify(
  state: GameState,
  action: FortifyAction,
  mapData: MapData
): ValidationResult {
  if (state.phase !== 'fortify') {
    return { valid: false, reason: 'Not in fortify phase' };
  }

  const fromTerritory = state.territories[action.from];
  const toTerritory = state.territories[action.to];

  if (!fromTerritory || !toTerritory) {
    return { valid: false, reason: 'Territory does not exist' };
  }

  if (fromTerritory.owner !== state.currentPlayerIndex) {
    return { valid: false, reason: 'You do not own the source territory' };
  }

  if (toTerritory.owner !== state.currentPlayerIndex) {
    return { valid: false, reason: 'You do not own the destination territory' };
  }

  if (action.from === action.to) {
    return { valid: false, reason: 'Source and destination must be different' };
  }

  if (action.armies < 1) {
    return { valid: false, reason: 'Must move at least 1 army' };
  }

  if (action.armies >= fromTerritory.armies) {
    return { valid: false, reason: 'Must leave at least 1 army behind' };
  }

  const connected = areConnected(
    action.from,
    action.to,
    state.currentPlayerIndex,
    state.territories,
    mapData.adjacency
  );
  if (!connected) {
    return {
      valid: false,
      reason: 'Territories are not connected through your territories',
    };
  }

  return { valid: true };
}

function validateSkip(state: GameState): ValidationResult {
  if (state.phase === 'reinforce' && state.reinforcementsRemaining > 0) {
    return { valid: false, reason: 'Must place all reinforcements before skipping' };
  }
  if (state.phase !== 'attack' && state.phase !== 'fortify') {
    return { valid: false, reason: 'Can only skip attack or fortify phase' };
  }
  return { valid: true };
}

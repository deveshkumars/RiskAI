import type {
  GameState,
  GameAction,
  Player,
  PlayerId,
  MapData,
  ValidationResult,
  SerializedGameState,
  ReinforceAction,
  AttackAction,
  FortifyAction,
} from './types';
import { validateAction } from './validation';
import { resolveCombat } from './combat';
import { calculateReinforcements } from './reinforcements';
import { distributeTerritories } from './setup';
import { serializeGameState } from './serialization';
import { areConnected } from './pathfinding';

export class GameEngine {
  private state: GameState;
  private mapData: MapData;

  constructor(players: Player[], mapData: MapData) {
    this.mapData = mapData;
    this.state = {
      players: [...players],
      territories: {},
      currentPlayerIndex: 0 as PlayerId,
      phase: 'reinforce',
      turnNumber: 1,
      reinforcementsRemaining: 0,
      lastCombatResult: null,
      gameLog: [],
      winner: null,
      gameOver: false,
    };
  }

  setupGame(): void {
    this.state.territories = distributeTerritories(this.state.players, this.mapData);
    this.state.reinforcementsRemaining = calculateReinforcements(
      this.state.currentPlayerIndex,
      this.state.territories,
      this.mapData.continents
    );
    this.addLog('Game started! Territories have been distributed.');
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  getStateCopy(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getMapData(): MapData {
    return this.mapData;
  }

  validate(action: GameAction): ValidationResult {
    return validateAction(this.state, action, this.mapData);
  }

  dispatch(action: GameAction): void {
    const validation = this.validate(action);
    if (!validation.valid) {
      console.warn('Invalid action:', validation.reason, action);
      return;
    }

    switch (action.type) {
      case 'reinforce':
        this.applyReinforce(action);
        break;
      case 'attack':
        this.applyAttack(action);
        break;
      case 'fortify':
        this.applyFortify(action);
        break;
      case 'skip_phase':
        this.applySkip();
        break;
    }

    this.checkWinCondition();
  }

  private applyReinforce(action: ReinforceAction): void {
    this.state.territories[action.territoryId].armies += action.armies;
    this.state.reinforcementsRemaining -= action.armies;

    const name = this.getTerritoryName(action.territoryId);
    this.addLog(`Placed ${action.armies} armies on ${name}`);

    if (this.state.reinforcementsRemaining <= 0) {
      this.advancePhase();
    }
  }

  private applyAttack(action: AttackAction): void {
    const fromState = this.state.territories[action.from];
    const toState = this.state.territories[action.to];

    const result = resolveCombat(action.attackDice, toState.armies);

    fromState.armies -= result.attackerLosses;
    toState.armies -= result.defenderLosses;

    const fromName = this.getTerritoryName(action.from);
    const toName = this.getTerritoryName(action.to);

    let conquered = false;
    if (toState.armies <= 0) {
      // Territory conquered
      conquered = true;
      const previousOwner = toState.owner;
      toState.owner = this.state.currentPlayerIndex;
      // Move armies in (attacking dice count is the minimum)
      const armiesToMove = action.attackDice;
      fromState.armies -= armiesToMove;
      toState.armies = armiesToMove;

      this.addLog(
        `Conquered ${toName} from ${fromName}! [${result.attackerRolls.join(',')}] vs [${result.defenderRolls.join(',')}]`
      );

      // Check if previous owner is eliminated
      const previousOwnerTerritories = Object.values(this.state.territories).filter(
        (t) => t.owner === previousOwner
      );
      if (previousOwnerTerritories.length === 0) {
        this.state.players[previousOwner].isEliminated = true;
        this.addLog(`${this.state.players[previousOwner].name} has been eliminated!`);
      }
    } else {
      this.addLog(
        `Attacked ${toName} from ${fromName}: [${result.attackerRolls.join(',')}] vs [${result.defenderRolls.join(',')}] → Lost ${result.attackerLosses}, Dealt ${result.defenderLosses}`
      );
    }

    this.state.lastCombatResult = {
      attackerDice: result.attackerRolls,
      defenderDice: result.defenderRolls,
      attackerLosses: result.attackerLosses,
      defenderLosses: result.defenderLosses,
      territoryConquered: conquered,
      attackingTerritory: action.from,
      defendingTerritory: action.to,
    };
  }

  private applyFortify(action: FortifyAction): void {
    this.state.territories[action.from].armies -= action.armies;
    this.state.territories[action.to].armies += action.armies;

    const fromName = this.getTerritoryName(action.from);
    const toName = this.getTerritoryName(action.to);
    this.addLog(`Fortified: moved ${action.armies} from ${fromName} to ${toName}`);

    this.advanceTurn();
  }

  private applySkip(): void {
    if (this.state.phase === 'attack') {
      this.addLog('Skipped attack phase');
      this.advancePhase();
    } else if (this.state.phase === 'fortify') {
      this.addLog('Skipped fortify phase');
      this.advanceTurn();
    }
  }

  private advancePhase(): void {
    if (this.state.phase === 'reinforce') {
      this.state.phase = 'attack';
      this.state.lastCombatResult = null;
    } else if (this.state.phase === 'attack') {
      this.state.phase = 'fortify';
    }
  }

  private advanceTurn(): void {
    // Find next non-eliminated player
    let next = ((this.state.currentPlayerIndex + 1) % 3) as PlayerId;
    while (this.state.players[next].isEliminated) {
      next = ((next + 1) % 3) as PlayerId;
    }

    this.state.currentPlayerIndex = next;
    this.state.phase = 'reinforce';
    this.state.turnNumber++;
    this.state.lastCombatResult = null;
    this.state.reinforcementsRemaining = calculateReinforcements(
      next,
      this.state.territories,
      this.mapData.continents
    );
    this.addLog(
      `--- ${this.state.players[next].name}'s turn (${this.state.reinforcementsRemaining} reinforcements) ---`
    );
  }

  private checkWinCondition(): void {
    const activePlayers = this.state.players.filter((p) => !p.isEliminated);
    if (activePlayers.length === 1) {
      this.state.winner = activePlayers[0].id;
      this.state.gameOver = true;
      this.addLog(`${activePlayers[0].name} wins the game!`);
    }
  }

  getValidActions(): GameAction[] {
    const actions: GameAction[] = [];
    const { phase, currentPlayerIndex, territories, reinforcementsRemaining } = this.state;

    if (this.state.gameOver) return actions;

    if (phase === 'reinforce') {
      // Can place armies on any owned territory
      for (const [tid, tState] of Object.entries(territories)) {
        if (tState.owner === currentPlayerIndex) {
          // Offer placing all remaining reinforcements on this territory
          actions.push({
            type: 'reinforce',
            territoryId: tid,
            armies: reinforcementsRemaining,
          });
        }
      }
    } else if (phase === 'attack') {
      // Find all valid attacks
      for (const [tid, tState] of Object.entries(territories)) {
        if (tState.owner !== currentPlayerIndex || tState.armies <= 1) continue;
        const adjacentIds = this.mapData.adjacency[tid] || [];
        for (const adjId of adjacentIds) {
          if (territories[adjId].owner !== currentPlayerIndex) {
            const maxDice = Math.min(3, tState.armies - 1) as 1 | 2 | 3;
            actions.push({
              type: 'attack',
              from: tid,
              to: adjId,
              attackDice: maxDice,
            });
          }
        }
      }
      // Can always skip attack
      actions.push({ type: 'skip_phase' });
    } else if (phase === 'fortify') {
      // Find all valid fortify moves
      for (const [fromId, fromState] of Object.entries(territories)) {
        if (fromState.owner !== currentPlayerIndex || fromState.armies <= 1) continue;
        for (const [toId, toState] of Object.entries(territories)) {
          if (
            toState.owner === currentPlayerIndex &&
            fromId !== toId &&
            areConnected(fromId, toId, currentPlayerIndex, territories, this.mapData.adjacency)
          ) {
            actions.push({
              type: 'fortify',
              from: fromId,
              to: toId,
              armies: fromState.armies - 1,
            });
          }
        }
      }
      // Can always skip fortify
      actions.push({ type: 'skip_phase' });
    }

    return actions;
  }

  serialize(): SerializedGameState {
    return serializeGameState(this.state, this.mapData, this.getValidActions());
  }

  private getTerritoryName(id: string): string {
    return this.mapData.territories.find((t) => t.id === id)?.name ?? id;
  }

  private addLog(message: string): void {
    this.state.gameLog.push({
      turnNumber: this.state.turnNumber,
      playerIndex: this.state.currentPlayerIndex,
      phase: this.state.phase,
      message,
      timestamp: Date.now(),
    });
  }
}

export type PlayerId = 0 | 1 | 2;

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  type: 'human' | 'ai';
  isEliminated: boolean;
}

export type TerritoryId = string;
export type ContinentId = string;

export interface TerritoryDefinition {
  id: TerritoryId;
  name: string;
  continentId: ContinentId;
  adjacentTo: TerritoryId[];
  svgPath: string;
  labelPosition: { x: number; y: number };
}

export interface ContinentDefinition {
  id: ContinentId;
  name: string;
  bonus: number;
  territoryIds: TerritoryId[];
  color: string;
}

export interface TerritoryState {
  owner: PlayerId;
  armies: number;
}

export type Phase = 'reinforce' | 'attack' | 'fortify';

export interface GameState {
  players: Player[];
  territories: Record<TerritoryId, TerritoryState>;
  currentPlayerIndex: PlayerId;
  phase: Phase;
  turnNumber: number;
  reinforcementsRemaining: number;
  lastCombatResult: CombatResult | null;
  gameLog: LogEntry[];
  winner: PlayerId | null;
  gameOver: boolean;
}

export type GameAction =
  | ReinforceAction
  | AttackAction
  | FortifyAction
  | SkipPhaseAction;

export interface ReinforceAction {
  type: 'reinforce';
  territoryId: TerritoryId;
  armies: number;
}

export interface AttackAction {
  type: 'attack';
  from: TerritoryId;
  to: TerritoryId;
  attackDice: 1 | 2 | 3;
}

export interface FortifyAction {
  type: 'fortify';
  from: TerritoryId;
  to: TerritoryId;
  armies: number;
}

export interface SkipPhaseAction {
  type: 'skip_phase';
}

export interface CombatResult {
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
  territoryConquered: boolean;
  attackingTerritory: TerritoryId;
  defendingTerritory: TerritoryId;
}

export interface LogEntry {
  turnNumber: number;
  playerIndex: PlayerId;
  phase: Phase;
  message: string;
  timestamp: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface SerializedGameState {
  text: string;
  json: string;
}

export interface IPlayerAgent {
  decideAction(
    serializedState: SerializedGameState,
    validActions: GameAction[],
    phase: Phase
  ): Promise<GameAction>;
}

export interface MapData {
  territories: TerritoryDefinition[];
  continents: ContinentDefinition[];
  adjacency: Record<TerritoryId, TerritoryId[]>;
}

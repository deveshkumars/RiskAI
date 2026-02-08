import { useState, useCallback, useMemo, useRef } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type {
  GameState,
  GameAction,
  Player,
  PlayerId,
  MapData,
  IPlayerAgent,
} from '../engine/types';
import { HumanAgent } from '../ai/HumanAgent';
import { LLMAgent } from '../ai/LLMAgent';

export function useGameState(players: Player[], mapData: MapData) {
  const engineRef = useRef<GameEngine | null>(null);
  const agentsRef = useRef<Record<number, IPlayerAgent>>({});

  // Initialize engine and agents
  if (!engineRef.current) {
    const engine = new GameEngine(players, mapData);
    engine.setupGame();
    engineRef.current = engine;

    // Create agents
    for (const player of players) {
      if (player.type === 'human') {
        agentsRef.current[player.id] = new HumanAgent();
      } else {
        agentsRef.current[player.id] = new LLMAgent();
      }
    }
  }

  const engine = engineRef.current;
  const [state, setState] = useState<GameState>(engine.getStateCopy());

  const dispatch = useCallback(
    (action: GameAction) => {
      engine.dispatch(action);
      setState(engine.getStateCopy());
    },
    [engine]
  );

  const validActions = useMemo(() => engine.getValidActions(), [state]);

  const serializedState = useMemo(() => engine.serialize(), [state]);

  const getAgent = useCallback(
    (playerId: PlayerId): IPlayerAgent => agentsRef.current[playerId],
    []
  );

  const getHumanAgent = useCallback(
    (playerId: PlayerId): HumanAgent | null => {
      const agent = agentsRef.current[playerId];
      return agent instanceof HumanAgent ? agent : null;
    },
    []
  );

  const reset = useCallback(
    (newPlayers: Player[]) => {
      const newEngine = new GameEngine(newPlayers, mapData);
      newEngine.setupGame();
      engineRef.current = newEngine;

      agentsRef.current = {};
      for (const player of newPlayers) {
        if (player.type === 'human') {
          agentsRef.current[player.id] = new HumanAgent();
        } else {
          agentsRef.current[player.id] = new LLMAgent();
        }
      }

      setState(newEngine.getStateCopy());
    },
    [mapData]
  );

  return {
    state,
    dispatch,
    validActions,
    serializedState,
    getAgent,
    getHumanAgent,
    reset,
  };
}

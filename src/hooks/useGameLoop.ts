import { useEffect, useRef } from 'react';
import type {
  GameState,
  GameAction,
  PlayerId,
  IPlayerAgent,
  SerializedGameState,
} from '../engine/types';
import { LLMAgent } from '../ai/LLMAgent';
import { AI_MOVE_DELAY_MS } from '../engine/constants';

export function useGameLoop(
  state: GameState,
  getAgent: (playerId: PlayerId) => IPlayerAgent,
  dispatch: (action: GameAction) => void,
  serializedState: SerializedGameState,
  validActions: GameAction[],
  onAiThought?: (thought: string | null) => void
) {
  const isRunning = useRef(false);

  useEffect(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'ai' || state.gameOver) return;
    if (validActions.length === 0) return;
    if (isRunning.current) return;

    isRunning.current = true;
    let cancelled = false;

    const runAiTurn = async () => {
      await new Promise((r) => setTimeout(r, AI_MOVE_DELAY_MS));
      if (cancelled) {
        isRunning.current = false;
        return;
      }

      const agent = getAgent(state.currentPlayerIndex);
      try {
        const action = await agent.decideAction(
          serializedState,
          validActions,
          state.phase
        );
        if (!cancelled) {
          // Extract reasoning if the agent is an LLMAgent
          if (agent instanceof LLMAgent && agent.lastReasoning) {
            onAiThought?.(agent.lastReasoning);
          }
          dispatch(action);
        }
      } catch (err) {
        console.error('AI agent error:', err);
        // Fallback: skip phase if possible
        if (!cancelled && validActions.length > 0) {
          const skipAction = validActions.find((a) => a.type === 'skip_phase');
          if (skipAction) {
            dispatch(skipAction);
          } else {
            dispatch(validActions[0]);
          }
        }
      }
      isRunning.current = false;
    };

    runAiTurn();

    return () => {
      cancelled = true;
      isRunning.current = false;
    };
  }, [
    state.currentPlayerIndex,
    state.phase,
    state.turnNumber,
    state.gameOver,
    // Also re-trigger when reinforcements change (AI places multiple times)
    state.reinforcementsRemaining,
    // Re-trigger after combat in attack phase
    state.lastCombatResult,
  ]);
}

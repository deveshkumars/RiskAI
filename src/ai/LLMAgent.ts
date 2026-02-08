import type { IPlayerAgent, SerializedGameState, GameAction, Phase } from '../engine/types';
import { RandomAgent } from './RandomAgent';

/**
 * Placeholder LLM agent. Currently delegates to RandomAgent.
 * When ready, this will send serializedState.text to an LLM API
 * and parse the numbered response to select a valid action.
 */
export class LLMAgent implements IPlayerAgent {
  private fallback = new RandomAgent();

  async decideAction(
    serializedState: SerializedGameState,
    validActions: GameAction[],
    phase: Phase
  ): Promise<GameAction> {
    // TODO: Wire up LLM API call here
    // The serializedState.text is formatted for LLM consumption
    // with numbered valid actions. The LLM just needs to return
    // a number 1-N to select an action.
    //
    // Example integration:
    // const response = await callLLM(serializedState.text);
    // const choice = parseInt(response.trim());
    // if (choice >= 1 && choice <= validActions.length) {
    //   return validActions[choice - 1];
    // }

    return this.fallback.decideAction(serializedState, validActions, phase);
  }
}

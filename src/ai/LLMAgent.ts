import type { IPlayerAgent, SerializedGameState, GameAction, Phase } from '../engine/types';
import { RandomAgent } from './RandomAgent';
import { callLLM } from './llmApi';
import { RISK_SYSTEM_PROMPT } from './llmPrompts';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * LLM-powered agent that calls an external chatflow API to decide actions.
 * Falls back to RandomAgent on any failure.
 */
export class LLMAgent implements IPlayerAgent {
  private fallback = new RandomAgent();

  async decideAction(
    serializedState: SerializedGameState,
    validActions: GameAction[],
    phase: Phase
  ): Promise<GameAction> {
    // Short-circuit: only one valid action, no need to call the API
    if (validActions.length <= 1) {
      if (validActions.length === 1) return validActions[0];
      return { type: 'skip_phase' };
    }

    const prompt = RISK_SYSTEM_PROMPT + '\n\n' + serializedState.text;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await callLLM(prompt);
        const choice = this.parseChoice(response, validActions.length);

        if (choice !== null) {
          console.log(`LLM chose action ${choice}: ${response.trim()}`);
          return validActions[choice - 1];
        }

        console.warn(
          `LLM returned unparseable response (attempt ${attempt + 1}): "${response.trim()}"`
        );
      } catch (err) {
        console.error(`LLM API error (attempt ${attempt + 1}):`, err);
      }

      // Wait before retrying (skip delay on last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    // All retries exhausted — fall back to random
    console.warn('LLM agent falling back to RandomAgent');
    return this.fallback.decideAction(serializedState, validActions, phase);
  }

  /**
   * Extract the first integer from the LLM response and validate it's in range.
   */
  private parseChoice(text: string, maxChoice: number): number | null {
    const match = text.trim().match(/(\d+)/);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= maxChoice) return num;
    return null;
  }
}

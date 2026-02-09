import type { IPlayerAgent, SerializedGameState, GameAction, Phase } from '../engine/types';
import { RandomAgent } from './RandomAgent';
import { callLLM } from './llmApi';
import { RISK_SYSTEM_PROMPT } from './llmPrompts';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

interface ParsedResponse {
  choice: number;
  reasoning: string;
}

/**
 * LLM-powered agent that calls an external chatflow API to decide actions.
 * Falls back to RandomAgent on any failure.
 */
export class LLMAgent implements IPlayerAgent {
  private fallback = new RandomAgent();
  lastReasoning: string | null = null;

  async decideAction(
    serializedState: SerializedGameState,
    validActions: GameAction[],
    phase: Phase
  ): Promise<GameAction> {
    this.lastReasoning = null;

    // Short-circuit: only one valid action, no need to call the API
    if (validActions.length <= 1) {
      if (validActions.length === 1) return validActions[0];
      return { type: 'skip_phase' };
    }

    const prompt = RISK_SYSTEM_PROMPT + '\n\n' + serializedState.text;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await callLLM(prompt);
        const parsed = this.parseResponse(response, validActions.length);

        if (parsed !== null) {
          console.log(
            `LLM chose action ${parsed.choice}: ${parsed.reasoning || '(no reason)'}`
          );
          this.lastReasoning = parsed.reasoning || null;
          return validActions[parsed.choice - 1];
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
    this.lastReasoning = null;
    return this.fallback.decideAction(serializedState, validActions, phase);
  }

  /**
   * Parse "NUMBER | reason" or just "NUMBER" from the LLM response.
   */
  private parseResponse(
    text: string,
    maxChoice: number
  ): ParsedResponse | null {
    const trimmed = text.trim();

    // Try "NUMBER | reason" format first
    const pipeMatch = trimmed.match(/^(\d+)\s*\|\s*(.+)/s);
    if (pipeMatch) {
      const num = parseInt(pipeMatch[1], 10);
      if (num >= 1 && num <= maxChoice) {
        return {
          choice: num,
          reasoning: pipeMatch[2].trim().replace(/\n/g, ' '),
        };
      }
    }

    // Fall back to just extracting first number
    const numMatch = trimmed.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 1 && num <= maxChoice) {
        return { choice: num, reasoning: '' };
      }
    }

    return null;
  }
}

import type { IPlayerAgent, SerializedGameState, GameAction, Phase } from '../engine/types';

export class RandomAgent implements IPlayerAgent {
  async decideAction(
    _serializedState: SerializedGameState,
    validActions: GameAction[],
    phase: Phase
  ): Promise<GameAction> {
    if (validActions.length === 0) {
      return { type: 'skip_phase' };
    }

    if (phase === 'attack') {
      // 70% chance to attack if possible, 30% skip
      const attacks = validActions.filter((a) => a.type === 'attack');
      const skip = validActions.find((a) => a.type === 'skip_phase');
      if (attacks.length > 0 && Math.random() < 0.7) {
        return attacks[Math.floor(Math.random() * attacks.length)];
      }
      return skip ?? validActions[Math.floor(Math.random() * validActions.length)];
    }

    if (phase === 'fortify') {
      // 50% chance to fortify, 50% skip
      const fortifies = validActions.filter((a) => a.type === 'fortify');
      const skip = validActions.find((a) => a.type === 'skip_phase');
      if (fortifies.length > 0 && Math.random() < 0.5) {
        return fortifies[Math.floor(Math.random() * fortifies.length)];
      }
      return skip ?? validActions[Math.floor(Math.random() * validActions.length)];
    }

    // Reinforce: pick a random valid reinforcement
    return validActions[Math.floor(Math.random() * validActions.length)];
  }
}

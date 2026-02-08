import type { IPlayerAgent, SerializedGameState, GameAction, Phase } from '../engine/types';

export class HumanAgent implements IPlayerAgent {
  private pendingResolve: ((action: GameAction) => void) | null = null;

  async decideAction(
    _serializedState: SerializedGameState,
    _validActions: GameAction[],
    _phase: Phase
  ): Promise<GameAction> {
    return new Promise<GameAction>((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  submitAction(action: GameAction): void {
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(action);
    }
  }

  isWaiting(): boolean {
    return this.pendingResolve !== null;
  }
}

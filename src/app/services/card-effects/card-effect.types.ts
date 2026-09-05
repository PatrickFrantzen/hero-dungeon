import { Mob } from 'src/models/monster/monster.class';

/** Die Teilmenge von CardPlayService, die eine einzelne Kartenwirkung braucht - erlaubt es,
 * jede Strategie unabhängig vom NGXS-Store/den Repository-Services zu testen. */
export interface CardEffectContext {
  currentEnemy(): Mob;
  dispatchMonsterTokenUpdate(tokens: string[]): void;
  updateCurrentEnemyToken(mob: Mob): Promise<void>;
  checkForNextEnemy(mob: Mob): Promise<void>;
  ensureGameTimerStarted(): Promise<void>;
  resumeGameTimerIfPaused(): Promise<void>;
  saveHand(card: string, currHand: string[]): Promise<void>;
}

/** Eine Kartenwirkung, die ohne weitere Nutzereingabe auflöst (Gegenstück zu den fünf
 * Zielspieler-Karten, die weiterhin eigene öffentliche resolve*()-Methoden auf CardPlayService
 * bleiben - siehe To-Do.md). */
export interface CardEffect {
  apply(ctx: CardEffectContext, playerId: string, card: string, currHand: string[]): Promise<void>;
}

import { Mob } from 'src/models/monster/monster.class';
import { CardEffect, CardEffectContext } from './card-effect.types';

/** Paladin/Walküre "Heilige Handgranate": besiegt sofort die aktuelle Bedrohung - die einzige
 * Karte im Spiel, die auch einen Mini-Boss oder Boss direkt besiegen kann (Anleitung S. 9).
 * Bis Mini-Bosse umgesetzt sind (TODO 9 im Plan) betrifft das faktisch nur normale
 * Dungeon-Karten und Bosse. */
export class HeiligeHandgranateEffect implements CardEffect {
  apply(
    ctx: CardEffectContext,
    playerId: string,
    card: string,
    currHand: string[],
  ): Promise<void> {
    const writes = [
      ctx.ensureGameTimerStarted(),
      ctx.resumeGameTimerIfPaused(),
    ];

    const clearedEnemy: Mob = { ...ctx.currentEnemy(), token: [] };
    ctx.dispatchMonsterTokenUpdate(clearedEnemy.token);
    writes.push(ctx.updateCurrentEnemyToken(clearedEnemy));
    writes.push(ctx.checkForNextEnemy(clearedEnemy));
    writes.push(ctx.saveHand(card, currHand));

    return Promise.all(writes).then(() => undefined);
  }
}

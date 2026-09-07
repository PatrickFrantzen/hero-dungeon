import { CardEffect, CardEffectContext } from './card-effect.types';

/** Paladin/Walküre "Heiltrank": alle Spieler (inkl. dir selbst) nehmen 3 Karten von ihrem
 * eigenen Ablagestapel (deliveryStack) zurück auf die Hand. */
export class HeiltrankEffect implements CardEffect {
  apply(
    ctx: CardEffectContext,
    playerId: string,
    card: string,
    currHand: string[],
  ): Promise<void> {
    const writes = [
      ctx.ensureGameTimerStarted(),
      ctx.resumeGameTimerIfPaused(),
      ctx.saveHand(card, currHand),
      ctx.reclaimCardsFromDeliveryStack(3),
      ctx.reclaimCardsFromDeliveryStackForOtherPlayers(3),
    ];
    return Promise.all(writes).then(() => undefined);
  }
}

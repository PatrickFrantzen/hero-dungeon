import { CardEffect, CardEffectContext } from './card-effect.types';

/** Walküre/Paladin "Göttlicher Schild": friert die Zeit ein und lässt jeden Spieler 1 Karte
 * vom eigenen Nachziehstapel ziehen - unabhängig von der sonst geltenden Handgrößen-Obergrenze
 * (Anleitung S. 6, Anmerkung Punkt 4: aufgeforderte Zuggaben zählen immer). */
export class GoettlicherSchildEffect implements CardEffect {
  apply(
    ctx: CardEffectContext,
    playerId: string,
    card: string,
    currHand: string[],
  ): Promise<void> {
    const writes = [
      ctx.ensureGameTimerStarted(),
      ctx.freezeGameTimer(),
      ctx.saveHand(card, currHand),
      ctx.drawCardsIgnoringHandsize(1),
      ctx.drawCardsForOtherPlayers(1),
    ];
    return Promise.all(writes).then(() => undefined);
  }
}

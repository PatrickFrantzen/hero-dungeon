import { CardEffect, CardEffectContext } from './card-effect.types';

/** Jägerin/Waldläufer "Joker": zählt als ein beliebiges Symbol (Anleitung S. 8) - da es keine
 * Auswahl-UI für "welches Symbol" gibt, wird einfach das erste Token der aktuellen Bedrohung
 * verbraucht (deterministisch, aber ohne Spielereinfluss auf die Wahl - eine Vereinfachung
 * analog zu den bereits automatisch aufgelösten Doppelsymbol-Karten). Wirkt nicht gegen
 * Ereigniskarten (dort gibt es keine Symbole zu ersetzen). */
export class JokerEffect implements CardEffect {
  apply(
    ctx: CardEffectContext,
    playerId: string,
    card: string,
    currHand: string[],
  ): Promise<void> {
    const currEne = [...ctx.currentEnemy().token];
    if (
      currEne.length === 0 ||
      currEne[0].toLocaleLowerCase().includes('event')
    )
      return Promise.resolve();

    const writes = [
      ctx.ensureGameTimerStarted(),
      ctx.resumeGameTimerIfPaused(),
    ];

    currEne.shift();
    ctx.dispatchMonsterTokenUpdate(currEne);
    writes.push(ctx.updateCurrentEnemyToken(ctx.currentEnemy()));
    writes.push(ctx.checkForNextEnemy(ctx.currentEnemy()));
    writes.push(ctx.saveHand(card, currHand));

    return Promise.all(writes).then(() => undefined);
  }
}

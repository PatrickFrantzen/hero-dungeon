import { CardEffect, CardEffectContext } from './card-effect.types';

const SYMBOLS = ['red', 'yellow', 'green', 'blue', 'purple'];

/** Magier/Zauberin "Magische Bombe": bringt alle 5 Symbole auf einmal, muss aber nicht alle
 * nutzen (Anleitung S. 8) - entfernt von der aktuellen Bedrohung je ein Vorkommen jeder der 5
 * Symbolfarben, falls vorhanden. Wirkt nicht gegen Ereigniskarten. */
export class MagischeBombeEffect implements CardEffect {
  apply(ctx: CardEffectContext, playerId: string, card: string, currHand: string[]): Promise<void> {
    const currEne = [...ctx.currentEnemy().token];
    if (currEne.length === 0 || currEne[0].toLocaleLowerCase().includes('event')) return Promise.resolve();

    const writes = [ctx.ensureGameTimerStarted(), ctx.resumeGameTimerIfPaused()];

    SYMBOLS.forEach((symbol) => {
      const index = currEne.indexOf(symbol);
      if (index !== -1) currEne.splice(index, 1);
    });

    ctx.dispatchMonsterTokenUpdate(currEne);
    writes.push(ctx.updateCurrentEnemyToken(ctx.currentEnemy()));
    writes.push(ctx.checkForNextEnemy(ctx.currentEnemy()));
    writes.push(ctx.saveHand(card, currHand));

    return Promise.all(writes).then(() => undefined);
  }
}

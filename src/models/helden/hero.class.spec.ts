import { createHero } from './hero.class';
import { EXTRA_DECK_FOR_HERO, HERO_DEFINITIONS } from './hero-definitions';

describe('createHero', () => {
  it('erzeugt für jede bekannte Helden-ID einen Helden mit der erwarteten Kartenanzahl', () => {
    for (const def of HERO_DEFINITIONS) {
      const hero = createHero(def.id);
      const expectedCardCount = Array.from(def.cardCounts.values()).reduce((sum, count) => sum + count, 0);

      expect(hero.heroName).toBe(def.heroName);
      expect(hero.heroPower).toBe(def.heroPower);
      expect(hero.description).toBe(def.description);
      expect(hero.cardstack.length).toBe(expectedCardCount);
    }
  });

  it('wirft bei unbekannter ID', () => {
    expect(() => createHero('unbekannt' as never)).toThrowError('Unbekannter Heldentyp: unbekannt');
  });

  it('mischt bei useExtraDeck=true das Kartendeck des zugeordneten Zusatzhelden ein (2-Spieler-/Singleplayer-Regel)', () => {
    for (const def of HERO_DEFINITIONS) {
      const hero = createHero(def.id, true);
      const extraDef = HERO_DEFINITIONS.find((d) => d.id === EXTRA_DECK_FOR_HERO[def.id])!;
      const ownCount = Array.from(def.cardCounts.values()).reduce((sum, count) => sum + count, 0);
      const extraCount = Array.from(extraDef.cardCounts.values()).reduce((sum, count) => sum + count, 0);

      expect(hero.cardstack.length).toBe(ownCount + extraCount);
    }
  });
});

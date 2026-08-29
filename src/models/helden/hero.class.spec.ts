import { createHero } from './hero.class';
import { HERO_DEFINITIONS } from './hero-definitions';

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
});

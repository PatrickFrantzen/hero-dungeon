import { Monster } from './monster.class';

const BOSS_NAMES = [
  'Baby-Barbar',
  'Der Flecken-Schrecken',
  'Zola, die Gorgone',
  'Verdammt, ein Drache!!!',
  'Der Dungeon-Overlord',
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

describe('Monster', () => {
  it('creates a singleplayer dungeon with five normal monsters and one solo-safe event for Baby-Barbar', () => {
    const mob = new Monster().createMob(1, 'Baby-Barbar', 'easy');

    expect(mob.length).toBe(6);
    expect(mob.filter((entry) => entry.token.includes('event')).length).toBe(1);
    expect(mob.filter((entry) => !entry.token.includes('event')).length).toBe(5);
    expect(mob.some((entry) => entry.name === 'Chaos')).toBeFalse();
  });

  it('never pushes undefined entries, auch wenn mehr Quest-Karten angefragt werden als aktuell verfügbar sind', () => {
    // Regressionstest: questTwo/-Drei/-Vier/-Fünf (4/6/8/10) übersteigen die aktuell nur 4
    // aktiven Event-Kartentypen ab 3 Spielern (Mini-Bosse sind auskommentiert) - ohne den
    // Math.min()-Schutz in Monster.loadQuests() landet dort ein undefined-Eintrag, der beim
    // Shiften in GameFactoryService.buildNewGame()/CardPlayService.prepareNextDungeon() zu
    // einem TypeError führt.
    for (const bossName of BOSS_NAMES) {
      for (const difficulty of DIFFICULTIES) {
        for (let numberOfPlayers = 1; numberOfPlayers <= 5; numberOfPlayers++) {
          const mob = new Monster().createMob(numberOfPlayers, bossName, difficulty);
          expect(mob.every((entry) => entry !== undefined)).toBe(true);
        }
      }
    }
  });
});

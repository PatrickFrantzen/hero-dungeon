import { Monster } from './monster.class';

const BOSS_NAMES = [
  'Baby-Barbar',
  'Der Flecken-Schrecken',
  'Zola, die Gorgone',
  'Verdammt, ein Drache!!!',
  'Der Dungeon-Overlord',
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Issue #86: die Originalanleitung kennt keine 1-Spieler-Spalte - diese Werte sind eine eigene,
// mit Patrick abgestimmte Fortschreibung der Multiplayer-Formel (Monster = (2*Spieler+6) +
// 4*(Boss-Index-1) + 4*Schwierigkeits-Index, Events konstant 2) auf einen Spieler.
const SOLO_MOB_COUNTS: Record<string, Record<string, { monster: number; event: number }>> = {
  'Baby-Barbar': { easy: { monster: 8, event: 2 }, medium: { monster: 12, event: 2 }, hard: { monster: 16, event: 2 } },
  'Der Flecken-Schrecken': { easy: { monster: 12, event: 2 }, medium: { monster: 16, event: 2 }, hard: { monster: 20, event: 2 } },
  'Zola, die Gorgone': { easy: { monster: 16, event: 2 }, medium: { monster: 20, event: 2 }, hard: { monster: 24, event: 2 } },
  'Verdammt, ein Drache!!!': { easy: { monster: 20, event: 2 }, medium: { monster: 24, event: 2 }, hard: { monster: 28, event: 2 } },
  'Der Dungeon-Overlord': { easy: { monster: 24, event: 2 }, medium: { monster: 28, event: 2 }, hard: { monster: 32, event: 2 } },
};

describe('Monster', () => {
  it('creates a singleplayer dungeon with eight normal monsters and two solo-safe events for Baby-Barbar on Lehrling (Issue #86)', () => {
    const mob = new Monster().createMob(1, 'Baby-Barbar', 'easy');

    expect(mob.length).toBe(10);
    expect(mob.filter((entry) => entry.token.includes('event')).length).toBe(2);
    expect(mob.filter((entry) => !entry.token.includes('event')).length).toBe(8);
    expect(mob.some((entry) => entry.name === 'Chaos')).toBeFalse();
  });

  it('scales the singleplayer monster/event count per boss and difficulty (Issue #86)', () => {
    for (const bossName of BOSS_NAMES) {
      for (const difficulty of DIFFICULTIES) {
        const expected = SOLO_MOB_COUNTS[bossName][difficulty];
        const mob = new Monster().createMob(1, bossName, difficulty);

        expect(mob.filter((entry) => !entry.token.includes('event')).length).toBe(
          expected.monster,
          `${bossName}/${difficulty}: monster count`
        );
        expect(mob.filter((entry) => entry.token.includes('event')).length).toBe(
          expected.event,
          `${bossName}/${difficulty}: event count`
        );
      }
    }
  });

  it('never pushes undefined entries, auch wenn mehr Quest-Karten angefragt werden als aktuell verfügbar sind', () => {
    // Regressionstest: questTwo/-Drei/-Vier/-Fünf (4/6/8/10) übersteigen die aktuell nur 4
    // aktiven Event-Kartentypen ab 3 Spielern (Mini-Bosse sind auskommentiert) - ohne den
    // Math.min()-Schutz in Monster.loadQuests() landet dort ein undefined-Eintrag, der beim
    // Shiften in GameFactoryService.buildNewGame()/CardPlayService.continueToNextDungeon() zu
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

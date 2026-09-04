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

const NORMAL_ENEMY_TYPES = ['Monster', 'Person', 'Hindernis'];

describe('Monster', () => {
  it('creates a singleplayer dungeon with eight normal monsters and two quest cards for Baby-Barbar on Lehrling (Issue #86)', () => {
    const mob = new Monster().createMob(1, 'Baby-Barbar', 'easy');

    expect(mob.length).toBe(10);
    expect(mob.filter((entry) => NORMAL_ENEMY_TYPES.includes(entry.type)).length).toBe(8);
    expect(mob.filter((entry) => !NORMAL_ENEMY_TYPES.includes(entry.type)).length).toBe(2);
    expect(mob.some((entry) => entry.name === 'Chaos')).toBeFalse();
  });

  it('scales the singleplayer monster/quest count per boss and difficulty (Issue #86)', () => {
    for (const bossName of BOSS_NAMES) {
      for (const difficulty of DIFFICULTIES) {
        const expected = SOLO_MOB_COUNTS[bossName][difficulty];
        const mob = new Monster().createMob(1, bossName, difficulty);

        expect(mob.filter((entry) => NORMAL_ENEMY_TYPES.includes(entry.type)).length).toBe(
          expected.monster,
          `${bossName}/${difficulty}: monster count`
        );
        expect(mob.filter((entry) => !NORMAL_ENEMY_TYPES.includes(entry.type)).length).toBe(
          expected.event,
          `${bossName}/${difficulty}: quest count`
        );
      }
    }
  });

  it('can draw Mini-Boss quest cards in singleplayer (Issue #90)', () => {
    let drewMiniBoss = false;
    for (let i = 0; i < 200 && !drewMiniBoss; i++) {
      const mob = new Monster().createMob(1, 'Der Dungeon-Overlord', 'hard');
      drewMiniBoss = mob.some((entry) => entry.type === 'Mini-Boss');
    }
    expect(drewMiniBoss).toBeTrue();
  });

  it('never pushes undefined entries, auch wenn mehr Quest-Karten angefragt werden als aktuell verfügbar sind', () => {
    // Regressionstest: questFive (10) übersteigt die aktuell nur 9 aktiven Quest-Kartentypen
    // ("Hinterhalt" bleibt auskommentiert) - ohne den Math.min()-Schutz in
    // Monster.loadQuests()/loadSoloQuests() landet dort ein undefined-Eintrag, der beim Shiften
    // in GameFactoryService.buildNewGame()/CardPlayService.continueToNextDungeon() zu einem
    // TypeError führt.
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

export type HeroId =
  | 'barbar'
  | 'dieb'
  | 'gladiator'
  | 'jägerin'
  | 'magier'
  | 'ninja'
  | 'paladin'
  | 'waldläufer'
  | 'walküre'
  | 'zauberin';

export interface HeroDefinition {
  id: HeroId;
  heroName: string;
  heroPower: string;
  description: string;
  cardCounts: Map<string, number>;
}

const barbarGladiatorCardCounts = new Map([
  ['red', 5],
  ['yellow', 7],
  ['green', 5],
  ['blue', 3],
  ['purple', 6],
  ['red_purple', 2],
  ['red_blue', 2],
  ['red_green', 2],
  ['red_red', 2],
  ['red_yellow', 2],
  ['wut', 2],
  ['riesensprung_hindernis', 2],
]);

const diebNinjaCardCounts = new Map([
  ['red', 7],
  ['yellow', 5],
  ['green', 3],
  ['blue', 6],
  ['purple', 7],
  ['purple_purple', 3],
  ['sprint_hindernis', 3],
  ['rücklings_person', 3],
  ['stehlen', 2],
  ['spende', 1],
]);

const jägerinWaldläuferCardCounts = new Map([
  ['red', 4],
  ['yellow', 3],
  ['green', 9],
  ['blue', 4],
  ['purple', 7],
  ['green_green', 2],
  ['joker', 8],
  ['heilkräuter', 2],
  ['treffer_person', 1],
]);

const paladinWalküreCardCounts = new Map([
  ['red', 6],
  ['yellow', 9],
  ['green', 6],
  ['blue', 8],
  ['purple', 3],
  ['yellow_yellow', 2],
  ['heiligeHandgranate', 1],
  ['göttlicherSchild', 1],
  ['heiltrank', 2],
  ['heile', 1],
  ['haudrauf_monster', 1],
]);

const magierZauberinCardCounts = new Map([
  ['red', 3],
  ['yellow', 5],
  ['green', 7],
  ['blue', 9],
  ['purple', 6],
  ['blue_blue', 2],
  ['verhinderung_event', 1],
  ['feuerball_monster', 4],
  ['magischeBombe', 3],
]);

export const HERO_DEFINITIONS: HeroDefinition[] = [
  {
    id: 'barbar',
    heroName: 'Barbar',
    heroPower: 'Schlagkräftige Argumente',
    description: 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Monster',
    cardCounts: barbarGladiatorCardCounts,
  },
  {
    id: 'dieb',
    heroName: 'Dieb',
    heroPower: 'Langfinger',
    description: 'Lege 3 Karten auf den Ablagestapel und ziehe dafür 5 Karten.',
    cardCounts: diebNinjaCardCounts,
  },
  {
    id: 'gladiator',
    heroName: 'Gladiator',
    heroPower: 'Furchteinflößend',
    description: 'Lege 3 Karten auf den Ablagestapel und besiege dadurch eine Person',
    cardCounts: barbarGladiatorCardCounts,
  },
  {
    id: 'jägerin',
    heroName: 'Jägerin',
    heroPower: 'Tierlieb',
    description:
      'Lege 3 Karten auf den Ablagestapel, dafür zieht einer von euch 4 Karten; das kannst auch du selbst sein.',
    cardCounts: jägerinWaldläuferCardCounts,
  },
  {
    id: 'magier',
    heroName: 'Magier',
    heroPower: 'Zeit einfrieren',
    description:
      'Lege 3 Karten auf den Ablagestapel und halte dafür die Zeit an, bis jemand eine Karte in die Tischmitte spielt.',
    cardCounts: magierZauberinCardCounts,
  },
  {
    id: 'ninja',
    heroName: 'Ninja',
    heroPower: 'Supersprung',
    description: 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Hindernis.',
    cardCounts: diebNinjaCardCounts,
  },
  {
    id: 'paladin',
    heroName: 'Paladin',
    heroPower: 'Blendend',
    description: 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Monster',
    cardCounts: paladinWalküreCardCounts,
  },
  {
    id: 'waldläufer',
    heroName: 'Waldläufer',
    heroPower: 'Kunstschuss',
    description: 'Lege 3 Karten auf den Ablagestapel und besiege dadurch eine Person',
    cardCounts: jägerinWaldläuferCardCounts,
  },
  {
    id: 'walküre',
    heroName: 'Walküre',
    heroPower: 'Verleiht Flügel',
    description: 'Lege 3 Karten auf den Ablagestapel und dafür zieht jeder andere Mitspieler 2 Karten.',
    cardCounts: paladinWalküreCardCounts,
  },
  {
    id: 'zauberin',
    heroName: 'Zauberin',
    heroPower: 'hindernis',
    description: 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Hindernis',
    cardCounts: magierZauberinCardCounts,
  },
];

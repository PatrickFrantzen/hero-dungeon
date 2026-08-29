import { Mob } from './monster.class';

export const questCollection: Mob[] = [
  // {
  //   name: 'Feindselige Riesenkrabbe',
  //   type: 'Mini-Boss',
  //   token: ['green', 'green', 'green', 'yellow', 'yellow', 'yellow'],
  // },
  // {
  //   name: 'Ein Bonsai-T-Rex',
  //   type: 'Mini-Boss',
  //   token: ['yellow', 'yellow', 'green', 'green', 'red', 'red'],
  // },
  // {
  //   name: 'Der Sammler',
  //   type: 'Mini-Boss',
  //   token: ['yellow', 'green', 'red', 'blue', 'purple'],
  // },
  {
    name: 'Plötzliche Krankheit',
    type: 'Jeder legt alle Handkarten auf den eigenen Ablagestapel.',
    token: ['event'],
  },
  {
    name: 'Chaos',
    type: 'Jeder gibt seine Handkarten einem Mitspieler.',
    token: ['event'],
  },
  {
    name: 'Ein Wehweh',
    type: 'Jeder legt 1 Karte auf den eigenen Ablagestapel.',
    token: ['event'],
  },
  // {
  //     "name": "Hinterhalt",
  //     "type": "Deckt 2 Karten aus dem Dungeon auf. Ihr müsst beide besiegen, bevor es weitergeht.",
  //     "token": ['event']
  // },
  {
    name: 'Falltür',
    type: 'Jeder legt 3 Karten auf den eigenen Ablagestapel.',
    token: ['event'],
  },
  // {
  //   name: 'Der Rattenkönig',
  //   type: 'Mini-Boss',
  //   token: ['purple', 'purple', 'purple', 'red', 'red', 'red'],
  // },
  // {
  //   name: 'Ein Zauberer mit schlechtem Ruf',
  //   type: 'Mini-Boss',
  //   token: ['blue', 'blue', 'blue', 'blue', 'purple', 'purple'],
  // },
];

export const bossCollection: Mob[] = [
  {
    name: 'Baby-Barbar',
    token: ['red', 'red', 'green', 'green', 'purple', 'purple', 'purple'],
    type: 'Boss',
  },
  {
    name: 'Der Flecken-Schrecken',
    token: [
      'blue',
      'blue',
      'blue',
      'blue',
      'blue',
      'blue',
      'blue',
      'yellow',
      'yellow',
      'yellow',
    ],
    type: 'Boss',
  },
  {
    name: 'Zola, die Gorgone',
    token: [
      'red',
      'red',
      'red',
      'red',
      'yellow',
      'yellow',
      'yellow',
      'purple',
      'purple',
      'purple',
    ],
    type: 'Boss',
  },
  {
    name: 'Verdammt, ein Drache!!!',
    token: [
      'red',
      'yellow',
      'purple',
      'purple',
      'purple',
      'purple',
      'green',
      'green',
      'green',
      'green',
      'green',
      'green',
    ],
    type: 'Boss',
  },
  {
    name: 'Der Dungeon-Overlord',
    token: [
      'red',
      'red',
      'red',
      'green',
      'green',
      'green',
      'yellow',
      'yellow',
      'yellow',
      'blue',
      'blue',
      'blue',
    ],
    type: 'Boss',
  },
];

export const monsterCollection: Mob[] = [
  {
    name: 'Treibsand',
    token: ['purple', 'purple', 'yellow'],
    type: 'Hindernis',
  },
  {
    name: 'Unsichtbare Wand',
    token: ['blue', 'blue'],
    type: 'Hindernis',
  },
  {
    name: 'Ein etwas unbequemer Stuhl',
    token: ['red', 'purple', 'yellow'],
    type: 'Hindernis',
  },
  {
    name: 'Ein Rosetta-Stein-Golem',
    token: ['purple', 'yellow'],
    type: 'Monster',
  },
  {
    name: 'Genau 26 Ninjas',
    token: ['blue', 'purple', 'purple'],
    type: 'Person',
  },
  {
    name: 'William Duck I.',
    token: ['blue', 'purple', 'yellow'],
    type: 'Monster',
  },
  {
    name: 'Eingestürzte Decke',
    token: ['red', 'blue', 'blue'],
    type: 'Hindernis',
  },
  {
    name: 'Bodenloser Abgrund',
    token: ['purple', 'purple'],
    type: 'Hindernis',
  },
  {
    name: 'Ein Ad-Hoc-Völkerballturnier',
    token: ['purple', 'purple', 'green'],
    type: 'Hindernis',
  },
  {
    name: 'Der Karpaltunnel',
    token: ['blue', 'green', 'green'],
    type: 'Hindernis',
  },
  {
    name: 'Zombies ohne Ende',
    token: ['red', 'red', 'red'],
    type: 'Monster',
  },
  {
    name: 'Steve',
    token: ['blue', 'purple', 'green'],
    type: 'Person',
  },
  {
    name: 'Knappe Nedward',
    token: ['yellow', 'yellow', 'green'],
    type: 'Person',
  },
  {
    name: 'Eine Kriegerprinzessin',
    token: ['yellow', 'green'],
    type: 'Person',
  },
  {
    name: 'Hai mit sexy Beinen!!',
    token: ['red', 'green', 'green'],
    type: 'Monster',
  },
  {
    name: "Eine 'Abkürzung'",
    token: ['red', 'yellow', 'yellow'],
    type: 'Hindernis',
  },
  {
    name: 'Knuffiger Goblin',
    token: ['red', 'purple'],
    type: 'Monster',
  },
  {
    name: 'Ein überteuerter Händler',
    token: ['blue', 'blue', 'purple'],
    type: 'Person',
  },
  {
    name: 'Zombietusse',
    token: ['red', 'green'],
    type: 'Monster',
  },
  {
    name: 'Ein Kaktus, der umarmen will',
    token: ['yellow', 'yellow', 'yellow'],
    type: 'Monster',
  },
  {
    name: 'Ein aufrechter Geist',
    token: ['blue', 'yellow'],
    type: 'Monster',
  },
  {
    name: 'Buchstäblich ein Strohmann',
    token: ['red', 'blue', 'purple'],
    type: 'Hindernis',
  },
  {
    name: 'Ein Armhändler',
    token: ['blue', 'green'],
    type: 'Person',
  },
  {
    name: 'Eine sicher sprengfallenfreie Truhe',
    token: ['purple', 'yellow', 'yellow'],
    type: 'Hindernis',
  },
  {
    name: 'Ein Haufen schreiender Kinder',
    token: ['red', 'yellow', 'green'],
    type: 'Person',
  },
  {
    name: 'Ein langsam ladender Bildschirm',
    token: ['red', 'purple', 'green'],
    type: 'Hindernis',
  },
  {
    name: 'Lebendiges Grünzeug',
    token: ['blue', 'blue', 'blue'],
    type: 'Hindernis',
  },
  {
    name: 'Sir Fuzzy',
    token: ['purple', 'green', 'green'],
    type: 'Monster',
  },
  {
    name: "Ein 'Geist', ja klar!",
    token: ['red', 'red', 'green'],
    type: 'Person',
  },
  {
    name: 'Ein Timberwolf',
    token: ['red', 'red'],
    type: 'Monster',
  },
  {
    name: 'Reizender Schleim',
    token: ['purple', 'green'],
    type: 'Monster',
  },
  {
    name: 'Grozznak der Große',
    token: ['purple', 'yellow', 'green'],
    type: 'Person',
  },
  {
    name: 'Eine lächerlich hohe Eiswand',
    token: ['purple', 'purple', 'purple'],
    type: 'Hindernis',
  },
  {
    name: 'Gespickte Wand',
    token: ['blue', 'blue', 'yellow'],
    type: 'Hindernis',
  },
  {
    name: 'Nur ein paar Stufen',
    token: ['blue', 'purple'],
    type: 'Hindernis',
  },
  {
    name: 'Barb-Irrer',
    token: ['red', 'red', 'yellow'],
    type: 'Person',
  },
  {
    name: 'ÖÖÖÖHHAA',
    token: ['yellow', 'blue', 'yellow'],
    type: 'Monster',
  },
  {
    name: 'Typ mit massiven Schulterpanzern',
    token: ['red', 'blue', 'red'],
    type: 'Person',
  },
  {
    name: '7 Null-Bock-Zwerge',
    token: ['red', 'blue', 'yellow'],
    type: 'Person',
  },
  {
    name: '2 Mann, 1 Bogen',
    token: ['green', 'yellow', 'green'],
    type: 'Person',
  },
];

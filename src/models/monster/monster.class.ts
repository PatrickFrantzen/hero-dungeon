import { shuffle } from '../shuffle.util';
import {
  bossCollection as bossCollectionData,
  monsterCollection as monsterCollectionData,
  questCollection as questCollectionData,
} from './monster-collection.data';

export interface Mob {
  name: string;
  type: string;
  token: string[];
}

/** Reihenfolge bestimmt den Boss-Index für die Monster-/Quest-Formel in `createMob()` - ein
 * Bossname, der hier nicht auftaucht (aktuell nur "Der Dungeon-Overlord", der ursprüngliche
 * `else`-Zweig), fällt auf den Index direkt nach dem letzten gelisteten Boss zurück (siehe
 * `bossIndex` dort), genau wie vorher der `else`-Zweig jeden unbekannten Namen wie den
 * schwersten Boss behandelte. */
const BOSS_ORDER = ['Baby-Barbar', 'Der Flecken-Schrecken', 'Zola, die Gorgone', 'Verdammt, ein Drache!!!'];

const DIFFICULTY_INDEX: Record<string, number> = { easy: 0, medium: 1 };

export class Monster {
  public Mob: Mob[] = [];

  constructor() {}

  /** Monster-/Quest-Anzahl folgt einer geschlossenen Formel statt einer 5×3-Boss-/Schwierigkeits-
   * Kaskade mit 11 positionellen Zahlen-Parametern (ehemals `getMonsterForGame()`, siehe
   * git-history) - Formel und Herleitung stehen in `src/models/CLAUDE.md` und im Test-Kommentar
   * in `monster.class.spec.ts`, hier nur die Anwendung. Ein unbekannter `difficulty`-String
   * (aktuell nur durch fehlerhaften Aufruf möglich) fällt wie vorher auf "hard" (Index 2)
   * zurück, da `DIFFICULTY_INDEX` nur "easy"/"medium" kennt. */
  createMob(numberOfPlayers: number, currentBossName: string, difficulty: string): Mob[] {
    const bossIndex = BOSS_ORDER.includes(currentBossName) ? BOSS_ORDER.indexOf(currentBossName) : BOSS_ORDER.length;
    const difficultyIndex = DIFFICULTY_INDEX[difficulty] ?? 2;

    const monsterCount = 2 * numberOfPlayers + 6 + 4 * bossIndex + 4 * difficultyIndex;
    const questCount = 2 * numberOfPlayers;

    this.loadMonster(monsterCount);
    if (numberOfPlayers === 1) {
      this.loadSoloQuests(questCount);
    } else {
      this.loadQuests(questCount);
    }
    shuffle(this.Mob);

    return this.Mob;
  }

  loadMonster(numberOfMonsterCards: number) {
    let monsterCollectionCopy = [...this.monsterCollection];
    const count = Math.min(numberOfMonsterCards, monsterCollectionCopy.length);
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(
        Math.random() * monsterCollectionCopy.length
      );
      const removedElement = monsterCollectionCopy.splice(randomIndex, 1)[0];
      this.Mob.push(removedElement);
    }
  }

  /** Math.min() schützt davor, mehr Karten zu ziehen als in `questCollection` verfügbar sind -
   * ohne den Schutz pusht die Schleife `undefined` ins Mob-Array, sobald `questCollectionCopy`
   * durch vorherige splice()-Aufrufe leer ist (Math.random() * 0 = 0, splice(0,1) auf leerem
   * Array liefert []). Das tritt konkret bei 5 Spielern auf, weil questFive (10) die aktuell nur
   * 9 aktiven Quest-Kartentypen übersteigt ("Hinterhalt" bleibt auskommentiert, siehe
   * docs/done/five-minute-dungeon-rules-plan.md TODO 9) - ein `undefined`-Eintrag im Mob-Array
   * führt beim späteren `.shift()` zu einem TypeError, sobald er zufällig an erster Stelle
   * landet. */
  loadQuests(numberOfQuestCards: number) {
    let questCollectionCopy = [...this.questCollection];
    const count = Math.min(numberOfQuestCards, questCollectionCopy.length);
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(
        Math.random() * questCollectionCopy.length
      );
      const removedElement = questCollectionCopy.splice(randomIndex, 1)[0];
      this.Mob.push(removedElement);
    }
  }

  /** Singleplayer zieht aus demselben Quest-Pool wie Multiplayer (inkl. Mini-Bosse), nur 'Chaos'
   * fällt raus, weil es eine Zielspieler-Weitergabe voraussetzt, die es im Solo-Modus nicht gibt
   * (siehe Issue #86 für die Monster-/Event-Anzahl pro Boss/Schwierigkeitsgrad). */
  loadSoloQuests(numberOfQuestCards: number) {
    let questCollectionCopy = this.questCollection.filter((quest) => quest.name !== 'Chaos');
    const count = Math.min(numberOfQuestCards, questCollectionCopy.length);
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(
        Math.random() * questCollectionCopy.length
      );
      const removedElement = questCollectionCopy.splice(randomIndex, 1)[0];
      this.Mob.push(removedElement);
    }
  }

  questCollection: Mob[] = questCollectionData;

  bossCollection: Mob[] = bossCollectionData;

  monsterCollection: Mob[] = monsterCollectionData;

  public toJSON() {
    return {
      Mob: this.Mob,
    };
  }
}

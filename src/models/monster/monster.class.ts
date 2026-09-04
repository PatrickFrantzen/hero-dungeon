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

export class Monster {
  public Mob: Mob[] = [];

  constructor() {}

  createMob(numberOfPlayers: number, currentBossName: string, difficulty: string) {
    if (currentBossName == 'Baby-Barbar') {
      if (difficulty == 'easy') {
        this.getMonsterForGame(numberOfPlayers, 8, 2, 10, 4, 12, 6, 14, 8, 16, 10);
      } else if (difficulty == 'medium') {
        this.getMonsterForGame(numberOfPlayers, 12, 2, 14, 4, 16, 6, 18, 8, 20, 10);
      } else {
        this.getMonsterForGame(numberOfPlayers, 16, 2, 18, 4, 20, 6, 22, 8, 24, 10);
      }
    } else if (currentBossName == 'Der Flecken-Schrecken') {
      if (difficulty == 'easy') {
        this.getMonsterForGame(numberOfPlayers, 12, 2, 14, 4, 16, 6, 18, 8, 20, 10);
      } else if (difficulty == 'medium') {
        this.getMonsterForGame(numberOfPlayers, 16, 2, 18, 4, 20, 6, 22, 8, 24, 10);
      } else {
        this.getMonsterForGame(numberOfPlayers, 20, 2, 22, 4, 24, 6, 26, 8, 28, 10);
      }
    } else if (currentBossName == 'Zola, die Gorgone') {
      if (difficulty == 'easy') {
        this.getMonsterForGame(numberOfPlayers, 16, 2, 18, 4, 20, 6, 22, 8, 24, 10);
      } else if (difficulty == 'medium') {
        this.getMonsterForGame(numberOfPlayers, 20, 2, 22, 4, 24, 6, 26, 8, 28, 10);
      } else {
        this.getMonsterForGame(numberOfPlayers, 24, 2, 26, 4, 28, 6, 30, 8, 32, 10);
      }
    } else if (currentBossName == 'Verdammt, ein Drache!!!') {
      if (difficulty == 'easy') {
        this.getMonsterForGame(numberOfPlayers, 20, 2, 22, 4, 24, 6, 26, 8, 28, 10);
      } else if (difficulty == 'medium') {
        this.getMonsterForGame(numberOfPlayers, 24, 2, 26, 4, 28, 6, 30, 8, 32, 10);
      } else {
        this.getMonsterForGame(numberOfPlayers, 28, 2, 30, 4, 32, 6, 34, 8, 36, 10);
      }
    } else {
      if (difficulty == 'easy') {
        this.getMonsterForGame(numberOfPlayers, 24, 2, 26, 4, 28, 6, 30, 8, 32, 10);
      } else if (difficulty == 'medium') {
        this.getMonsterForGame(numberOfPlayers, 28, 2, 30, 4, 32, 6, 34, 8, 36, 10);
      } else {
        this.getMonsterForGame(numberOfPlayers, 32, 2, 34, 4, 36, 6, 38, 8, 40, 10);
      }
    }
    return this.Mob;
  }

  getMonsterForGame(
    numberOfPlayers: number,
    monsterOne: number,
    questOne: number,
    monsterTwo: number,
    questTwo: number,
    monsterThree: number,
    questThree: number,
    monsterFour: number,
    questFour: number,
    monsterFive: number,
    questFive: number
  ) {
    switch (numberOfPlayers) {
      case 1:
        this.loadMonster(monsterOne);
        this.loadSoloQuests(questOne);
        break;
      case 2:
        this.loadMonster(monsterTwo);
        this.loadQuests(questTwo);
        break;
      case 3:
        this.loadMonster(monsterThree);
        this.loadQuests(questThree);
        break;
      case 4:
        this.loadMonster(monsterFour);
        this.loadQuests(questFour);
        break;
      case 5:
        this.loadMonster(monsterFive);
        this.loadQuests(questFive);
        break;
      default:
        break;
    }
    shuffle(this.Mob);
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
   * Array liefert []). Das tritt konkret ab 3 Spielern auf, weil questTwo/-Drei/-Vier/-Fünf
   * (4/6/8/10) den aktuell nur 4 aktiven Event-Kartentypen entwachsen sind (Mini-Bosse sind
   * auskommentiert, siehe docs/done/five-minute-dungeon-rules-plan.md TODO 9) - ein
   * `undefined`-Eintrag im Mob-Array führt beim späteren `.shift()` zu einem TypeError, sobald
   * er zufällig an erster Stelle landet. */
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

  /** Singleplayer zieht nur normale Event-Karten, keine Mini-Bosse/Chaos (siehe
   * singleplayer-mode-plan.md und Issue #86 für die Monster-/Event-Anzahl pro Boss/
   * Schwierigkeitsgrad) - 'Chaos' fällt raus, weil es eine Zielspieler-Weitergabe voraussetzt,
   * die es im Solo-Modus nicht gibt; Mini-Bosse fallen raus, weil sie laut Plan nicht Teil des
   * Solo-Dungeons sind. */
  loadSoloQuests(numberOfQuestCards: number) {
    let questCollectionCopy = this.questCollection.filter((quest) => quest.name !== 'Chaos' && quest.type !== 'Mini-Boss');
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

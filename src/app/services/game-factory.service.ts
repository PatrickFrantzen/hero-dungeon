import { Injectable } from '@angular/core';
import { Game } from 'src/models/game';
import { Mob, Monster } from 'src/models/monster/monster.class';

/**
 * Baut den initialen `Game`-Datensatz für ein neu erstelltes Spiel - reine Funktion ohne
 * Komponentenzustand, extrahiert aus StartscreenComponent.setGameSettings().
 */
@Injectable({
  providedIn: 'root',
})
export class GameFactoryService {
  buildNewGame(numberOfPlayer: number, difficulty: string, gameId: string): Game {
    // bossCollection[0] ist immer Baby-Barbar (Boss #1) - allBosses ist ab hier die
    // Warteschlange der NACH dem aktuellen Boss noch ausstehenden Bosse (#2-#5), analog zu
    // `Mob` als Warteschlange der noch ausstehenden Dungeon-Karten. CardPlayService.
    // continueToNextDungeon() zieht daraus den jeweils nächsten Boss, sobald der aktuelle besiegt
    // ist (Anleitung S. 6: Kampagne Boss #1 -> #2 -> ... -> #5).
    const [currentBoss, ...allBosses] = new Monster().bossCollection;
    const mob: Mob[] = new Monster().createMob(numberOfPlayer, currentBoss.name, difficulty);
    const currentEnemy: Mob = mob.shift()!;

    return {
      numberOfPlayers: numberOfPlayer,
      choosenHeros: [],
      currentEnemy: {
        name: currentEnemy.name,
        token: currentEnemy.token,
        type: currentEnemy.type,
      },
      currentBoss,
      isLost: false,
      gameStatus: 'playing',
      gameId,
      difficulty,
      Mob: mob,
      allBosses,
      questCardActivated: false,
      timerStartedAt: null,
      timerDurationSeconds: 300,
      timerPausedAt: null,
      timerPausedSecondsTotal: 0,
    };
  }
}

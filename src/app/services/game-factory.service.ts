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
    const mob: Mob[] = new Monster().createMob(numberOfPlayer, 'Baby-Barbar', difficulty);
    const allBosses: Mob[] = new Monster().bossCollection;
    const currentEnemy: Mob = mob.shift()!;

    return {
      numberOfPlayers: numberOfPlayer,
      choosenHeros: [],
      currentEnemy: {
        name: currentEnemy.name,
        token: currentEnemy.token,
        type: currentEnemy.type,
      },
      currentBoss: {
        name: 'Baby-Barbar',
        token: ['red', 'red', 'green', 'green', 'purple', 'purple', 'purple'],
        type: 'Boss',
      },
      isLost: false,
      gameStatus: 'playing',
      gameId,
      difficulty,
      Mob: mob,
      allBosses,
      questCardActivated: false,
    };
  }
}

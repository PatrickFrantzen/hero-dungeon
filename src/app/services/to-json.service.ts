import { Injectable } from '@angular/core';
import { Game } from 'src/models/game';

@Injectable({
  providedIn: 'root'
})
export class ToJSONService {

  constructor() { }

  public gameToJSON(game: Game) {
                    return {
            numberOfPlayers: game.numberOfPlayers,
            choosenHeros: game.choosenHeros,
            currentEnemy: game.currentEnemy,
            currentBoss: game.currentBoss,
            isLost: game.isLost,
            gameId: game.gameId,
            difficulty: game.difficulty,
            Mob: game.Mob,
            allBosses: game.allBosses,
            questCardActivated: game.questCardActivated
        }
  }
}

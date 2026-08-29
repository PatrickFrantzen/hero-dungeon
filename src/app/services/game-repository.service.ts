import { Injectable } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { Mob } from 'src/models/monster/monster.class';
import { FirestoreRepositoryService } from './firestore-repository.service';

/**
 * Alle Firestore-Zugriffe auf das `games/{gameId}`-Dokument selbst (Gegner/Mob/Boss,
 * Quest-Flag, Spielerliste). Ersetzt LoadGameService/GamePlayerService/SaveGameService, die
 * dieselben Felder bisher redundant über drei Klassen gelesen/geschrieben haben.
 */
@Injectable({
  providedIn: 'root',
})
export class GameRepositoryService {
  constructor(private repo: FirestoreRepositoryService) {}

  getGame(gameId: string): Promise<DocumentData | undefined> {
    return this.repo.getDoc(['games', gameId]);
  }

  createGame(gameId: string, game: object): Promise<void> {
    return this.repo.setDoc(['games', gameId], game);
  }

  addPlayerToGame(gameId: string, choosenHeros: unknown[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], { choosenHeros });
  }

  updateCurrentEnemyToken(gameId: string, update: Mob | Mob[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], { currentEnemy: update });
  }

  updateNewMob(gameId: string, update: Mob | Mob[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], { Mob: update });
  }

  updateQuestStatus(gameId: string, update: boolean): Promise<void> {
    return this.repo.updateFields(['games', gameId], { questCardActivated: update });
  }

  updateGameStatus(gameId: string, gameStatus: 'playing' | 'won' | 'lost'): Promise<void> {
    return this.repo.updateFields(['games', gameId], { gameStatus, isLost: gameStatus === 'lost' });
  }
}

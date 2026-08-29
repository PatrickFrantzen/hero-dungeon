import { Injectable } from '@angular/core';
import { Mob } from 'src/models/monster/monster.class';
import { FirestoreRepositoryService } from './firestore-repository.service';

@Injectable({
  providedIn: 'root'
})
export class SaveGameService {

  constructor(private repo: FirestoreRepositoryService) { }

  updateHandstack(gameId: string, playerId: string, update: string[]) {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { handstack: update });
  }

  updateCardstack(gameId: string, playerId: string, update: string[]) {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { cardstack: update });
  }

  updateDeliveryStack(gameId: string, playerId: string, update: string[]) {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { deliveryStack: update });
  }

  updateCurrentEnemyToken(gameId: string, update: Mob | Mob[]) {
    return this.repo.updateFields(['games', gameId], { currentEnemy: update });
  }

  updateNewMob(gameId: string, update: Mob | Mob[]) {
    return this.repo.updateFields(['games', gameId], { Mob: update });
  }

  updateQuestStatus(gameId: string, update: boolean) {
    return this.repo.updateFields(['games', gameId], { questCardActivated: update });
  }

}

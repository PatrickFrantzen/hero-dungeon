import { Injectable } from '@angular/core';
import { Firestore, doc, getFirestore, updateDoc } from '@angular/fire/firestore';
import { Mob } from 'src/models/monster/monster.class';

@Injectable({
  providedIn: 'root'
})
export class SaveGameService {

  db = getFirestore();
  constructor() { }

  updateHandstack(gameId: string, playerId: string, update: string[]) {
    const docPlayer = doc(this.db, 'games', gameId, 'player', playerId);
    return updateDoc(docPlayer, { handstack: update });
  }

  updateCardstack(gameId: string, playerId: string, update: string[]) {
    const docPlayer = doc(this.db, 'games', gameId, 'player', playerId);
    return updateDoc(docPlayer, { cardstack: update });
  }

  updateDeliveryStack(gameId: string, playerId: string, update: string[]) {
    const docPlayer = doc(this.db, 'games', gameId, 'player', playerId);
    return updateDoc(docPlayer, { deliveryStack: update });
  }

  updateCurrentEnemyToken(gameId: string, update: Mob | Mob[]) {
    const docServer = doc(this.db, 'games', gameId);
    return updateDoc(docServer, { currentEnemy: update });
  }

  updateNewMob(gameId: string, update: Mob | Mob[]) {
    const docServer = doc(this.db, 'games', gameId);
    return updateDoc(docServer, { Mob: update });
  }

  updateQuestStatus(gameId: string, update: boolean) {
    const docServer = doc(this.db, 'games', gameId);
    return updateDoc(docServer, { questCardActivated: update });
  }

}

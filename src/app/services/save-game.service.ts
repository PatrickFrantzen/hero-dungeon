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
    const updateData = {
      handstack: update
    }
    updateDoc(docPlayer, updateData)
  }

  updateCardstack(gameId: string, playerId: string, update: string[]) {
    const docPlayer = doc(this.db, 'games', gameId, 'player', playerId);
    const updateData = {
      cardstack: update
    }
    updateDoc(docPlayer, updateData)
  }

  updateDeliveryStack(gameId: string, playerId: string, update: string[]) {
    const docPlayer = doc(this.db, 'games', gameId, 'player', playerId);
    const updateData = {
      deliveryStack: update
    }
    console.warn('delStack', update)
    updateDoc(docPlayer, updateData)
  }

  updateCurrentEnemyToken(gameId: string, update: Mob | Mob[]) {
    const docServer= doc(this.db, 'games', gameId);
    const updateData = {
      currentEnemy: update
    }
    updateDoc(docServer, updateData)
  }

  updateNewEnemy(gameId: string, update: Mob | Mob[]) {
    const docServer= doc(this.db, 'games', gameId);
    const updateData = {
      currentEnemy: update
    }
    updateDoc(docServer, updateData)
  }

  updateNewMob(gameId: string, update: Mob | Mob[]) {
    const docServer= doc(this.db, 'games', gameId);
    const updateData = {
      Mob: update
    }
    updateDoc(docServer, updateData)
  }

  updateQuestStatus(gameId: string, update: boolean) {
    const docServer= doc(this.db, 'games', gameId);
    const updateData = {
      questCardActivated: update
    }
    updateDoc(docServer, updateData)
  }

}

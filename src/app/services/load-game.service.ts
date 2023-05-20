import { Injectable } from '@angular/core';
import { doc, getDoc, getFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class LoadGameService {

  db = getFirestore()

  constructor() { }

  async loadHandstack(gameId: string, playerId: string){
    const handstackRef = doc(this.db, 'games', gameId, 'players', playerId);
    const docSnap = await getDoc(handstackRef);
    const data = docSnap.data()!['handstack'];
    console.log('testLoad', data)
    return data;
  }

  async loadCardstack(gameId: string, playerId: string){
    const cardstackkRef = doc(this.db, 'games', gameId, 'players', playerId);
    const docSnap = await getDoc(cardstackkRef);
    const data = docSnap.data()!['cardstack'];
    console.log('testLoad', data);
    return data;
  }

  async loadDeliverystack(gameId: string, playerId: string){
    const deliverystackkRef = doc(this.db, 'games', gameId, 'players', playerId);
    const docSnap = await getDoc(deliverystackkRef);
    const data = docSnap.data()!['deliveryStack'];
    console.log('testLoad', data);
    return data;
  }

  async loadCurrentEnemyToken(gameId: string){
    const currentEnemyTokenRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(currentEnemyTokenRef);
    const data = docSnap.data()!['currentEnemy'].token;
    console.log('testLoad', data);
    return data;
  }

  async loadNewEnemy(gameId: string){
    const newEnemyRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(newEnemyRef);
    const data = docSnap.data()!['currentEnemy'];
    console.log('testLoad', data);
    return data;
  }

  async loadNewMob(gameId: string){
    const currentEnemyTokenRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(currentEnemyTokenRef);
    const data = docSnap.data()!['currentEnemy'];
    console.log('testLoad', data);
    return data;
  }
}

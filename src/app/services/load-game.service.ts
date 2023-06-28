import { Injectable } from '@angular/core';
import {
  DocumentData,
  collection,
  doc,
  getDoc,
  getFirestore,
  query,
} from '@angular/fire/firestore';
import { getDocs, where } from '@firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class LoadGameService {
  db = getFirestore();
  collectionData!: DocumentData;
  constructor() {}

  async loadPlayerCollectionData(gameId: string, playerId: string) {
    const handstackRef = collection(this.db, 'games', gameId, 'player');
    const q = query(handstackRef, where('userId', '==', playerId));
    const docSnap = await getDocs(q);
    docSnap.forEach((doc) => {
      this.collectionData = doc.data();
    });
    return this.collectionData;
  }

  async loadGameCollectionData(gameId: string) {
    const handstackRef = collection(this.db, 'games');
    const q = query(handstackRef, where('gameId', '==', gameId));
    const docSnap = await getDocs(q);
    docSnap.forEach((doc) => {
      this.collectionData = doc.data();
    });
    return this.collectionData;
  }

  async loadCurrentEnemyToken(gameId: string) {
    const currentEnemyTokenRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(currentEnemyTokenRef);
    const data = docSnap.data()!['currentEnemy'].token;
    return data;
  }

  async loadNewEnemy(gameId: string) {
    const newEnemyRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(newEnemyRef);
    const data = docSnap.data()!['currentEnemy'];
    return data;
  }

  async loadNewMob(gameId: string) {
    const currentEnemyTokenRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(currentEnemyTokenRef);
    const data = docSnap.data()!['currentEnemy'];
    return data;
  }
}

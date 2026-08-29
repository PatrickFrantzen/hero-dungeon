import { Injectable } from '@angular/core';
import {
  DocumentData,
  collection,
  getFirestore,
  query,
} from '@angular/fire/firestore';
import { getDocs, where } from '@firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class LoadGameService {
  db = getFirestore();
  constructor() {}

  async loadPlayerCollectionData(gameId: string, playerId: string): Promise<DocumentData | undefined> {
    const handstackRef = collection(this.db, 'games', gameId, 'player');
    const q = query(handstackRef, where('userId', '==', playerId));
    const docSnap = await getDocs(q);
    return docSnap.docs[docSnap.docs.length - 1]?.data();
  }

  async loadGameCollectionData(gameId: string): Promise<DocumentData | undefined> {
    const handstackRef = collection(this.db, 'games');
    const q = query(handstackRef, where('gameId', '==', gameId));
    const docSnap = await getDocs(q);
    return docSnap.docs[docSnap.docs.length - 1]?.data();
  }
}

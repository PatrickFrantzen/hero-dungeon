import { Injectable } from '@angular/core';
import { DocumentData, doc, getDoc, getFirestore, setDoc, updateDoc } from '@angular/fire/firestore';

/**
 * All Firestore access GameComponent needs to join a game and load/update the joining
 * player's document. Extracted so GameComponent's own responsibility is orchestrating that
 * flow and the NGXS dispatches, not building Firestore paths and awaiting SDK calls directly.
 */
@Injectable({
  providedIn: 'root',
})
export class GamePlayerService {
  private db = getFirestore();

  async getGame(gameId: string): Promise<DocumentData | undefined> {
    const docSnap = await getDoc(doc(this.db, 'games', gameId));
    return docSnap.data();
  }

  async getPlayer(gameId: string, playerId: string): Promise<DocumentData | undefined> {
    const docSnap = await getDoc(doc(this.db, 'games', gameId, 'player', playerId));
    return docSnap.data();
  }

  async createPlayer(gameId: string, playerId: string, playerJson: object, updateData: object): Promise<void> {
    const docRef = doc(this.db, 'games', gameId, 'player', playerId);
    await setDoc(docRef, playerJson);
    await updateDoc(docRef, updateData);
  }

  async addPlayerToGame(gameId: string, choosenHeros: unknown[]): Promise<void> {
    await updateDoc(doc(this.db, 'games', gameId), { choosenHeros });
  }

  async updatePlayerChoosenHero(gameId: string, playerId: string, choosenHero: unknown): Promise<void> {
    await updateDoc(doc(this.db, 'games', gameId, 'player', playerId), { choosenHero });
  }

  async updatePlayerCards(gameId: string, playerId: string, cardstack: string[], handstack: string[]): Promise<void> {
    await updateDoc(doc(this.db, 'games', gameId, 'player', playerId), { cardstack, handstack });
  }
}

import { BlockScrollStrategy } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { getFirestore, doc, getDoc } from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})
export class CurrentGameService {

  currentGameId: string = '';
  currentNumberOfPlayers: number = 0;
  currentGameDifficulty: string = '';
  currentGameIsLost: boolean = false;
  currentEnemy: object[] = [];
  currentMonsterStack: string[] = [];
  currentBoss: {} = {};
  allBosses: object[] = [];
  db = getFirestore();

  constructor() { }

  public async getCurrentGame(gameId: string) {
    const docRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(docRef);
    const currentGameData = docSnap.data();
    console.log('currentGame', currentGameData);
    return currentGameData;
  }
}

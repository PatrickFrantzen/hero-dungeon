import { BlockScrollStrategy } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { getFirestore, doc, getDoc } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';

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
  db: any;
  

  constructor() { }

  public async getCurrentGame(gameId: string) {
    const firebaseApp = initializeApp(environment.firebase);
    this.db = getFirestore(firebaseApp);
    const docRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(docRef);
    const currentGameData = docSnap.data();
    console.log('currentGame', currentGameData);
    return currentGameData;
  }

}

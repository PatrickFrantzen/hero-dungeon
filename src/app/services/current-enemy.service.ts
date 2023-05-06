import { EventEmitter, Injectable } from '@angular/core';
import { CurrentGameService } from './current-game.service';
import { doc, getDoc, getFirestore, DocumentData, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CurrentEnemyService {
  db = getFirestore();
  currentData: DocumentData | undefined;
  currentEnemyToken: string[] = []
  public currentEnemyTokenEvent = new EventEmitter<string[]>();

  constructor(
    private currentGame: CurrentGameService
  ) { }

  public async getCurrentEnemyFromServer(gameId: string) {
    return new Promise((resolve, reject) => {
      this.currentGame.getCurrentGame(gameId)
        .then(async () => {
          const EnemyRef = doc(this.db, 'games', gameId);
          const docSnap = await getDoc(EnemyRef);
          this.currentData = docSnap.data();
          
        })
        .then(() => {
          resolve(this.currentData)
        })
    })
  }

  public async removeEnemyToken(gameId: string, card: string) {
    return new Promise((resolve, reject) => {
      this.getCurrentEnemyFromServer(gameId)
      .then(async (response:any) => {
        const EnemyRef = doc(this.db, 'games', gameId);
        const docSnap = await getDoc(EnemyRef);
        this.currentData = docSnap.data();
        this.currentEnemyToken = response.currentEnemy.token;
        let indexOfToken = this.currentEnemyToken.indexOf(card);
        this.currentEnemyToken.splice(indexOfToken,1);

        const updateData = {
          currentEnemy:({
            name: this.currentData!['currentEnemy'].name,
            token: this.currentEnemyToken,
            type: this.currentData!['currentEnemy'].type
          })
        }

        updateDoc(EnemyRef, updateData);
      })
      .then(() => {
        console.log('Service', this.currentEnemyToken)
        resolve(this.currentEnemyToken)
      })
    })
  }

}

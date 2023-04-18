import { Injectable } from '@angular/core';
import { CurrentGameService } from './current-game.service';
import { doc, getDoc, getFirestore, DocumentData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CurrentEnemyService {
  db = getFirestore();
  currentData:DocumentData | undefined;

  constructor(
    private currentGame: CurrentGameService
  ) { }

  public async getCurrentEnemyFromServer(gameId: string) {
    return new Promise((resolve, reject) => {
     this.currentGame.getCurrentGame(gameId)
     .then(async () => {
       const HandRef = doc(this.db, 'games', gameId);
       const docSnap = await getDoc(HandRef);
       this.currentData = docSnap.data();
     })
     .then(()=> {
       resolve(this.currentData)
     })
 
    }) 
   }
}

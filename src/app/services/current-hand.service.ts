import { Injectable } from '@angular/core';
import { doc, getFirestore, getDoc, DocumentData } from '@angular/fire/firestore';
import { CurrentUserService } from './current-user.service';




@Injectable({
  providedIn: 'root'
})
export class CurrentHandService {
  playerId: string = '';
  gameId: string = '';
  db = getFirestore();
  currentCardsInHand!:Promise<string[]>;
  currentData:DocumentData | undefined;

  constructor(
    private currentUserService:CurrentUserService,
    ) { 
  }


  public async getCurrentHandFromServer(gameId: string) {
   return new Promise((resolve, reject) => {
    this.currentUserService.getCurrentUser()
    .then(async (response) => {
      this.playerId = response.userId;
      this.gameId = gameId;
      const HandRef = doc(this.db, 'games', this.gameId, 'player', this.playerId);
      const docSnap = await getDoc(HandRef);
      this.currentData = docSnap.data();
    })
    .then(()=> {
      resolve(this.currentData)
    })

   }) 
  }

  getCards() {
    console.log('felhler2', this.currentCardsInHand)
    return this.currentCardsInHand;
  }
}



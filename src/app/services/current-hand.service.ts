import { Injectable } from '@angular/core';
import { doc, getFirestore, getDoc, DocumentData, updateDoc } from '@angular/fire/firestore';
import { CurrentUserService } from './current-user.service';
import { Select, Store } from '@ngxs/store';
import { CurrentUserSelectors } from '../selectors/currentUser-selectos';
import { Observable } from 'rxjs';
import { CurrentUserModel } from '../states/currentUser-state';
import { UpdateCardStackAction } from '../actions/CardStack-action';




@Injectable({
  providedIn: 'root'
})
export class CurrentHandService {
  

  playerId: string = '';
  gameId: string = '';
  db = getFirestore();
  currentCardsInHand!: Promise<string[]>;
  currentData: DocumentData | undefined;

  constructor(
    private currentUserService: CurrentUserService,
    private store: Store,
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
        .then(() => {
          resolve(this.currentData)
        })

    })
  }

  getCards() {
    return this.currentCardsInHand;
  }

  public async drawACard(gameId: string, currentHand: string[]) {
    //if handstack.length is < 5 draw Cards until 5 in Hand
    return new Promise((resolve, reject) => {
      this.currentUserService.getCurrentUser()
        .then(async (response) => {
          this.playerId = response.userId;
          this.gameId = gameId;
          const HandRef = doc(this.db, 'games', this.gameId, 'player', this.playerId);
          const docSnap = await getDoc(HandRef);
          let data = docSnap.data();
          for (let i = 0; currentHand.length < 5; i++) {
            const getCardForHand = data!['heroStack'].shift();
            currentHand.push(getCardForHand)
            this.store.dispatch(new UpdateCardStackAction(data!['heroStack']))
          }
          const updateData = {
            heroStack: data!['heroStack'],
            handstack: currentHand
          }
          
          updateDoc(HandRef, updateData)
        })
    })
  }




}


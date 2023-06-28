import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { CurrentHandSelector } from '../selectors/currentHand-selector';
import { CurrentCardStackSelector } from '../selectors/currentCardStack-selector';
import { CurrentGameSelectors } from '../selectors/currentGame-selector';
import { CurrentUserSelectors } from '../selectors/currentUser-selectos';
import { UpdateCurrentHandAction } from '../actions/cardsInHand-action';
import { SaveGameService } from './save-game.service';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from '../actions/heropower-action';

@Injectable({
  providedIn: 'root'
})
export class DiebServiceService {

  constructor(private store: Store, private saveGame: SaveGameService) { }

  heropower(heropowerArray: string[]) {
    let currentHand = this.store.selectSnapshot(
      CurrentHandSelector.currentHand
    );
    let currentCardStack = this.store.selectSnapshot(
      CurrentCardStackSelector.currentCardStack
    );
    let gameId = this.store.selectSnapshot(CurrentGameSelectors.currentGame);
    let playerId = this.store.selectSnapshot(
      CurrentUserSelectors.currentUserId
    );
    let currHand = [...currentHand];
    let currCardStack = [...currentCardStack];
    heropowerArray.forEach((card) => {
      let indexOfHandCard = currHand.indexOf(card);

      currHand.splice(indexOfHandCard, 1);
      this.store.dispatch(new UpdateCurrentHandAction(currHand));
    });
    for (let i = 0; i < 5; i++) {
      if (currCardStack.length > 0) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);

        this.saveGame.updateHandstack(gameId, playerId, currHand);
        this.saveGame.updateCardstack(gameId, playerId, currCardStack);
      } else {
        this.saveGame.updateHandstack(gameId, playerId, currHand);
        this.saveGame.updateCardstack(gameId, playerId, currCardStack);
      }
    }
    console.warn('Success');
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }
}

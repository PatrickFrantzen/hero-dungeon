import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { CurrentHandSelector } from '../selectors/currentHand-selector';
import { CurrentCardStackSelector } from '../selectors/currentCardStack-selector';
import { CurrentGameSelectors } from '../selectors/currentGame-selector';
import { CurrentUserSelectors } from '../selectors/currentUser-selectors';
import { UpdateCurrentHandAction } from '../actions/cardsInHand-action';
import { PlayerRepositoryService } from './player-repository.service';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from '../actions/heropower-action';

@Injectable({
  providedIn: 'root'
})
export class DiebService {

  constructor(private store: Store, private playerRepo: PlayerRepositoryService) { }

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
    for (let i = 0; i < 5 && currCardStack.length > 0; i++) {
      currHand.push(currCardStack.shift()!);
    }
    this.playerRepo.updateHandstack(gameId, playerId, currHand);
    this.playerRepo.updateCardstack(gameId, playerId, currCardStack);
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }
}

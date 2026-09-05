import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { CurrentHandSelector } from '../selectors/currentHand-selector';
import { CurrentCardStackSelector } from '../selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from '../selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from '../selectors/currentGame-selector';
import { CurrentUserSelectors } from '../selectors/currentUser-selectors';
import { UpdateCurrentHandAction } from '../actions/cardsInHand-action';
import { UpdateCardStackAction } from '../actions/CardStack-action';
import { UpdateDeliveryStack } from '../actions/deliveryStack-action';
import { SetGameStats } from '../actions/currentGame-action';
import { PlayerRepositoryService } from './player-repository.service';
import { GameRepositoryService } from './game-repository.service';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from '../actions/heropower-action';

@Injectable({
  providedIn: 'root'
})
export class DiebService {
  private store = inject(Store);
  private playerRepo = inject(PlayerRepositoryService);
  private gameRepo = inject(GameRepositoryService);

  heropower(heropowerArray: string[]) {
    let currentHand = this.store.selectSnapshot(
      CurrentHandSelector.currentHand
    );
    let currentCardStack = this.store.selectSnapshot(
      CurrentCardStackSelector.currentCardStack
    );
    let currentDeliveryStack = this.store.selectSnapshot(
      CurrentDeliveryStackSelector.currentDeliveryStack
    );
    let gameId = this.store.selectSnapshot(CurrentGameSelectors.currentGame);
    let playerId = this.store.selectSnapshot(
      CurrentUserSelectors.currentUserId
    );
    let currHand = [...currentHand];
    let currCardStack = [...currentCardStack];
    let currDeliveryStack = [...currentDeliveryStack];

    // Lege die 3 gewählten Karten auf den Ablagestapel statt sie zu verwerfen - sonst
    // verschwinden sie dauerhaft aus dem Umlauf, statt beim nächsten Reshuffle
    // (CardPlayService.drawCards()) wieder verfügbar zu werden.
    heropowerArray.forEach((card) => {
      let indexOfHandCard = currHand.indexOf(card);
      if (indexOfHandCard === -1) return;

      currDeliveryStack.push(...currHand.splice(indexOfHandCard, 1));
    });

    for (let i = 0; i < 5 && currCardStack.length > 0; i++) {
      currHand.push(currCardStack.shift()!);
    }

    // Nachziehstapel/Ablagestapel im Store aktualisieren - ohne diese Dispatches (vorheriger
    // Bug) blieb currentCardStack im Singleplayer (kein Firestore-Live-Sync zurück in den
    // Store, siehe player-hand/CLAUDE.md) für den Rest der Session eingefroren: jede weitere
    // Heropower-Nutzung/jedes Nachziehen las denselben, nicht geschrumpften Stapel erneut und
    // zog bereits ausgeteilte Karten (z.B. "Stehlen") ein zweites Mal - sichtbar als
    // duplizierte Handkarten.
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateCardStackAction(currCardStack));
    this.store.dispatch(new UpdateDeliveryStack(currDeliveryStack));

    this.playerRepo.updateHandstack(gameId, playerId, currHand);
    this.playerRepo.updateCardstack(gameId, playerId, currCardStack);
    this.playerRepo.updateDeliveryStack(gameId, playerId, currDeliveryStack);
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));

    // Statistik-Zähler "genutzte Heldenfähigkeiten" (GameStats) - der Dieb läuft nicht über
    // HeropowerService.bumpStat(), daher hier separat analog zum dortigen Muster.
    const currentStats = this.store.selectSnapshot(CurrentGameSelectors.currentStats);
    const stats = { ...currentStats, heropowersUsed: currentStats.heropowersUsed + 1 };
    this.store.dispatch(new SetGameStats(stats));
    this.gameRepo.updateStats(gameId, stats);
  }
}

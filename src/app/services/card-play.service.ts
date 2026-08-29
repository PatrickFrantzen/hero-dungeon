import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { StartGameTimer, UpdateGameStatus } from 'src/app/actions/currentGame-action';
import { SetNewEnemy, UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { Mob } from 'src/models/monster/monster.class';
import { shuffle } from 'src/models/shuffle.util';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

export type ReportWriteFailure = (write: Promise<void>) => void;

/**
 * Die eigentlichen Kartenspielregeln aus PlayerHandComponent: welche Karte auf welches
 * Gegner-Token passt, Einzel-/Doppelkarten-Logik, Handgröße nachfüllen, nächster Gegner/Boss.
 * `chooseCard()` ist der einzige öffentliche Einstiegspunkt (Template-Handler); alles andere
 * ist interne Ablauflogik dieser Regeln.
 */
@Injectable({
  providedIn: 'root',
})
export class CardPlayService {
  private currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);
  private currentCardStack = this.store.selectSignal(CurrentCardStackSelector.currentCardStack);
  private currentDeliveryStack = this.store.selectSignal(CurrentDeliveryStackSelector.currentDeliveryStack);
  private currentEnemy = this.store.selectSignal(EncounterSelectors.currentEnemy);
  private currentMob = this.store.selectSignal(EncounterSelectors.currentMob);
  private currentBoss = this.store.selectSignal(EncounterSelectors.currentBoss);
  private timerStartedAt = this.store.selectSignal(CurrentGameSelectors.currentTimerStartedAt);
  private heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);
  private heropowerArray = this.store.selectSignal(HeropowerSelectors.currentHeropowerArray);

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService
  ) {}

  chooseCard(gameId: string, playerId: string, card: string, reportWriteFailure: ReportWriteFailure): void {
    const doubleCard = card.split('_');
    const currHand = [...this.currentHand()];
    const currEne = [...this.currentEnemy().token];
    const currName = this.currentEnemy().name;
    const currType = this.currentEnemy().type;
    const currMob: Mob = {
      name: currName,
      token: currEne,
      type: currType,
    };

    if (this.heropowerActivated()) {
      if (this.heropowerArray().length < 3) {
        let hpArr = [...this.heropowerArray()];
        hpArr.push(card);
        this.store.dispatch(new UpdateHeropowerArray(hpArr));
      }
    } else {
      this.store.dispatch(new UpdateHeropowerArray([]));

      if (card.includes('_')) {
        const isEventCard = currMob.token[0].toLocaleLowerCase().includes('event');
        const isMatchingType = currMob.type.toLocaleLowerCase().includes(doubleCard[1]);

        if (isEventCard || isMatchingType) {
          this.ensureGameTimerStarted(gameId, reportWriteFailure);
          currEne.length = 0;
          this.store.dispatch(new UpdateMonsterTokenArray(currEne));
          reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
          this.checkForNextEnemy(gameId, this.currentEnemy(), reportWriteFailure);
          this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);
        }
        if (
          card.includes('_') &&
          (this.currentEnemy().token.includes(doubleCard[0]) || this.currentEnemy().token.includes(doubleCard[1]))
        ) {
          this.ensureGameTimerStarted(gameId, reportWriteFailure);
          if (this.currentEnemy().token.includes(doubleCard[0]) && this.currentEnemy().token.includes(doubleCard[1])) {
            this.playAsTwoCards(gameId, doubleCard[0], doubleCard[1], currEne, reportWriteFailure);
          } else if (this.currentEnemy().token.includes(doubleCard[0])) {
            this.playAsOneCard(gameId, doubleCard[0], currEne, reportWriteFailure);
          } else if (this.currentEnemy().token.includes(doubleCard[1])) {
            this.playAsOneCard(gameId, doubleCard[1], currEne, reportWriteFailure);
          }
          this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);
        }
      }

      if (this.currentEnemy().token.includes(card)) {
        this.ensureGameTimerStarted(gameId, reportWriteFailure);
        this.playCardfromHandAndUpdateEnemyToken(gameId, playerId, card, reportWriteFailure);
      }
    }
  }

  /** Singleplayer-Deadlock-Schutz: ausgewählte Karte ablegen und eine Ersatzkarte ziehen. */
  restCard(gameId: string, playerId: string, card: string, reportWriteFailure: ReportWriteFailure): void {
    const currHand = [...this.currentHand()];
    const cardIndex = currHand.indexOf(card);
    if (cardIndex < 0) return;

    currHand.splice(cardIndex, 1);
    const deliveryStack = [...this.currentDeliveryStack(), card];
    const drawResult = this.drawCards(currHand, [...this.currentCardStack()], deliveryStack, 1);

    this.persistPlayerStacks(gameId, playerId, drawResult.hand, drawResult.cardStack, drawResult.deliveryStack, reportWriteFailure);
  }

  /** Löst die solo-tauglichen Eventkarten aus und lädt danach den nächsten Encounter. */
  resolveSoloEvent(gameId: string, playerId: string, reportWriteFailure: ReportWriteFailure): void {
    const event = this.currentEnemy();
    if (!event.token.includes('event')) return;

    const currHand = [...this.currentHand()];
    let cardsToDiscard = 0;
    let cardsToDraw = 0;

    switch (event.name) {
      case 'Plötzliche Krankheit':
        cardsToDiscard = currHand.length;
        cardsToDraw = 5;
        break;
      case 'Ein Wehweh':
        cardsToDiscard = Math.min(1, currHand.length);
        cardsToDraw = cardsToDiscard;
        break;
      case 'Falltür':
        cardsToDiscard = Math.min(3, currHand.length);
        cardsToDraw = cardsToDiscard;
        break;
      default:
        cardsToDiscard = currHand.length;
        cardsToDraw = 5;
        break;
    }

    const discardedCards = currHand.splice(0, cardsToDiscard);
    const deliveryStack = [...this.currentDeliveryStack(), ...discardedCards];
    const drawResult = this.drawCards(currHand, [...this.currentCardStack()], deliveryStack, cardsToDraw);
    this.persistPlayerStacks(gameId, playerId, drawResult.hand, drawResult.cardStack, drawResult.deliveryStack, reportWriteFailure);

    const clearedEvent: Mob = { ...event, token: [] };
    this.store.dispatch(new SetNewEnemy(clearedEvent));
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, clearedEvent));
    this.checkForNextEnemy(gameId, clearedEvent, reportWriteFailure);
  }

  private playCardfromHandAndUpdateEnemyToken(
    gameId: string,
    playerId: string,
    card: string,
    reportWriteFailure: ReportWriteFailure
  ): void {
    const currHand = [...this.currentHand()];
    const currEne = [...this.currentEnemy().token];
    const currName = this.currentEnemy().name;
    const currType = this.currentEnemy().type;
    const currMob: Mob = {
      name: currName,
      token: currEne,
      type: currType,
    };

    const indexOfHandCard = currHand.indexOf(card);
    const indexOfEnemyToken = currEne.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currEne.splice(indexOfEnemyToken, 1);

    const updatedHand = this.checkHandsize(gameId, playerId, currHand, [card], reportWriteFailure);

    reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, updatedHand));
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, currMob));

    this.store.dispatch(new UpdateCurrentHandAction(updatedHand));
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));

    this.checkForNextEnemy(gameId, this.currentEnemy(), reportWriteFailure);
  }

  private ensureGameTimerStarted(gameId: string, reportWriteFailure: ReportWriteFailure): void {
    if (this.timerStartedAt() !== null) return;
    const startedAt = Date.now();
    this.store.dispatch(new StartGameTimer(startedAt));
    reportWriteFailure(this.gameRepo.updateTimerStartedAt(gameId, startedAt));
  }

  private checkHandsize(
    gameId: string,
    playerId: string,
    handsize: string[],
    discardedCards: string[],
    reportWriteFailure: ReportWriteFailure
  ): string[] {
    const drawCount = Math.max(0, 5 - handsize.length);
    const drawResult = this.drawCards(
      [...handsize],
      [...this.currentCardStack()],
      [...this.currentDeliveryStack(), ...discardedCards],
      drawCount
    );

    this.persistPlayerStacks(gameId, playerId, drawResult.hand, drawResult.cardStack, drawResult.deliveryStack, reportWriteFailure);
    return drawResult.hand;
  }

  /** Public: also used directly by PlayerHandComponent as the "array" heropower group's
   * onEnemyTokenCleared callback (HeropowerService clears the token, this decides what enemy
   * comes next). */
  checkForNextEnemy(gameId: string, currentEnemy: Mob, reportWriteFailure: ReportWriteFailure): void {
    if (Array.isArray(currentEnemy.token) && !currentEnemy.token.length) {
      if (currentEnemy.type === 'Boss') {
        reportWriteFailure(this.gameRepo.updateGameStatus(gameId, 'won'));
        this.store.dispatch(new UpdateGameStatus('won'));
      } else if (this.currentMob().length > 0) {
        this.getNextEnemy(gameId, reportWriteFailure);
      } else {
        this.getNextBoss(gameId, reportWriteFailure);
      }
      // this.loadNextDungeon(); // noch nicht geschrieben - Dungeon-Wechsel nach dem letzten Boss
    }
  }

  private playAsOneCard(gameId: string, card: string, currEne: string[], reportWriteFailure: ReportWriteFailure): void {
    const indexOfEnemyToken = currEne.indexOf(card);
    currEne.splice(indexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
    this.checkForNextEnemy(gameId, this.currentEnemy(), reportWriteFailure);
  }

  private playAsTwoCards(
    gameId: string,
    cardOne: string,
    cardTwo: string,
    currEne: string[],
    reportWriteFailure: ReportWriteFailure
  ): void {
    const firstIndexOfEnemyToken = currEne.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);

    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));

    if (currEne.includes(cardTwo)) {
      const secCurrEne = [...currEne];
      const secondIndexOfEnemyToken = currEne.indexOf(cardTwo);
      secCurrEne.splice(secondIndexOfEnemyToken, 1);

      this.store.dispatch(new UpdateMonsterTokenArray(secCurrEne));
      reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
      this.checkForNextEnemy(gameId, this.currentEnemy(), reportWriteFailure);
    }
  }

  private getNextEnemy(gameId: string, reportWriteFailure: ReportWriteFailure): void {
    const currMob = [...this.currentMob()];
    const newCurrentEnemy: Mob = currMob.shift()!;
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy));
    reportWriteFailure(this.gameRepo.updateNewMob(gameId, currMob));
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob));
  }

  private getNextBoss(gameId: string, reportWriteFailure: ReportWriteFailure): void {
    const newCurrentEnemy: Mob = this.currentBoss();
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy));
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
  }

  private saveHand(
    gameId: string,
    playerId: string,
    card: string,
    currHand: string[],
    reportWriteFailure: ReportWriteFailure
  ): void {
    let indexOfHandCard = this.currentHand().indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currHand = this.checkHandsize(gameId, playerId, currHand, [card], reportWriteFailure);
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, currHand));
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateCardStackAction(this.currentCardStack()));
  }

  private drawCards(hand: string[], cardStack: string[], deliveryStack: string[], drawCount: number) {
    for (let i = 0; i < drawCount; i++) {
      if (cardStack.length === 0 && deliveryStack.length > 0) {
        cardStack = shuffle([...deliveryStack]);
        deliveryStack = [];
      }

      if (cardStack.length === 0) {
        break;
      }

      hand.push(cardStack.shift()!);
    }

    return { hand, cardStack, deliveryStack };
  }

  private persistPlayerStacks(
    gameId: string,
    playerId: string,
    hand: string[],
    cardStack: string[],
    deliveryStack: string[],
    reportWriteFailure: ReportWriteFailure
  ): void {
    this.store.dispatch(new UpdateCurrentHandAction(hand));
    this.store.dispatch(new UpdateCardStackAction(cardStack));
    this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, hand));
    reportWriteFailure(this.playerRepo.updateCardstack(gameId, playerId, cardStack));
    reportWriteFailure(this.playerRepo.updateDeliveryStack(gameId, playerId, deliveryStack));
  }
}

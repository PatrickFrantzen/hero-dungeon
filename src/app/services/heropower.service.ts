import { Injectable } from '@angular/core';
import { DocumentData, where } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { SetGameTimerPauseState } from 'src/app/actions/currentGame-action';
import { UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { Mob } from 'src/models/monster/monster.class';
import { FirestoreRepositoryService } from './firestore-repository.service';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

/** Passed in by the caller so a failed write surfaces on that caller's own error signal
 * instead of this (root-provided, but effectively PlayerHandComponent-only) service needing
 * its own error state. */
export type ReportWriteFailure = (write: Promise<void>) => void;

/**
 * Die drei Heropower-Auflösungen aus PlayerHandComponent (Walküre/Jägerin/"Array"-Gruppe:
 * Gladiator/Barbar/Zauberin/Waldläufer/Ninja/Paladin), inklusive der Firestore-Zugriffe, die
 * dafür nötig sind (andere Spieler-Dokumente lesen, Hand-/Kartenstapel schreiben).
 *
 * Die drei Methoden bleiben bewusst separate Implementierungen statt zu einer gemeinsamen
 * Hilfsmethode zusammengefasst zu werden: `resolveArrayHeropower()` dispatcht
 * `UpdateCurrentHandAction` nach dem Entfernen einer Karte nur dann, wenn direkt im selben
 * Schritt auch nachgezogen wird, während `resolveWalkuereHeropower()`/
 * `resolveJaegerinHeropower()` das bei jeder Karte im Array dispatchen, unabhängig vom
 * Nachziehen - eine bereits im Ursprungscode vorhandene, nicht dokumentierte Verhaltens-
 * Abweichung. Ohne echten Multiplayer-Test wäre ein Vereinheitlichen dieser drei Methoden ein
 * Risiko, unbeabsichtigt Spielverhalten zu ändern.
 */
@Injectable({
  providedIn: 'root',
})
export class HeropowerService {
  private currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);
  private currentCardStack = this.store.selectSignal(CurrentCardStackSelector.currentCardStack);
  private currentEnemy = this.store.selectSignal(EncounterSelectors.currentEnemy);
  private heropowerArray = this.store.selectSignal(HeropowerSelectors.currentHeropowerArray);
  private timerStartedAt = this.store.selectSignal(CurrentGameSelectors.currentTimerStartedAt);
  private timerPausedAt = this.store.selectSignal(CurrentGameSelectors.currentTimerPausedAt);
  private timerPausedSecondsTotal = this.store.selectSignal(CurrentGameSelectors.currentTimerPausedSecondsTotal);

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
    private repo: FirestoreRepositoryService
  ) {}

  resolveWalkuereHeropower(gameId: string, playerId: string, reportWriteFailure: ReportWriteFailure): void {
    if (this.heropowerArray().length !== 3) return;

    this.heropowerArray().forEach((card) => {
      let currHand = [...this.currentHand()];
      let currCardStack = [...this.currentCardStack()];
      let indexOfHandCard = this.currentHand().indexOf(card);
      currHand.splice(indexOfHandCard, 1);
      this.store.dispatch(new UpdateCurrentHandAction(currHand));

      if (currHand.length < 5 && currCardStack.length > 0) {
        let currCardStack = [...this.currentCardStack()];
        let currHand = [...this.currentHand()];
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);
        reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, currHand));
        reportWriteFailure(this.playerRepo.updateCardstack(gameId, playerId, currCardStack));
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });

    this.giveOtherPlayersCards(gameId, playerId, reportWriteFailure);

    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }

  private async giveOtherPlayersCards(
    gameId: string,
    playerId: string,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    otherPlayers.forEach((data) => this.drawTwoCardsForOtherPlayer(gameId, data, reportWriteFailure));
  }

  private drawTwoCardsForOtherPlayer(gameId: string, data: DocumentData, reportWriteFailure: ReportWriteFailure): void {
    const userId = data['userId'];
    let currentCardStack = data['cardstack'];
    let currentHand = data['handstack'];
    for (let i = 0; i < 2; i++) {
      let currHand = [...currentHand];
      let currCardStack = [...currentCardStack];

      if (currCardStack.length > 0) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);

        reportWriteFailure(this.playerRepo.updateHandstack(gameId, userId, currHand));
        reportWriteFailure(this.playerRepo.updateCardstack(gameId, userId, currCardStack));

        currentCardStack = currCardStack;
        currentHand = currHand;
      }
    }
  }

  resolveJaegerinHeropower(
    gameId: string,
    playerId: string,
    reportWriteFailure: ReportWriteFailure,
    openFollowUpDialog: () => void
  ): void {
    if (this.heropowerArray().length !== 3) return;
    this.heropowerArray().forEach((card) => {
      let currHand = [...this.currentHand()];
      let currCardStack = [...this.currentCardStack()];
      let indexOfHandCard = this.currentHand().indexOf(card);
      currHand.splice(indexOfHandCard, 1);
      this.store.dispatch(new UpdateCurrentHandAction(currHand));

      if (currHand.length < 5 && currCardStack.length > 0) {
        let currCardStack = [...this.currentCardStack()];
        let currHand = [...this.currentHand()];
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);
        reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, currHand));
        reportWriteFailure(this.playerRepo.updateCardstack(gameId, playerId, currCardStack));
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });
    openFollowUpDialog();
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }

  /** Wird aufgerufen, nachdem der Spieler im "Heropower auswählen"-Dialog einen Zielspieler
   * gewählt hat (vorher: getOtherPlayerDataTogivePlayerCards() + playerIdForHeropowerAction-Feld
   * in PlayerHandComponent - der gewählte Spieler wird jetzt direkt als Parameter durchgereicht). */
  async resolveJaegerinHeropowerForPlayer(
    gameId: string,
    currentPlayerId: string,
    targetPlayerId: string,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const targetPlayerDocs = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('userId', '==', targetPlayerId)]
    );
    targetPlayerDocs.forEach((data) =>
      this.drawFourCardsForJaegerinTarget(gameId, currentPlayerId, data, reportWriteFailure)
    );
  }

  private drawFourCardsForJaegerinTarget(
    gameId: string,
    currentPlayerId: string,
    data: DocumentData,
    reportWriteFailure: ReportWriteFailure
  ): void {
    const userId = data['userId'];
    let currentCardStack = data['cardstack'];
    let currentHand = data['handstack'];

    if (currentPlayerId === userId) {
      for (let i = 0; i < 4; i++) {
        let currCardStack = [...this.currentCardStack()];
        let currHand = [...this.currentHand()];

        if (currCardStack.length > 0) {
          const getCardForHand = currCardStack.shift()!;
          currHand.push(getCardForHand);

          reportWriteFailure(this.playerRepo.updateHandstack(gameId, userId, currHand));
          reportWriteFailure(this.playerRepo.updateCardstack(gameId, userId, currCardStack));

          this.store.dispatch(new UpdateCardStackAction(currCardStack));
          this.store.dispatch(new UpdateCurrentHandAction(currHand));
        }
      }
    } else {
      for (let i = 0; i < 4; i++) {
        let currHand = [...currentHand];
        let currCardStack = [...currentCardStack];

        if (currCardStack.length > 0) {
          const getCardForHand = currCardStack.shift()!;
          currHand.push(getCardForHand);

          reportWriteFailure(this.playerRepo.updateHandstack(gameId, userId, currHand));
          reportWriteFailure(this.playerRepo.updateCardstack(gameId, userId, currCardStack));

          currentCardStack = currCardStack;
          currentHand = currHand;
        }
      }
    }
  }

  /** Magier "Zeit einfrieren": 3 Handkarten ablegen, dafür pausiert der Dungeon-Timer, bis
   * jemand eine Karte in die Tischmitte spielt (CardPlayService.resumeGameTimerIfPaused()). */
  resolveMagierHeropower(gameId: string, playerId: string, reportWriteFailure: ReportWriteFailure): void {
    if (this.heropowerArray().length !== 3) return;

    this.heropowerArray().forEach((card) => {
      const indexOfHandCard = this.currentHand().indexOf(card);
      const currHand = [...this.currentHand()];
      currHand.splice(indexOfHandCard, 1);
      this.store.dispatch(new UpdateCurrentHandAction(currHand));
    });

    if (this.timerStartedAt() !== null && this.timerPausedAt() === null) {
      const pausedAt = Date.now();
      this.store.dispatch(new SetGameTimerPauseState(pausedAt, this.timerPausedSecondsTotal()));
      reportWriteFailure(this.gameRepo.updateTimerPauseState(gameId, pausedAt, this.timerPausedSecondsTotal()));
    }

    reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, this.currentHand()));
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }

  resolveArrayHeropower(
    gameId: string,
    playerId: string,
    reportWriteFailure: ReportWriteFailure,
    onEnemyTokenCleared: (enemy: Mob) => void
  ): void {
    if (this.heropowerArray().length !== 3) return;

    let currEnemyToken = [...this.currentEnemy().token];
    currEnemyToken.length = 0;

    this.store.dispatch(new UpdateMonsterTokenArray(currEnemyToken));
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
    onEnemyTokenCleared(this.currentEnemy());

    this.heropowerArray().forEach((card) => {
      let indexOfHandCard = this.currentHand().indexOf(card);
      let currHand = [...this.currentHand()];
      let currCardStack = [...this.currentCardStack()];
      currHand.splice(indexOfHandCard, 1);

      if (currHand.length < 5 && currCardStack.length > 0) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);

        reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, currHand));
        reportWriteFailure(this.playerRepo.updateCardstack(gameId, playerId, currCardStack));

        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }
}

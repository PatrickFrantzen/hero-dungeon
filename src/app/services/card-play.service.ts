import { Injectable } from '@angular/core';
import { DocumentData, where } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { SetGameTimerPauseState, StartGameTimer, UpdateGameStatus } from 'src/app/actions/currentGame-action';
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
import { FirestoreRepositoryService } from './firestore-repository.service';
import { startHandSize } from 'src/models/start-hand-size.util';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

export type ReportWriteFailure = (write: Promise<void>) => void;

/**
 * Die eigentlichen Kartenspielregeln aus PlayerHandComponent: welche Karte auf welches
 * Gegner-Token passt, Einzel-/Doppelkarten-Logik, Handgröße nachfüllen, nächster Gegner/Boss.
 * `chooseCard()` ist der Einstiegspunkt für alle Karten, die ohne weitere Nutzereingabe
 * auflösen (Template-Handler). Fünf Aktionskarten (Spende, Stehlen, Heilkräuter, Wut, Heilung)
 * brauchen vorher eine Zielspieler-Auswahl per Dialog - für die ruft PlayerHandComponent statt
 * `chooseCard()` direkt die passende `resolve*()`-Methode unten mit dem/den gewählten
 * Zielspieler(n) auf; `chooseCard()` selbst würde diese Kartennamen nicht erkennen und sie
 * folgenlos verpuffen lassen.
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
  private timerPausedAt = this.store.selectSignal(CurrentGameSelectors.currentTimerPausedAt);
  private timerPausedSecondsTotal = this.store.selectSignal(CurrentGameSelectors.currentTimerPausedSecondsTotal);
  private heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);
  private heropowerArray = this.store.selectSignal(HeropowerSelectors.currentHeropowerArray);
  private currentNumberOfPlayers = this.store.selectSignal(CurrentGameSelectors.currentNumberOfPlayers);

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
    private repo: FirestoreRepositoryService
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

      if (card === 'göttlicherSchild') {
        this.resolveGoettlicherSchild(gameId, playerId, card, currHand, reportWriteFailure);
        return;
      }

      if (card === 'heiligeHandgranate') {
        this.resolveHeiligeHandgranate(gameId, playerId, card, currHand, reportWriteFailure);
        return;
      }

      if (card === 'heiltrank') {
        this.resolveHeiltrank(gameId, playerId, card, currHand, reportWriteFailure);
        return;
      }

      if (card.includes('_')) {
        const isEventCard = currMob.token[0].toLocaleLowerCase().includes('event');
        const isMatchingType = currMob.type.toLocaleLowerCase().includes(doubleCard[1]);

        if (isEventCard || isMatchingType) {
          this.ensureGameTimerStarted(gameId, reportWriteFailure);
          this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
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
          this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
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
        this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
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

  /** "Zeit bleibt eingefroren, bis ein Spieler eine Karte in die Tischmitte spielt" (S. 8) -
   * an jeder Stelle aufgerufen, an der chooseCard() tatsächlich eine Ressourcen-/Aktionskarte
   * in die Tischmitte spielt (nicht bei Heropower-Nutzung oder beim Aufdecken der nächsten
   * Dungeon-Karte, die laut Anleitung die Pause ausdrücklich NICHT beenden). */
  private resumeGameTimerIfPaused(gameId: string, reportWriteFailure: ReportWriteFailure): void {
    const pausedAt = this.timerPausedAt();
    if (pausedAt === null) return;
    const pausedSecondsTotal = this.timerPausedSecondsTotal() + Math.max(0, (Date.now() - pausedAt) / 1000);
    this.store.dispatch(new SetGameTimerPauseState(null, pausedSecondsTotal));
    reportWriteFailure(this.gameRepo.updateTimerPauseState(gameId, null, pausedSecondsTotal));
  }

  private freezeGameTimer(gameId: string, reportWriteFailure: ReportWriteFailure): void {
    if (this.timerPausedAt() !== null) return;
    const pausedAt = Date.now();
    this.store.dispatch(new SetGameTimerPauseState(pausedAt, this.timerPausedSecondsTotal()));
    reportWriteFailure(this.gameRepo.updateTimerPauseState(gameId, pausedAt, this.timerPausedSecondsTotal()));
  }

  /** Walküre/Paladin "Göttlicher Schild": friert die Zeit ein und lässt jeden Spieler 1 Karte
   * vom eigenen Nachziehstapel ziehen - unabhängig von der sonst geltenden Handgrößen-Obergrenze
   * (Anleitung S. 6, Anmerkung Punkt 4: aufgeforderte Zuggaben zählen immer). */
  private resolveGoettlicherSchild(
    gameId: string,
    playerId: string,
    card: string,
    currHand: string[],
    reportWriteFailure: ReportWriteFailure
  ): void {
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.freezeGameTimer(gameId, reportWriteFailure);
    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);
    this.drawCardsIgnoringHandsize(gameId, playerId, 1, reportWriteFailure);
    this.drawCardsForOtherPlayers(gameId, playerId, 1, reportWriteFailure);
  }

  private drawCardsIgnoringHandsize(gameId: string, playerId: string, count: number, reportWriteFailure: ReportWriteFailure): void {
    const drawResult = this.drawCards(
      [...this.currentHand()],
      [...this.currentCardStack()],
      [...this.currentDeliveryStack()],
      count
    );
    this.persistPlayerStacks(gameId, playerId, drawResult.hand, drawResult.cardStack, drawResult.deliveryStack, reportWriteFailure);
  }

  private async drawCardsForOtherPlayers(
    gameId: string,
    playerId: string,
    count: number,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    otherPlayers.forEach((data) => this.drawCardsForPlayerData(gameId, data, count, reportWriteFailure));
  }

  private async drawCardsForTarget(
    gameId: string,
    targetPlayerId: string,
    count: number,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const data = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    if (!data) return;
    this.drawCardsForPlayerData(gameId, data, count, reportWriteFailure);
  }

  private drawCardsForPlayerData(gameId: string, data: DocumentData, count: number, reportWriteFailure: ReportWriteFailure): void {
    const userId = data['userId'];
    const drawResult = this.drawCards(
      [...(data['handstack'] ?? [])],
      [...(data['cardstack'] ?? [])],
      [...(data['deliveryStack'] ?? [])],
      count
    );
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, userId, drawResult.hand));
    reportWriteFailure(this.playerRepo.updateCardstack(gameId, userId, drawResult.cardStack));
    reportWriteFailure(this.playerRepo.updateDeliveryStack(gameId, userId, drawResult.deliveryStack));
  }

  /** Paladin/Walküre "Heilige Handgranate": besiegt sofort die aktuelle Bedrohung - die einzige
   * Karte im Spiel, die auch einen Mini-Boss oder Boss direkt besiegen kann (Anleitung S. 9).
   * Bis Mini-Bosse umgesetzt sind (TODO 9 im Plan) betrifft das faktisch nur normale
   * Dungeon-Karten und Bosse. */
  private resolveHeiligeHandgranate(
    gameId: string,
    playerId: string,
    card: string,
    currHand: string[],
    reportWriteFailure: ReportWriteFailure
  ): void {
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);

    const clearedEnemy: Mob = { ...this.currentEnemy(), token: [] };
    this.store.dispatch(new UpdateMonsterTokenArray(clearedEnemy.token));
    reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(gameId, clearedEnemy));
    this.checkForNextEnemy(gameId, clearedEnemy, reportWriteFailure);

    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);
  }

  /** Paladin/Walküre "Heiltrank": alle Spieler (inkl. dir selbst) nehmen 3 Karten von ihrem
   * eigenen Ablagestapel (deliveryStack) zurück auf die Hand. */
  private resolveHeiltrank(
    gameId: string,
    playerId: string,
    card: string,
    currHand: string[],
    reportWriteFailure: ReportWriteFailure
  ): void {
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);
    this.reclaimCardsFromDeliveryStack(gameId, playerId, 3, reportWriteFailure);
    this.reclaimCardsFromDeliveryStackForOtherPlayers(gameId, playerId, 3, reportWriteFailure);
  }

  private reclaimCardsFromDeliveryStack(gameId: string, playerId: string, count: number, reportWriteFailure: ReportWriteFailure): void {
    const hand = [...this.currentHand()];
    const deliveryStack = [...this.currentDeliveryStack()];
    const reclaimed = deliveryStack.splice(0, Math.min(count, deliveryStack.length));
    if (reclaimed.length === 0) return;

    hand.push(...reclaimed);
    this.store.dispatch(new UpdateCurrentHandAction(hand));
    this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, hand));
    reportWriteFailure(this.playerRepo.updateDeliveryStack(gameId, playerId, deliveryStack));
  }

  private async reclaimCardsFromDeliveryStackForOtherPlayers(
    gameId: string,
    playerId: string,
    count: number,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    otherPlayers.forEach((data) => this.reclaimCardsFromDeliveryStackForPlayerData(gameId, data, count, reportWriteFailure));
  }

  private async reclaimCardsFromDeliveryStackForTarget(
    gameId: string,
    targetPlayerId: string,
    count: number,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const data = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    if (!data) return;
    this.reclaimCardsFromDeliveryStackForPlayerData(gameId, data, count, reportWriteFailure);
  }

  private reclaimCardsFromDeliveryStackForPlayerData(
    gameId: string,
    data: DocumentData,
    count: number,
    reportWriteFailure: ReportWriteFailure
  ): void {
    const userId = data['userId'];
    const hand: string[] = [...(data['handstack'] ?? [])];
    const deliveryStack: string[] = [...(data['deliveryStack'] ?? [])];
    const reclaimed = deliveryStack.splice(0, Math.min(count, deliveryStack.length));
    if (reclaimed.length === 0) return;

    hand.push(...reclaimed);
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, userId, hand));
    reportWriteFailure(this.playerRepo.updateDeliveryStack(gameId, userId, deliveryStack));
  }

  /** Dieb/Ninja "Spende": gibst deine komplette (restliche) Hand einem gewählten Mitspieler und
   * ziehst dafür so viele Karten auf die Hand wie zu Spielbeginn (Anleitung S. 9). Aufgerufen
   * von PlayerHandComponent, nachdem der Zielspieler-Dialog geschlossen wurde. */
  async resolveSpende(
    gameId: string,
    playerId: string,
    card: string,
    targetPlayerId: string,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);

    const handToGive = [...this.currentHand()];
    handToGive.splice(handToGive.indexOf(card), 1);

    const targetData = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    const targetHand = [...(targetData?.['handstack'] ?? []), ...handToGive];
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, targetPlayerId, targetHand));

    const deliveryStack = [...this.currentDeliveryStack(), card];
    const drawResult = this.drawCards([], [...this.currentCardStack()], deliveryStack, startHandSize(this.currentNumberOfPlayers()));
    this.persistPlayerStacks(gameId, playerId, drawResult.hand, drawResult.cardStack, drawResult.deliveryStack, reportWriteFailure);
  }

  /** Dieb/Ninja "Stehlen": nimmst die komplette Hand eines gewählten Mitspielers zu deiner
   * eigenen dazu (Anleitung S. 9) - der bestohlene Spieler füllt seine Hand erst wieder auf,
   * wenn er selbst das nächste Mal eine Karte spielt oder ablegt. */
  async resolveStehlen(
    gameId: string,
    playerId: string,
    card: string,
    targetPlayerId: string,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const currHand = [...this.currentHand()];
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);

    const targetData = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    const stolenCards = [...(targetData?.['handstack'] ?? [])];
    if (stolenCards.length === 0) return;

    reportWriteFailure(this.playerRepo.updateHandstack(gameId, targetPlayerId, []));

    const newOwnHand = [...this.currentHand(), ...stolenCards];
    this.store.dispatch(new UpdateCurrentHandAction(newOwnHand));
    reportWriteFailure(this.playerRepo.updateHandstack(gameId, playerId, newOwnHand));
  }

  /** Jägerin/Waldläufer "Heilkräuter": ein gewählter Spieler (auch du selbst) nimmt 4 Karten
   * von seinem eigenen Ablagestapel zurück auf die Hand (Anleitung S. 9). */
  resolveHeilkraeuter(
    gameId: string,
    playerId: string,
    card: string,
    targetPlayerId: string,
    reportWriteFailure: ReportWriteFailure
  ): void {
    const currHand = [...this.currentHand()];
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);

    if (targetPlayerId === playerId) {
      this.reclaimCardsFromDeliveryStack(gameId, playerId, 4, reportWriteFailure);
    } else {
      this.reclaimCardsFromDeliveryStackForTarget(gameId, targetPlayerId, 4, reportWriteFailure);
    }
  }

  /** Barbar/Gladiator "Wut": zwei gewählte Spieler (auch du selbst als einer von beiden) ziehen
   * je 3 Karten von ihrem eigenen Nachziehstapel (Anleitung S. 9). */
  resolveWut(
    gameId: string,
    playerId: string,
    card: string,
    targetPlayerIdOne: string,
    targetPlayerIdTwo: string,
    reportWriteFailure: ReportWriteFailure
  ): void {
    const currHand = [...this.currentHand()];
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);

    this.drawThreeCardsForChosenPlayer(gameId, playerId, targetPlayerIdOne, reportWriteFailure);
    this.drawThreeCardsForChosenPlayer(gameId, playerId, targetPlayerIdTwo, reportWriteFailure);
  }

  private drawThreeCardsForChosenPlayer(
    gameId: string,
    actingPlayerId: string,
    targetPlayerId: string,
    reportWriteFailure: ReportWriteFailure
  ): void {
    if (targetPlayerId === actingPlayerId) {
      this.drawCardsIgnoringHandsize(gameId, actingPlayerId, 3, reportWriteFailure);
    } else {
      this.drawCardsForTarget(gameId, targetPlayerId, 3, reportWriteFailure);
    }
  }

  /** Paladin/Walküre "Heilung" (Karte `heile`): ein gewählter Spieler legt seinen kompletten
   * Ablagestapel verdeckt zurück auf seinen Nachziehstapel (Anleitung S. 9) - kann einen
   * Spieler ohne Hand- und Nachziehstapelkarten retten. */
  async resolveHeilung(
    gameId: string,
    playerId: string,
    card: string,
    targetPlayerId: string,
    reportWriteFailure: ReportWriteFailure
  ): Promise<void> {
    const currHand = [...this.currentHand()];
    this.ensureGameTimerStarted(gameId, reportWriteFailure);
    this.resumeGameTimerIfPaused(gameId, reportWriteFailure);
    this.saveHand(gameId, playerId, card, currHand, reportWriteFailure);

    if (targetPlayerId === playerId) {
      const cardStack = shuffle([...this.currentCardStack(), ...this.currentDeliveryStack()]);
      this.store.dispatch(new UpdateCardStackAction(cardStack));
      this.store.dispatch(new UpdateDeliveryStack([]));
      reportWriteFailure(this.playerRepo.updateCardstack(gameId, playerId, cardStack));
      reportWriteFailure(this.playerRepo.updateDeliveryStack(gameId, playerId, []));
      return;
    }

    const data = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    const targetCardStack = shuffle([...(data?.['cardstack'] ?? []), ...(data?.['deliveryStack'] ?? [])]);
    reportWriteFailure(this.playerRepo.updateCardstack(gameId, targetPlayerId, targetCardStack));
    reportWriteFailure(this.playerRepo.updateDeliveryStack(gameId, targetPlayerId, []));
  }

  private checkHandsize(
    gameId: string,
    playerId: string,
    handsize: string[],
    discardedCards: string[],
    reportWriteFailure: ReportWriteFailure
  ): string[] {
    const drawCount = Math.max(0, startHandSize(this.currentNumberOfPlayers()) - handsize.length);
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

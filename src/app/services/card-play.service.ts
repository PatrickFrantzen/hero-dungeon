import { Injectable } from '@angular/core';
import { DocumentData, where } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { ResetGameTimer, SetGameStats, SetGameTimerPauseState, StartGameTimer, UpdateGameStatus } from 'src/app/actions/currentGame-action';
import { SetCurrentBoss, SetNewEnemy, SetRemainingBosses, UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { createHero } from 'src/models/helden/hero.class';
import { HERO_DEFINITIONS } from 'src/models/helden/hero-definitions';
import { GameStats } from 'src/models/game';
import { Mob, Monster } from 'src/models/monster/monster.class';
import { shuffle } from 'src/models/shuffle.util';
import { FirestoreRepositoryService } from './firestore-repository.service';
import { GameFactoryService } from './game-factory.service';
import { startHandSize } from 'src/models/start-hand-size.util';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

// Feste Gegnertypen (monster-collection.data.ts) - Ereigniskarten tragen im `type`-Feld
// stattdessen ihren Fließtext-Effekt (z.B. "Jeder gibt seine Handkarten..."), damit lassen sie
// sich von echten Gegnern unterscheiden (siehe CardPlayService.checkForNextEnemy()).
const ENEMY_TYPES = ['Monster', 'Person', 'Hindernis', 'Mini-Boss', 'Boss'];

/** Bündelt einen (evtl. neuen) Wert mit den dabei ausgelösten, noch laufenden Firestore-Writes -
 * für interne Hilfsmethoden, die sowohl einen Rückgabewert liefern als auch selbst schreiben
 * (siehe drawCards()/checkHandsize()). */
interface WithWrites<T> {
  value: T;
  writes: Promise<void>[];
}

/**
 * Die eigentlichen Kartenspielregeln aus PlayerHandComponent: welche Karte auf welches
 * Gegner-Token passt, Einzel-/Doppelkarten-Logik, Handgröße nachfüllen, nächster Gegner/Boss.
 * `chooseCard()` ist der Einstiegspunkt für alle Karten, die ohne weitere Nutzereingabe
 * auflösen (Template-Handler). Fünf Aktionskarten (Spende, Stehlen, Heilkräuter, Wut, Heilung)
 * brauchen vorher eine Zielspieler-Auswahl per Dialog - für die ruft PlayerHandComponent statt
 * `chooseCard()` direkt die passende `resolve*()`-Methode unten mit dem/den gewählten
 * Zielspieler(n) auf; `chooseCard()` selbst würde diese Kartennamen nicht erkennen und sie
 * folgenlos verpuffen lassen.
 *
 * Firestore-Writes laufen fire-and-forget (die lokalen NGXS-Dispatches passieren synchron,
 * unabhängig vom Schreibergebnis). Jede öffentliche Methode gibt trotzdem ein `Promise<void>`
 * zurück, das rejected, sobald einer ihrer internen Writes fehlschlägt - der Aufrufer hängt
 * sein eigenes `.catch()` mit einer für seinen Call-Site passenden Fehlermeldung an, statt wie
 * zuvor einen `reportWriteFailure`-Callback durch alle ~40 privaten Hilfsmethoden zu reichen.
 * Kein Instanzfeld für diesen Zustand: `CardPlayService` ist ein Singleton, mehrere private
 * Hilfsmethoden sind bereits `async` (enthalten also echte Await-Punkte) - ein geteiltes Feld
 * wäre bei zeitlich überlappenden Aufrufen nicht sicher.
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
  private currentAllBosses = this.store.selectSignal(EncounterSelectors.currentAllBosses);
  private currentDifficulty = this.store.selectSignal(CurrentGameSelectors.currentDifficulty);
  private timerStartedAt = this.store.selectSignal(CurrentGameSelectors.currentTimerStartedAt);
  private timerPausedAt = this.store.selectSignal(CurrentGameSelectors.currentTimerPausedAt);
  private timerPausedSecondsTotal = this.store.selectSignal(CurrentGameSelectors.currentTimerPausedSecondsTotal);
  private currentStats = this.store.selectSignal(CurrentGameSelectors.currentStats);
  private heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);
  private heropowerArray = this.store.selectSignal(HeropowerSelectors.currentHeropowerArray);
  private currentNumberOfPlayers = this.store.selectSignal(CurrentGameSelectors.currentNumberOfPlayers);
  private currentGameStatus = this.store.selectSignal(CurrentGameSelectors.currentGameStatus);

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
    private repo: FirestoreRepositoryService,
    private gameFactory: GameFactoryService
  ) {}

  chooseCard(gameId: string, playerId: string, card: string): Promise<void> {
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
      return Promise.resolve();
    }

    this.store.dispatch(new UpdateHeropowerArray([]));

    if (card === 'göttlicherSchild') {
      return this.resolveGoettlicherSchild(gameId, playerId, card, currHand);
    }

    if (card === 'heiligeHandgranate') {
      return this.resolveHeiligeHandgranate(gameId, playerId, card, currHand);
    }

    if (card === 'heiltrank') {
      return this.resolveHeiltrank(gameId, playerId, card, currHand);
    }

    if (card === 'joker') {
      return this.resolveJoker(gameId, playerId, card, currHand);
    }

    if (card === 'magischeBombe') {
      return this.resolveMagischeBombe(gameId, playerId, card, currHand);
    }

    const writes: Promise<void>[] = [];

    if (card.includes('_')) {
      // Nur die Magier-Karte "Verhinderung" darf eine Ereigniskarte stoppen (Anleitung S. 9) -
      // vorher löste jede beliebige Doppelkarte ein Event auf, weil nur der Bedrohungstyp
      // ("ist es überhaupt ein Event") geprüft wurde, nicht welche Karte gespielt wurde.
      const isVerhinderungAgainstEvent = card === 'verhinderung_event' && currMob.token[0].toLocaleLowerCase().includes('event');
      const isMatchingType = currMob.type.toLocaleLowerCase().includes(doubleCard[1]);

      if (isVerhinderungAgainstEvent || isMatchingType) {
        writes.push(this.ensureGameTimerStarted(gameId));
        writes.push(this.resumeGameTimerIfPaused(gameId));
        currEne.length = 0;
        this.store.dispatch(new UpdateMonsterTokenArray(currEne));
        writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
        writes.push(this.checkForNextEnemy(gameId, this.currentEnemy()));
        writes.push(this.saveHand(gameId, playerId, card, currHand));
      }
      if (
        card.includes('_') &&
        (this.currentEnemy().token.includes(doubleCard[0]) || this.currentEnemy().token.includes(doubleCard[1]))
      ) {
        writes.push(this.ensureGameTimerStarted(gameId));
        writes.push(this.resumeGameTimerIfPaused(gameId));
        if (this.currentEnemy().token.includes(doubleCard[0]) && this.currentEnemy().token.includes(doubleCard[1])) {
          writes.push(this.playAsTwoCards(gameId, doubleCard[0], doubleCard[1], currEne));
        } else if (this.currentEnemy().token.includes(doubleCard[0])) {
          writes.push(this.playAsOneCard(gameId, doubleCard[0], currEne));
        } else if (this.currentEnemy().token.includes(doubleCard[1])) {
          writes.push(this.playAsOneCard(gameId, doubleCard[1], currEne));
        }
        writes.push(this.saveHand(gameId, playerId, card, currHand));
      }
    }

    if (this.currentEnemy().token.includes(card)) {
      writes.push(this.ensureGameTimerStarted(gameId));
      writes.push(this.resumeGameTimerIfPaused(gameId));
      writes.push(this.playCardfromHandAndUpdateEnemyToken(gameId, playerId, card));
    }

    return Promise.all(writes).then(() => undefined);
  }

  /** Singleplayer-Deadlock-Schutz: ausgewählte Karte ablegen und eine Ersatzkarte ziehen. */
  restCard(gameId: string, playerId: string, card: string): Promise<void> {
    const currHand = [...this.currentHand()];
    const cardIndex = currHand.indexOf(card);
    if (cardIndex < 0) return Promise.resolve();

    currHand.splice(cardIndex, 1);
    const deliveryStack = [...this.currentDeliveryStack(), card];
    const drawResult = this.drawCards(currHand, [...this.currentCardStack()], deliveryStack, 1, gameId);

    // Das eigentliche Rasten-Ereignis selbst zählt als "gecyclete Karte" - unabhängig davon, ob
    // drawCards() dabei zusätzlich den Ablagestapel neu mischen musste (das interne Reshuffle
    // in drawCards() zählt separat, greift beim Rasten aber praktisch nie, da der Nachziehstapel
    // dabei meist noch nicht leer ist).
    const writes = [
      ...drawResult.writes,
      this.bumpStat(gameId, 'cardsCycled', 1),
      this.persistPlayerStacks(gameId, playerId, drawResult.value.hand, drawResult.value.cardStack, drawResult.value.deliveryStack),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  /** Löst eine aufgedeckte Ereigniskarte aus (Anleitung S. 8-9: "müsst ihr sofort tun, was die
   * Karte verlangt") - betrifft ALLE Spieler, nicht nur den, der auf "Event ausführen" klickt.
   * "Chaos" ("Jeder gibt seine Handkarten einem Mitspieler") ist vereinfacht wie "Plötzliche
   * Krankheit" behandelt (komplette Hand ablegen + auffüllen): die Anleitung gibt keine feste
   * Weitergabe-Reihenfolge vor, eine korrekte Umsetzung bräuchte eine Zielspieler-Zuordnung pro
   * Spieler - nicht umgesetzt, siehe docs/done/five-minute-dungeon-rules-plan.md TODO 9. */
  resolveEvent(gameId: string, playerId: string): Promise<void> {
    const event = this.currentEnemy();
    if (!event.token.includes('event')) return Promise.resolve();

    const writes = [this.applyEventToSelf(gameId, playerId, event.name), this.applyEventToOtherPlayers(gameId, playerId, event.name)];

    const clearedEvent: Mob = { ...event, token: [] };
    this.store.dispatch(new SetNewEnemy(clearedEvent));
    writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, clearedEvent));
    writes.push(this.checkForNextEnemy(gameId, clearedEvent));

    return Promise.all(writes).then(() => undefined);
  }

  private eventDiscardCount(eventName: string, handLength: number): number {
    switch (eventName) {
      case 'Ein Wehweh':
        return Math.min(1, handLength);
      case 'Falltür':
        return Math.min(3, handLength);
      default:
        // 'Plötzliche Krankheit' und 'Chaos' (vereinfacht, siehe resolveEvent()-Kommentar).
        return handLength;
    }
  }

  private applyEventToSelf(gameId: string, playerId: string, eventName: string): Promise<void> {
    const currHand = [...this.currentHand()];
    const discardedCards = currHand.splice(0, this.eventDiscardCount(eventName, currHand.length));
    const result = this.checkHandsize(gameId, playerId, currHand, discardedCards);
    return Promise.all(result.writes).then(() => undefined);
  }

  private async applyEventToOtherPlayers(gameId: string, playerId: string, eventName: string): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    await Promise.all(otherPlayers.map((data) => this.applyEventToPlayerData(gameId, data, eventName)));
  }

  private applyEventToPlayerData(gameId: string, data: DocumentData, eventName: string): Promise<void> {
    const userId = data['userId'];
    const hand: string[] = [...(data['handstack'] ?? [])];
    const discardedCards = hand.splice(0, this.eventDiscardCount(eventName, hand.length));
    const drawCount = Math.max(0, startHandSize(this.currentNumberOfPlayers()) - hand.length);
    const drawResult = this.drawCards(hand, [...(data['cardstack'] ?? [])], [...(data['deliveryStack'] ?? []), ...discardedCards], drawCount, gameId);

    const writes = [
      ...drawResult.writes,
      this.playerRepo.updateHandstack(gameId, userId, drawResult.value.hand),
      this.playerRepo.updateCardstack(gameId, userId, drawResult.value.cardStack),
      this.playerRepo.updateDeliveryStack(gameId, userId, drawResult.value.deliveryStack),
      this.checkHandDeadlockLoss(gameId, drawResult.value.hand, drawResult.value.cardStack, drawResult.value.deliveryStack),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  private playCardfromHandAndUpdateEnemyToken(gameId: string, playerId: string, card: string): Promise<void> {
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

    const handResult = this.checkHandsize(gameId, playerId, currHand, [card]);
    const writes = [
      ...handResult.writes,
      this.playerRepo.updateHandstack(gameId, playerId, handResult.value),
      this.gameRepo.updateCurrentEnemyToken(gameId, currMob),
    ];

    this.store.dispatch(new UpdateCurrentHandAction(handResult.value));
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));

    writes.push(this.checkForNextEnemy(gameId, this.currentEnemy()));
    return Promise.all(writes).then(() => undefined);
  }

  /** Statistik-Zähler (besiegte Gegner/gespielte Karten/gecyclete Karten/genutzte
   * Heldenfähigkeiten, `src/models/game.ts` GameStats) - schreibt den neuen absoluten Wert
   * lokal + nach Firestore, analog zu den Timer-Feldern (siehe game/CLAUDE.md). */
  private bumpStat(gameId: string, key: keyof GameStats, amount: number): Promise<void> {
    if (amount <= 0) return Promise.resolve();
    const stats = { ...this.currentStats(), [key]: this.currentStats()[key] + amount };
    this.store.dispatch(new SetGameStats(stats));
    return this.gameRepo.updateStats(gameId, stats);
  }

  /** Aufgerufen an jeder Stelle, an der chooseCard() (bzw. eine der resolve*()-Sonderfall-
   * Methoden) tatsächlich eine Karte wirksam spielt - startet den Dungeon-Timer bei der ersten
   * solchen Karte (Guard unten) und zählt bei JEDER dieser Karten die "gespielte Karten"-
   * Statistik hoch, unabhängig vom Timer-Guard. */
  private ensureGameTimerStarted(gameId: string): Promise<void> {
    const writes = [this.bumpStat(gameId, 'cardsPlayed', 1)];

    if (this.timerStartedAt() === null) {
      const startedAt = Date.now();
      this.store.dispatch(new StartGameTimer(startedAt));
      writes.push(this.gameRepo.updateTimerStartedAt(gameId, startedAt));
    }

    return Promise.all(writes).then(() => undefined);
  }

  /** "Zeit bleibt eingefroren, bis ein Spieler eine Karte in die Tischmitte spielt" (S. 8) -
   * an jeder Stelle aufgerufen, an der chooseCard() tatsächlich eine Ressourcen-/Aktionskarte
   * in die Tischmitte spielt (nicht bei Heropower-Nutzung oder beim Aufdecken der nächsten
   * Dungeon-Karte, die laut Anleitung die Pause ausdrücklich NICHT beenden). */
  private resumeGameTimerIfPaused(gameId: string): Promise<void> {
    const pausedAt = this.timerPausedAt();
    if (pausedAt === null) return Promise.resolve();
    const pausedSecondsTotal = this.timerPausedSecondsTotal() + Math.max(0, (Date.now() - pausedAt) / 1000);
    this.store.dispatch(new SetGameTimerPauseState(null, pausedSecondsTotal));
    return this.gameRepo.updateTimerPauseState(gameId, null, pausedSecondsTotal);
  }

  private freezeGameTimer(gameId: string): Promise<void> {
    if (this.timerPausedAt() !== null) return Promise.resolve();
    const pausedAt = Date.now();
    this.store.dispatch(new SetGameTimerPauseState(pausedAt, this.timerPausedSecondsTotal()));
    return this.gameRepo.updateTimerPauseState(gameId, pausedAt, this.timerPausedSecondsTotal());
  }

  /** Walküre/Paladin "Göttlicher Schild": friert die Zeit ein und lässt jeden Spieler 1 Karte
   * vom eigenen Nachziehstapel ziehen - unabhängig von der sonst geltenden Handgrößen-Obergrenze
   * (Anleitung S. 6, Anmerkung Punkt 4: aufgeforderte Zuggaben zählen immer). */
  private resolveGoettlicherSchild(gameId: string, playerId: string, card: string, currHand: string[]): Promise<void> {
    const writes = [
      this.ensureGameTimerStarted(gameId),
      this.freezeGameTimer(gameId),
      this.saveHand(gameId, playerId, card, currHand),
      this.drawCardsIgnoringHandsize(gameId, playerId, 1),
      this.drawCardsForOtherPlayers(gameId, playerId, 1),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  private drawCardsIgnoringHandsize(gameId: string, playerId: string, count: number): Promise<void> {
    const drawResult = this.drawCards([...this.currentHand()], [...this.currentCardStack()], [...this.currentDeliveryStack()], count, gameId);
    const writes = [
      ...drawResult.writes,
      this.persistPlayerStacks(gameId, playerId, drawResult.value.hand, drawResult.value.cardStack, drawResult.value.deliveryStack),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  private async drawCardsForOtherPlayers(gameId: string, playerId: string, count: number): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    await Promise.all(otherPlayers.map((data) => this.drawCardsForPlayerData(gameId, data, count)));
  }

  private async drawCardsForTarget(gameId: string, targetPlayerId: string, count: number): Promise<void> {
    const data = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    if (!data) return;
    await this.drawCardsForPlayerData(gameId, data, count);
  }

  private drawCardsForPlayerData(gameId: string, data: DocumentData, count: number): Promise<void> {
    const userId = data['userId'];
    const drawResult = this.drawCards([...(data['handstack'] ?? [])], [...(data['cardstack'] ?? [])], [...(data['deliveryStack'] ?? [])], count, gameId);
    const writes = [
      ...drawResult.writes,
      this.playerRepo.updateHandstack(gameId, userId, drawResult.value.hand),
      this.playerRepo.updateCardstack(gameId, userId, drawResult.value.cardStack),
      this.playerRepo.updateDeliveryStack(gameId, userId, drawResult.value.deliveryStack),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  /** Paladin/Walküre "Heilige Handgranate": besiegt sofort die aktuelle Bedrohung - die einzige
   * Karte im Spiel, die auch einen Mini-Boss oder Boss direkt besiegen kann (Anleitung S. 9).
   * Bis Mini-Bosse umgesetzt sind (TODO 9 im Plan) betrifft das faktisch nur normale
   * Dungeon-Karten und Bosse. */
  private resolveHeiligeHandgranate(gameId: string, playerId: string, card: string, currHand: string[]): Promise<void> {
    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId)];

    const clearedEnemy: Mob = { ...this.currentEnemy(), token: [] };
    this.store.dispatch(new UpdateMonsterTokenArray(clearedEnemy.token));
    writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, clearedEnemy));
    writes.push(this.checkForNextEnemy(gameId, clearedEnemy));

    writes.push(this.saveHand(gameId, playerId, card, currHand));

    return Promise.all(writes).then(() => undefined);
  }

  /** Paladin/Walküre "Heiltrank": alle Spieler (inkl. dir selbst) nehmen 3 Karten von ihrem
   * eigenen Ablagestapel (deliveryStack) zurück auf die Hand. */
  private resolveHeiltrank(gameId: string, playerId: string, card: string, currHand: string[]): Promise<void> {
    const writes = [
      this.ensureGameTimerStarted(gameId),
      this.resumeGameTimerIfPaused(gameId),
      this.saveHand(gameId, playerId, card, currHand),
      this.reclaimCardsFromDeliveryStack(gameId, playerId, 3),
      this.reclaimCardsFromDeliveryStackForOtherPlayers(gameId, playerId, 3),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  private reclaimCardsFromDeliveryStack(gameId: string, playerId: string, count: number): Promise<void> {
    const hand = [...this.currentHand()];
    const deliveryStack = [...this.currentDeliveryStack()];
    const reclaimed = deliveryStack.splice(0, Math.min(count, deliveryStack.length));
    if (reclaimed.length === 0) return Promise.resolve();

    hand.push(...reclaimed);
    this.store.dispatch(new UpdateCurrentHandAction(hand));
    this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
    return Promise.all([
      this.playerRepo.updateHandstack(gameId, playerId, hand),
      this.playerRepo.updateDeliveryStack(gameId, playerId, deliveryStack),
    ]).then(() => undefined);
  }

  private async reclaimCardsFromDeliveryStackForOtherPlayers(gameId: string, playerId: string, count: number): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    await Promise.all(otherPlayers.map((data) => this.reclaimCardsFromDeliveryStackForPlayerData(gameId, data, count)));
  }

  private async reclaimCardsFromDeliveryStackForTarget(gameId: string, targetPlayerId: string, count: number): Promise<void> {
    const data = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    if (!data) return;
    await this.reclaimCardsFromDeliveryStackForPlayerData(gameId, data, count);
  }

  private reclaimCardsFromDeliveryStackForPlayerData(gameId: string, data: DocumentData, count: number): Promise<void> {
    const userId = data['userId'];
    const hand: string[] = [...(data['handstack'] ?? [])];
    const deliveryStack: string[] = [...(data['deliveryStack'] ?? [])];
    const reclaimed = deliveryStack.splice(0, Math.min(count, deliveryStack.length));
    if (reclaimed.length === 0) return Promise.resolve();

    hand.push(...reclaimed);
    return Promise.all([
      this.playerRepo.updateHandstack(gameId, userId, hand),
      this.playerRepo.updateDeliveryStack(gameId, userId, deliveryStack),
    ]).then(() => undefined);
  }

  /** Dieb/Ninja "Spende": gibst deine komplette (restliche) Hand einem gewählten Mitspieler und
   * ziehst dafür so viele Karten auf die Hand wie zu Spielbeginn (Anleitung S. 9). Aufgerufen
   * von PlayerHandComponent, nachdem der Zielspieler-Dialog geschlossen wurde. */
  async resolveSpende(gameId: string, playerId: string, card: string, targetPlayerId: string): Promise<void> {
    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId)];

    const handToGive = [...this.currentHand()];
    handToGive.splice(handToGive.indexOf(card), 1);

    const targetData = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    const targetHand = [...(targetData?.['handstack'] ?? []), ...handToGive];
    writes.push(this.playerRepo.updateHandstack(gameId, targetPlayerId, targetHand));

    const deliveryStack = [...this.currentDeliveryStack(), card];
    const drawResult = this.drawCards([], [...this.currentCardStack()], deliveryStack, startHandSize(this.currentNumberOfPlayers()), gameId);
    writes.push(...drawResult.writes);
    writes.push(this.persistPlayerStacks(gameId, playerId, drawResult.value.hand, drawResult.value.cardStack, drawResult.value.deliveryStack));

    await Promise.all(writes);
  }

  /** Dieb/Ninja "Stehlen": nimmst die komplette Hand eines gewählten Mitspielers zu deiner
   * eigenen dazu (Anleitung S. 9) - der bestohlene Spieler füllt seine Hand erst wieder auf,
   * wenn er selbst das nächste Mal eine Karte spielt oder ablegt. */
  async resolveStehlen(gameId: string, playerId: string, card: string, targetPlayerId: string): Promise<void> {
    const currHand = [...this.currentHand()];
    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId), this.saveHand(gameId, playerId, card, currHand)];

    const targetData = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    const stolenCards = [...(targetData?.['handstack'] ?? [])];
    if (stolenCards.length === 0) {
      await Promise.all(writes);
      return;
    }

    writes.push(this.playerRepo.updateHandstack(gameId, targetPlayerId, []));
    writes.push(this.checkHandDeadlockLoss(gameId, [], targetData?.['cardstack'] ?? [], targetData?.['deliveryStack'] ?? []));

    const newOwnHand = [...this.currentHand(), ...stolenCards];
    this.store.dispatch(new UpdateCurrentHandAction(newOwnHand));
    writes.push(this.playerRepo.updateHandstack(gameId, playerId, newOwnHand));

    await Promise.all(writes);
  }

  /** Jägerin/Waldläufer "Heilkräuter": ein gewählter Spieler (auch du selbst) nimmt 4 Karten
   * von seinem eigenen Ablagestapel zurück auf die Hand (Anleitung S. 9). */
  resolveHeilkraeuter(gameId: string, playerId: string, card: string, targetPlayerId: string): Promise<void> {
    const currHand = [...this.currentHand()];
    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId), this.saveHand(gameId, playerId, card, currHand)];

    if (targetPlayerId === playerId) {
      writes.push(this.reclaimCardsFromDeliveryStack(gameId, playerId, 4));
    } else {
      writes.push(this.reclaimCardsFromDeliveryStackForTarget(gameId, targetPlayerId, 4));
    }

    return Promise.all(writes).then(() => undefined);
  }

  /** Barbar/Gladiator "Wut": zwei gewählte Spieler (auch du selbst als einer von beiden) ziehen
   * je 3 Karten von ihrem eigenen Nachziehstapel (Anleitung S. 9). */
  resolveWut(gameId: string, playerId: string, card: string, targetPlayerIdOne: string, targetPlayerIdTwo: string): Promise<void> {
    const currHand = [...this.currentHand()];
    const writes = [
      this.ensureGameTimerStarted(gameId),
      this.resumeGameTimerIfPaused(gameId),
      this.saveHand(gameId, playerId, card, currHand),
      this.drawThreeCardsForChosenPlayer(gameId, playerId, targetPlayerIdOne),
      this.drawThreeCardsForChosenPlayer(gameId, playerId, targetPlayerIdTwo),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  private drawThreeCardsForChosenPlayer(gameId: string, actingPlayerId: string, targetPlayerId: string): Promise<void> {
    if (targetPlayerId === actingPlayerId) {
      return this.drawCardsIgnoringHandsize(gameId, actingPlayerId, 3);
    }
    return this.drawCardsForTarget(gameId, targetPlayerId, 3);
  }

  /** Paladin/Walküre "Heilung" (Karte `heile`): ein gewählter Spieler legt seinen kompletten
   * Ablagestapel verdeckt zurück auf seinen Nachziehstapel (Anleitung S. 9) - kann einen
   * Spieler ohne Hand- und Nachziehstapelkarten retten. */
  async resolveHeilung(gameId: string, playerId: string, card: string, targetPlayerId: string): Promise<void> {
    const currHand = [...this.currentHand()];
    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId), this.saveHand(gameId, playerId, card, currHand)];

    if (targetPlayerId === playerId) {
      const cardStack = shuffle([...this.currentCardStack(), ...this.currentDeliveryStack()]);
      this.store.dispatch(new UpdateCardStackAction(cardStack));
      this.store.dispatch(new UpdateDeliveryStack([]));
      writes.push(this.playerRepo.updateCardstack(gameId, playerId, cardStack));
      writes.push(this.playerRepo.updateDeliveryStack(gameId, playerId, []));
      await Promise.all(writes);
      return;
    }

    const data = await this.playerRepo.getPlayer(gameId, targetPlayerId);
    const targetCardStack = shuffle([...(data?.['cardstack'] ?? []), ...(data?.['deliveryStack'] ?? [])]);
    writes.push(this.playerRepo.updateCardstack(gameId, targetPlayerId, targetCardStack));
    writes.push(this.playerRepo.updateDeliveryStack(gameId, targetPlayerId, []));

    await Promise.all(writes);
  }

  /** Jägerin/Waldläufer "Joker": zählt als ein beliebiges Symbol (Anleitung S. 8) - da es keine
   * Auswahl-UI für "welches Symbol" gibt, wird einfach das erste Token der aktuellen Bedrohung
   * verbraucht (deterministisch, aber ohne Spielereinfluss auf die Wahl - eine Vereinfachung
   * analog zu den bereits automatisch aufgelösten Doppelsymbol-Karten). Wirkt nicht gegen
   * Ereigniskarten (dort gibt es keine Symbole zu ersetzen). */
  private resolveJoker(gameId: string, playerId: string, card: string, currHand: string[]): Promise<void> {
    const currEne = [...this.currentEnemy().token];
    if (currEne.length === 0 || currEne[0].toLocaleLowerCase().includes('event')) return Promise.resolve();

    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId)];

    currEne.shift();
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
    writes.push(this.checkForNextEnemy(gameId, this.currentEnemy()));

    writes.push(this.saveHand(gameId, playerId, card, currHand));

    return Promise.all(writes).then(() => undefined);
  }

  /** Magier/Zauberin "Magische Bombe": bringt alle 5 Symbole auf einmal, muss aber nicht alle
   * nutzen (Anleitung S. 8) - entfernt von der aktuellen Bedrohung je ein Vorkommen jeder der 5
   * Symbolfarben, falls vorhanden. Wirkt nicht gegen Ereigniskarten. */
  private resolveMagischeBombe(gameId: string, playerId: string, card: string, currHand: string[]): Promise<void> {
    const currEne = [...this.currentEnemy().token];
    if (currEne.length === 0 || currEne[0].toLocaleLowerCase().includes('event')) return Promise.resolve();

    const writes = [this.ensureGameTimerStarted(gameId), this.resumeGameTimerIfPaused(gameId)];

    ['red', 'yellow', 'green', 'blue', 'purple'].forEach((symbol) => {
      const index = currEne.indexOf(symbol);
      if (index !== -1) currEne.splice(index, 1);
    });

    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
    writes.push(this.checkForNextEnemy(gameId, this.currentEnemy()));

    writes.push(this.saveHand(gameId, playerId, card, currHand));

    return Promise.all(writes).then(() => undefined);
  }

  private checkHandsize(gameId: string, playerId: string, handsize: string[], discardedCards: string[]): WithWrites<string[]> {
    const drawCount = Math.max(0, startHandSize(this.currentNumberOfPlayers()) - handsize.length);
    const drawResult = this.drawCards([...handsize], [...this.currentCardStack()], [...this.currentDeliveryStack(), ...discardedCards], drawCount, gameId);

    const persistWrite = this.persistPlayerStacks(
      gameId,
      playerId,
      drawResult.value.hand,
      drawResult.value.cardStack,
      drawResult.value.deliveryStack
    );
    return { value: drawResult.value.hand, writes: [...drawResult.writes, persistWrite] };
  }

  /** Public: also used directly by PlayerHandComponent as the "array" heropower group's
   * onEnemyTokenCleared callback (HeropowerService clears the token, this decides what enemy
   * comes next). */
  checkForNextEnemy(gameId: string, currentEnemy: Mob): Promise<void> {
    const writes: Promise<void>[] = [];

    if (Array.isArray(currentEnemy.token) && !currentEnemy.token.length) {
      // Ereigniskarten (type ist bei ihnen ein Fließtext wie "Jeder gibt seine Handkarten...",
      // siehe monster-collection.data.ts questCollection) zählen bewusst nicht als "besiegter
      // Gegner" - nur die festen Gegnertypen.
      if (ENEMY_TYPES.includes(currentEnemy.type)) {
        writes.push(this.bumpStat(gameId, 'enemiesDefeated', 1));
      }

      if (currentEnemy.type === 'Boss') {
        // Nicht automatisch weitermachen: die Gruppe wird gefragt, ob sie mit dem nächsten
        // Dungeon fortfährt (continueToNextDungeon(), von GameComponent nach Bestätigung
        // aufgerufen) oder abbricht. Erst nach Boss #5 (Dungeon-Overlord, allBosses leer) ist
        // das Spiel direkt gewonnen. Timer einfrieren, solange die Gruppe entscheidet bzw. das
        // Spiel bereits gewonnen ist - läuft sonst sichtbar weiter, ohne dass noch etwas
        // gespielt werden kann (continueToNextDungeon()/restartCampaign() setzen ihn per
        // ResetGameTimer ohnehin zurück).
        const status = this.currentAllBosses().length > 0 ? 'bossDefeated' : 'won';
        writes.push(this.freezeGameTimer(gameId));
        writes.push(this.gameRepo.updateGameStatus(gameId, status));
        this.store.dispatch(new UpdateGameStatus(status));
      } else if (this.currentMob().length > 0) {
        writes.push(this.getNextEnemy(gameId));
      } else {
        writes.push(this.getNextBoss(gameId));
      }
    }

    return Promise.all(writes).then(() => undefined);
  }

  /** Von GameComponent aufgerufen, nachdem ein Spieler nach besiegtem Boss (gameStatus
   * 'bossDefeated') bestätigt hat, mit dem nächsten Dungeon weiterzumachen (Anleitung S. 6):
   * nächster Boss aus der `allBosses`-Warteschlange, neuer Dungeon-Kartenstapel passend zu
   * Spielerzahl/Schwierigkeit, Timer zurückgesetzt, und - Anleitung S. 6 "Mischt die 40 Karten
   * eines jeden Helden-Decks für sich" - jeder Spieler bekommt sein Heldendeck frisch gemischt
   * und eine neue Starthand. */
  continueToNextDungeon(gameId: string, playerId: string): Promise<void> {
    const remainingBosses = [...this.currentAllBosses()];
    const nextBoss = remainingBosses.shift();
    if (!nextBoss) return Promise.resolve();

    const newMob = new Monster().createMob(this.currentNumberOfPlayers(), nextBoss.name, this.currentDifficulty());
    const newCurrentEnemy = newMob.shift()!;

    this.store.dispatch(new SetCurrentBoss(nextBoss));
    this.store.dispatch(new SetRemainingBosses(remainingBosses));
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(newMob));
    this.store.dispatch(new ResetGameTimer());
    this.store.dispatch(new UpdateGameStatus('playing'));

    const writes = [
      this.gameRepo.updateCurrentBoss(gameId, nextBoss),
      this.gameRepo.updateRemainingBosses(gameId, remainingBosses),
      this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy),
      this.gameRepo.updateNewMob(gameId, newMob),
      this.gameRepo.resetTimer(gameId),
      this.gameRepo.updateGameStatus(gameId, 'playing'),
      this.reshuffleAllPlayersForNewDungeon(gameId, playerId),
    ];

    return Promise.all(writes).then(() => undefined);
  }

  /** Von GameComponent aufgerufen, wenn ein Spieler nach verlorenem Dungeon (gameStatus 'lost')
   * einen Neustart bestätigt (Anleitung S. 7: "versucht euer Glück von neuem mit dem
   * Baby-Barbar") - baut den Dungeon wieder auf Boss #1 zurück und mischt wie
   * continueToNextDungeon() jedes Heldendeck frisch. */
  restartCampaign(gameId: string, playerId: string): Promise<void> {
    const freshGame = this.gameFactory.buildNewGame(this.currentNumberOfPlayers(), this.currentDifficulty(), gameId);

    this.store.dispatch(new SetCurrentBoss(freshGame.currentBoss));
    this.store.dispatch(new SetRemainingBosses(freshGame.allBosses));
    this.store.dispatch(new SetNewEnemy(freshGame.currentEnemy));
    this.store.dispatch(new UpdateMobAction(freshGame.Mob));
    this.store.dispatch(new ResetGameTimer());
    this.store.dispatch(new UpdateGameStatus('playing'));

    const writes = [
      this.gameRepo.updateCurrentBoss(gameId, freshGame.currentBoss),
      this.gameRepo.updateRemainingBosses(gameId, freshGame.allBosses),
      this.gameRepo.updateCurrentEnemyToken(gameId, freshGame.currentEnemy),
      this.gameRepo.updateNewMob(gameId, freshGame.Mob),
      this.gameRepo.resetTimer(gameId),
      this.gameRepo.updateGameStatus(gameId, 'playing'),
      this.reshuffleAllPlayersForNewDungeon(gameId, playerId),
    ];

    return Promise.all(writes).then(() => undefined);
  }

  private async reshuffleAllPlayersForNewDungeon(gameId: string, actingPlayerId: string): Promise<void> {
    const players = await this.repo.queryAll<DocumentData>(['games', gameId, 'player'], [where('gameId', '==', gameId)]);
    const numberOfPlayers = this.currentNumberOfPlayers();
    const useExtraDeck = numberOfPlayers === 1 || numberOfPlayers === 2;
    await Promise.all(
      players.map((data) => this.reshufflePlayerHeroDeck(gameId, data, data['userId'] === actingPlayerId, useExtraDeck))
    );
  }

  private reshufflePlayerHeroDeck(gameId: string, data: DocumentData, isActingPlayer: boolean, useExtraDeck: boolean): Promise<void> {
    const userId = data['userId'];
    const heroName = data['choosenHero']?.heroname;
    const heroDefinition = HERO_DEFINITIONS.find((def) => def.heroName === heroName);
    if (!heroDefinition) return Promise.resolve();

    const hero = createHero(heroDefinition.id, useExtraDeck);
    const hand = hero.cardstack.splice(0, startHandSize(this.currentNumberOfPlayers()));

    const writes = [
      this.playerRepo.updateHandstack(gameId, userId, hand),
      this.playerRepo.updateCardstack(gameId, userId, hero.cardstack),
      this.playerRepo.updateDeliveryStack(gameId, userId, []),
    ];

    if (isActingPlayer) {
      this.store.dispatch(new UpdateCurrentHandAction(hand));
      this.store.dispatch(new UpdateCardStackAction(hero.cardstack));
      this.store.dispatch(new UpdateDeliveryStack([]));
    }

    return Promise.all(writes).then(() => undefined);
  }

  private playAsOneCard(gameId: string, card: string, currEne: string[]): Promise<void> {
    const indexOfEnemyToken = currEne.indexOf(card);
    currEne.splice(indexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    const writes = [this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()), this.checkForNextEnemy(gameId, this.currentEnemy())];
    return Promise.all(writes).then(() => undefined);
  }

  private playAsTwoCards(gameId: string, cardOne: string, cardTwo: string, currEne: string[]): Promise<void> {
    const firstIndexOfEnemyToken = currEne.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);

    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    const writes = [this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy())];

    if (currEne.includes(cardTwo)) {
      const secCurrEne = [...currEne];
      const secondIndexOfEnemyToken = currEne.indexOf(cardTwo);
      secCurrEne.splice(secondIndexOfEnemyToken, 1);

      this.store.dispatch(new UpdateMonsterTokenArray(secCurrEne));
      writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
      writes.push(this.checkForNextEnemy(gameId, this.currentEnemy()));
    }

    return Promise.all(writes).then(() => undefined);
  }

  private getNextEnemy(gameId: string): Promise<void> {
    const currMob = [...this.currentMob()];
    const newCurrentEnemy: Mob = currMob.shift()!;
    const writes = [this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy), this.gameRepo.updateNewMob(gameId, currMob)];
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob));
    return Promise.all(writes).then(() => undefined);
  }

  private getNextBoss(gameId: string): Promise<void> {
    const newCurrentEnemy: Mob = this.currentBoss();
    const write = this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy);
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    return write;
  }

  private saveHand(gameId: string, playerId: string, card: string, currHand: string[]): Promise<void> {
    let indexOfHandCard = this.currentHand().indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    const result = this.checkHandsize(gameId, playerId, currHand, [card]);
    const writes = [...result.writes, this.playerRepo.updateHandstack(gameId, playerId, result.value)];
    this.store.dispatch(new UpdateCurrentHandAction(result.value));
    this.store.dispatch(new UpdateCardStackAction(this.currentCardStack()));
    return Promise.all(writes).then(() => undefined);
  }

  private drawCards(
    hand: string[],
    cardStack: string[],
    deliveryStack: string[],
    drawCount: number,
    gameId: string
  ): WithWrites<{ hand: string[]; cardStack: string[]; deliveryStack: string[] }> {
    const writes: Promise<void>[] = [];

    for (let i = 0; i < drawCount; i++) {
      if (cardStack.length === 0 && deliveryStack.length > 0) {
        // Ablagestapel wird gemischt zurück zum Nachziehstapel - das ist ein "Kartenzyklus"
        // (Statistik "gecyclete Karten": jede so wieder verfügbar gemachte Karte zählt).
        writes.push(this.bumpStat(gameId, 'cardsCycled', deliveryStack.length));
        cardStack = shuffle([...deliveryStack]);
        deliveryStack = [];
      }

      if (cardStack.length === 0) {
        break;
      }

      hand.push(cardStack.shift()!);
    }

    return { value: { hand, cardStack, deliveryStack }, writes };
  }

  private persistPlayerStacks(gameId: string, playerId: string, hand: string[], cardStack: string[], deliveryStack: string[]): Promise<void> {
    this.store.dispatch(new UpdateCurrentHandAction(hand));
    this.store.dispatch(new UpdateCardStackAction(cardStack));
    this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
    const writes = [
      this.playerRepo.updateHandstack(gameId, playerId, hand),
      this.playerRepo.updateCardstack(gameId, playerId, cardStack),
      this.playerRepo.updateDeliveryStack(gameId, playerId, deliveryStack),
      this.checkHandDeadlockLoss(gameId, hand, cardStack, deliveryStack),
    ];
    return Promise.all(writes).then(() => undefined);
  }

  /** Verlustbedingung (TODO 11, Anleitung: kann ein Spieler seine Hand nicht mehr auffüllen, weil
   * sowohl Nachzieh- als auch Ablagestapel leer sind, ist das Spiel sofort verloren). Bewusst nur
   * dieser Fall - die zweite, komplexere Verlustbedingung ("Gruppe kann die geforderten Symbole
   * nicht mehr aufbringen") ist laut Plan als eigenes Folge-TODO vorgesehen. */
  private checkHandDeadlockLoss(gameId: string, hand: string[], cardStack: string[], deliveryStack: string[]): Promise<void> {
    if (hand.length > 0 || cardStack.length > 0 || deliveryStack.length > 0) return Promise.resolve();
    if (this.currentGameStatus() !== 'playing') return Promise.resolve();

    this.store.dispatch(new UpdateGameStatus('lost'));
    return this.gameRepo.updateGameStatus(gameId, 'lost');
  }
}

import { Injectable } from '@angular/core';
import { DocumentData, where } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { SetGameStats, SetGameTimerPauseState } from 'src/app/actions/currentGame-action';
import { UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { GameStats } from 'src/models/game';
import { Mob } from 'src/models/monster/monster.class';
import { FirestoreRepositoryService } from './firestore-repository.service';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

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
 *
 * Fehlerbehandlung analog zu `CardPlayService` (2026-09-05, Architecture-Review-Kandidat 1,
 * Folgeschritt): alle öffentlichen Methoden geben ein `Promise<void>` zurück statt einen
 * `reportWriteFailure`-Callback als letzten Parameter entgegenzunehmen. Die Promise rejected,
 * sobald einer der intern gesammelten, weiterhin fire-and-forget laufenden Firestore-Writes
 * fehlschlägt - der Aufrufer (`PlayerHandComponent`) hängt sein eigenes `.catch()` an, statt
 * eine Callback-Closure durch jede private Hilfsmethode zu reichen.
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
  private currentStats = this.store.selectSignal(CurrentGameSelectors.currentStats);

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
    private repo: FirestoreRepositoryService
  ) {}

  /** Statistik-Zähler "genutzte Heldenfähigkeiten" (`src/models/game.ts` GameStats) - schreibt
   * den neuen absoluten Wert lokal + nach Firestore, analog zu CardPlayService.bumpStat()
   * (bewusst nicht geteilt, siehe Klassenkommentar oben zur Nicht-Vereinheitlichung). */
  private bumpStat(gameId: string, key: keyof GameStats, amount: number): Promise<void> {
    if (amount <= 0) return Promise.resolve();
    const stats = { ...this.currentStats(), [key]: this.currentStats()[key] + amount };
    this.store.dispatch(new SetGameStats(stats));
    return this.gameRepo.updateStats(gameId, stats);
  }

  resolveWalkuereHeropower(gameId: string, playerId: string): Promise<void> {
    if (this.heropowerArray().length !== 3) return Promise.resolve();
    const writes = [this.bumpStat(gameId, 'heropowersUsed', 1)];

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
        writes.push(this.playerRepo.updateHandstack(gameId, playerId, currHand));
        writes.push(this.playerRepo.updateCardstack(gameId, playerId, currCardStack));
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });

    writes.push(this.giveOtherPlayersCards(gameId, playerId));

    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));

    return Promise.all(writes).then(() => undefined);
  }

  private async giveOtherPlayersCards(gameId: string, playerId: string): Promise<void> {
    const otherPlayers = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('gameId', '==', gameId), where('userId', '!=', playerId)]
    );
    await Promise.all(otherPlayers.map((data) => this.drawTwoCardsForOtherPlayer(gameId, data)));
  }

  private drawTwoCardsForOtherPlayer(gameId: string, data: DocumentData): Promise<void> {
    const userId = data['userId'];
    let currentCardStack = data['cardstack'];
    let currentHand = data['handstack'];
    const writes: Promise<void>[] = [];

    for (let i = 0; i < 2; i++) {
      let currHand = [...currentHand];
      let currCardStack = [...currentCardStack];

      if (currCardStack.length > 0) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);

        writes.push(this.playerRepo.updateHandstack(gameId, userId, currHand));
        writes.push(this.playerRepo.updateCardstack(gameId, userId, currCardStack));

        currentCardStack = currCardStack;
        currentHand = currHand;
      }
    }

    return Promise.all(writes).then(() => undefined);
  }

  resolveJaegerinHeropower(gameId: string, playerId: string, openFollowUpDialog: () => void): Promise<void> {
    if (this.heropowerArray().length !== 3) return Promise.resolve();
    const writes = [this.bumpStat(gameId, 'heropowersUsed', 1)];

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
        writes.push(this.playerRepo.updateHandstack(gameId, playerId, currHand));
        writes.push(this.playerRepo.updateCardstack(gameId, playerId, currCardStack));
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });

    openFollowUpDialog();
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));

    return Promise.all(writes).then(() => undefined);
  }

  /** Wird aufgerufen, nachdem der Spieler im "Heropower auswählen"-Dialog einen Zielspieler
   * gewählt hat (vorher: getOtherPlayerDataTogivePlayerCards() + playerIdForHeropowerAction-Feld
   * in PlayerHandComponent - der gewählte Spieler wird jetzt direkt als Parameter durchgereicht). */
  async resolveJaegerinHeropowerForPlayer(gameId: string, currentPlayerId: string, targetPlayerId: string): Promise<void> {
    const targetPlayerDocs = await this.repo.queryAll<DocumentData>(
      ['games', gameId, 'player'],
      [where('userId', '==', targetPlayerId)]
    );
    await Promise.all(targetPlayerDocs.map((data) => this.drawFourCardsForJaegerinTarget(gameId, currentPlayerId, data)));
  }

  private drawFourCardsForJaegerinTarget(gameId: string, currentPlayerId: string, data: DocumentData): Promise<void> {
    const userId = data['userId'];
    let currentCardStack = data['cardstack'];
    let currentHand = data['handstack'];
    const writes: Promise<void>[] = [];

    if (currentPlayerId === userId) {
      for (let i = 0; i < 4; i++) {
        let currCardStack = [...this.currentCardStack()];
        let currHand = [...this.currentHand()];

        if (currCardStack.length > 0) {
          const getCardForHand = currCardStack.shift()!;
          currHand.push(getCardForHand);

          writes.push(this.playerRepo.updateHandstack(gameId, userId, currHand));
          writes.push(this.playerRepo.updateCardstack(gameId, userId, currCardStack));

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

          writes.push(this.playerRepo.updateHandstack(gameId, userId, currHand));
          writes.push(this.playerRepo.updateCardstack(gameId, userId, currCardStack));

          currentCardStack = currCardStack;
          currentHand = currHand;
        }
      }
    }

    return Promise.all(writes).then(() => undefined);
  }

  /** Magier "Zeit einfrieren": 3 Handkarten ablegen, dafür pausiert der Dungeon-Timer, bis
   * jemand eine Karte in die Tischmitte spielt (CardPlayService.resumeGameTimerIfPaused()). */
  resolveMagierHeropower(gameId: string, playerId: string): Promise<void> {
    if (this.heropowerArray().length !== 3) return Promise.resolve();
    const writes = [this.bumpStat(gameId, 'heropowersUsed', 1)];

    this.heropowerArray().forEach((card) => {
      const indexOfHandCard = this.currentHand().indexOf(card);
      const currHand = [...this.currentHand()];
      currHand.splice(indexOfHandCard, 1);
      this.store.dispatch(new UpdateCurrentHandAction(currHand));
    });

    if (this.timerStartedAt() !== null && this.timerPausedAt() === null) {
      const pausedAt = Date.now();
      this.store.dispatch(new SetGameTimerPauseState(pausedAt, this.timerPausedSecondsTotal()));
      writes.push(this.gameRepo.updateTimerPauseState(gameId, pausedAt, this.timerPausedSecondsTotal()));
    }

    writes.push(this.playerRepo.updateHandstack(gameId, playerId, this.currentHand()));
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));

    return Promise.all(writes).then(() => undefined);
  }

  resolveArrayHeropower(gameId: string, playerId: string, onEnemyTokenCleared: (enemy: Mob) => void): Promise<void> {
    if (this.heropowerArray().length !== 3) return Promise.resolve();
    const writes = [this.bumpStat(gameId, 'heropowersUsed', 1)];

    let currEnemyToken = [...this.currentEnemy().token];
    currEnemyToken.length = 0;

    this.store.dispatch(new UpdateMonsterTokenArray(currEnemyToken));
    writes.push(this.gameRepo.updateCurrentEnemyToken(gameId, this.currentEnemy()));
    onEnemyTokenCleared(this.currentEnemy());

    this.heropowerArray().forEach((card) => {
      let indexOfHandCard = this.currentHand().indexOf(card);
      let currHand = [...this.currentHand()];
      let currCardStack = [...this.currentCardStack()];
      currHand.splice(indexOfHandCard, 1);

      if (currHand.length < 5 && currCardStack.length > 0) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);

        writes.push(this.playerRepo.updateHandstack(gameId, playerId, currHand));
        writes.push(this.playerRepo.updateCardstack(gameId, playerId, currCardStack));

        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));

    return Promise.all(writes).then(() => undefined);
  }
}

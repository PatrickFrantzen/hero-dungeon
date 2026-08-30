import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { ResetGameTimer, SetGameTimerPauseState, StartGameTimer, updateQuestCardActivated, UpdateGameStatus } from 'src/app/actions/currentGame-action';
import { SetCurrentBoss, SetNewEnemy, SetRemainingBosses, UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { SetChoosenHeros } from 'src/app/actions/lobby-action';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { LobbySelectors } from 'src/app/selectors/lobby-selector';
import { CardPlayService } from 'src/app/services/card-play.service';
import { FirestoreOperationError } from 'src/app/services/firestore-repository.service';
import { FirestoreSyncService } from 'src/app/services/firestore-sync.service';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { HeropowerService } from 'src/app/services/heropower.service';
import { HeropowerDialogPlayer } from '../dialog-results';
import { DialogHeropowerComponent } from '../dialog-heropower/dialog-heropower.component';
import { NgStyle } from '@angular/common';
import { HeropowerContainerComponent } from '../heropower/heropower-container/heropower-container.component';

// OnPush: the Firestore onSnapshot callbacks in updateFromDatabase/updatePlayerFromDatabase
// below now only dispatch NGXS actions instead of also mutating plain fields directly, so all
// state read by the template flows through store.selectSignal() and is tracked correctly.
@Component({
    selector: 'app-player-hand',
    templateUrl: './player-hand.component.html',
    styleUrls: ['./player-hand.component.scss'],
    imports: [NgStyle, HeropowerContainerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerHandComponent implements OnInit, OnDestroy {
  currentPlayerId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentPlayerName = this.store.selectSignal(CurrentUserSelectors.currentUserName);
  currentGameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  currentNumberOfPlayers = this.store.selectSignal(CurrentGameSelectors.currentNumberOfPlayers);

  currentPlayers = this.store.selectSignal(LobbySelectors.currentPlayers);

  currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);

  currentDeliveryStack = this.store.selectSignal(CurrentDeliveryStackSelector.currentDeliveryStack);

  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);
  heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);

  /** Aktionskarten, die vor der Auflösung einen Zielspieler brauchen (Anleitung S. 9) - werden
   * in chooseCard() abgefangen statt an CardPlayService.chooseCard() weitergereicht, das diese
   * Kartennamen nicht kennt. "Wut" braucht zwei Zielspieler, siehe openWutDialog(). */
  private readonly singleTargetActionCards = new Set(['spende', 'stehlen', 'heilkräuter', 'heile']);

  loadError = signal<string | null>(null);

  gameSubscr!: Subscription;
  playerSubsc?: Subscription;

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private firestoreSync: FirestoreSyncService,
    private heropowerService: HeropowerService,
    private cardPlayService: CardPlayService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.gameSubscr = this.firestoreSync.watchGamesCollection().subscribe(async () => {
      let data: DocumentData | undefined;
      try {
        data = await this.gameRepo.getGame(this.currentGameId());
      } catch {
        this.loadError.set('Der Spielstand konnte nicht geladen werden. Bitte Seite neu laden.');
        return;
      }
      this.updateFromDatabase(data!);

      this.playerSubsc?.unsubscribe();
      this.playerSubsc = this.firestoreSync
        .watchPlayerDoc(this.currentGameId(), this.currentPlayerId())
        .subscribe({
          next: (data) => this.updatePlayerFromDatabase(data),
          error: () => {
            this.loadError.set('Die Verbindung zum Spiel wurde unterbrochen. Bitte Seite neu laden.');
          },
        });
    });
  }

  /**
   * Firestore-Writes in dieser Komponente laufen "fire and forget" (das lokale NGXS-Update
   * passiert sofort, unabhängig vom Schreib-Ergebnis - die Live-Subscription oben synchronisiert
   * ohnehin den tatsächlichen Serverstand zurück). Bisher wurde ein fehlgeschlagener Write
   * überhaupt nicht beobachtet; jetzt wird der Fehler wenigstens sichtbar gemacht statt still zu
   * verschwinden.
   */
  private reportWriteFailure(write: Promise<void>): void {
    write.catch((error: unknown) => {
      const message =
        error instanceof FirestoreOperationError
          ? `Änderung konnte nicht gespeichert werden (${error.operation}).`
          : 'Änderung konnte nicht gespeichert werden.';
      this.loadError.set(message);
    });
  }

  updatePlayerFromDatabase(data: DocumentData) {
    this.store.dispatch(new UpdateCurrentHandAction(data['handstack']));
    this.store.dispatch(new UpdateCardStackAction(data['cardstack']));
    this.store.dispatch(new UpdateDeliveryStack(data['deliveryStack']));
  }

  updateFromDatabase(data: DocumentData) {
    const currentEnemy = data['currentEnemy'];
    this.store.dispatch(new SetNewEnemy(currentEnemy));
    this.store.dispatch(new UpdateMonsterTokenArray(currentEnemy.token));
    this.store.dispatch(new UpdateMobAction(data['Mob']));
    this.store.dispatch(new SetCurrentBoss(data['currentBoss']));
    this.store.dispatch(new SetRemainingBosses(data['allBosses']));
    this.store.dispatch(new SetChoosenHeros(data['choosenHeros']));
    this.store.dispatch(new updateQuestCardActivated(data['questCardActivated']));
    this.store.dispatch(new UpdateGameStatus(data['gameStatus'] ?? (data['isLost'] ? 'lost' : 'playing')));
    if (typeof data['timerStartedAt'] === 'number') {
      this.store.dispatch(new StartGameTimer(data['timerStartedAt']));
    } else {
      // Neuer Dungeon nach besiegtem Boss (CardPlayService.continueToNextDungeon()) setzt
      // timerStartedAt in Firestore auf null zurück - StartGameTimer allein kann das wegen
      // seines "nur einmal setzen"-Guards nicht an andere Clients weitergeben.
      this.store.dispatch(new ResetGameTimer());
    }
    this.store.dispatch(
      new SetGameTimerPauseState(
        typeof data['timerPausedAt'] === 'number' ? data['timerPausedAt'] : null,
        typeof data['timerPausedSecondsTotal'] === 'number' ? data['timerPausedSecondsTotal'] : 0
      )
    );
  }

  onHeropowerResolved(kind: 'array' | 'jaegerin' | 'walkuere' | 'magier') {
    const reportWriteFailure = (write: Promise<void>) => this.reportWriteFailure(write);
    switch (kind) {
      case 'magier':
        this.heropowerService.resolveMagierHeropower(this.currentGameId(), this.currentPlayerId(), reportWriteFailure);
        break;
      case 'array':
        this.heropowerService.resolveArrayHeropower(
          this.currentGameId(),
          this.currentPlayerId(),
          reportWriteFailure,
          (enemy) => this.cardPlayService.checkForNextEnemy(this.currentGameId(), enemy, reportWriteFailure)
        );
        break;
      case 'jaegerin':
        this.heropowerService.resolveJaegerinHeropower(
          this.currentGameId(),
          this.currentPlayerId(),
          reportWriteFailure,
          () => this.openDialog()
        );
        break;
      case 'walkuere':
        this.heropowerService.resolveWalkuereHeropower(this.currentGameId(), this.currentPlayerId(), reportWriteFailure);
        break;
    }
  }

  chooseCard(card: string) {
    if (!this.heropowerActivated()) {
      if (this.singleTargetActionCards.has(card)) {
        this.openTargetPlayerDialog(card);
        return;
      }
      if (card === 'wut') {
        this.openWutDialog();
        return;
      }
    }

    this.cardPlayService.chooseCard(this.currentGameId(), this.currentPlayerId(), card, (write) =>
      this.reportWriteFailure(write)
    );
  }

  /** Öffnet den Zielspieler-Dialog für Spende/Stehlen/Heilkräuter/Heilung (je ein Zielspieler)
   * und ruft danach die passende CardPlayService-Methode mit dem gewählten Spieler auf. */
  private openTargetPlayerDialog(card: string) {
    const dialogRef = this.dialog.open<DialogHeropowerComponent, HeropowerDialogPlayer[], { data: HeropowerDialogPlayer }>(
      DialogHeropowerComponent,
      { data: this.currentPlayers() }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const targetPlayerId = result.data.playerId;
      const reportWriteFailure = (write: Promise<void>) => this.reportWriteFailure(write);

      switch (card) {
        case 'spende':
          this.cardPlayService.resolveSpende(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId, reportWriteFailure);
          break;
        case 'stehlen':
          this.cardPlayService.resolveStehlen(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId, reportWriteFailure);
          break;
        case 'heilkräuter':
          this.cardPlayService.resolveHeilkraeuter(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId, reportWriteFailure);
          break;
        case 'heile':
          this.cardPlayService.resolveHeilung(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId, reportWriteFailure);
          break;
      }
    });
  }

  /** Öffnet den Zielspieler-Dialog zweimal nacheinander für "Wut" (zwei Zielspieler, du selbst
   * darfst einer davon sein). */
  private openWutDialog() {
    const dialogRefOne = this.dialog.open<DialogHeropowerComponent, HeropowerDialogPlayer[], { data: HeropowerDialogPlayer }>(
      DialogHeropowerComponent,
      { data: this.currentPlayers() }
    );

    dialogRefOne.afterClosed().subscribe((resultOne) => {
      if (!resultOne) return;

      const dialogRefTwo = this.dialog.open<DialogHeropowerComponent, HeropowerDialogPlayer[], { data: HeropowerDialogPlayer }>(
        DialogHeropowerComponent,
        { data: this.currentPlayers() }
      );

      dialogRefTwo.afterClosed().subscribe((resultTwo) => {
        if (!resultTwo) return;
        this.cardPlayService.resolveWut(
          this.currentGameId(),
          this.currentPlayerId(),
          'wut',
          resultOne.data.playerId,
          resultTwo.data.playerId,
          (write) => this.reportWriteFailure(write)
        );
      });
    });
  }

  restCard(card: string) {
    this.cardPlayService.restCard(this.currentGameId(), this.currentPlayerId(), card, (write) =>
      this.reportWriteFailure(write)
    );
  }

  resolveEvent() {
    this.cardPlayService.resolveEvent(this.currentGameId(), this.currentPlayerId(), (write) =>
      this.reportWriteFailure(write)
    );
  }

  isEventActive(): boolean {
    return this.store.selectSnapshot(CurrentGameSelectors.currentQuestCardStatus);
  }

  isSingleplayer(): boolean {
    return this.currentNumberOfPlayers() === 1;
  }

  openDialog() {
    let dialogRef = this.dialog.open<DialogHeropowerComponent, HeropowerDialogPlayer[], { data: HeropowerDialogPlayer }>(
      DialogHeropowerComponent,
      { data: this.currentPlayers() }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const { playerId } = result.data;
      this.heropowerService.resolveJaegerinHeropowerForPlayer(
        this.currentGameId(),
        this.currentPlayerId(),
        playerId,
        (write) => this.reportWriteFailure(write)
      );
    });
  }

  ngOnDestroy(): void {
    this.gameSubscr.unsubscribe();
    this.playerSubsc?.unsubscribe();
  }
}

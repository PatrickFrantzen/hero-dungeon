import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Observable, Subscription, map } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { ResetGameTimer, SetGameStats, SetGameTimerPauseState, StartGameTimer, updateQuestCardActivated, UpdateGameStatus } from 'src/app/actions/currentGame-action';
import { SetCurrentBoss, SetNewEnemy, SetRemainingBosses, UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { SetChoosenHeros } from 'src/app/actions/lobby-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
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
import { PlayerRepositoryService } from 'src/app/services/player-repository.service';
import { HeropowerService } from 'src/app/services/heropower.service';
import { isLocalGameId } from 'src/app/services/local-game-id.util';
import { HeropowerDialogPlayer } from '../dialog-results';
import { DialogHeropowerComponent } from '../dialog-heropower/dialog-heropower.component';
import { HeropowerContainerComponent } from '../heropower/heropower-container/heropower-container.component';
import { HandCardsComponent } from './hand-cards/hand-cards.component';

// OnPush: the Firestore onSnapshot callbacks in updateFromDatabase/updatePlayerFromDatabase
// below now only dispatch NGXS actions instead of also mutating plain fields directly, so all
// state read by the template flows through store.selectSignal() and is tracked correctly.
@Component({
    selector: 'app-player-hand',
    templateUrl: './player-hand.component.html',
    styleUrls: ['./player-hand.component.scss'],
    imports: [HeropowerContainerComponent, HandCardsComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerHandComponent implements OnInit, OnDestroy {
  currentPlayerId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentPlayerName = this.store.selectSignal(CurrentUserSelectors.currentUserName);
  currentGameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  currentNumberOfPlayers = this.store.selectSignal(CurrentGameSelectors.currentNumberOfPlayers);

  currentPlayers = this.store.selectSignal(LobbySelectors.currentPlayers);

  currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);

  currentCardStack = this.store.selectSignal(CurrentCardStackSelector.currentCardStack);

  currentDeliveryStack = this.store.selectSignal(CurrentDeliveryStackSelector.currentDeliveryStack);

  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);
  heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);

  /** Aktionskarten, die vor der Auflösung einen Zielspieler brauchen (Anleitung S. 9) - werden
   * in chooseCard() abgefangen statt an CardPlayService.chooseCard() weitergereicht, das diese
   * Kartennamen nicht kennt. "Wut" braucht zwei Zielspieler, siehe openWutDialog(). */
  private readonly singleTargetActionCards = new Set(['spende', 'stehlen', 'heilkräuter', 'heile']);

  loadError = signal<string | null>(null);

  gameSubscr?: Subscription;
  playerSubsc?: Subscription;

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
    private firestoreSync: FirestoreSyncService,
    private heropowerService: HeropowerService,
    private cardPlayService: CardPlayService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Lokale Singleplayer-Spielstände (Issue #73) brauchen kein Firestore-Live-Sync: es gibt
    // keine Mitspieler, deren Züge ankommen könnten, und jede eigene Aktion aktualisiert den
    // Store bereits synchron über CardPlayService/HeropowerService (siehe reportWriteFailure()-
    // Kommentar unten). Ein Spielstand, der (z.B. nach einem Reload) nicht neu angelegt, sondern
    // aus einem bestehenden lokalen Save fortgesetzt wird, braucht trotzdem EINMAL denselben
    // Store-Aufbau, den sonst der erste Firestore-Snapshot liefert - loadLocalGameOnce() bildet
    // genau das nach, nur aus LocalGameDocumentStoreService statt einem onSnapshot-Callback.
    if (isLocalGameId(this.currentGameId())) {
      this.loadLocalGameOnce();
      return;
    }
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

  /** Einmaliger Ersatz für die Firestore-Live-Sync-Kette oben, nur für lokale Singleplayer-
   * Spielstände: lädt Game-/Player-Dokument je einmal aus LocalGameDocumentStoreService (über
   * gameRepo/playerRepo, die für eine lokale gameId automatisch dorthin umleiten) und dispatcht
   * dieselben Actions wie updateFromDatabase()/updatePlayerFromDatabase(). Ein brandneues Spiel
   * hat noch kein Player-Dokument (choosenHero fehlt, bis GameComponent.openDialog() ihn
   * anlegt) - data/playerData bleiben dann undefined, was hier bewusst zu keinem Dispatch führt,
   * da GameComponent/openDialog() die initialen Werte für diesen Fall bereits selbst dispatcht. */
  private async loadLocalGameOnce(): Promise<void> {
    let data: DocumentData | undefined;
    try {
      data = await this.gameRepo.getGame(this.currentGameId());
    } catch {
      this.loadError.set('Der Spielstand konnte nicht geladen werden. Bitte Seite neu laden.');
      return;
    }
    if (data) {
      this.updateFromDatabase(data);
    }

    let playerData: DocumentData | undefined;
    try {
      playerData = await this.playerRepo.getPlayer(this.currentGameId(), this.currentPlayerId());
    } catch {
      this.loadError.set('Die Verbindung zum Spiel wurde unterbrochen. Bitte Seite neu laden.');
      return;
    }
    if (playerData) {
      this.updatePlayerFromDatabase(playerData);
    }
  }

  /** Kurzer Vibrations-Pulse bei Karte spielen/Heropower auslösen (Issue #51). iOS Safari kennt
   * `navigator.vibrate` nicht (dort `undefined`) - der Optional-Call degradiert dann automatisch
   * ohne Fehler, kein Feature-Check nötig. */
  private vibrate(durationMs = 15): void {
    navigator.vibrate?.(durationMs);
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

  /** Kapselt den vierfach duplizierten `dialog.open<DialogHeropowerComponent, ...>({ data:
   * this.currentPlayers() }).afterClosed()`-Aufruf (Architecture-Review-Kandidat 6) — jeder
   * Aufrufer entscheidet weiterhin selbst, was mit dem gewählten Spieler passiert (ein
   * `undefined`-Ergebnis bedeutet "Dialog ohne Auswahl geschlossen"). */
  private pickPlayer(): Observable<HeropowerDialogPlayer | undefined> {
    return this.dialog
      .open<DialogHeropowerComponent, HeropowerDialogPlayer[], { data: HeropowerDialogPlayer }>(DialogHeropowerComponent, {
        data: this.currentPlayers(),
      })
      .afterClosed()
      .pipe(map((result) => result?.data));
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
    this.store.dispatch(
      new SetGameStats(
        data['stats'] ?? { enemiesDefeated: 0, cardsPlayed: 0, cardsCycled: 0, heropowersUsed: 0 }
      )
    );
  }

  onHeropowerResolved(kind: 'array' | 'jaegerin' | 'walkuere' | 'magier') {
    this.vibrate();
    switch (kind) {
      case 'magier':
        this.reportWriteFailure(this.heropowerService.resolveMagierHeropower(this.currentGameId(), this.currentPlayerId()));
        break;
      case 'array':
        this.reportWriteFailure(
          this.heropowerService.resolveArrayHeropower(this.currentGameId(), this.currentPlayerId(), (enemy) =>
            this.reportWriteFailure(this.cardPlayService.checkForNextEnemy(this.currentGameId(), enemy))
          )
        );
        break;
      case 'jaegerin':
        this.reportWriteFailure(
          this.heropowerService.resolveJaegerinHeropower(this.currentGameId(), this.currentPlayerId(), () => this.openDialog())
        );
        break;
      case 'walkuere':
        this.reportWriteFailure(this.heropowerService.resolveWalkuereHeropower(this.currentGameId(), this.currentPlayerId()));
        break;
    }
  }

  chooseCard(card: string) {
    this.vibrate();
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

    this.reportWriteFailure(this.cardPlayService.chooseCard(this.currentGameId(), this.currentPlayerId(), card));
  }

  /** Öffnet den Zielspieler-Dialog für Spende/Stehlen/Heilkräuter/Heilung (je ein Zielspieler)
   * und ruft danach die passende CardPlayService-Methode mit dem gewählten Spieler auf. */
  private openTargetPlayerDialog(card: string) {
    this.pickPlayer().subscribe((result) => {
      if (!result) return;
      const targetPlayerId = result.playerId;

      switch (card) {
        case 'spende':
          this.reportWriteFailure(this.cardPlayService.resolveSpende(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId));
          break;
        case 'stehlen':
          this.reportWriteFailure(this.cardPlayService.resolveStehlen(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId));
          break;
        case 'heilkräuter':
          this.reportWriteFailure(this.cardPlayService.resolveHeilkraeuter(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId));
          break;
        case 'heile':
          this.reportWriteFailure(this.cardPlayService.resolveHeilung(this.currentGameId(), this.currentPlayerId(), card, targetPlayerId));
          break;
      }
    });
  }

  /** Öffnet den Zielspieler-Dialog zweimal nacheinander für "Wut" (zwei Zielspieler, du selbst
   * darfst einer davon sein). */
  private openWutDialog() {
    this.pickPlayer().subscribe((resultOne) => {
      if (!resultOne) return;

      this.pickPlayer().subscribe((resultTwo) => {
        if (!resultTwo) return;
        this.reportWriteFailure(
          this.cardPlayService.resolveWut(this.currentGameId(), this.currentPlayerId(), 'wut', resultOne.playerId, resultTwo.playerId)
        );
      });
    });
  }

  restCard(card: string) {
    this.reportWriteFailure(this.cardPlayService.restCard(this.currentGameId(), this.currentPlayerId(), card));
  }

  resolveEvent() {
    this.reportWriteFailure(this.cardPlayService.resolveEvent(this.currentGameId(), this.currentPlayerId()));
  }

  isEventActive(): boolean {
    return this.store.selectSnapshot(CurrentGameSelectors.currentQuestCardStatus);
  }

  isSingleplayer(): boolean {
    return this.currentNumberOfPlayers() === 1;
  }

  openDialog() {
    this.pickPlayer().subscribe((result) => {
      if (!result) return;
      this.reportWriteFailure(
        this.heropowerService.resolveJaegerinHeropowerForPlayer(this.currentGameId(), this.currentPlayerId(), result.playerId)
      );
    });
  }

  ngOnDestroy(): void {
    this.gameSubscr?.unsubscribe();
    this.playerSubsc?.unsubscribe();
  }
}

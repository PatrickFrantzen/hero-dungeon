import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { updateQuestCardActivated } from 'src/app/actions/currentGame-action';
import { SetNewEnemy, UpdateMonsterTokenArray } from 'src/app/actions/encounter-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { SetChoosenHeros } from 'src/app/actions/lobby-action';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
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

  currentPlayers = this.store.selectSignal(LobbySelectors.currentPlayers);

  currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);

  currentDeliveryStack = this.store.selectSignal(CurrentDeliveryStackSelector.currentDeliveryStack);

  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);

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
    this.store.dispatch(new SetChoosenHeros(data['choosenHeros']));
    this.store.dispatch(new updateQuestCardActivated(data['questCardActivated']));
  }

  onHeropowerResolved(kind: 'array' | 'jaegerin' | 'walkuere') {
    const reportWriteFailure = (write: Promise<void>) => this.reportWriteFailure(write);
    switch (kind) {
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
    this.cardPlayService.chooseCard(this.currentGameId(), this.currentPlayerId(), card, (write) =>
      this.reportWriteFailure(write)
    );
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

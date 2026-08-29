import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, Input, inject, signal } from '@angular/core';
import { DocumentData, Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import {
  SetChoosenHeros,
  updateChoosenHeros,
  updateQuestCardActivated,
} from 'src/app/actions/currentGame-action';
import {
  SetNewEnemy,
  UpdateMonsterTokenArray,
} from 'src/app/actions/currentGame-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import {
  UpdateHeropowerActivated,
  UpdateHeropowerArray,
} from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { FirestoreOperationError } from 'src/app/services/firestore-repository.service';
import { FirestoreSyncService } from 'src/app/services/firestore-sync.service';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { PlayerRepositoryService } from 'src/app/services/player-repository.service';
import { Game } from 'src/models/game';
import { Mob } from 'src/models/monster/monster.class';
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

  currentPlayers = this.store.selectSignal(CurrentGameSelectors.currentPlayers);

  currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);
  loadedCurrentHand: string[] = [];

  currentCardStack = this.store.selectSignal(CurrentCardStackSelector.currentCardStack);
  loadedCurrentCardStack!: string[];

  currentEnemy = this.store.selectSignal(CurrentGameSelectors.currentEnemy);
  loadedCurrentEnemy!: Mob;

  currentMob = this.store.selectSignal(CurrentGameSelectors.currentMob);
  loadedCurrentMob!: Mob[];

  currentBoss = this.store.selectSignal(CurrentGameSelectors.currentBoss);

  currentDeliveryStack = this.store.selectSignal(CurrentDeliveryStackSelector.currentDeliveryStack);

  heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);
  heropowerArray = this.store.selectSignal(HeropowerSelectors.currentHeropowerArray);
  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);

  questCardStatus = this.store.selectSignal(CurrentGameSelectors.currentQuestCardStatus);

  playerIdForHeropowerAction: string = '';
  playerNameForHeropowerAction: string = '';
  playerHeroForHeropowerAction: string = '';

  db = inject(Firestore);
  loadedCollectionData!: DocumentData;
  collectionData!: DocumentData;
  allPlayerDataFromServer: DocumentData[] = [];

  loadError = signal<string | null>(null);

  gameSubscr!: Subscription;
  playerSubsc?: Subscription;

  constructor(
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
    private firestoreSync: FirestoreSyncService,
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
    switch (kind) {
      case 'array':
        this.checkheropowerArray();
        break;
      case 'jaegerin':
        this.checkJaegerinHeropower();
        break;
      case 'walkuere':
        this.checkWalkuereHeropower();
        break;
    }
  }

  checkWalkuereHeropower() {
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
        this.reportWriteFailure(this.playerRepo.updateHandstack(
          this.currentGameId(),
          this.currentPlayerId(),
          currHand
        ));
        this.reportWriteFailure(this.playerRepo.updateCardstack(
          this.currentGameId(),
          this.currentPlayerId(),
          currCardStack
        ));
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });
    this.getAllPlayerDatatoGivePlayersCards();

    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }

  async getAllPlayerDatatoGivePlayersCards() {
    const allPlayerData = query(
      collection(this.db, 'games', this.currentGameId(), 'player'),
      where('gameId', '==', this.currentGameId()),
      where('userId', '!=', this.currentPlayerId())
    );
    const querySnapshot = await getDocs(allPlayerData);
    querySnapshot.forEach((doc) => {
      this.executeWalkuereHeropower(doc.data());
    });
  }

  executeWalkuereHeropower(data: DocumentData) {
    const userId = data['userId'];
    let currentCardStack = data['cardstack'];
    let currentHand = data['handstack'];
    for (let i = 0; i < 2; i++) {
      let currHand = [...currentHand];
      let currCardStack = [...currentCardStack];

      if (currCardStack.length > 0) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand);

        this.reportWriteFailure(this.playerRepo.updateHandstack(this.currentGameId(), userId, currHand));
        this.reportWriteFailure(this.playerRepo.updateCardstack(
          this.currentGameId(),
          userId,
          currCardStack
        ));

        currentCardStack = currCardStack;
        currentHand = currHand;
      }
    }
  }

  async getOtherPlayerDataTogivePlayerCards() {
    const playerSnap = await getDocs(
      query(
        collection(this.db, 'games', this.currentGameId(), 'player'),
        where('userId', '==', this.playerIdForHeropowerAction)
      )
    );
    playerSnap.forEach((doc) => {
      let data = doc.data();
      this.executeJaegerinHeropower(data);
    });
  }

  executeJaegerinHeropower(data: DocumentData) {
    // console.warn('execute', data);
    const userId = data['userId'];
    let currentCardStack = data['cardstack'];
    let currentHand = data['handstack'];

    if (this.currentPlayerId() === userId) {
      for (let i = 0; i < 4; i++) {
        let currCardStack = [...this.currentCardStack()];
        let currHand = [...this.currentHand()];

        if (currCardStack.length > 0) {
          const getCardForHand = currCardStack.shift()!;
          currHand.push(getCardForHand);

          this.reportWriteFailure(this.playerRepo.updateHandstack(this.currentGameId(), userId, currHand));
          this.reportWriteFailure(this.playerRepo.updateCardstack(
            this.currentGameId(),
            userId,
            currCardStack
          ));

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

          this.reportWriteFailure(this.playerRepo.updateHandstack(this.currentGameId(), userId, currHand));
          this.reportWriteFailure(this.playerRepo.updateCardstack(
            this.currentGameId(),
            userId,
            currCardStack
          ));

          currentCardStack = currCardStack;
          currentHand = currHand;
        }
      }
    }
  }

  checkJaegerinHeropower() {
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
        this.reportWriteFailure(this.playerRepo.updateHandstack(
          this.currentGameId(),
          this.currentPlayerId(),
          currHand
        ));
        this.reportWriteFailure(this.playerRepo.updateCardstack(
          this.currentGameId(),
          this.currentPlayerId(),
          currCardStack
        ));
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.store.dispatch(new UpdateCurrentHandAction(currHand));
      }
    });
    this.openDialog();
    this.store.dispatch(new UpdateHeropowerActivated(false));
    this.store.dispatch(new UpdateHeropowerArray([]));
  }

  chooseCard(card: string) {
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
    if (this.questCardStatus()) {
      //check welche Quest usw.
    }

    if (this.heropowerActivated()) {
      if (this.heropowerArray().length < 3) {
        let hpArr = [...this.heropowerArray()];
        hpArr.push(card);
        this.store.dispatch(new UpdateHeropowerArray(hpArr));
      }
    } else {
      this.store.dispatch(new UpdateHeropowerArray([]));

      if (card.includes('_')) {
        const isEventCard = currMob.token[0]
          .toLocaleLowerCase()
          .includes('event');
        const isMatchingType = currMob.type
          .toLocaleLowerCase()
          .includes(doubleCard[1]);

        if (isEventCard || isMatchingType) {
          currEne.length = 0;
          this.store.dispatch(new UpdateMonsterTokenArray(currEne));
          this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(
            this.currentGameId(),
            this.currentEnemy()
          ));
          this.checkForNextEnemy(this.currentEnemy());
          this.saveHand(card, currHand);
        }
        if (
          card.includes('_') &&
          (this.currentEnemy().token.includes(doubleCard[0]) ||
            this.currentEnemy().token.includes(doubleCard[1]))
        ) {
          if (
            this.currentEnemy().token.includes(doubleCard[0]) &&
            this.currentEnemy().token.includes(doubleCard[1])
          ) {
            this.playAsTwoCards(doubleCard[0], doubleCard[1], currEne);
          } else if (this.currentEnemy().token.includes(doubleCard[0])) {
            this.playAsOneCard(doubleCard[0], currEne);
          } else if (this.currentEnemy().token.includes(doubleCard[1])) {
            this.playAsOneCard(doubleCard[1], currEne);
          }
          this.saveHand(card, currHand);
        }
      }

      if (this.currentEnemy().token.includes(card)) {
        this.playCardfromHandAndUpdateEnemyToken(card);
      }
    }
  }

  playCardfromHandAndUpdateEnemyToken(card: string) {
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

    const updatedHand = this.checkHandsize(currHand)!;

    this.reportWriteFailure(this.playerRepo.updateHandstack(
      this.currentGameId(),
      this.currentPlayerId(),
      updatedHand
    ));
    this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(this.currentGameId(), currMob));

    this.store.dispatch(new UpdateCurrentHandAction(updatedHand));
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));

    this.checkForNextEnemy(this.currentEnemy());
  }

  checkHandsize(handsize: string[]) {
    const currHand = [...handsize];
    const currCardStack = [...this.currentCardStack()];

    while (currHand.length < 5 && currCardStack.length > 0) {
      const changedCardStack = [...currCardStack];
      const getCardForHand = changedCardStack.shift()!;
      currHand.push(getCardForHand);
      // this.store.dispatch(new UpdateCardStackAction(currCardStack));
      this.reportWriteFailure(this.playerRepo.updateHandstack(
        this.currentGameId(),
        this.currentPlayerId(),
        currHand
      ));
      this.reportWriteFailure(this.playerRepo.updateCardstack(
        this.currentGameId(),
        this.currentPlayerId(),
        changedCardStack
      ));
    }
    return currHand;
  }

  checkForNextEnemy(currentEnemy: Mob) {
    if (Array.isArray(currentEnemy.token) && !currentEnemy.token.length) {
      //  if (this.currentMob.length > 0 && !currentEnemy.token.length) { // funktioniert so noch nicht
      //   this.loadNextDungeon() //noch nicht geschrieben
      //  }
      if (this.currentMob().length > 0) {
        this.getNextEnemy();
      } else {
        this.getNextBoss();
      }
    }
  }

  playAsOneCard(card: string, currEne: string[]) {
    const indexOfEnemyToken = currEne.indexOf(card);
    currEne.splice(indexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(
      this.currentGameId(),
      this.currentEnemy()
    ));
    this.checkForNextEnemy(this.currentEnemy());
  }

  playAsTwoCards(cardOne: string, cardTwo: string, currEne: string[]) {
    const firstIndexOfEnemyToken = currEne.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);

    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(
      this.currentGameId(),
      this.currentEnemy()
    ));

    if (currEne.includes(cardTwo)) {
      const secCurrEne = [...currEne];
      const secondIndexOfEnemyToken = currEne.indexOf(cardTwo);
      secCurrEne.splice(secondIndexOfEnemyToken, 1);

      this.store.dispatch(new UpdateMonsterTokenArray(secCurrEne));
      this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(
        this.currentGameId(),
        this.currentEnemy()
      ));
      this.checkForNextEnemy(this.currentEnemy());
    }
  }

  getNextEnemy() {
    const currMob = [...this.currentMob()];
    const newCurrentEnemy: Mob = currMob.shift()!;
    this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(this.currentGameId(), newCurrentEnemy));
    this.reportWriteFailure(this.gameRepo.updateNewMob(this.currentGameId(), currMob));
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob));
  }

  getNextBoss() {
    const newCurrentEnemy: Mob = this.currentBoss();
    this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(this.currentGameId(), newCurrentEnemy));
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
  }

  loadNextDungeon() {}

  checkheropowerArray() {
    if (this.heropowerArray().length == 3) {
      let currEnemyToken = [...this.currentEnemy().token];
      currEnemyToken.length = 0;

      this.store.dispatch(new UpdateMonsterTokenArray(currEnemyToken));
      this.reportWriteFailure(this.gameRepo.updateCurrentEnemyToken(
        this.currentGameId(),
        this.currentEnemy()
      ));
      this.checkForNextEnemy(this.currentEnemy());

      this.heropowerArray().forEach((card) => {
        let indexOfHandCard = this.currentHand().indexOf(card);
        let currHand = [...this.currentHand()];
        let currCardStack = [...this.currentCardStack()];
        currHand.splice(indexOfHandCard, 1);

        if (currHand.length < 5 && currCardStack.length > 0) {
          const getCardForHand = currCardStack.shift()!;
          currHand.push(getCardForHand);

          this.reportWriteFailure(this.playerRepo.updateHandstack(
            this.currentGameId(),
            this.currentPlayerId(),
            currHand
          ));
          this.reportWriteFailure(this.playerRepo.updateCardstack(
            this.currentGameId(),
            this.currentPlayerId(),
            currCardStack
          ));

          this.store.dispatch(new UpdateCardStackAction(currCardStack));
          this.store.dispatch(new UpdateCurrentHandAction(currHand));
        }
      });
      this.store.dispatch(new UpdateHeropowerActivated(false));
      this.store.dispatch(new UpdateHeropowerArray([]));
    }
  }


  saveHand(card: string, currHand: string[]) {
    let indexOfHandCard = this.currentHand().indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currHand = this.checkHandsize(currHand)!;
    this.reportWriteFailure(this.playerRepo.updateHandstack(
      this.currentGameId(),
      this.currentPlayerId(),
      currHand
    ));
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateCardStackAction(this.currentCardStack()));
  }

  openDialog() {
    let dialogRef = this.dialog.open(DialogHeropowerComponent, {
      data: this.currentPlayers(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      const { playerHero, playerId, playerName } = result.data;
      this.playerIdForHeropowerAction = playerId;
      this.playerNameForHeropowerAction = playerName;
      this.playerHeroForHeropowerAction = playerHero;
      this.getOtherPlayerDataTogivePlayerCards();
    });
  }

  ngOnDestroy(): void {
    this.gameSubscr.unsubscribe();
    this.playerSubsc?.unsubscribe();
  }
}

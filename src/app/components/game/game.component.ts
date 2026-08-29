import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';
import { doc, getFirestore, getDoc, updateDoc, setDoc, DocumentReference } from '@angular/fire/firestore';
import { User } from 'src/models/user.class';
import { Store } from '@ngxs/store';
import { CreateNewCardStackAction, UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { CardStack } from 'src/models/helden/card.class'
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentCardsInHand } from 'src/app/actions/cardsInHand-action';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { CurrentUserHeroAction } from 'src/app/actions/currentUser-action';
import { updateChoosenHeros } from 'src/app/actions/currentGame-action';
import { EnemyContainerComponent } from '../enemy/enemy-container/enemy-container.component';
import { PlayerHandComponent } from '../player-hand/player-hand.component';

// Not OnPush: its child PlayerHandComponent still mutates plain fields from raw Firestore
// onSnapshot callbacks (not via input()/signal/markForCheck), so an OnPush GameComponent
// would prune change detection before it ever reaches PlayerHandComponent whenever those
// callbacks fire outside a click/event. Revisit once Issue #8 untangles that.
@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
    imports: [EnemyContainerComponent, PlayerHandComponent]
})
export class GameComponent implements OnInit {

  currentUserId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentUserName = this.store.selectSignal(CurrentUserSelectors.currentUserName);
  currentGameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  currentHand = this.store.selectSignal(CurrentHandSelector.currentHand);
  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);

  heroName: string = ''
  heropower: string = ''
  description: string = ''

  initialHand: CardStack = { cardstack: [] };
  deliveryStack: string[] = [];
  user = new User();
  currentHero: Object = {};
  playerData: { playerName: string, playerId: string, playerHero: string } = { playerName: '', playerId: '', playerHero: ''}
  players!: [{ playerName: string, playerId: string, playerHero: string }]
  cardStack!: string[];
  foundCurrentPlayer: boolean = false;
  db = getFirestore();
  // ----------------- //


  constructor(
    public dialog: MatDialog,
    private store: Store,
  ) { }

  ngOnInit(): void {
    this.checkIfPlayerIsAlreadyPartOfGame();
  };

  async checkIfPlayerIsAlreadyPartOfGame() {
    const docPlayer = doc(this.db, 'games', this.currentGameId());
    const docSnap = await getDoc(docPlayer);
    let data = docSnap.data();
    this.players = data?.['choosenHeros'] || [];
    this.players.forEach(player => {
      if (player.playerId === this.currentUserId()) {
        this.foundCurrentPlayer = true;
        this.loadHandstack(this.currentUserId())
      }
    })

    if (!this.foundCurrentPlayer) {
      this.createNewPlayer();
      this.openDialog();
    }

  }

  createNewPlayer() {
    const docRef = doc(this.db, 'games', this.currentGameId(), 'player', this.currentUserId());
    setDoc(docRef, this.user.toJSON());
    const updateData = {
      userId: this.currentUserId(),
      userNickname: this.currentUserName(),
      gameId: this.currentGameId(),
    }
    updateDoc(docRef, updateData);
    this.store.dispatch(new CurrentDeliveryStack(this.user.deliveryStack));
  }

  async updatePlayerOfGame(docPlayer: any) {
    this.playerData = {
      playerName: this.currentUserName(),
      playerId: this.currentUserId(),
      playerHero: this.currentUserHeroData().choosenHero,
    }

    this.players.push(this.playerData)
    const updatePlayer = {
      choosenHeros: this.players
    }
    updateDoc(docPlayer, updatePlayer);
    this.store.dispatch(new updateChoosenHeros(this.playerData))
  }




  async loadHandstack(currentPlayerId: string) {
    const docRef = doc(this.db, 'games', this.currentGameId(), 'player', currentPlayerId);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data();
    this.store.dispatch(new CurrentCardsInHand(data!['handstack']));
    this.store.dispatch(new CurrentDeliveryStack(data!['deliveryStack']));

  }


  openDialog() {
    let dialogRef = this.dialog.open(DialogChooseHeroComponent, {
      data: {
        choosenHero: this.currentHero,
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      const updateData = {
        choosenHero: result.data.choosenHero,
      }
      const { cardstack, heroname, heropower, description } = result.data.choosenHero;
      this.store.dispatch(new CreateNewCardStackAction(cardstack));
      this.store.dispatch(new CurrentUserHeroAction(heroname, heropower, description))
      const docRef = doc(this.db, 'games', this.currentGameId(), 'player', this.currentUserId())
      updateDoc(docRef, updateData).then(() => {
        this.drawInitialHand(docRef)
      })
      const docPlayer = doc(this.db, 'games', this.currentGameId());
      this.updatePlayerOfGame(docPlayer);
    }
    )
  }


  async drawInitialHand(docRef: DocumentReference) {
    const docSnap = await getDoc(docRef);
    const cardStack:string[] = docSnap.data()?.['choosenHero'].cardstack || [];
    const handstack:string[] = cardStack.splice(0, 5);
    const updateData = {
      cardstack: cardStack,
      handstack: handstack
    }
    this.store.dispatch(new CurrentCardsInHand(handstack));
    this.store.dispatch(new UpdateCardStackAction(cardStack))
    updateDoc(docRef, updateData);
  }

}

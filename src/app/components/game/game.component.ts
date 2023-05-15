import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';
import { doc, getFirestore, getDoc, updateDoc, setDoc, DocumentReference } from '@angular/fire/firestore';
import { User } from 'src/models/user.class';
import { Select, Store } from '@ngxs/store';
import { CreateNewCardStackAction, UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { CardStack } from 'src/models/helden/card.class'
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { Observable, Subscription } from 'rxjs';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentCardsInHand } from 'src/app/actions/cardsInHand-action';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentDeliveryStack } from 'src/app/actions/deliveryStack-action';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  @Select(CurrentUserSelectors.currentUserId) currentUserId$!: Observable<string>
  @Select(CurrentUserSelectors.currentUserName) currentUserName$!: Observable<string>
  @Select(CurrentGameSelectors.currentGame) currentGameId$!: Observable<string>
  @Select(CurrentHandSelector.currentHand) currentHand$!:Observable<string[]>

  playerIdSubscription!: Subscription;
  playerNameSubscription!: Subscription;
  gameIdSubscription!: Subscription;

  currentPlayerId!: string;
  currentPlayerName!: string;
  currentGameId!: string;
  initialHand:CardStack = {cardstack: []};
  deliveryStack: string[] = [];
  user = new User();
  currentHero: Object = {};
  cardStack!: string[];
  db = getFirestore();
  // ----------------- //


  constructor(
    public dialog: MatDialog,
    private store: Store,
  ) { }

  ngOnInit(): void {
    this.setUserID();
    this.setGameId();
    this.checkIfPlayerIsAlreadyPartOfGame();
  };

  async checkIfPlayerIsAlreadyPartOfGame() {
    const docPlayer = doc(this.db, 'games', this.currentGameId);
    const docSnap = await getDoc(docPlayer);
    let data = docSnap.data();
    let players: string[] = data!['choosenHeros'];
    if (players.includes(this.currentPlayerName)) {
      this.loadHandstack(this.currentPlayerId)
    } else {
      this.createNewPlayer();
      this.updatePlayerOfGame(docPlayer, players);
      this.openDialog();
    }
  }

  createNewPlayer() {
    const docRef = doc(this.db, 'games', this.currentGameId, 'player', this.currentPlayerId);
    setDoc(docRef, this.user.toJSON());
    const updateData = {
      userId: this.currentPlayerId,
      userNickname: this.currentPlayerName,
    }
    updateDoc(docRef, updateData);
    this.store.dispatch(new CurrentDeliveryStack(this.user.deliveryStack));
  }

  async updatePlayerOfGame(docPlayer: any, players: string[]) {
    players.push(this.currentPlayerName)
    const updatePlayer = {
      choosenHeros: players
    }
    updateDoc(docPlayer, updatePlayer);
  }




  async loadHandstack(currentPlayerId: string) {
    const docRef = doc(this.db, 'games', this.currentGameId, 'player', currentPlayerId);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data();
    console.log('geladen', data)
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
      console.log('choosenHeroToServer', result.data.choosenHero)
      const cardStack: string[] = result.data.choosenHero.herostack;
      this.store.dispatch(new CreateNewCardStackAction(cardStack));
      const docRef = doc(this.db, 'games', this.currentGameId, 'player', this.currentPlayerId)
      updateDoc(docRef, updateData).then(() => {
        this.drawInitialHand(docRef)
      })
    }
    )
  }


  async drawInitialHand(docRef: DocumentReference) {
    const docSnap = await getDoc(docRef);
    let data = docSnap.data();
    this.cardStack = data!['choosenHero'].herostack;
    for (let i = 0; i < 5; i++) {
      const cardsinHand: string = this.cardStack.shift()!;
      this.initialHand.cardstack.push(cardsinHand)
    }
    const updateData = {
      heroStack: this.cardStack,
      handstack: this.initialHand.cardstack
    }
    this.store.dispatch(new CurrentCardsInHand(this.initialHand.cardstack));
    this.store.dispatch(new UpdateCardStackAction(this.cardStack))
    updateDoc(docRef, updateData);
  }

  setGameId() {
      this.gameIdSubscription = this.currentGameId$
      .subscribe((data) => {
        this.currentGameId = data;
      });
    
  }
  
  setUserID() {
    this.playerIdSubscription = this.currentUserId$
    .subscribe((data) => {
      this.currentPlayerId = data;
    });
    this.playerNameSubscription = this.currentUserName$
    .subscribe((data) => {
      this.currentPlayerName = data;
    });
  }

  ngOnDestroy(): void {
    this.playerIdSubscription.unsubscribe();
    this.playerNameSubscription.unsubscribe();
    this.gameIdSubscription.unsubscribe();
  }

}
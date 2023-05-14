import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { isEmpty } from '@firebase/util';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';

import { CurrentGameService } from 'src/app/services/current-game.service';
import { doc, getFirestore, getDoc, updateDoc, addDoc, setDoc, DocumentReference } from '@angular/fire/firestore';
import { Game } from 'src/models/game';
import { User } from 'src/models/user.class';
import { Monster } from 'src/models/monster/monster.class';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { get, update } from '@angular/fire/database';
import { CurrentHandService } from 'src/app/services/current-hand.service';
import { Select, Store } from '@ngxs/store';
import { CreateNewCardStackAction, UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { Card, CardStack } from 'src/models/helden/card.class';
import { CurrentGameAction } from 'src/app/actions/currentGame-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { Observable, Subscription } from 'rxjs';
import { CurrentUserModel } from 'src/app/states/currentUser-state';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { CurrentCardsInHand } from 'src/app/actions/cardsInHand-action';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';

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

  // ----------------- //

  
  user = new User();
  gameId: string = '';
  currentPlayer: string = '';
  currentHero: Object = {};
  currentEnemy!: Array<object>;
  numberOfPlayers: number = 0;
  gameDifficulty: string = '';
  gameIsLost: boolean = false;
  enemy: string = '';
  monsterStack: Array<object> = [];
  monsterSetting!: string;
  monster!: Monster;
  currentBoss: object[] = [];
  currentMonster: Array<object> = [];
  allBosses: object[] = [];

 
  playedCards: string[] = [];
  db = getFirestore();

  currentEnemyName!: string;
  currentEnemyType!: string;
  currentEnemyToken!: Array<string>;
  cardStack!: string[];

  constructor(
    public currentUserService: CurrentUserService,
    public currentGameService: CurrentGameService,
    private currentHandService: CurrentHandService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private store: Store,
  ) { }

  ngOnInit(): void {
    
    this.setUserID();
    this.setGameId();
    this.checkIfPlayerIsAlreadyPartOfGame();
    // this.route.params.subscribe(async (params) => {
    //   //When url is changed the Hero Data of this User is loaded
      
    //   this.setGameId();
    // });

    // this.currentUserService.getCurrentUser().then(()=>{
    //   this.setUserID();
    // }
    // ).then(()=>{
    //   this.checkIfPlayerIsAlreadyPartOfGame();
    // });
    
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


  
  // getGameInfos(response: any) {
  //   this.numberOfPlayers = response!['numberOfPlayers'];
  //   this.gameDifficulty = response!['difficulty'];
  //   this.gameIsLost = response!['isLost'];
  //   this.enemy = response!['currentEnemy'];
  //   this.monsterStack = response!['monsterStack'];
  //   this.currentBoss = response!['currentBoss'];
  //   this.allBosses = response!['allBosses'];
  //   this.currentEnemy = response!['currentEnemy'];
  //   this.currentEnemyName = response!['currentEnemy'].name;
  //   this.currentEnemyType = response!['currentEnemy'].type;
  //   this.currentEnemyToken = response!['currentEnemy'].token;
  // }

}
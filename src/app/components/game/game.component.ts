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
import { CreateNewCardStackAction } from 'src/app/actions/createNewCardStack-action';
import { CardStack } from 'src/models/helden/card.class';
import { CurrentGameAction } from 'src/app/actions/currentGame-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { Observable, Subscription } from 'rxjs';
import { CurrentUserModel } from 'src/app/states/currentUser-state';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  @Select(CurrentUserSelectors.currentUser) currentUserId$!: Observable<string>
  @Select(CurrentGameSelectors.currentGame) currentGameId$!: Observable<string>

  playerIdSubscription!: Subscription;
  gameIdSubscription!: Subscription;

  currentPlayerId!: string;
  currentGameId!: string;

  // ----------------- //

  game = new Game();
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

  initialHand: string[] | undefined = [];
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
    this.route.params.subscribe(async (params) => {
      //When url is changed the Hero Data of this User is loaded
      this.store.dispatch(new CurrentGameAction(params['id']))

      this.playerIdSubscription = 
      this.currentUserId$
      .subscribe((data) => {
        this.currentPlayerId = data;
        console.log('Obsdata', this.currentPlayerId)
      });

      this.gameIdSubscription = 
      this.currentGameId$
      .subscribe((data) => {
        this.currentGameId = data;
        console.log('Obsdata2', this.currentGameId)
      });

      console.log('Obsdata3', this.currentGameId ,this.currentPlayerId)
    });
//Die CurrentUserService muss vor der Select currentUserID$ laufen, da dort erst der Store dispatch läuft
    this.currentUserService.getCurrentUser().then((response) => {
      this.getPlayerInfos(response);
      this.checkIfPlayerIsAlreadyPartOfGame()
      console.log('Obsdata4', this.currentPlayerId)
    })
      .then(() => {
        this.currentGameService.getCurrentGame(this.currentGameId)
          .then((response) => {
            //get Data from Server for Game
            this.getGameInfos(response);
          })
      });
  };


  async checkIfPlayerIsAlreadyPartOfGame() {
    const docPlayer = doc(this.db, 'games', this.currentGameId);
    const docSnap = await getDoc(docPlayer);
    let data = docSnap.data();
    let players: string[] = data!['choosenHeros'];
    if (players.includes(this.currentPlayer)) {
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
      userNickname: this.currentPlayer,
    }
    updateDoc(docRef, updateData);
  }

  async updatePlayerOfGame(docPlayer: any, players: string[]) {
    players.push(this.currentPlayer)
    const updatePlayer = {
      choosenHeros: players
    }
    updateDoc(docPlayer, updatePlayer);
  }

  getPlayerInfos(response: any) {
    this.currentHero = response.choosenHero;
    this.currentPlayer = response.userNickname;
    this.currentPlayerId = response.userId;
    this.playedCards = response.playedCards;

  }

  getGameInfos(response: any) {
    this.numberOfPlayers = response!['numberOfPlayers'];
    this.gameDifficulty = response!['difficulty'];
    this.gameIsLost = response!['isLost'];
    this.enemy = response!['currentEnemy'];
    this.monsterStack = response!['monsterStack'];
    this.currentBoss = response!['currentBoss'];
    this.allBosses = response!['allBosses'];
    this.currentEnemy = response!['currentEnemy'];
    this.currentEnemyName = response!['currentEnemy'].name;
    this.currentEnemyType = response!['currentEnemy'].type;
    this.currentEnemyToken = response!['currentEnemy'].token;
  }


  async loadHandstack(currentPlayerId: string) {
    const docRef = doc(this.db, 'games', this.currentGameId, 'player', currentPlayerId);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data();
    this.initialHand = data!['handstack'];
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
      const cardsinHand: string | undefined = this.cardStack.shift();
      this.initialHand!.push(cardsinHand!);
    }
    const updateData = {
      heroStack: this.cardStack,
      handstack: this.initialHand
    }

    updateDoc(docRef, updateData);
  }

  ngOnDestroy(): void {
    this.playerIdSubscription.unsubscribe();
    this.gameIdSubscription.unsubscribe();
  }

}
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { doc, getDoc, getFirestore, updateDoc } from '@angular/fire/firestore';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { SetNewEnemy, UpdateMonsterTokenArray } from 'src/app/actions/currentGame-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { LoadGameService } from 'src/app/services/load-game.service';
import { SaveGameService } from 'src/app/services/save-game.service';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-player-hand',
  templateUrl: './player-hand.component.html',
  styleUrls: ['./player-hand.component.scss']
})
export class PlayerHandComponent implements OnInit, OnDestroy {

  @Select(CurrentUserSelectors.currentUserId) currentUserId$!: Observable<string>
  playerIdSubscription!: Subscription;
  currentPlayerId!: string;

  @Select(CurrentUserSelectors.currentUserName) currentUserName$!: Observable<string>
  playerNameSubscription!: Subscription;
  currentPlayerName!: string;

  @Select(CurrentGameSelectors.currentGame) currentGameId$!: Observable<string>
  gameIdSubscription!: Subscription;
  currentGameId!: string;

  @Select(CurrentHandSelector.currentHand) currentHand$!: Observable<string[]>
  handSubscription!: Subscription;
  currentHand!: string[];
  loadedCurrentHand: string[] = [];

  @Select(CurrentCardStackSelector.currentCardStack) currentCardStack$!: Observable<string[]>
  stackSubscription!: Subscription;
  currentCardStack!: string[];

  @Select(CurrentGameSelectors.currentEnemy) currentEnemy$!: Observable<Mob>
  currentEnemySubscription!: Subscription;
  currentEnemy!: Mob;

  @Select(CurrentGameSelectors.currentMob) currentMob$!: Observable<Mob[]>
  MobSubscription!: Subscription;
  currentMob!: Mob[];

  @Select(CurrentGameSelectors.currentBoss) currentBoss$!: Observable<Mob>
  currentBossSubscription!: Subscription;
  currentBoss!: Mob;


  @Select(CurrentDeliveryStackSelector.currentDeliveryStack) currentDeliveryStack$!: Observable<string[]>
  deliveryStackSubscription!: Subscription
  currentDeliveryStack!: string[];

  db = getFirestore();
  // -------------------------------------



  constructor(
    private store: Store,
    private saveGame: SaveGameService,
    private loadGame: LoadGameService
  ) { }

  ngOnInit(): void {
    this.getGameData();
  }



  saveHand(card: string, currHand: string[]) {
    let indexOfHandCard = this.currentHand.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    // this.updatePlayer('handstack', currHand);
    this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
    // this.loadGame.loadHandstack(this.currentGameId, this.currentPlayerId).then((results)=> {
    //   this.loadedCurrentHand = results
    // });
    console.log('Result from Load', currHand)
    this.store.dispatch(new UpdateCurrentHandAction(currHand));

  }

  chooseCard(card: string) {
    const doubleCard = card.split('_');
    const currHand = [...this.currentHand];
    const currEne = [...this.currentEnemy.token];
    const currName = this.currentEnemy.name;
    const currType = this.currentEnemy.type;
    const currMob: Mob = {
      name: currName,
      token: currEne,
      type: currType
    };
    if (card.includes('_') && (this.currentEnemy.type.toLocaleLowerCase().includes(doubleCard[1]))) {
      console.log('test', card, this.currentEnemy.type.includes(doubleCard[1]))
      currEne.length = 0;
      this.store.dispatch(new UpdateMonsterTokenArray(currEne));
      // this.updateGame('currentEnemyToken', currMob);
      this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob);
      this.saveHand(card, currHand)
    }
    // debugger
    if (card.includes('_') && (this.currentEnemy.token.includes(doubleCard[0]) || this.currentEnemy.token.includes(doubleCard[1]))) {
        if (this.currentEnemy.token.includes(doubleCard[0]) && this.currentEnemy.token.includes(doubleCard[1])) {
        this.playAsTwoCards(doubleCard[0], doubleCard[1], currEne, currMob)
      } else if (this.currentEnemy.token.includes(doubleCard[0])) {
        this.playAsOneCard(doubleCard[0], currEne, currMob)
      } else if (this.currentEnemy.token.includes(doubleCard[1])) {
        this.playAsOneCard(doubleCard[1], currEne, currMob)
      };
      this.saveHand(card, currHand);
    };
    if (this.currentEnemy.token.includes(card)) {
      this.playCardfromHandAndUpdateEnemyToken(card)
    }
    if (this.currentHand.length < 5) {
      this.checkLenghtOfCurentHand()
    }
    if (Array.isArray(this.currentEnemy.token) && !this.currentEnemy.token.length) {
      if (this.currentMob.length > 0) {
        this.getNextEnemy();
      } else {
        this.getNextBoss();
      }
    }
  }




  playCardfromHandAndUpdateEnemyToken(card: string) {
    const currHand = [...this.currentHand];
    const currEne = [...this.currentEnemy.token];
    const currName = this.currentEnemy.name;
    const currType = this.currentEnemy.type;
    const currMob: Mob = {
      name: currName,
      token: currEne,
      type: currType
    }
    // const deliveryStack = [...this.currentDeliveryStack];
    let indexOfHandCard = this.currentHand.indexOf(card);
    let indexOfEnemyToken = this.currentEnemy.token.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currEne.splice(indexOfEnemyToken, 1);
    // deliveryStack.push(card)

    // this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
    // this.updatePlayer('handstack', currHand);
    this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob);
    // this.loadGame.loadHandstack(this.currentGameId, this.currentPlayerId).then((results)=> {
    //   this.loadedCurrentHand = results
    // });
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    // this.updateGame('currentEnemyToken', currMob);
    // this.updatePlayer('deliveryStack', deliveryStack)
  };

  checkLenghtOfCurentHand() {

    const currHand = [...this.currentHand];
    const currCardStack = [...this.currentCardStack];
    for (let i = 0; currHand.length < 5; i++) {
      const getCardForHand = currCardStack.shift()!;
      currHand.push(getCardForHand)
      this.store.dispatch(new UpdateCardStackAction(currCardStack));
      this.store.dispatch(new UpdateCurrentHandAction(currHand));
      // this.updatePlayer('handstack', currHand);
      this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
      this.saveGame.updateCardstack(this.currentGameId, this.currentPlayerId ,currCardStack)
      // this.updatePlayer('cardstack', currCardStack);

    }
  };

  playAsOneCard(card: string, currEne: string[], currMob: Mob) {
    let indexOfEnemyToken = this.currentEnemy.token.indexOf(card);
    currEne.splice(indexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    // this.updateGame('currentEnemyToken', currMob);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob)
  }

  playAsTwoCards(cardOne: string, cardTwo: string, currEne: string[], currMob: Mob) {
    let firstIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob);
    // this.updateGame('currentEnemyToken', currMob);
    const secCurrEne = [...currEne]
    let secondIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardTwo);
    secCurrEne.splice(secondIndexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(secCurrEne));
    // this.updateGame('currentEnemyToken', currMob);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob)
  }

  getNextEnemy() {
    const currMob = [...this.currentMob];
    const newCurrentEnemy: Mob = currMob.shift()!;
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob));
    // this.updateGame('newEnemy', newCurrentEnemy)
    this.saveGame.updateNewEnemy(this.currentGameId, newCurrentEnemy);
    this.saveGame.updateNewMob(this.currentGameId, currMob);
    // this.updateGame('newMob', currMob)
  };

  getNextBoss() {
    const newCurrentEnemy: Mob = this.currentBoss;
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    // this.updateGame('newEnemy', newCurrentEnemy)
    this.saveGame.updateNewEnemy(this.currentGameId, newCurrentEnemy);
  };

  // updatePlayer(prop: string, cardsToUpdate: string[],) {
  //   const docPlayer = doc(this.db, 'games', this.currentGameId, 'player', this.currentPlayerId);
  //   if (prop === 'handstack') {
  //     const updateCurrentHand = {
  //       handstack: cardsToUpdate,
  //     }
  //     updateDoc(docPlayer, updateCurrentHand);
  //   } else if (prop === 'cardstack') {
  //     const updateCardstack = {
  //       cardstack: cardsToUpdate,
  //     }
  //     updateDoc(docPlayer, updateCardstack);
  //   } else if (prop === 'deliveryStack') {
  //     const updateDeliveryStack = {
  //       deliveryStack: cardsToUpdate
  //     }
  //     updateDoc(docPlayer, updateDeliveryStack) // deliveryStack ist der Ablagestapel. Nur bestimmte Karten kommen auf den Ablagestapel, daher noch auskommentiert
  //   }
  // }

  // updateGame(prop: string, currMob: Mob | Mob[]) {
  //   const docServer = doc(this.db, 'games', this.currentGameId);
  //   if (prop === 'currentEnemyToken') {
  //     const updateEnemyToken = {
  //       currentEnemy: currMob
  //     }
  //     updateDoc(docServer, updateEnemyToken)

  //   } else if (prop === 'newEnemy') {
  //     const updateMonster = {
  //       currentEnemy: currMob
  //     }
  //     updateDoc(docServer, updateMonster)

  //   } else if (prop === 'newMob') {
  //     const updateMob = {
  //       Mob: currMob
  //     }
  //     updateDoc(docServer, updateMob)
  //   }

  // }

  getGameData() {
    this.playerIdSubscription = this.currentUserId$
      .subscribe((data) => {
        this.currentPlayerId = data;
      });
    this.gameIdSubscription = this.currentGameId$
      .subscribe((data) => {
        this.currentGameId = data;
      });

    this.playerNameSubscription = this.currentUserName$
      .subscribe((data) => {
        this.currentPlayerName = data;
      });

    this.handSubscription = this.currentHand$
      .subscribe((data) => {
        this.currentHand = data;
      });

    this.currentEnemySubscription = this.currentEnemy$
      .subscribe((data) => {
        this.currentEnemy = data;
      });
    this.MobSubscription = this.currentMob$
      .subscribe((data) => {
        this.currentMob = data;
      });
    this.currentBossSubscription = this.currentBoss$
      .subscribe((data) => {
        this.currentBoss = data;
      });
    this.stackSubscription = this.currentCardStack$
      .subscribe((data) => {
        this.currentCardStack = data;
      });
    this.deliveryStackSubscription = this.currentDeliveryStack$
      .subscribe((data) => {
        this.currentDeliveryStack = data;
      });

  }

  ngOnDestroy(): void {
    this.playerIdSubscription.unsubscribe();
    this.gameIdSubscription.unsubscribe();
    this.handSubscription.unsubscribe();
    this.currentEnemySubscription.unsubscribe();
    this.MobSubscription.unsubscribe();
    this.stackSubscription.unsubscribe();
  }


}

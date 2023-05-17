import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { doc, getFirestore, updateDoc } from '@angular/fire/firestore';
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
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-player-hand',
  templateUrl: './player-hand.component.html',
  styleUrls: ['./player-hand.component.scss']
})
export class PlayerHandComponent implements OnInit, OnDestroy {

  @Select(CurrentUserSelectors.currentUserId) currentUserId$!: Observable<string>
  @Select(CurrentUserSelectors.currentUserName) currentUserName$!: Observable<string>
  @Select(CurrentGameSelectors.currentGame) currentGameId$!: Observable<string>
  @Select(CurrentHandSelector.currentHand) currentHand$!: Observable<string[]>
  @Select(CurrentCardStackSelector.currentCardStack) currentCardStack$!: Observable<string[]>
  @Select(CurrentGameSelectors.currentEnemy) currentEnemy$!: Observable<Mob>
  @Select(CurrentGameSelectors.currentMob) currentMob$!: Observable<Mob[]>
  @Select(CurrentGameSelectors.currentBoss) currentBoss$!: Observable<Mob>
  @Select(CurrentDeliveryStackSelector.currentDeliveryStack) currentDeliveryStack$!: Observable<string[]>

  playerIdSubscription!: Subscription;
  playerNameSubscription!: Subscription;
  gameIdSubscription!: Subscription;
  handSubscription!: Subscription;
  stackSubscription!: Subscription;
  currentEnemySubscription!: Subscription;
  currentBossSubscription!: Subscription;
  MobSubscription!: Subscription;
  deliveryStackSubscription!: Subscription

  currentPlayerId!: string;
  currentPlayerName!: string;
  currentGameId!: string;
  currentHand!: string[];
  currentCardStack!: string[];
  currentEnemy!: Mob;
  currentBoss!: Mob;
  currentMob!: Mob[];
  currentDeliveryStack!: string[];

  db = getFirestore();
  // -------------------------------------



  constructor(
    private store: Store,
  ) { }

  ngOnInit(): void {
    this.getGameData();
  }

  playAsTwoCards(cardOne: string, cardTwo: string, currEne: string[], currMob: Mob) {
    let firstIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.updateGame('currentEnemyToken', currMob);
    const secCurrEne = [...currEne]
    let secondIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardTwo);
    secCurrEne.splice(secondIndexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(secCurrEne));
    this.updateGame('currentEnemyToken', currMob);
  }

  saveHand(card: string, currHand: string[]) {
    let indexOfHandCard = this.currentHand.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.updatePlayer('handstack', currHand);
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
      //die Token vom Enemy löschen und Karte aus Hand entfernen
      currEne.length = 0;
      this.store.dispatch(new UpdateMonsterTokenArray(currEne));
      this.updateGame('currentEnemyToken', currMob);
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
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    // this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
    this.updatePlayer('handstack', currHand);
    this.updateGame('currentEnemyToken', currMob);
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
      this.updatePlayer('handstack', currHand);
      this.updatePlayer('cardstack', currCardStack);

    }
  };

  playAsOneCard(card: string, currEne: string[], currMob: Mob) {
    let indexOfEnemyToken = this.currentEnemy.token.indexOf(card);
    currEne.splice(indexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.updateGame('currentEnemyToken', currMob);
  }

  getNextEnemy() {
    const currMob = [...this.currentMob];
    const newCurrentEnemy: Mob = currMob.shift()!;
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob))
    this.updateGame('newEnemy', newCurrentEnemy)
    this.updateGame('newMob', currMob)
  };

  getNextBoss() {
    const newCurrentEnemy: Mob = this.currentBoss;
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy))
    this.updateGame('newEnemy', newCurrentEnemy)
  };

  updatePlayer(prop: string, cardsToUpdate: string[],) {
    const docPlayer = doc(this.db, 'games', this.currentGameId, 'player', this.currentPlayerId);
    if (prop === 'handstack') {
      const updateCurrentHand = {
        handstack: cardsToUpdate,
      }
      updateDoc(docPlayer, updateCurrentHand);
    } else if (prop === 'cardstack') {
      const updateCardstack = {
        heroStack: cardsToUpdate,
      }
      updateDoc(docPlayer, updateCardstack);
    } else if (prop === 'deliveryStack') {
      const updateDeliveryStack = {
        deliveryStack: cardsToUpdate
      }
      updateDoc(docPlayer, updateDeliveryStack) // deliveryStack ist der Ablagestapel. Nur bestimmte Karten kommen auf den Ablagestapel, daher noch auskommentiert
    }
  }

  updateGame(prop: string, currMob: Mob | Mob[]) {
    const docServer = doc(this.db, 'games', this.currentGameId);
    if (prop === 'currentEnemyToken') {
      const updateEnemyToken = {
        currentEnemy: currMob
      }
      updateDoc(docServer, updateEnemyToken)

    } else if (prop === 'newEnemy') {
      const updateMonster = {
        currentEnemy: currMob
      }
      updateDoc(docServer, updateMonster)

    } else if (prop === 'newMob') {
      const updateMob = {
        Mob: currMob
      }
      updateDoc(docServer, updateMob)
    }

  }

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

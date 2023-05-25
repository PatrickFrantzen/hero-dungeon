import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DocumentData, collection, collectionData, doc, getDoc, getFirestore, updateDoc } from '@angular/fire/firestore';
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
import { Game } from 'src/models/game';
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
  loadedCurrentCardStack!: string[]

  @Select(CurrentGameSelectors.currentEnemy) currentEnemy$!: Observable<Mob>
  currentEnemySubscription!: Subscription;
  currentEnemy!: Mob;
  loadedCurrentEnemy!: Mob;

  @Select(CurrentGameSelectors.currentMob) currentMob$!: Observable<Mob[]>
  MobSubscription!: Subscription;
  currentMob!: Mob[];
  loadedCurrentMob!: Mob[];

  @Select(CurrentGameSelectors.currentBoss) currentBoss$!: Observable<Mob>
  currentBossSubscription!: Subscription;
  currentBoss!: Mob;


  @Select(CurrentDeliveryStackSelector.currentDeliveryStack) currentDeliveryStack$!: Observable<string[]>
  deliveryStackSubscription!: Subscription
  currentDeliveryStack!: string[];

  db = getFirestore();
  loadedCollectionData!: DocumentData;
  game$:Observable<any>
  // -------------------------------------



  constructor(
    private store: Store,
    private saveGame: SaveGameService,
    private loadGame: LoadGameService
  ) {this.game$ = collectionData(collection(this.db, 'games')) }

  ngOnInit(): void {
    this.getGameData();
    console.log('testID', this.currentGameId)
    this.game$.subscribe(async() => {
      const docRef = doc(this.db, 'games', this.currentGameId)
      const docSnap = await getDoc(docRef);
      const data = docSnap.data()
      this.updateFromDatabase(data!);
    })
    
  }

  updateFromDatabase(data:DocumentData) {
    this.currentEnemy = data['currentEnemy'];
    this.currentBoss = data['currentBoss'];
    this.currentMob = data['Mob'];
    this.store.dispatch(new UpdateMonsterTokenArray(this.currentEnemy.token))
    this.store.dispatch(new UpdateMobAction(this.currentMob));

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
      this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob);
      this.loadGame.loadGameCollectionData(this.currentGameId)
      .then((results)=> {
        this.loadedCollectionData = results!;
        this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
        this.store.dispatch(new UpdateMonsterTokenArray(this.loadedCurrentEnemy.token));
      })
      this.saveHand(card, currHand)
    }
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
  }

  playCardfromHandAndUpdateEnemyToken(card: string) {
    
    let currHand = [...this.currentHand];
    const currEne = [...this.currentEnemy.token];
    const currName = this.currentEnemy.name;
    const currType = this.currentEnemy.type;
    const currMob: Mob = {
      name: currName,
      token: currEne,
      type: currType
    }
    let indexOfHandCard = this.currentHand.indexOf(card);
    let indexOfEnemyToken = this.currentEnemy.token.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currEne.splice(indexOfEnemyToken, 1);
    currHand = this.checkHandsize(currHand)!;
    this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob);
    // debugger
    this.loadGame.loadPlayerCollectionData(this.currentGameId, this.currentPlayerId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentHand = this.loadedCollectionData['handstack'];
      this.store.dispatch(new UpdateCurrentHandAction(this.loadedCurrentHand));
    });
    this.loadGame.loadGameCollectionData(this.currentGameId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.store.dispatch(new UpdateMonsterTokenArray(this.loadedCurrentEnemy.token));
      this.checkForNextEnemy(this.loadedCurrentEnemy)
    })
  };

  checkHandsize(handsize: string[]) {
    if (handsize.length <5) {
      const currHand = [...handsize];
      const currCardStack = [...this.currentCardStack];
      for (let i = 0; currHand.length < 5; i++) {
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand)
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
        this.saveGame.updateCardstack(this.currentGameId, this.currentPlayerId ,currCardStack)
      }
      return currHand
    }
    return null
  }

  checkForNextEnemy(currentEnemy: Mob) {
    if (Array.isArray(currentEnemy.token) && !currentEnemy.token.length) {
      if (this.currentMob.length > 0) {
        this.getNextEnemy();
      } else {
        this.getNextBoss();
      }
    }
  }


  playAsOneCard(card: string, currEne: string[], currMob: Mob) {
    let indexOfEnemyToken = this.currentEnemy.token.indexOf(card);
    currEne.splice(indexOfEnemyToken, 1);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob)
    this.loadGame.loadGameCollectionData(this.currentGameId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.store.dispatch(new UpdateMonsterTokenArray(this.loadedCurrentEnemy.token));
      this.checkForNextEnemy(this.loadedCurrentEnemy)
    })
  }

  playAsTwoCards(cardOne: string, cardTwo: string, currEne: string[], currMob: Mob) {
    let firstIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob);
    this.loadGame.loadGameCollectionData(this.currentGameId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.store.dispatch(new UpdateMonsterTokenArray(this.loadedCurrentEnemy.token));
      this.checkForNextEnemy(this.loadedCurrentEnemy)
    })
    const secCurrEne = [...currEne]
    let secondIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardTwo);
    secCurrEne.splice(secondIndexOfEnemyToken, 1);
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, currMob)
    this.loadGame.loadGameCollectionData(this.currentGameId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.store.dispatch(new UpdateMonsterTokenArray(this.loadedCurrentEnemy.token));
      this.checkForNextEnemy(this.loadedCurrentEnemy)
    })
  }

  getNextEnemy() {
    const currMob = [...this.currentMob];
    const newCurrentEnemy: Mob = currMob.shift()!;
    this.saveGame.updateNewEnemy(this.currentGameId, newCurrentEnemy);
    this.saveGame.updateNewMob(this.currentGameId, currMob);
    this.loadGame.loadGameCollectionData(this.currentGameId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.loadedCurrentMob = this.loadedCollectionData['Mob'];
      this.store.dispatch(new SetNewEnemy(this.loadedCurrentEnemy));
      this.store.dispatch(new UpdateMobAction(this.loadedCurrentMob));
    })
  };

  getNextBoss() {
    const newCurrentEnemy: Mob = this.currentBoss;
    this.saveGame.updateNewEnemy(this.currentGameId, newCurrentEnemy);
    this.loadGame.loadGameCollectionData(this.currentGameId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    })
  };

  saveHand(card: string, currHand: string[]) {
    let indexOfHandCard = this.currentHand.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currHand = this.checkHandsize(currHand)!;
    this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
    this.loadGame.loadPlayerCollectionData(this.currentGameId, this.currentPlayerId)
    .then((results)=> {
      this.loadedCollectionData = results!;
      this.loadedCurrentHand = [...this.loadedCollectionData['handstack']];
      this.loadedCurrentCardStack = [...this.loadedCollectionData['cardstack']]
      this.store.dispatch(new UpdateCurrentHandAction(this.loadedCurrentHand));
      this.store.dispatch(new UpdateCardStackAction(this.loadedCurrentCardStack));

    });
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

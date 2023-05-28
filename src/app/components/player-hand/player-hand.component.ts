import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DocumentData, collection, collectionData, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from '@angular/fire/firestore';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { SetNewEnemy, UpdateMonsterTokenArray } from 'src/app/actions/currentGame-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { UpdateHeropowerActivated } from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
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

  @Select(HeropowerSelectors.currentHeropowerActivated) currentHeropowerActivated$!: Observable<boolean>;
  heropowerSubscription!: Subscription;
  heropowerActivated: boolean = false;

  @Select(CurrentUserSelectors.currentUserHeroData) currentUserHeroData$!: Observable<{ choosenHero: string, heroPower: string, description: string }>;
  userHeroSubscription!: Subscription;
  currentUserHeroData!: { choosenHero: string, heroPower: string, description: string }
  heroName: string = ''
  heropower: string = ''
  description: string = ''

  db = getFirestore();
  loadedCollectionData!: DocumentData;
  collectionData!: DocumentData

  heropowerArray: string[] = [];


  game$: Observable<any>;
  gameSubscr!: Subscription
  // player$:Observable<any>;
  // -------------------------------------



  constructor(
    private store: Store,
    private saveGame: SaveGameService,
  ) {
    this.game$ = collectionData(collection(this.db, 'games'));
    // this.player$= collectionData(collection(this.db, 'games', this.currentGameId, 'player'))
  }

  ngOnInit(): void {
    this.getGameData();
    this.gameSubscr = this.game$.subscribe(async () => {
      const docRef = doc(this.db, 'games', this.currentGameId)
      const docSnap = await getDoc(docRef);
      const data = docSnap.data()
      this.updateFromDatabase(data!);
      const handstackRef = collection(this.db, 'games', this.currentGameId, 'player');
      const q = query(handstackRef, where('userId', '==', this.currentPlayerId))
      const playerSnap = await getDocs(q);
      playerSnap.forEach((doc) => {
        this.collectionData = doc.data()
        console.warn('Test', this.collectionData)
        this.updatePlayerFromDatabase(this.collectionData)
      })
    })

  }

  updatePlayerFromDatabase(data: DocumentData) {
    this.currentCardStack = data['cardstack'];
    this.currentHand = data['handstack'];
    this.currentDeliveryStack = data['deliveryStack']
    this.store.dispatch(new UpdateCurrentHandAction(this.currentHand));
    this.store.dispatch(new UpdateCardStackAction(this.currentCardStack))
    this.store.dispatch(new UpdateDeliveryStack(this.currentDeliveryStack))
  }

  updateFromDatabase(data: DocumentData) {
    this.currentEnemy = data['currentEnemy'];
    this.currentBoss = data['currentBoss'];
    this.currentMob = data['Mob'];
    this.store.dispatch(new UpdateMonsterTokenArray(this.currentEnemy.token))
    this.store.dispatch(new UpdateMobAction(this.currentMob));
    this.store.dispatch(new SetNewEnemy(this.currentEnemy));
  }

  checkheropowerArray() {
    if (this.heropowerArray.length == 3) {
      let currEnemyToken = [...this.currentEnemy.token]
      currEnemyToken.length = 0;
      this.store.dispatch(new UpdateMonsterTokenArray(currEnemyToken));
      this.saveGame.updateCurrentEnemyToken(this.currentGameId, this.currentEnemy);
      this.checkForNextEnemy(this.currentEnemy);
      this.heropowerArray.forEach((card) => {
        let indexOfHandCard = this.currentHand.indexOf(card);
        let currHand = [...this.currentHand];
        let currCardStack = [...this.currentCardStack]
        currHand.splice(indexOfHandCard, 1);
        if (currHand.length < 5) {
          if (currCardStack.length === 0) return;
          const getCardForHand = currCardStack.shift()!;
          currHand.push(getCardForHand)
          this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
          this.saveGame.updateCardstack(this.currentGameId, this.currentPlayerId, currCardStack)
          this.store.dispatch(new UpdateCardStackAction(currCardStack));
          this.store.dispatch(new UpdateCurrentHandAction(currHand));
        }
      })
      this.store.dispatch(new UpdateHeropowerActivated(false))
      this.heropowerArray = [];
    }

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
    if (this.heropowerActivated) {
      switch (true) {
        case this.heroName == 'Gladiator':
          if (this.heropowerArray.length < 3) {
            this.heropowerArray.push(card);
            this.checkheropowerArray()
          }
          break;
        case this.heroName == 'Barbar':
          if (this.heropowerArray.length < 3) {
            this.heropowerArray.push(card);
            this.checkheropowerArray()
          }
          break;
        case this.heroName == 'Zauberin':
          if (this.heropowerArray.length < 3) {
            this.heropowerArray.push(card);
            this.checkheropowerArray()
          }
          break;
        case this.heroName == 'Magier':

          break;
        case this.heroName == 'Jägerin':

          break;
        case this.heroName == 'Waldläufer':
          if (this.heropowerArray.length < 3) {
            this.heropowerArray.push(card);
            this.checkheropowerArray()
          }
          break;
        case this.heroName == 'Dieb':

          break;
        case this.heroName == 'Ninja':
          if (this.heropowerArray.length < 3) {
            this.heropowerArray.push(card);
            this.checkheropowerArray()
          }
          break;
        case this.heroName == 'Paladin':
          if (this.heropowerArray.length < 3) {
            this.heropowerArray.push(card);
            this.checkheropowerArray()
          }
          break;
        case this.heroName == 'Walküre':

          break;
        default:
          break;
      }
    } else {
    if (card.includes('_') && ((currMob.token[0].toLocaleLowerCase().includes('event')) || currMob.type.toLocaleLowerCase().includes(doubleCard[1]))) {

      console.log('test', card, this.currentEnemy.type.includes(doubleCard[1]))
      currEne.length = 0;
      this.store.dispatch(new UpdateMonsterTokenArray(currEne));
      this.saveGame.updateCurrentEnemyToken(this.currentGameId, this.currentEnemy);
      this.checkForNextEnemy(this.currentEnemy)
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
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.checkForNextEnemy(this.currentEnemy)
  };

  checkHandsize(handsize: string[]) {
    if (handsize.length < 5) {
      const currHand = [...handsize];
      const currCardStack = [...this.currentCardStack];
      for (let i = 0; currHand.length < 5; i++) {
        if (currCardStack.length === 0) return;
        const getCardForHand = currCardStack.shift()!;
        currHand.push(getCardForHand)
        this.store.dispatch(new UpdateCardStackAction(currCardStack));
        this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
        this.saveGame.updateCardstack(this.currentGameId, this.currentPlayerId, currCardStack)
      }
      return currHand
    }
    return null
  }

  checkForNextEnemy(currentEnemy: Mob) {
    if (Array.isArray(currentEnemy.token) && !currentEnemy.token.length) {
      //  if (this.currentMob.length > 0 && !currentEnemy.token.length) { // funktioniert so noch nicht
      //   this.loadNextDungeon() //noch nicht geschrieben
      //  }
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
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, this.currentEnemy)
    this.checkForNextEnemy(this.currentEnemy)
  }

  playAsTwoCards(cardOne: string, cardTwo: string, currEne: string[], currMob: Mob) {

    let firstIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardOne);
    currEne.splice(firstIndexOfEnemyToken, 1);
    this.store.dispatch(new UpdateMonsterTokenArray(currEne));
    this.saveGame.updateCurrentEnemyToken(this.currentGameId, this.currentEnemy);

    if (currEne.includes(cardTwo)) {
      const secCurrEne = [...currEne]
      let secondIndexOfEnemyToken = this.currentEnemy.token.indexOf(cardTwo);
      secCurrEne.splice(secondIndexOfEnemyToken, 1);
      this.store.dispatch(new UpdateMonsterTokenArray(secCurrEne));
      this.saveGame.updateCurrentEnemyToken(this.currentGameId, this.currentEnemy);
      this.checkForNextEnemy(this.currentEnemy)
    }
  }

  getNextEnemy() {
    const currMob = [...this.currentMob];
    const newCurrentEnemy: Mob = currMob.shift()!;
    this.saveGame.updateNewEnemy(this.currentGameId, newCurrentEnemy);
    this.saveGame.updateNewMob(this.currentGameId, currMob);
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob));
  };

  getNextBoss() {
    const newCurrentEnemy: Mob = this.currentBoss;
    this.saveGame.updateNewEnemy(this.currentGameId, newCurrentEnemy);
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
  };

  loadNextDungeon() {

  }

  saveHand(card: string, currHand: string[]) {
    let indexOfHandCard = this.currentHand.indexOf(card);
    currHand.splice(indexOfHandCard, 1);
    currHand = this.checkHandsize(currHand)!;
    this.saveGame.updateHandstack(this.currentGameId, this.currentPlayerId, currHand);
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
    this.store.dispatch(new UpdateCardStackAction(this.currentCardStack));
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
    this.heropowerSubscription = this.currentHeropowerActivated$.subscribe((data) => {
      this.heropowerActivated = data;
    })
    this.userHeroSubscription = this.currentUserHeroData$.subscribe((data) => {
      if (data) {
        this.currentUserHeroData = data;
        this.heroName = this.currentUserHeroData.choosenHero;
        this.heropower = this.currentUserHeroData.heroPower;
        this.description = this.currentUserHeroData.description
      }
    })
  }

  ngOnDestroy(): void {
    this.playerIdSubscription.unsubscribe();
    this.gameIdSubscription.unsubscribe();
    this.handSubscription.unsubscribe();
    this.currentEnemySubscription.unsubscribe();
    this.MobSubscription.unsubscribe();
    this.stackSubscription.unsubscribe();
    this.gameSubscr.unsubscribe();
    this.heropowerSubscription.unsubscribe();
    this.userHeroSubscription.unsubscribe();
  }


}

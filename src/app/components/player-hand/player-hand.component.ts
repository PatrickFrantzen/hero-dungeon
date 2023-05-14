import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { doc, getFirestore, updateDoc } from '@angular/fire/firestore';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMonsterStackAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { SetNewEnemy, UpdateMonsterTokenArray } from 'src/app/actions/currentGame-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { CurrentEnemyService } from 'src/app/services/current-enemy.service';
import { Mob, Monster, MonsterStack } from 'src/models/monster/monster.class';

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
  @Select(CurrentGameSelectors.currentMonsterStack) currentMonsterStack$!: Observable<MonsterStack[]>

  playerIdSubscription!: Subscription;
  playerNameSubscription!: Subscription;
  gameIdSubscription!: Subscription;
  handSubscription!: Subscription;
  stackSubscription!: Subscription;
  currentEnemySubscription!: Subscription;
  monsterstackSubscription!: Subscription;

  currentPlayerId!: string;
  currentPlayerName!: string;
  currentGameId!: string;
  currentHand!: string[];
  currentCardStack!: string[];
  currentEnemy!: Mob
  currentMonsterStack!: MonsterStack[]

  db = getFirestore();
  // -------------------------------------



  constructor(
    public currentEnemyService: CurrentEnemyService,
    private store: Store,
  ) { }

  ngOnInit(): void {
    this.getGameData();
  }


  chooseCard(card: string) {
    if (this.currentEnemy.token.includes(card)) {
      const currHand = [...this.currentHand];
      const currEne = [...this.currentEnemy.token];
      const currName = this.currentEnemy.name;
      const currType = this.currentEnemy.type;
      const currMob: Mob = {
        name: currName,
        token: currEne,
        type: currType
      }
      const deliveryStack = []
      let indexOfHandCard = this.currentHand.indexOf(card);
      let indexOfEnemyToken = this.currentEnemy.token.indexOf(card);
      currHand.splice(indexOfHandCard, 1);
      currEne.splice(indexOfEnemyToken, 1);
      deliveryStack.push(card)
      this.store.dispatch(new UpdateCurrentHandAction(currHand));
      this.store.dispatch(new UpdateMonsterTokenArray(currEne));
      this.store.dispatch(new UpdateDeliveryStack(deliveryStack));
      this.updatePlayer('handstack', currHand);
      this.updateGame('currentEnemyToken', currMob);
      this.updatePlayer('deliveryStack', deliveryStack)

      if (this.currentHand.length < 5) {
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
      }
    }
    if (Array.isArray(this.currentEnemy.token) && !this.currentEnemy.token.length) {
      const currMonsterStack = [...this.currentMonsterStack];
      const newCurrentEnemy: Mob = currMonsterStack.shift()!;
      this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
      this.store.dispatch(new UpdateMonsterStackAction(currMonsterStack))
      this.updateGame('newEnemy', newCurrentEnemy)
      this.updateGame('newMonsterstack', currMonsterStack)
    }
  }

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
        playedCards: cardsToUpdate
      }
      updateDoc(docPlayer, updateDeliveryStack) // PlayedCards funktioniert noch nicht richtig
    }
  }

  updateGame(prop: string ,currMob: Mob | MonsterStack[]) {
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

    } else if(prop === 'newMonsterstack') {
      const updateMonsterstack = {
        monsterStack: currMob
      }
      updateDoc(docServer, updateMonsterstack)
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
      })

    this.currentEnemySubscription = this.currentEnemy$
      .subscribe((data) => {
        this.currentEnemy = data;
      })
    this.monsterstackSubscription = this.currentMonsterStack$
      .subscribe((data) => {
        this.currentMonsterStack = data;
      })
    this.stackSubscription = this.currentCardStack$
    .subscribe((data)=> {
      this.currentCardStack = data;
    })

  }

  ngOnDestroy(): void {
    this.playerIdSubscription.unsubscribe();
    this.gameIdSubscription.unsubscribe();
    this.handSubscription.unsubscribe();
    this.currentEnemySubscription.unsubscribe();
    this.monsterstackSubscription.unsubscribe();
    this.stackSubscription.unsubscribe();
  }


}

import { Component, Input, OnDestroy, OnInit} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { updateQuestCardActivated } from 'src/app/actions/currentGame-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { SaveGameService } from 'src/app/services/save-game.service';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss'],
})
export class EnemyComponent implements OnInit, OnDestroy{
  @Input() currentGameId: string = ''

  @Select(CurrentGameSelectors.currentEnemy) currentEnemy$!: Observable<Mob>
  currentEnemy!:Mob
  currentEnemySubscription!: Subscription;
  @Select(CurrentGameSelectors.currentQuestCardStatus) questStatus$!: Observable<boolean>
  questCardStatus: boolean = false;
  questCardStatusSubscription!: Subscription;
  constructor(
    private store: Store,
    private saveGame: SaveGameService
  ) {

  }

  ngOnInit(): void {
    this.setCurrentEnemy();
    console.log('currentEnemy', this.currentEnemy)
    if (this.currentEnemy.token.includes('event')) {
      this.store.dispatch(new updateQuestCardActivated(true))
      this.saveGame.updateQuestStatus(this.currentGameId, this.questCardStatus)
    }
  }

  setCurrentEnemy() {
    this.currentEnemySubscription = this.currentEnemy$.subscribe((data)=> {
      this.currentEnemy = data;
    })
    this.questCardStatusSubscription = this.questStatus$.subscribe((data)=> {
      this.questCardStatus = data;
      console.warn('questCardStatus', this.questCardStatus)
    })
  }

  ngOnDestroy(): void {
    this.currentEnemySubscription.unsubscribe()
    this.questCardStatusSubscription.unsubscribe()
  }
 

  
}

import { Component, OnDestroy, OnInit} from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss'],
})
export class EnemyComponent implements OnInit, OnDestroy{


  @Select(CurrentGameSelectors.currentEnemy) currentEnemy$!: Observable<Mob>
  currentEnemy!:Mob
  currentEnemySubscription!: Subscription;
  constructor(
  ) {

  }

  ngOnInit(): void {
    this.setCurrentEnemy();
    console.log('currentEnemy', this.currentEnemy)
  }

  setCurrentEnemy() {
    this.currentEnemySubscription = this.currentEnemy$.subscribe((data)=> {
      this.currentEnemy = data;
    })
  }

  ngOnDestroy(): void {
    this.currentEnemySubscription.unsubscribe()
  }
 

  
}

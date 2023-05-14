import { Component, EventEmitter, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentEnemyService } from 'src/app/services/current-enemy.service';
import { CurrentHandService } from 'src/app/services/current-hand.service';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss'],
  providers: [CurrentHandService, CurrentEnemyService]
})
export class EnemyComponent implements OnInit, OnDestroy{


  @Select(CurrentGameSelectors.currentEnemy) currentEnemy$!: Observable<Mob>
  currentEnemy!:Mob
  currentEnemySubscription!: Subscription;
  constructor(
    private route: ActivatedRoute,
    public enemyService: CurrentEnemyService
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

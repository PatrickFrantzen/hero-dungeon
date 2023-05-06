import { Component, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentEnemyService } from 'src/app/services/current-enemy.service';
import { CurrentHandService } from 'src/app/services/current-hand.service';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss'],
  providers: [CurrentHandService, CurrentEnemyService]
})
export class EnemyComponent implements OnInit, OnChanges{
  currentEnemyTokenEvent = new EventEmitter<string[]>();
  gameId:string = '';
  currentEnemyName:string = '';
  currentEnemyType:string = '';
  currentEnemyToken:string[] = [];

  constructor(
    private route: ActivatedRoute,
    public enemyService: CurrentEnemyService
  ) {

  }

  ngOnInit(): void {
    this.route.params.subscribe(async (params) => {
      //When url is changed the Hero Data of this User is loaded
      this.gameId = params['id'];
    });
    this.enemyService.getCurrentEnemyFromServer(this.gameId)
    .then((response:any) => {
      this.currentEnemyName = response.currentEnemy.name;
      this.currentEnemyType = response.currentEnemy.type;
      this.currentEnemyToken = response.currentEnemy.token;
    })
    // this.checkEnemyToken();
    
    this.enemyService.currentEnemyTokenEvent
    .subscribe((enemyToken: string[]) => {
      console.log(enemyToken)
      this.currentEnemyToken = enemyToken
    })
  }

  // checkEnemyToken() {
  //   this.enemyService.getCurrentEnemyFromServer(this.gameId)
  //   .then((response:any) =>{
  //     this.currentEnemyToken = response.currentEnemy.token;
  //   })
  // }



  ngOnChanges(changes: SimpleChanges): void {
    console.log('changes', changes)
  }

  
}

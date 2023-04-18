import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentEnemyService } from 'src/app/services/current-enemy.service';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss']
})
export class EnemyComponent implements OnInit{

  gameId:string = '';
  currentEnemyName:string = '';
  currentEnemyType:string = '';
  currentEnemyTokens:string[] = [];

  constructor(
    private route: ActivatedRoute,
    private enemyService: CurrentEnemyService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(async (params) => {
      //When url is changed the Hero Data of this User is loaded
      this.gameId = params['id'];
    });
    this.enemyService.getCurrentEnemyFromServer(this.gameId)
    .then((response:any) => {
      this.currentEnemyName = response.currentEnemy.name;
      this.currentEnemyType = response.currentEnemy.type;
      this.currentEnemyTokens = response.currentEnemy.token;
    })
  }

}

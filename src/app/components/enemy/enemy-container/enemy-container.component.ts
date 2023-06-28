import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  Observable,
  distinctUntilChanged,
  map
} from 'rxjs';
import { updateQuestCardActivated } from 'src/app/actions/currentGame-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { SaveGameService } from 'src/app/services/save-game.service';
import { Game } from 'src/models/game';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-enemy-container',
  template: `
    <app-enemy
      [gameId]="(this.gameId$ | async) || ''"
      [currentEnemy]="(this.currentEnemy$ | async) || emptyMob"
      [questCardStatus]="(this.currentQuestStatus$ | async) || false"
    ></app-enemy>
  `,
  styles: [``],
})
export class EnemyContainerComponent implements OnInit {
  @Select(CurrentGameSelectors.currentGameState)
  game$!: Observable<Game>;

  @Select(CurrentGameSelectors.currentQuestCardStatus)
  questStatus$!: Observable<boolean>;

  public emptyMob: Mob = {
    name: '',
    type: '',
    token: [],
  };

  gameId$: Observable<string> = new Observable<string>();
  currentEnemy$: Observable<Mob> = new Observable<Mob>();
  currentQuestStatus$: Observable<boolean> = new Observable<boolean>();

  constructor(private store: Store, private saveGame: SaveGameService) {}

  ngOnInit(): void {
    this.gameId$ = this.game$.pipe(
      map((data) => {
        return data.gameId;
      })
    );

    this.currentEnemy$ = this.game$.pipe(
      map((data) => {
        return data.currentEnemy;
      })
    );

    this.currentQuestStatus$ = this.currentEnemy$.pipe(
      distinctUntilChanged(),
      map((data) => {
        let currentEnemy = data;
        let questCardStatus = this.store.selectSnapshot(
          CurrentGameSelectors.currentQuestCardStatus
        );
        if (currentEnemy.token.includes('event')) {
          questCardStatus = true;
          this.store.dispatch(new updateQuestCardActivated(questCardStatus));
          return questCardStatus;
        } else {
          questCardStatus = false;
          this.store.dispatch(new updateQuestCardActivated(questCardStatus));
          return questCardStatus;
        }
      })
    );
    let gameId = this.store.selectSnapshot(CurrentGameSelectors.currentGame);
    let questCardStatus = this.store.selectSnapshot(
      CurrentGameSelectors.currentQuestCardStatus
    );
    this.saveGame.updateQuestStatus(gameId, questCardStatus);
  }
}

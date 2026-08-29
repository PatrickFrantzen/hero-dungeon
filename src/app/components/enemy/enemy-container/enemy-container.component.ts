import { ChangeDetectionStrategy, Component, OnInit, computed, effect } from '@angular/core';
import { Store } from '@ngxs/store';
import { updateQuestCardActivated } from 'src/app/actions/currentGame-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { Mob } from 'src/models/monster/monster.class';
import { EnemyComponent } from '../enemy.component';

@Component({
    selector: 'app-enemy-container',
    template: `
    <app-enemy
      [gameId]="gameId()"
      [currentEnemy]="currentEnemy()"
      [questCardStatus]="currentQuestStatus()"
    ></app-enemy>
  `,
    styles: [``],
    imports: [EnemyComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnemyContainerComponent implements OnInit {
  game = this.store.selectSignal(CurrentGameSelectors.currentGameState);
  currentQuestStatus = this.store.selectSignal(CurrentGameSelectors.currentQuestCardStatus);

  public emptyMob: Mob = {
    name: '',
    type: '',
    token: [],
  };

  gameId = computed(() => this.game().gameId ?? '');
  currentEnemy = computed(() => this.game().currentEnemy ?? this.emptyMob);

  constructor(private store: Store, private gameRepo: GameRepositoryService) {
    // Dispatches whether the "quest card" is active whenever the current enemy changes,
    // mirroring the previous @Select-based pipe(map(...dispatch...)) exactly.
    effect(() => {
      const currentEnemy = this.currentEnemy();
      const questCardStatus = currentEnemy.token.includes('event');
      this.store.dispatch(new updateQuestCardActivated(questCardStatus));
    });
  }

  ngOnInit(): void {
    let gameId = this.store.selectSnapshot(CurrentGameSelectors.currentGame);
    let questCardStatus = this.store.selectSnapshot(
      CurrentGameSelectors.currentQuestCardStatus
    );
    this.gameRepo.updateQuestStatus(gameId, questCardStatus);
  }
}

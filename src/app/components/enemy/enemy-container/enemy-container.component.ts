import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { updateQuestCardActivated } from 'src/app/actions/currentGame-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
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
    // display: contents, weil dieses Host-Element selbst kein CSS bekommt (nur Weiterreichen an
    // <app-enemy>) - ohne das ist der Host default "inline" und die auf .current-Enemy gesetzte
    // align-self: center (enemy.component.scss) wirkungslos, weil sie nicht mehr direkter
    // Flex-Item von .mainfield (game.component.scss) ist. Siehe enemy.component.ts fürs
    // gleiche Problem eine Ebene tiefer.
    styles: [`:host { display: contents; }`],
    imports: [EnemyComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnemyContainerComponent implements OnInit {
  private store = inject(Store);
  private gameRepo = inject(GameRepositoryService);

  gameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  encounterEnemy = this.store.selectSignal(EncounterSelectors.currentEnemy);
  currentQuestStatus = this.store.selectSignal(CurrentGameSelectors.currentQuestCardStatus);

  public emptyMob: Mob = {
    name: '',
    type: '',
    token: [],
  };

  currentEnemy = computed(() => this.encounterEnemy() ?? this.emptyMob);

  constructor() {
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

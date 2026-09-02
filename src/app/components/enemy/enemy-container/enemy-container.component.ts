import { ChangeDetectionStrategy, Component, OnInit, computed, effect } from '@angular/core';
import { Store } from '@ngxs/store';
import { updateQuestCardActivated } from 'src/app/actions/currentGame-action';
import { ChooseJokerToken } from 'src/app/actions/joker-selection-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { JokerSelectionSelectors } from 'src/app/selectors/joker-selection-selector';
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
      [tokenSelectable]="jokerSelectionActive()"
      (tokenChosen)="onTokenChosen($event)"
    ></app-enemy>
  `,
    styles: [``],
    imports: [EnemyComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnemyContainerComponent implements OnInit {
  gameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  encounterEnemy = this.store.selectSignal(EncounterSelectors.currentEnemy);
  currentQuestStatus = this.store.selectSignal(CurrentGameSelectors.currentQuestCardStatus);

  public emptyMob: Mob = {
    name: '',
    type: '',
    token: [],
  };

  currentEnemy = computed(() => this.encounterEnemy() ?? this.emptyMob);

  private jokerSelectionActiveState = this.store.selectSignal(JokerSelectionSelectors.isActive);

  /** Nie true gegen eine Ereigniskarte (`token: ['event']`, siehe monster-collection.data.ts) -
   * Joker wirkt laut Anleitung nicht gegen Events (CardPlayService.resolveJoker() hat denselben
   * Guard als zweite Absicherung). Ohne diesen Zusatz-Check würde ein Encounter-Wechsel während
   * einer laufenden Auswahl (bewusst nicht automatisch abgebrochen, siehe joker-selection-
   * state.ts) das einzelne "event"-Token selbst leuchten und anklickbar lassen. */
  jokerSelectionActive = computed(
    () => this.jokerSelectionActiveState() && !this.currentEnemy().token.includes('event')
  );

  onTokenChosen(token: string): void {
    this.store.dispatch(new ChooseJokerToken(token));
  }

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

import { ChangeDetectionStrategy, Component, computed, effect, inject, output } from '@angular/core';
import { Store } from '@ngxs/store';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { DiebService } from 'src/app/services/dieb.service';
import { Mob } from 'src/models/monster/monster.class';
import { HERO_DEFINITIONS } from 'src/models/helden/hero-definitions';
import { HeropowerComponent } from '../heropower.component';

@Component({
    selector: 'app-heropower-container',
    template: `
    <app-heropower
      [currentGameId]="gameId()"
      [currentPlayerId]="playerId()"
      [currentEnemy]="enemy()"
      [currentDeliveryStack]="deliveryStack()"
    ></app-heropower>
  `,
    styles: [``],
    imports: [HeropowerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeropowerContainerComponent {
  private store = inject(Store);
  private diebService = inject(DiebService);

  gameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  currentEnemy = this.store.selectSignal(EncounterSelectors.currentEnemy);
  user = this.store.selectSignal(CurrentUserSelectors.currentUser);
  deliveryStack = this.store.selectSignal(CurrentDeliveryStackSelector.currentDeliveryStack);
  heropowerArray = this.store.selectSignal(HeropowerSelectors.currentHeropowerArray);
  heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);
  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);

  public emptyMob: Mob = {
    name: '',
    type: '',
    token: [],
  };

  playerId = computed(() => this.user().items.id ?? '');
  enemy = computed(() => this.currentEnemy() ?? this.emptyMob);

  // PlayerHandComponent owns the actual card-/handstack logic for these heropowers (it holds
  // the hand/cardstack signals this container does not have) — this container only detects
  // *when* a heropower resolves and delegates the *how* back up to its parent.
  readonly heropowerResolved = output<'array' | 'jaegerin' | 'walkuere' | 'magier'>();

  constructor() {
    // Aktion der Heropower hier durchführen, sobald sich Gegner oder Heropower-Auswahl ändern.
    // Welches Ereignis ein Held auslöst, steht als resolutionKind auf seiner HeroDefinition
    // (TODO 5 aus docs/done/player-hand-decomposition-plan.md, ersetzt den vorherigen
    // switch(heroname)) — Dieb bleibt Sonderfall, da er nie über heropowerResolved läuft,
    // sondern DiebService direkt aufruft.
    effect(() => {
      const enemy = this.enemy();
      const heropowerArray = this.heropowerArray();
      const heroname = this.currentUserHeroData().choosenHero;

      if (!this.heropowerActivated() || heropowerArray.length !== 3) {
        return;
      }

      const definition = HERO_DEFINITIONS.find((def) => def.heroName === heroname);
      if (!definition) {
        return;
      }

      if (definition.resolutionKind === 'dieb') {
        this.diebService.heropower(heropowerArray);
      } else {
        this.heropowerResolved.emit(definition.resolutionKind);
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, effect } from '@angular/core';
import { Store } from '@ngxs/store';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { DiebServiceService } from 'src/app/services/dieb-service.service';
import { SaveGameService } from 'src/app/services/save-game.service';
import { Mob } from 'src/models/monster/monster.class';
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
  game = this.store.selectSignal(CurrentGameSelectors.currentGameState);
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

  gameId = computed(() => this.game().gameId ?? '');
  playerId = computed(() => this.user().items.id ?? '');
  enemy = computed(() => this.game().currentEnemy ?? this.emptyMob);

  constructor(private store: Store, private saveGame: SaveGameService, private diebService: DiebServiceService) {
    // Aktion der Heropower hier durchführen, sobald sich Gegner oder Heropower-Auswahl ändern.
    effect(() => {
      const enemy = this.enemy();
      const heropowerArray = this.heropowerArray();
      const heroname = this.currentUserHeroData().choosenHero;

      if (this.heropowerActivated() && heropowerArray.length == 3) {
        switch (heroname) {
          case 'Gladiator':
          case 'Barbar':
          case 'Zauberin':
          case 'Waldläufer':
          case 'Ninja':
          case 'Paladin':
            this.checkheropowerArray();
            break;
          case 'Magier':
            break;
          case 'Jägerin':
            this.checkJaegerinHeropower();
            break;
          case 'Dieb':
            this.diebService.heropower(heropowerArray)
            break;
          case 'Walküre':
            this.checkWalkuereHeropower();
            break;
        }
      }
    });
  }

  checkheropowerArray() {}

  checkJaegerinHeropower() {}

  checkWalkuereHeropower() {}
}

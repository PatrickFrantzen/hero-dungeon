import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Store} from '@ngxs/store';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { Mob } from 'src/models/monster/monster.class';
import { MatCard } from '@angular/material/card';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-heropower',
    templateUrl: './heropower.component.html',
    styleUrls: ['./heropower.component.scss'],
    imports: [MatCard, NgClass],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeropowerComponent {
  readonly currentGameId = input<string>('');
  readonly currentPlayerId = input<string>('');
  readonly currentEnemy = input<Mob>({ name: '', token: [], type: '' });
  readonly currentDeliveryStack = input<string[]>([]);

  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);
  heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);

  heroName = computed(() => this.currentUserHeroData()?.choosenHero ?? '');
  heropower = computed(() => this.currentUserHeroData()?.heroPower ?? '');
  description = computed(() => this.currentUserHeroData()?.description ?? '');

  /** Rein UI-lokaler Zustand (Issue #49) - die Heropower-Karte ist kein permanentes Overlay
   * mehr, sondern klappt per FAB-Tap als Bottom-Sheet auf/zu. Heropower-Auslösung selbst
   * (heropowerActivated/heropowerArray) bleibt unverändert, nur die Präsentation ändert sich. */
  readonly sheetOpen = signal(false);

  toggleSheet(): void {
    this.sheetOpen.update((open) => !open);
  }

  constructor(
    private store: Store
  ) {}

  activateHeroPower() {
    // iOS Safari kennt navigator.vibrate nicht (dort undefined) - der Optional-Call
    // degradiert dann automatisch ohne Fehler, kein Feature-Check nötig (Issue #51).
    navigator.vibrate?.(15);
    this.store.dispatch(new UpdateHeropowerActivated(true))
    this.store.dispatch(new UpdateHeropowerArray([]))
  }

  deactivateHeroPower() {

    this.store.dispatch(new UpdateHeropowerActivated(false))
    this.store.dispatch(new UpdateHeropowerArray([]))
  }

  heroPowerGladiator() {
    if (this.currentEnemy().type === 'Person' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerBarbar() {
    if (this.currentEnemy().type === 'Monster' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();

  }

  heroPowerZauberin() {
    if (this.currentEnemy().type === 'Hindernis' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerMagier() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerJaegerin() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  heroPowerWaldlaeufer() {
    if (this.currentEnemy().type === 'Person' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerDieb() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  heroPowerNinja() {
    if (this.currentEnemy().type === 'Hindernis' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerPaladin() {
    if (this.currentEnemy().type === 'Monster' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerWalkuere() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }
}

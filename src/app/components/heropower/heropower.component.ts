import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Store} from '@ngxs/store';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { Mob } from 'src/models/monster/monster.class';
import { HERO_DEFINITIONS } from 'src/models/helden/hero-definitions';
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

  /** Issue #93 + TODO 5 aus docs/done/player-hand-decomposition-plan.md: ersetzt die
   * ursprünglich zehn strukturell identischen `heroPower<Name>()`-Methoden (unterschieden sich
   * nur im geprüften `currentEnemy().type`) durch einen Lookup auf `HeroDefinition.activatesOn`
   * — ein unbekannter/leerer Heldenname ist weiterhin ein No-op. */
  onActivateHeropower(): void {
    const definition = HERO_DEFINITIONS.find((def) => def.heroName === this.heroName());
    if (!definition) {
      return;
    }
    const enemyMatches = definition.activatesOn === 'always' || definition.activatesOn === this.currentEnemy().type;
    if (enemyMatches && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else {
      this.deactivateHeroPower();
    }
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
}

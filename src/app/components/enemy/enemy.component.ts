import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { Mob } from 'src/models/monster/monster.class';
import { MatCard, MatCardHeader, MatCardContent, MatCardFooter } from '@angular/material/card';

/** `Mob.type` trägt bei den drei Encounter-Kategorien exakt diese Werte (siehe
 * monster-collection.data.ts) - bei Boss/Mini-Boss und den freitextigen Ereigniskarten-
 * Beschreibungen gibt es dagegen kein passendes Icon, dort bleibt typeIcon() undefined. */
const typeIconByType: Record<string, string> = {
  Person: 'person',
  Hindernis: 'hindernis',
  Monster: 'monster'
};

@Component({
    selector: 'app-enemy',
    templateUrl: './enemy.component.html',
    styleUrls: ['./enemy.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardContent, MatCardFooter],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnemyComponent {
  readonly currentEnemy = input.required<Mob>();
  readonly gameId = input<string>('');
  readonly questCardStatus = input<boolean>(false);

  /** Rein UI-lokaler Zustand (Issue #50) - Name + Token-Icons bleiben immer sichtbar, die
   * Beschreibung klappt per Tap auf die Karte ein/aus. Kein Store-State nötig, da nichts
   * Spielrelevantes betroffen ist. */
  readonly descriptionExpanded = signal(false);

  /** Zeigt an, ob und welches Kategorie-Icon (Person/Hindernis/Monster,
   * `assets/img/monsterToken/{{typeIcon()}}.png`) zusätzlich zu den Kampf-Token-Icons als
   * letztes Bild angehängt wird. */
  readonly typeIcon = computed(() => typeIconByType[this.currentEnemy().type]);

  toggleDescription(): void {
    this.descriptionExpanded.update((expanded) => !expanded);
  }
}

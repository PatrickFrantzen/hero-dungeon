import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal
} from '@angular/core';
import { Mob } from 'src/models/monster/monster.class';
import { MatCard, MatCardHeader, MatCardContent, MatCardFooter } from '@angular/material/card';

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

  toggleDescription(): void {
    this.descriptionExpanded.update((expanded) => !expanded);
  }
}

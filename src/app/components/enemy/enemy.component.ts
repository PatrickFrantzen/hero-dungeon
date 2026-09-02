import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { NgStyle } from '@angular/common';
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

// Dynamische Token-Icon-Größe (Live-Test-Feedback: Icons wirkten auf dem Handy zu klein).
// 12 ist die höchste Boss-Tokenzahl im Spiel ("Verdammt, ein Drache!!!"/"Der Dungeon-Overlord",
// siehe monster-collection.data.ts) - mehr Icons als das kommen nie gleichzeitig vor, das ist
// also bewusst die Referenz für "am kleinsten", nicht ein willkürlicher Wert.
const TOKEN_ICON_MAX_COUNT = 12;
const TOKEN_ICON_MIN_PX = 30;
const TOKEN_ICON_MAX_PX = 64;

@Component({
    selector: 'app-enemy',
    templateUrl: './enemy.component.html',
    styleUrls: ['./enemy.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardContent, MatCardFooter, NgStyle],
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

  /** Anzahl aller gleichzeitig gezeigten Icons (Kampf-Token + ggf. Kategorie-Icon) - Basis für
   * `tokenIconSizePx()`. */
  readonly tokenIconCount = computed(() => this.currentEnemy().token.length + (this.typeIcon() ? 1 : 0));

  /** Lineare Interpolation zwischen `TOKEN_ICON_MAX_PX` (wenige Icons, z.B. ein normales
   * Hindernis) und `TOKEN_ICON_MIN_PX` (Boss mit `TOKEN_ICON_MAX_COUNT` Icons) - als
   * `--token-size`-Custom-Property gebunden (siehe `player-hand.component.scss` fürs selbe
   * Muster: JS berechnet den fertigen Wert, SCSS wendet ihn nur noch an, mit einem
   * `clamp()`-Sicherheitsnetz für die Querformat-Kompaktansicht). */
  readonly tokenIconSizePx = computed(() => {
    const count = Math.max(1, this.tokenIconCount());
    const ratio = Math.min(1, (count - 1) / (TOKEN_ICON_MAX_COUNT - 1));
    return Math.round(TOKEN_ICON_MAX_PX - ratio * (TOKEN_ICON_MAX_PX - TOKEN_ICON_MIN_PX));
  });

  toggleDescription(): void {
    this.descriptionExpanded.update((expanded) => !expanded);
  }
}

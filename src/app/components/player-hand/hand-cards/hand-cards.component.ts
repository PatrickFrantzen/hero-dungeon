import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgStyle } from '@angular/common';

// Reiner Presenter (kein Store-/Firestore-Zugriff) - kapselt das Fächer-Layout und die
// Swipe-Geste der Handkarten, extrahiert aus PlayerHandComponent
// (docs/planned/player-hand-decomposition-plan.md, TODO 4). PlayerHandComponent bleibt für
// vibrate()/reportWriteFailure()/chooseCard() zuständig - dieser Presenter meldet nur, welche
// Karte per Tap/Swipe gewählt oder welche per Rasten-Button abgelegt wurde.
@Component({
  selector: 'app-hand-cards',
  templateUrl: './hand-cards.component.html',
  styleUrls: ['./hand-cards.component.scss'],
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandCardsComponent {
  hand = input.required<string[]>();
  singleplayer = input.required<boolean>();

  cardChosen = output<string>();
  cardRested = output<string>();

  /** Fächer-Layout für die Handkarten, sobald mehr als 5 Karten gehalten werden (Dieb "Stehlen":
   * 3 Handkarten ablegen, 5 nachziehen - kann die Hand auf bis zu 7 Karten wachsen lassen, siehe
   * dieb.service.ts). Bei ≤5 Karten bleibt die bestehende, nicht überlappende Reihe (Flexbox-
   * `gap`) unverändert - Inspiration Hearthstone/Slay the Spire: Karten überlappen statt in eine
   * zweite Reihe umzubrechen, fächern sich in einem Bogen auf und schrumpfen ab 6 Karten leicht,
   * damit die Reihe auch auf schmalen Screens eine einzige bleibt. Gesetzt werden nur CSS-Custom-
   * Properties (`--rot`/`--y`/`--scale`) plus `margin-left`/`z-index` - die eigentliche
   * `transform`-Deklaration (inkl. `:active`-Press-Feedback) steht in hand-cards.component.scss,
   * damit Inline-Styles nicht mit dem CSS-`:active`-Zustand kollidieren.
   *
   * Live-Test (2026-09-01) zeigte: die äußeren Karten rutschten bei 7-8 Karten seitlich aus dem
   * sichtbaren Bereich. Ursache: `margin-left` reserviert nur die UNROTIERTE Kartenbreite im
   * Flex-Layout (CSS `transform` ändert die Layout-Box nicht), die tatsächlich sichtbare
   * Bounding-Box einer rotierten Karte ist aber breiter (`W*cos(θ) + H*sin(θ)`) - bei der
   * vorherigen Rotation von bis zu ±28° und einem Höhen-/Breitenverhältnis von ~1.5 wuchs die
   * äußerste Karte dadurch spürbar über ihre reservierte Breite hinaus. Fix: Rotation deutlich
   * gedeckelt (max. ±17° statt ±28°) und Überlappung/Schrumpfung so nachgezogen, dass die
   * inkl. Rotationszuwachs sichtbare Gesamtbreite auch bei 8-10 Karten innerhalb eines typischen
   * Phone-Viewports (ab ~320px) bleibt, ohne dass horizontales Scrollen nötig wird. */
  readonly handCardStyles = computed(() => {
    const hand = this.hand();
    const total = hand.length;
    if (total <= 5) {
      return hand.map(() => ({}));
    }

    const spread = Math.min(34, (total - 5) * 8);
    const overlapFraction = Math.min(0.7, 0.18 + (total - 5) * 0.09);
    const shrink = total > 6 ? Math.max(0.68, 1 - (total - 6) * 0.07) : 1;

    return hand.map((_, index) => {
      const t = total === 1 ? 0 : index / (total - 1) - 0.5;
      const edgeBias = Math.abs(t) * 2;
      const style: Record<string, string> = {
        '--rot': `${(t * spread).toFixed(1)}deg`,
        '--y': `${(edgeBias * edgeBias * 12).toFixed(1)}px`,
        '--scale': `${shrink}`,
        'z-index': `${index}`,
      };
      if (index > 0) {
        style['margin-left'] = `calc(clamp(70px, 15vw, 150px) * -${overlapFraction.toFixed(2)})`;
      }
      return style;
    });
  });

  /** Swipe-Geste zum Karte-Spielen (Issue #52), additiv zu Tap - Tap bleibt über das
   * bestehende (click) auf dem Bild unverändert die primäre, verlässliche Interaktion. Nach
   * oben wischen über `swipeThresholdPx` löst `cardChosen` genauso aus wie ein Tap; wird der
   * Schwellwert nicht erreicht, snappt die Karte per CSS-Transition zurück in ihre
   * Fächer-Position (kein Emit, rein visuell). Reiner UI-Zustand, deshalb lokale Signale statt
   * Store. */
  private readonly swipeThresholdPx = 70;
  private dragStartY = 0;
  readonly draggingIndex = signal<number | null>(null);
  readonly dragDeltaY = signal(0);

  /** Merge aus dem Fächer-Basisstil (handCardStyles()) und, während eines aktiven Swipes an
   * genau diesem Index, dem zusätzlichen `--drag-y`-Custom-Property (siehe `.hand-card`-
   * Transform in hand-cards.component.scss), das die Karte dem Finger folgen lässt. */
  handCardStyle(index: number): Record<string, string> {
    const base = this.handCardStyles()[index] ?? {};
    if (this.draggingIndex() === index && this.dragDeltaY() !== 0) {
      return { ...base, '--drag-y': `${this.dragDeltaY().toFixed(1)}px` };
    }
    return base;
  }

  onCardTouchStart(event: TouchEvent, index: number): void {
    this.dragStartY = event.touches[0].clientY;
    this.draggingIndex.set(index);
    this.dragDeltaY.set(0);
  }

  onCardTouchMove(event: TouchEvent, index: number): void {
    if (this.draggingIndex() !== index) {
      return;
    }
    const delta = this.dragStartY - event.touches[0].clientY;
    // Nach unten nur wenig zulassen (Finger leicht verrutscht bleibt ein Tap-Kandidat), nach
    // oben auf das ~1.6-fache des Schwellwerts deckeln, damit die Karte dem Finger nicht
    // beliebig weit folgt.
    this.dragDeltaY.set(Math.max(-20, Math.min(delta, this.swipeThresholdPx * 1.6)));
    if (Math.abs(delta) > 8) {
      // Verhindert Seiten-Scroll/Pull-to-Refresh während des Ziehens UND den synthetischen
      // `click`, den mobile Browser nach touchend sonst zusätzlich zum direkten
      // cardChosen-Emit unten auslösen würden (Doppel-Ausspielen der Karte).
      event.preventDefault();
    }
  }

  onCardTouchEnd(event: TouchEvent, index: number, card: string): void {
    if (this.draggingIndex() !== index) {
      return;
    }
    const delta = this.dragDeltaY();
    this.draggingIndex.set(null);
    this.dragDeltaY.set(0);
    if (delta >= this.swipeThresholdPx) {
      event.preventDefault();
      this.cardChosen.emit(card);
    }
  }

  onCardTouchCancel(index: number): void {
    if (this.draggingIndex() !== index) {
      return;
    }
    this.draggingIndex.set(null);
    this.dragDeltaY.set(0);
  }
}

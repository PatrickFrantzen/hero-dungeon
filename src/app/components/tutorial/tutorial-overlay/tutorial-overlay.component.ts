import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { TutorialStep } from '../tutorial-steps.data';

@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.component.html',
  styleUrls: ['./tutorial-overlay.component.scss'],
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorialOverlayComponent {
  readonly active = input.required<boolean>();
  readonly step = input<TutorialStep | null>(null);
  readonly stepNumber = input(1);
  readonly totalSteps = input(1);
  readonly isFirstStep = input(false);
  readonly isLastStep = input(false);

  readonly next = output<void>();
  readonly previous = output<void>();
  readonly skip = output<void>();

  /** Position des hervorgehobenen Elements (Spotlight) - null, wenn der aktuelle Schritt keinen
   * `targetSelector` hat oder das Element (noch) nicht im DOM steht (z.B. ein Element auf einer
   * anderen Route). `document.querySelector()` + `getBoundingClientRect()` statt eines
   * ViewChild/Store-Zugriffs, weil das Zielelement zu einer beliebigen, von diesem Overlay
   * unabhaengigen Komponente irgendwo im Rest der App gehoert (siehe tutorial-plan.md,
   * Design-Entscheidung 2). */
  readonly spotlightRect = signal<DOMRect | null>(null);

  constructor() {
    effect(() => {
      const selector = this.step()?.targetSelector;
      if (!this.active() || !selector) {
        this.spotlightRect.set(null);
        return;
      }
      this.updateSpotlightRect(selector);
    });

    /* Stationen 3-6 zeigen auf Elemente aus dem laufenden Spiel (Timer, Gegner, Handkarten,
     * Heropower-FAB), die sich waehrend dieser Schritte durch Spielzuege verschieben oder
     * verkleinern koennen, sowie bei Orientierungswechsel auf Mobile - der Effekt oben laeuft
     * nur beim Schrittwechsel, deshalb hier zusaetzlich bei Resize/Orientierungswechsel neu
     * berechnen, solange das Overlay aktiv ist. */
    const recompute = () => {
      const selector = this.step()?.targetSelector;
      if (this.active() && selector) {
        this.updateSpotlightRect(selector);
      }
    };
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    });
  }

  private updateSpotlightRect(selector: string): void {
    const target = document.querySelector(selector);
    this.spotlightRect.set(target?.getBoundingClientRect() ?? null);
  }
}

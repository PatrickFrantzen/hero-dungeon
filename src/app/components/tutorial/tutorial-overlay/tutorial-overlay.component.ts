import {
  ChangeDetectionStrategy,
  Component,
  effect,
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
      const target = document.querySelector(selector);
      this.spotlightRect.set(target?.getBoundingClientRect() ?? null);
    });
  }
}

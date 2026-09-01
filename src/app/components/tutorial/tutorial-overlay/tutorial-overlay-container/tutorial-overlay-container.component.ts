import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Store } from '@ngxs/store';
import {
  CompleteTutorial,
  NextTutorialStep,
  PreviousTutorialStep,
  SkipTutorial
} from 'src/app/actions/tutorial-action';
import { TutorialSelectors } from 'src/app/selectors/tutorial-selector';
import { tutorialSteps } from '../../tutorial-steps.data';
import { TutorialOverlayComponent } from '../tutorial-overlay.component';

@Component({
  selector: 'app-tutorial-overlay-container',
  template: `
    <app-tutorial-overlay
      [active]="active()"
      [step]="currentStep()"
      [stepNumber]="stepNumber()"
      [totalSteps]="totalSteps"
      [isFirstStep]="isFirstStep()"
      [isLastStep]="isLastStep()"
      (next)="onNext()"
      (previous)="onPrevious()"
      (skip)="onSkip()"
    ></app-tutorial-overlay>
  `,
  styles: [``],
  imports: [TutorialOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorialOverlayContainerComponent {
  readonly steps = tutorialSteps;
  readonly totalSteps = this.steps.length;

  readonly active = this.store.selectSignal(TutorialSelectors.isTutorialActive);
  readonly stepIndex = this.store.selectSignal(TutorialSelectors.currentStepIndex);

  readonly currentStep = computed(() => this.steps[this.stepIndex()] ?? null);
  readonly stepNumber = computed(() => this.stepIndex() + 1);
  readonly isFirstStep = computed(() => this.stepIndex() === 0);
  readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);

  constructor(private store: Store) {}

  onNext(): void {
    if (this.isLastStep()) {
      this.store.dispatch(new CompleteTutorial());
      return;
    }
    this.store.dispatch(new NextTutorialStep());
  }

  onPrevious(): void {
    this.store.dispatch(new PreviousTutorialStep());
  }

  onSkip(): void {
    this.store.dispatch(new SkipTutorial());
  }
}

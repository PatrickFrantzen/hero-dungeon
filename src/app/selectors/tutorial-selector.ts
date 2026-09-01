import { Selector } from '@ngxs/store';
import { TutorialModel, TutorialState } from '../states/tutorial-state';

export class TutorialSelectors {
  @Selector([TutorialState])
  static isTutorialActive(state: TutorialModel): boolean {
    return state.active;
  }

  @Selector([TutorialState])
  static currentStepIndex(state: TutorialModel): number {
    return state.currentStepIndex;
  }

  @Selector([TutorialState])
  static hasSeenTutorial(state: TutorialModel): boolean {
    return state.hasSeenTutorial;
  }
}

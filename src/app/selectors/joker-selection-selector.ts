import { Selector } from '@ngxs/store';
import { JokerSelectionState, JokerSelectionStateModel } from '../states/joker-selection-state';

export class JokerSelectionSelectors {
  @Selector([JokerSelectionState])
  static isActive(state: JokerSelectionStateModel): boolean {
    return state.active;
  }

  @Selector([JokerSelectionState])
  static chosenToken(state: JokerSelectionStateModel): string | null {
    return state.chosenToken;
  }
}

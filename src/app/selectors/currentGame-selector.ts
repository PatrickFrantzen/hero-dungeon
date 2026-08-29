import { Selector } from '@ngxs/store';
import {
  CurrentGameModel,
  CurrentGameState,
} from '../states/currentGame-state';

export class CurrentGameSelectors {
  @Selector([CurrentGameState])
  static currentGame(state: CurrentGameModel): string {
    return state.items;
  }

  @Selector([CurrentGameState])
  static currentQuestCardStatus(state: CurrentGameModel): boolean {
    return state.questCardActivated;
  }

  @Selector([CurrentGameState])
  static currentGameStatus(state: CurrentGameModel): string {
    return state.gameStatus;
  }

  @Selector([CurrentGameState])
  static currentNumberOfPlayers(state: CurrentGameModel): number {
    return state.numberOfPlayers;
  }
}

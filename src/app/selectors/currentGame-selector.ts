import { Selector } from '@ngxs/store';
import {
  CurrentGameModel,
  CurrentGameState,
} from '../states/currentGame-state';
import { Game } from 'src/models/game';

export class CurrentGameSelectors {
  @Selector([CurrentGameState])
  static currentGame(state: CurrentGameModel): string {
    return state.items;
  }

  @Selector([CurrentGameState])
  static currentGameState(state: CurrentGameModel): Game {
    return state.game;
  }

  @Selector([CurrentGameState])
  static currentQuestCardStatus(state: CurrentGameModel): boolean {
    return state.game.questCardActivated;
  }
}

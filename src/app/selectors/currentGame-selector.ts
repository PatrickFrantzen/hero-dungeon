import { Selector } from '@ngxs/store';
import {
  CurrentGameModel,
  CurrentGameState,
} from '../states/currentGame-state';
import { GameStats } from 'src/models/game';

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

  @Selector([CurrentGameState])
  static currentTimerStartedAt(state: CurrentGameModel): number | null {
    return state.timerStartedAt;
  }

  @Selector([CurrentGameState])
  static currentTimerDurationSeconds(state: CurrentGameModel): number {
    return state.timerDurationSeconds;
  }

  @Selector([CurrentGameState])
  static currentTimerPausedAt(state: CurrentGameModel): number | null {
    return state.timerPausedAt;
  }

  @Selector([CurrentGameState])
  static currentTimerPausedSecondsTotal(state: CurrentGameModel): number {
    return state.timerPausedSecondsTotal;
  }

  @Selector([CurrentGameState])
  static currentDifficulty(state: CurrentGameModel): string {
    return state.difficulty;
  }

  @Selector([CurrentGameState])
  static currentStats(state: CurrentGameModel): GameStats {
    return state.stats;
  }
}

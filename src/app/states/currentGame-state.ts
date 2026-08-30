import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CurrentGameAction,
  CurrentGameData,
  ResetGameTimer,
  SetGameStats,
  SetGameTimerPauseState,
  StartGameTimer,
  UpdateGameStatus,
  updateQuestCardActivated,
} from '../actions/currentGame-action';
import { GameStats, GameStatus } from 'src/models/game';

const DEFAULT_STATS: GameStats = { enemiesDefeated: 0, cardsPlayed: 0, cardsCycled: 0, heropowersUsed: 0 };

export interface CurrentGameModel {
  items: string;
  numberOfPlayers: number;
  gameId: string;
  difficulty: string;
  isLost: boolean;
  gameStatus: GameStatus;
  questCardActivated: boolean;
  timerStartedAt: number | null;
  timerDurationSeconds: number;
  timerPausedAt: number | null;
  timerPausedSecondsTotal: number;
  stats: GameStats;
}

@State<CurrentGameModel>({
  name: 'currentGame',
  defaults: {
    items: '',
    numberOfPlayers: 0,
    gameId: '',
    difficulty: '',
    isLost: false,
    gameStatus: 'playing',
    questCardActivated: false,
    timerStartedAt: null,
    timerDurationSeconds: 300,
    timerPausedAt: null,
    timerPausedSecondsTotal: 0,
    stats: DEFAULT_STATS,
  },
})
@Injectable()
export class CurrentGameState {
  @Action(CurrentGameAction)
  getGameID(ctx: StateContext<CurrentGameModel>, action: CurrentGameAction) {
    const { id } = action;
    if (!id) return;

    ctx.patchState({ items: id });
  }

  // Spiel-Identität/Metadaten - Gegner/Mob/Boss (EncounterState) und choosenHeros (LobbyState)
  // haben je ihren eigenen @Action(CurrentGameData)-Handler auf denselben dispatchten Game-
  // Datensatz, siehe encounter-state.ts/lobby-state.ts.
  @Action(CurrentGameData)
  setGameData(ctx: StateContext<CurrentGameModel>, action: CurrentGameData) {
    const { game } = action;
    if (!game) return;

    ctx.patchState({
      numberOfPlayers: game.numberOfPlayers,
      gameId: game.gameId,
      difficulty: game.difficulty,
      isLost: game.isLost,
      gameStatus: game.gameStatus ?? (game.isLost ? 'lost' : 'playing'),
      questCardActivated: game.questCardActivated,
      timerStartedAt: game.timerStartedAt ?? null,
      timerDurationSeconds: game.timerDurationSeconds ?? 300,
      timerPausedAt: game.timerPausedAt ?? null,
      timerPausedSecondsTotal: game.timerPausedSecondsTotal ?? 0,
      stats: game.stats ?? DEFAULT_STATS,
    });
  }

  @Action(updateQuestCardActivated)
  updateQuestCardActivated(
    ctx: StateContext<CurrentGameModel>,
    action: updateQuestCardActivated
  ) {
    const { questCardActivated } = action;
    ctx.patchState({ questCardActivated });
  }

  @Action(UpdateGameStatus)
  updateGameStatus(ctx: StateContext<CurrentGameModel>, action: UpdateGameStatus) {
    const { gameStatus } = action;
    ctx.patchState({ gameStatus, isLost: gameStatus === 'lost' });
  }

  @Action(StartGameTimer)
  startGameTimer(ctx: StateContext<CurrentGameModel>, action: StartGameTimer) {
    if (ctx.getState().timerStartedAt !== null) return;
    ctx.patchState({ timerStartedAt: action.timerStartedAt });
  }

  @Action(SetGameTimerPauseState)
  setGameTimerPauseState(ctx: StateContext<CurrentGameModel>, action: SetGameTimerPauseState) {
    ctx.patchState({
      timerPausedAt: action.timerPausedAt,
      timerPausedSecondsTotal: action.timerPausedSecondsTotal,
    });
  }

  @Action(ResetGameTimer)
  resetGameTimer(ctx: StateContext<CurrentGameModel>) {
    ctx.patchState({
      timerStartedAt: null,
      timerPausedAt: null,
      timerPausedSecondsTotal: 0,
    });
  }

  @Action(SetGameStats)
  setGameStats(ctx: StateContext<CurrentGameModel>, action: SetGameStats) {
    ctx.patchState({ stats: action.stats });
  }
}

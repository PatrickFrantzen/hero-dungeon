import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CurrentGameAction,
  CurrentGameData,
  StartGameTimer,
  UpdateGameStatus,
  updateQuestCardActivated,
} from '../actions/currentGame-action';
import { GameStatus } from 'src/models/game';

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
}

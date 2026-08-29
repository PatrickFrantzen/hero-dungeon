import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CurrentGameAction,
  CurrentGameData,
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
}

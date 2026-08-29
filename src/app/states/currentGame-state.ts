import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CurrentGameAction,
  CurrentGameData,
  updateQuestCardActivated,
} from '../actions/currentGame-action';
import { Game } from 'src/models/game';
import { ToJSONService } from '../services/to-json.service';

export interface CurrentGameModel {
  items: string;
  game: Game;
}

@State<CurrentGameModel>({
  name: 'currentGame',
  defaults: {
    items: '',
    game: {
      numberOfPlayers: 0,
      choosenHeros: [
        {
          playerName: '',
          playerId: '',
          playerHero: '',
        },
      ],
      currentEnemy: { name: '', token: [], type: '' },
      currentBoss: { name: '', token: [], type: '' },
      isLost: false,
      gameId: '',
      difficulty: '',
      Mob: [],
      allBosses: [],
      questCardActivated: false,
    },
  },
})
@Injectable()
export class CurrentGameState {
  constructor(JSON: ToJSONService) {}
  @Action(CurrentGameAction)
  getGameID(ctx: StateContext<CurrentGameModel>, action: CurrentGameAction) {
    const { id } = action;
    if (!id) return;

    const state = ctx.getState();
    const gameId: string = id;

    ctx.setState({
      ...state,
      items: gameId,
    });
  }

  @Action(CurrentGameData)
  setGameData(ctx: StateContext<CurrentGameModel>, action: CurrentGameData) {
    const { game } = action;
    if (!game) return;

    const state = ctx.getState();
    const gameData: Game = game;

    ctx.setState({
      ...state,
      game: gameData,
    });
  }

  @Action(updateQuestCardActivated)
  updateQuestCardActivated(
    ctx: StateContext<CurrentGameModel>,
    action: updateQuestCardActivated
  ) {
    const { questCardActivated } = action;

    const state = ctx.getState();
    const activation = questCardActivated;
    ctx.patchState({
      ...state,
      game: {
        ...state.game,
        questCardActivated: activation,
      },
    });
  }
}

import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { CurrentGameData } from '../actions/currentGame-action';
import { SetChoosenHeros, updateChoosenHeros } from '../actions/lobby-action';

export interface ChoosenHero {
  playerName: string;
  playerId: string;
  playerHero: string;
}

export interface LobbyModel {
  choosenHeros: ChoosenHero[];
}

@State<LobbyModel>({
  name: 'lobby',
  defaults: {
    // Übernommen 1:1 aus dem bisherigen CurrentGameModel.game.choosenHeros-Default: ein
    // einzelner leerer Platzhalter statt eines leeren Arrays - updateChoosenHero() unten
    // verlässt sich auf dieses Verhalten (length > 0 ist ab dem Default immer wahr).
    choosenHeros: [
      {
        playerName: '',
        playerId: '',
        playerHero: '',
      },
    ],
  },
})
@Injectable()
export class LobbyState {
  @Action(updateChoosenHeros)
  updateChoosenHero(ctx: StateContext<LobbyModel>, action: updateChoosenHeros) {
    const { hero } = action;
    if (!hero) {
      return;
    }

    const state = ctx.getState();
    const newHero: ChoosenHero = hero;

    const updatedChoosenHeros: ChoosenHero[] =
      state.choosenHeros.length > 0 ? [...state.choosenHeros, newHero] : [newHero];

    ctx.setState({
      ...state,
      choosenHeros: updatedChoosenHeros,
    });
  }

  @Action(SetChoosenHeros)
  setChoosenHeros(ctx: StateContext<LobbyModel>, action: SetChoosenHeros) {
    const { choosenHeros } = action;
    if (!choosenHeros) {
      return;
    }

    ctx.patchState({ choosenHeros });
  }

  @Action(CurrentGameData)
  setGameData(ctx: StateContext<LobbyModel>, action: CurrentGameData) {
    const { game } = action;
    if (!game) {
      return;
    }

    ctx.patchState({ choosenHeros: game.choosenHeros });
  }
}

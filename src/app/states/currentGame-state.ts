import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { CurrentGameAction } from "../actions/currentGame-action";


export interface CurrentGameModel {
    items: string
}

@State<CurrentGameModel>({
    name: 'currentGame',
    defaults: {
        items: ''
    }
})

@Injectable()
export class CurrentGameState {
    @Action(CurrentGameAction)
    getGameID(ctx: StateContext<CurrentGameModel>, action: CurrentGameAction) {

        const { id } = action;
        if (!id) {
            return
        }

        const state = ctx.getState();

        const gameId:string = id;

        ctx.setState( {
            ...state,
            items: gameId
        });
        console.log('currentGameId', ctx.getState())
    }
}
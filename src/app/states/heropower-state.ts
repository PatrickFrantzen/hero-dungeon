import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { UpdateHeropowerActivated, UpdateHeropowerArray } from "../actions/heropower-action";

export interface HeropowerStateModel {
    heropowerActivated: boolean,
    heropowerArray: string[]
}

@State<HeropowerStateModel>({
    name: 'heropower',
    defaults: {
        heropowerActivated: false,
        heropowerArray: []
    }
})

@Injectable()
export class heropowerState {

    @Action(UpdateHeropowerActivated)
    updateHeropower(ctx: StateContext<HeropowerStateModel>, action: UpdateHeropowerActivated) {
        const { heropower } = action;

        const state = ctx.getState();
        const heropowerStatus: boolean = heropower;
        ctx.patchState({
            ...state,
            heropowerActivated: heropowerStatus
        })
    }

    @Action(UpdateHeropowerArray)
    updateHeropowerArray(ctx: StateContext<HeropowerStateModel>, action: UpdateHeropowerArray) {
        const { heropowerArray } = action;

        const state = ctx.getState();
        const heropowerArr: string[] = heropowerArray;
        ctx.patchState({
            ...state,
            heropowerArray: heropowerArr
        })
        console.warn('ArrayState', ctx.getState())
    }
}
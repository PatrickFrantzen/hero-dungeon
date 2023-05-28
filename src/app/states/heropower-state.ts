import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { UpdateHeropowerActivated } from "../actions/heropower-action";

export interface HeropowerStateModel {
    heropowerActivated: boolean
}

@State<HeropowerStateModel>({
    name: 'heropower',
    defaults: {
        heropowerActivated: false
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
}
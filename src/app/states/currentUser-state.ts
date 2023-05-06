import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { CurrentUserAction } from "../actions/currentUser-action";


export interface CurrentUserModel{
    items: {
        id: string,
        name: string,
    }
}

@State<CurrentUserModel>({
    name: 'currentUser',
    defaults: {
        items: {
            id: '',
            name:''
        }
    }
})

@Injectable()
export class CurrentUserState{
    @Action(CurrentUserAction)
    getUserData(ctx: StateContext<CurrentUserModel>, action: CurrentUserAction) {
        const { id, name } = action;
        if (!id || !name) {
            return
        }
        
        const state = ctx.getState();
        const userData = {
            id: id,
            name: name
        }

        ctx.setState({
            ...state,
            items: userData
        })

        console.log('UserState', ctx.getState())
    }
}
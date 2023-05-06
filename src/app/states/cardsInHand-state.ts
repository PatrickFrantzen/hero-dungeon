
import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { Card } from "src/models/helden/card.class";
import { ChooseCardAction } from "../actions/cardsInHand-action";

export interface CardsInHandStateModel {
    items: Card[]
}

@State<CardsInHandStateModel>({
    name: 'cardsInHand',
    defaults: {
        items: []
    },
})

@Injectable()
export class cardsInHandState {
    @Action(ChooseCardAction) 
    chooseCard(ctx: StateContext<CardsInHandStateModel>, action: ChooseCardAction) {
        const {token} = action;

        if (!token) {
            return
        }
        
        const state = ctx.getState();
        const card: Card = {
            token: token
        }
        ctx.setState( {
            ...state,
            items: [...state.items, card]
        });
        console.log('CardState', ctx.getState())
    }
}

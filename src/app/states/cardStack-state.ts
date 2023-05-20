import { Injectable } from "@angular/core"
import { Action, State, StateContext } from "@ngxs/store"
import { CardStack } from "src/models/helden/card.class"
import { CreateNewCardStackAction, UpdateCardStackAction } from "../actions/CardStack-action"
import { Hero } from "src/models/helden/hero.class"
import { cardsInHandState } from "./cardsInHand-state"
import { patch } from "@ngxs/store/operators"

export interface CardStackModel {
    items: CardStack
}

@State<CardStackModel>({
    name: 'cardStack',
    defaults: {
        items: {
            cardstack: []
        }
    }
}
)
@Injectable()
export class CardStackState {

    @Action(CreateNewCardStackAction)
    createNewCardStack(ctx: StateContext<CardStackModel>, action: CreateNewCardStackAction) {

        const { cardstack } = action;
        if (!cardstack) {
            return
        }

        const state = ctx.getState();
        const CardStack: CardStack = {
            cardstack: cardstack
        }
        ctx.setState({
            ...state,
            items: CardStack
        });
        console.log('CreatedCardstackState', ctx.getState())
    }

    @Action(UpdateCardStackAction)
    updateCardStack(ctx: StateContext<CardStackModel>, action: UpdateCardStackAction) {
        const { cardstack } = action;
        if (!cardstack) {
            return
        }

        const CardStack: CardStack = {
            cardstack: cardstack
        }

        ctx.setState(
            patch<CardStackModel>({
                items: CardStack
            })
            )
            console.log('UpdatedCardstackState', ctx.getState())
    }

}
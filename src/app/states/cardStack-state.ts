import { Injectable } from "@angular/core"
import { Action, State, StateContext } from "@ngxs/store"
import { CardStack } from "src/models/helden/card.class"
import { CreateNewCardStackAction } from "../actions/createNewCardStack-action"
import { Hero } from "src/models/helden/hero.class"
import { cardsInHandState } from "./cardsInHand-state"
import { UpdateCardStackAction } from "../actions/updateCardStack-action"
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
        const HeroStack: CardStack = {
            cardstack: cardstack
        }
        ctx.setState({
            ...state,
            items: HeroStack
        });
        
    }

    @Action(UpdateCardStackAction)
    updateCardStack(ctx: StateContext<CardStackModel>, action: UpdateCardStackAction) {
        const { cardstack } = action;
        if (!cardstack) {
            return
        }

        const HeroStack: CardStack = {
            cardstack: cardstack
        }

        ctx.setState(
            patch<CardStackModel>({
                items: HeroStack
            })
            )
            console.log('UpdatedCardstackState', ctx.getState())
    }

}
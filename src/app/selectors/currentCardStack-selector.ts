import { Selector } from "@ngxs/store"
import { CardStackModel, CardStackState } from "../states/cardStack-state"

export class CurrentCardStackSelector {

    @Selector([CardStackState])
    static currentCardStack(state: CardStackModel): string[]{
        console.log('CurrentCardStackSelector', state.items.cardstack)
        return state.items.cardstack
    }
}
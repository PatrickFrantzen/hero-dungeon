import { Selector } from "@ngxs/store"
import { DeliveryStackModel, DeliveryStackState } from "../states/deliveryStack-state"

export class CurrentDeliveryStackSelector {

    @Selector([DeliveryStackState])
    static currentDeliveryStack(state: DeliveryStackModel): string[]{
        console.log('DeliveryStateSelector', state.items)
        return state.items
    }
}
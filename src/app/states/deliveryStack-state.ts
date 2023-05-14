import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { CurrentDeliveryStack, UpdateDeliveryStack } from "../actions/deliveryStack-action";

export interface DeliveryStackModel {
    items: string[]
}

@State<DeliveryStackModel>({
    name: 'deliveryStack',
    defaults: {
        items: []
    }
})

@Injectable()
export class DeliveryStackState {
    @Action(CurrentDeliveryStack)
    getCardsInDeliveryStack(ctx: StateContext<DeliveryStackModel>, action: CurrentDeliveryStack) {
       const { deliveryStackCards } = action;
       if (!deliveryStackCards) {
        return
       }
       const state = ctx.getState();
       const deliveryStack: string[] = deliveryStackCards;

       ctx.setState({
        ...state,
        items: deliveryStack
       })

       console.log('deliveryStack', ctx.getState())
    }

    @Action(UpdateDeliveryStack)
    updateCardsInDeliveryStack(ctx: StateContext<DeliveryStackModel>, action: UpdateDeliveryStack) {
        const { deliveryStackCards } = action;
       if (!deliveryStackCards) {
        return
       }
       const state = ctx.getState();
       const deliveryStack: string[] = deliveryStackCards;
       ctx.patchState({
        ...state,
        items: deliveryStack
       })

       console.log('UpdatedDeliveryStack', ctx.getState())
    }
}
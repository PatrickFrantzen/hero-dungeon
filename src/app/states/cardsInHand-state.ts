import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { CardStack } from 'src/models/helden/card.class';
import {
  CurrentCardsInHand,
  UpdateCurrentHandAction,
} from '../actions/cardsInHand-action';
import { patch } from '@ngxs/store/operators';

export interface CardsInHandStateModel {
  items: CardStack;
}

@State<CardsInHandStateModel>({
  name: 'cardsInHand',
  defaults: {
    items: {
      cardstack: [],
    },
  },
})
@Injectable()
export class cardsInHandState {
  @Action(CurrentCardsInHand)
  getCardsInHand(
    ctx: StateContext<CardsInHandStateModel>,
    action: CurrentCardsInHand,
  ) {
    const { cardsInHand } = action;

    if (!cardsInHand) {
      return;
    }

    const state = ctx.getState();
    const HandCards: CardStack = {
      cardstack: cardsInHand,
    };

    ctx.setState({
      ...state,
      items: HandCards,
    });
  }

  @Action(UpdateCurrentHandAction)
  updateCardsInHand(
    ctx: StateContext<CardsInHandStateModel>,
    action: UpdateCurrentHandAction,
  ) {
    const { cardsInHand } = action;
    if (!cardsInHand) {
      return;
    }

    const HandCards: CardStack = {
      cardstack: cardsInHand,
    };

    ctx.setState(
      patch<CardsInHandStateModel>({
        items: HandCards,
      }),
    );
  }
}

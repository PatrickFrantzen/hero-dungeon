import { Selector } from '@ngxs/store';
import {
  CurrentGameModel,
  CurrentGameState,
} from '../states/currentGame-state';
import {
  CardsInHandStateModel,
  cardsInHandState,
} from '../states/cardsInHand-state';
import { CardStack } from 'src/models/helden/card.class';

export class CurrentHandSelector {
  @Selector([cardsInHandState])
  static currentHand(state: CardsInHandStateModel): string[] {
    return state.items.cardstack;
  }
}

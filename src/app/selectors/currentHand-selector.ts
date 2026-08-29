import { Selector } from '@ngxs/store';
import {
  CardsInHandStateModel,
  cardsInHandState,
} from '../states/cardsInHand-state';

export class CurrentHandSelector {
  @Selector([cardsInHandState])
  static currentHand(state: CardsInHandStateModel): string[] {
    return state.items.cardstack;
  }
}

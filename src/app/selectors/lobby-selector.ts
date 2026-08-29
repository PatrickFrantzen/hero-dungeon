import { Selector } from '@ngxs/store';
import { ChoosenHero, LobbyModel, LobbyState } from '../states/lobby-state';

export class LobbySelectors {
  @Selector([LobbyState])
  static currentPlayers(state: LobbyModel): ChoosenHero[] {
    return state.choosenHeros;
  }
}

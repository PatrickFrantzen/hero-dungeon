import { Selector } from '@ngxs/store';
import {
  CurrentGameModel,
  CurrentGameState,
} from '../states/currentGame-state';
import { Mob } from 'src/models/monster/monster.class';
import { Game } from 'src/models/game';

export class CurrentGameSelectors {
  @Selector([CurrentGameState])
  static currentGame(state: CurrentGameModel): string {
    return state.items;
  }

  @Selector([CurrentGameState])
  static currentGameState(state: CurrentGameModel): Game {
    return state.game;
  }

  @Selector([CurrentGameState])
  static currentEnemy(state: CurrentGameModel): Mob {
    return state.game.currentEnemy;
  }

  @Selector([CurrentGameState])
  static currentMob(state: CurrentGameModel): Mob[] {
    return state.game.Mob;
  }

  @Selector([CurrentGameState])
  static currentBoss(state: CurrentGameModel): Mob {
    return state.game.currentBoss;
  }

  @Selector([CurrentGameState])
  static currentPlayers(
    state: CurrentGameModel
  ): { playerName: string; playerId: string; playerHero: string }[] {
    return state.game.choosenHeros;
  }

  @Selector([CurrentGameState])
  static currentQuestCardStatus(state: CurrentGameModel): boolean {
    return state.game.questCardActivated;
  }
}

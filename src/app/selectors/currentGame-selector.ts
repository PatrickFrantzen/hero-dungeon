import { Selector } from "@ngxs/store";
import { CurrentGameModel, CurrentGameState } from "../states/currentGame-state";
import { MonsterStack } from "src/models/monster/monster.class";

export class CurrentGameSelectors {

    @Selector([CurrentGameState])
    static currentGame(state: CurrentGameModel): string {
        console.log('currentGameSelector', state.items)
        return state.items;
    }

    @Selector([CurrentGameState])
    static currentEnemy(state: CurrentGameModel): {} {
        console.log('currentEnemySelector', state.game.currentEnemy)
        return state.game.currentEnemy
    }

    @Selector([CurrentGameState])
    static currentMonsterStack(state: CurrentGameModel): MonsterStack[] {
        console.log('currentMonsterStackSelector', state.game.monsterStack)
        return state.game.monsterStack
    }
}
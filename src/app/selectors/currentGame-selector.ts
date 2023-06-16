import { Selector } from "@ngxs/store";
import { CurrentGameModel, CurrentGameState } from "../states/currentGame-state";
import { Mob } from "src/models/monster/monster.class";

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
    static currentMob(state: CurrentGameModel): Mob[] {
        console.log('currentMobSelector', state.game.Mob)
        return state.game.Mob
    }

    @Selector([CurrentGameState])
    static currentBoss(state: CurrentGameModel): Mob {
        return state.game.currentBoss
    }

    @Selector([CurrentGameState])
    static currentPlayers(state: CurrentGameModel): { playerName: string; playerId: string; playerHero: string; }[] {
        return state.game.choosenHeros
    }

    @Selector([CurrentGameState])
    static currentQuestCardStatus(state: CurrentGameModel): boolean {
        return state.game.questCardActivated
    }
}
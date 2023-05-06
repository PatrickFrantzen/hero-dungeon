import { Selector } from "@ngxs/store";
import { CurrentGameModel, CurrentGameState } from "../states/currentGame-state";

export class CurrentGameSelectors {

    @Selector([CurrentGameState])
    static currentGame(state: CurrentGameModel): string {
        return state.items;
    }
}
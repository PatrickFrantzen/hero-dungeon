import { Selector } from "@ngxs/store";
import { HeropowerStateModel, heropowerState } from "../states/heropower-state";

export class HeropowerSelectors {

    @Selector([heropowerState])
    static currentHeropowerActivated(state: HeropowerStateModel): boolean {
        return state.heropowerActivated
    }
}
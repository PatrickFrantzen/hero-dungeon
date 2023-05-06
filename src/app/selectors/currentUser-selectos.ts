import { Selector } from "@ngxs/store";
import { CurrentUserModel, CurrentUserState } from "../states/currentUser-state";

export class CurrentUserSelectors {

    @Selector([CurrentUserState])
    static currentUser(state: CurrentUserModel): string {
        return state.items.id;
    }
}
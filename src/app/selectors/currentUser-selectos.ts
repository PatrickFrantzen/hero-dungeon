import { Selector } from "@ngxs/store";
import { CurrentUserModel, CurrentUserState } from "../states/currentUser-state";

export class CurrentUserSelectors {

    @Selector([CurrentUserState])
    static currentUserId(state: CurrentUserModel): string {
        return state.items.id;
    }

    @Selector([CurrentUserState])
    static currentUserName(state: CurrentUserModel): string {
        return state.items.name;
    }
}
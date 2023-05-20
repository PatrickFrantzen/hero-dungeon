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

    @Selector([CurrentUserState])
    static currentUserHeroData(state: CurrentUserModel): object {
        console.warn('currentUserSelector', state.hero)
        return state.hero;
    }
}
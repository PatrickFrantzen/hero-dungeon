import { Selector } from "@ngxs/store";
import { CurrentUserModel, CurrentUserState } from "../states/currentUser-state";
import { Herointerface } from "src/models/helden/hero.class";

export class CurrentUserSelectors {

    @Selector([CurrentUserState])
    static currentUserId(state: CurrentUserModel): string {
        return state.items.id;
    }

    @Selector([CurrentUserState])
    static currentUser(state: CurrentUserModel) {
        return state
    }

    @Selector([CurrentUserState])
    static currentUserName(state: CurrentUserModel): string {
        return state.items.name;
    }

    @Selector([CurrentUserState])
    static currentUserHeroData(state: CurrentUserModel): Herointerface {
        console.warn('currentUserSelector', state.hero)
        return state.hero;
    }
}
import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { Mob} from "src/models/monster/monster.class";
import { CurrentGameAction, CurrentGameData } from "../actions/currentGame-action";
import { CurrentGameState } from "./currentGame-state";
import { CurrentGameSelectors } from "../selectors/currentGame-selector";
import { patch } from "@ngxs/store/operators";
import { CreateNewMobAction, UpdateMobAction } from "../actions/MonsterStack-action";

export interface MobModel{
    enemys: Mob[]
}

@State<MobModel>({
    name: 'Mob',
    defaults: {
        enemys: [{
            name: '',
            type: '',
            token: []
        }]
    }
})
@Injectable()
export class MobState {

    @Action(CreateNewMobAction)
    createNewMob(ctx: StateContext<MobModel>, action: CreateNewMobAction) {
        const { mob } = action;
        if (!mob) {
            return
        }
        const state = ctx.getState();
        const Mob: Mob[] = 
            mob;
        
        ctx.setState({
            ...state,
            enemys: Mob
        });
        console.log('MobState', ctx.getState())
    }

    @Action(UpdateMobAction)
    updateMob(ctx: StateContext<MobModel>, action: UpdateMobAction) {
        const { mob } = action;
        if (!mob) {
            return
        }
        const Mob: Mob[] = 
        mob;

            ctx.setState(
                patch<MobModel>({
                    enemys: Mob
                })
                )
                console.log('UpdatedCardstackState', ctx.getState())
    }
}
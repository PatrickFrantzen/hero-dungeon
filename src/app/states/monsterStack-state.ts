import { Injectable } from "@angular/core";
import { Action, State, StateContext } from "@ngxs/store";
import { Mob, MonsterStack } from "src/models/monster/monster.class";
import { CreateNewMonsterStackAction, UpdateMonsterStackAction } from "../actions/MonsterStack-action";
import { CurrentGameAction, CurrentGameData } from "../actions/currentGame-action";
import { CurrentGameState } from "./currentGame-state";
import { CurrentGameSelectors } from "../selectors/currentGame-selector";
import { patch } from "@ngxs/store/operators";

export interface MonsterStackModel{
    items: MonsterStack[]
}

@State<MonsterStackModel>({
    name: 'monsterStack',
    defaults: {
        items: [{
            name: '',
            type: '',
            token: []
        }]
    }
})
@Injectable()
export class MonsterStackState {

    @Action(CreateNewMonsterStackAction)
    createNewMonsterStack(ctx: StateContext<MonsterStackModel>, action: CreateNewMonsterStackAction) {
        const { monsterStack } = action;
        if (!monsterStack) {
            return
        }
        const state = ctx.getState();
        const MonsterStack: MonsterStack[] = 
            monsterStack;
        
        ctx.setState({
            ...state,
            items: MonsterStack
        });
        console.log('MonsterStackState', ctx.getState())
    }

    @Action(UpdateMonsterStackAction)
    updateMonsterStack(ctx: StateContext<MonsterStackModel>, action: UpdateMonsterStackAction) {
        const { monsterStack } = action;
        if (!monsterStack) {
            return
        }
        const MonsterStack: MonsterStack[] = 
            monsterStack;

            ctx.setState(
                patch<MonsterStackModel>({
                    items: MonsterStack
                })
                )
                console.log('UpdatedCardstackState', ctx.getState())
    }
}
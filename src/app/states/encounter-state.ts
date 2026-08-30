import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { CurrentGameData } from '../actions/currentGame-action';
import { SetCurrentBoss, SetNewEnemy, SetRemainingBosses, UpdateMonsterTokenArray } from '../actions/encounter-action';
import { UpdateMobAction } from '../actions/MonsterStack-action';
import { Mob } from 'src/models/monster/monster.class';

export interface EncounterModel {
  currentEnemy: Mob;
  currentBoss: Mob;
  Mob: Mob[];
  allBosses: Mob[];
}

@State<EncounterModel>({
  name: 'encounter',
  defaults: {
    currentEnemy: { name: '', token: [], type: '' },
    currentBoss: { name: '', token: [], type: '' },
    Mob: [],
    allBosses: [],
  },
})
@Injectable()
export class EncounterState {
  @Action(UpdateMonsterTokenArray)
  updateMonsterTokenArray(ctx: StateContext<EncounterModel>, action: UpdateMonsterTokenArray) {
    const { currentEnemyToken } = action;
    if (!currentEnemyToken) return;

    const state = ctx.getState();
    const enemyTokenArray: string[] = currentEnemyToken;

    ctx.patchState({
      currentEnemy: {
        ...state.currentEnemy,
        token: enemyTokenArray,
      },
    });
  }

  @Action(SetNewEnemy)
  updateNewEnemy(ctx: StateContext<EncounterModel>, action: SetNewEnemy) {
    const { newEnemy } = action;
    if (!newEnemy) {
      return;
    }
    const enemy: Mob = newEnemy;
    ctx.patchState({ currentEnemy: enemy });
  }

  @Action(UpdateMobAction)
  updateMob(ctx: StateContext<EncounterModel>, action: UpdateMobAction) {
    const { mob } = action;
    if (!mob) {
      return;
    }
    const newMob: Mob[] = mob;
    ctx.patchState({ Mob: newMob });
  }

  @Action(SetCurrentBoss)
  setCurrentBoss(ctx: StateContext<EncounterModel>, action: SetCurrentBoss) {
    const { currentBoss } = action;
    if (!currentBoss) return;
    ctx.patchState({ currentBoss });
  }

  @Action(SetRemainingBosses)
  setRemainingBosses(ctx: StateContext<EncounterModel>, action: SetRemainingBosses) {
    const { remainingBosses } = action;
    if (!remainingBosses) return;
    ctx.patchState({ allBosses: remainingBosses });
  }

  @Action(CurrentGameData)
  setGameData(ctx: StateContext<EncounterModel>, action: CurrentGameData) {
    const { game } = action;
    if (!game) {
      return;
    }
    ctx.patchState({
      currentEnemy: game.currentEnemy,
      currentBoss: game.currentBoss,
      Mob: game.Mob,
      allBosses: game.allBosses,
    });
  }
}

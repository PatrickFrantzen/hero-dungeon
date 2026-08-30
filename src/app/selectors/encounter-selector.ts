import { Selector } from '@ngxs/store';
import { Mob } from 'src/models/monster/monster.class';
import { EncounterModel, EncounterState } from '../states/encounter-state';

export class EncounterSelectors {
  @Selector([EncounterState])
  static currentEnemy(state: EncounterModel): Mob {
    return state.currentEnemy;
  }

  @Selector([EncounterState])
  static currentMob(state: EncounterModel): Mob[] {
    return state.Mob;
  }

  @Selector([EncounterState])
  static currentBoss(state: EncounterModel): Mob {
    return state.currentBoss;
  }

  @Selector([EncounterState])
  static currentAllBosses(state: EncounterModel): Mob[] {
    return state.allBosses;
  }
}

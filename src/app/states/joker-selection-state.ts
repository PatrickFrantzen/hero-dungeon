import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  ActivateJokerSelection,
  ChooseJokerToken,
  ClearJokerToken,
  DeactivateJokerSelection
} from '../actions/joker-selection-action';

export interface JokerSelectionStateModel {
  active: boolean;
  chosenToken: string | null;
}

/** Rein clientlokaler UI-Zustand (nicht persistiert, kein Firestore-Bezug) - analog zu
 * `heropower-state.ts`, das dieselbe Rolle für die Heldenfähigkeiten-Aktivierung übernimmt.
 * `EnemyContainerComponent` (liest `active`, dispatcht `ChooseJokerToken`) und
 * `PlayerHandComponent` (dispatcht `Activate`/`DeactivateJokerSelection`, reagiert auf
 * `chosenToken`) sind Geschwister-Komponenten unter `GameComponent` ohne direkte Eltern-Kind-
 * Bindung - der Store ist hier bewusst das Kommunikationsmedium, kein Angular-Input/Output über
 * `GameComponent` als Vermittler. */
@State<JokerSelectionStateModel>({
  name: 'jokerSelection',
  defaults: {
    active: false,
    chosenToken: null
  }
})
@Injectable()
export class JokerSelectionState {
  @Action(ActivateJokerSelection)
  activate(ctx: StateContext<JokerSelectionStateModel>) {
    ctx.patchState({ active: true, chosenToken: null });
  }

  @Action(DeactivateJokerSelection)
  deactivate(ctx: StateContext<JokerSelectionStateModel>) {
    ctx.patchState({ active: false, chosenToken: null });
  }

  @Action(ChooseJokerToken)
  chooseToken(ctx: StateContext<JokerSelectionStateModel>, action: ChooseJokerToken) {
    if (!ctx.getState().active) return;
    ctx.patchState({ chosenToken: action.token });
  }

  @Action(ClearJokerToken)
  clearToken(ctx: StateContext<JokerSelectionStateModel>) {
    ctx.patchState({ chosenToken: null });
  }
}

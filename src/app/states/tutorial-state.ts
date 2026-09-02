import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CompleteTutorial,
  NextTutorialStep,
  PreviousTutorialStep,
  SkipTutorial,
  StartTutorial
} from '../actions/tutorial-action';

export interface TutorialModel {
  hasSeenTutorial: boolean;
  active: boolean;
  currentStepIndex: number;
}

@State<TutorialModel>({
  name: 'tutorial',
  defaults: {
    hasSeenTutorial: false,
    active: false,
    currentStepIndex: 0
  }
})
@Injectable()
export class TutorialState {
  @Action(StartTutorial)
  startTutorial(ctx: StateContext<TutorialModel>) {
    ctx.patchState({ active: true, currentStepIndex: 0 });
  }

  @Action(NextTutorialStep)
  nextTutorialStep(ctx: StateContext<TutorialModel>) {
    const state = ctx.getState();
    ctx.patchState({ currentStepIndex: state.currentStepIndex + 1 });
  }

  @Action(PreviousTutorialStep)
  previousTutorialStep(ctx: StateContext<TutorialModel>) {
    const state = ctx.getState();
    ctx.patchState({ currentStepIndex: Math.max(0, state.currentStepIndex - 1) });
  }

  // Skip zaehlt wie ein abgeschlossenes Tutorial (hasSeenTutorial: true) - sonst wuerde der
  // Auto-Trigger (PR 5) beim naechsten Singleplayer-Spiel erneut aufploppen, obwohl der Spieler
  // bereits bewusst "nein danke" gesagt hat.
  @Action(SkipTutorial)
  skipTutorial(ctx: StateContext<TutorialModel>) {
    ctx.patchState({ active: false, hasSeenTutorial: true, currentStepIndex: 0 });
  }

  @Action(CompleteTutorial)
  completeTutorial(ctx: StateContext<TutorialModel>) {
    ctx.patchState({ active: false, hasSeenTutorial: true, currentStepIndex: 0 });
  }
}

import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CurrentUserAction,
  CurrentUserHeroAction,
} from '../actions/currentUser-action';
import { Herointerface } from 'src/models/helden/hero.class';

export interface CurrentUserModel {
  items: {
    id: string;
    name: string;
  };
  hero: Herointerface
}

@State<CurrentUserModel>({
  name: 'currentUser',
  defaults: {
    items: {
      id: '',
      name: '',
    },
    hero: {
      choosenHero: '',
      heroPower: '',
      description: '',
    },
  },
})
@Injectable()
export class CurrentUserState {
  @Action(CurrentUserAction)
  getUserData(ctx: StateContext<CurrentUserModel>, action: CurrentUserAction) {
    const { id, name } = action;
    if (!id || !name) {
      return;
    }

    const state = ctx.getState();
    const userData = {
      id: id,
      name: name,
    };

    ctx.setState({
      ...state,
      items: userData,
    });
  }

  @Action(CurrentUserHeroAction)
  getUserHero(
    ctx: StateContext<CurrentUserModel>,
    action: CurrentUserHeroAction
  ) {
    const { choosenHero, heroPower, description } = action;
    if (!choosenHero || !heroPower) {
      return;
    }

    const state = ctx.getState();
    const userHero = {
      choosenHero: choosenHero,
      heroPower: heroPower,
      description: description,
    };

    ctx.setState({
      ...state,
      hero: userHero,
    });
  }
}

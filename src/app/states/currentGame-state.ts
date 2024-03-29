import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import {
  CurrentGameAction,
  CurrentGameData,
  SetNewEnemy,
  UpdateMonsterTokenArray,
  updateChoosenHeros,
  updateQuestCardActivated,
} from '../actions/currentGame-action';
import { Game } from 'src/models/game';
import { ToJSONService } from '../services/to-json.service';
import { Mob } from 'src/models/monster/monster.class';
import { UpdateMobAction } from '../actions/MonsterStack-action';

export interface CurrentGameModel {
  items: string;
  game: Game;
}

@State<CurrentGameModel>({
  name: 'currentGame',
  defaults: {
    items: '',
    game: {
      numberOfPlayers: 0,
      choosenHeros: [
        {
          playerName: '',
          playerId: '',
          playerHero: '',
        },
      ],
      currentEnemy: { name: '', token: [], type: '' },
      currentBoss: { name: '', token: [], type: '' },
      isLost: false,
      gameId: '',
      difficulty: '',
      Mob: [],
      allBosses: [],
      questCardActivated: false,
    },
  },
})
@Injectable()
export class CurrentGameState {
  constructor(JSON: ToJSONService) {}
  @Action(CurrentGameAction)
  getGameID(ctx: StateContext<CurrentGameModel>, action: CurrentGameAction) {
    const { id } = action;
    if (!id) return;

    const state = ctx.getState();
    const gameId: string = id;

    ctx.setState({
      ...state,
      items: gameId,
    });
  }

  @Action(CurrentGameData)
  setGameData(ctx: StateContext<CurrentGameModel>, action: CurrentGameData) {
    const { game } = action;
    if (!game) return;

    const state = ctx.getState();
    const gameData: Game = game;

    ctx.setState({
      ...state,
      game: gameData,
    });
  }

  @Action(UpdateMonsterTokenArray)
  updateMonsterTokenArray(
    ctx: StateContext<CurrentGameModel>,
    action: UpdateMonsterTokenArray
  ) {
    const { currentEnemyToken } = action;
    if (!currentEnemyToken) return;

    const state = ctx.getState();
    const enemyTokenArray: string[] = currentEnemyToken;

    ctx.patchState({
      ...state,
      game: {
        numberOfPlayers: state.game.numberOfPlayers,
        currentEnemy: {
          name: state.game.currentEnemy.name,
          token: enemyTokenArray,
          type: state.game.currentEnemy.type,
        },
        choosenHeros: state.game.choosenHeros,
        currentBoss: state.game.currentBoss,
        isLost: state.game.isLost,
        gameId: state.game.gameId,
        difficulty: state.game.difficulty,
        Mob: state.game.Mob,
        allBosses: state.game.allBosses,
        questCardActivated: state.game.questCardActivated,
      },
    });
  }

  @Action(SetNewEnemy)
  updateNewEnemy(ctx: StateContext<CurrentGameModel>, action: SetNewEnemy) {
    const { newEnemy } = action;
    if (!newEnemy) {
      return;
    }
    const state = ctx.getState();
    const enemy: Mob = newEnemy;
    ctx.patchState({
      ...state,
      game: {
        numberOfPlayers: state.game.numberOfPlayers,
        currentEnemy: enemy,
        choosenHeros: state.game.choosenHeros,
        currentBoss: state.game.currentBoss,
        isLost: state.game.isLost,
        gameId: state.game.gameId,
        difficulty: state.game.difficulty,
        Mob: state.game.Mob,
        allBosses: state.game.allBosses,
        questCardActivated: state.game.questCardActivated,
      },
    });
  }

  @Action(UpdateMobAction)
  updateMob(ctx: StateContext<CurrentGameModel>, action: UpdateMobAction) {
    const { mob } = action;
    if (!mob) {
      return;
    }
    const state = ctx.getState();
    const newMob: Mob[] = mob;
    ctx.patchState({
      ...state,
      game: {
        numberOfPlayers: state.game.numberOfPlayers,
        currentEnemy: state.game.currentEnemy,
        choosenHeros: state.game.choosenHeros,
        currentBoss: state.game.currentBoss,
        isLost: state.game.isLost,
        gameId: state.game.gameId,
        difficulty: state.game.difficulty,
        Mob: newMob,
        allBosses: state.game.allBosses,
        questCardActivated: state.game.questCardActivated,
      },
    });
  }

  @Action(updateChoosenHeros)
  updateChoosenHero(
    ctx: StateContext<CurrentGameModel>,
    action: updateChoosenHeros
  ) {
    const { hero } = action;
    if (!hero) {
      return;
    }

    const state = ctx.getState();
    const newHero: {
      playerName: string;
      playerId: string;
      playerHero: string;
    } = hero;

    let updatedChoosenHeros: Array<{
      playerName: string;
      playerId: string;
      playerHero: string;
    }>;

    if (state.game.choosenHeros.length > 0) {
      updatedChoosenHeros = [...state.game.choosenHeros, newHero];
    } else {
      updatedChoosenHeros = [newHero];
    }
    ctx.setState({
      ...state,
      game: {
        ...state.game,
        choosenHeros: updatedChoosenHeros,
      },
    });
  }

  @Action(updateQuestCardActivated)
  updateQuestCardActivated(
    ctx: StateContext<CurrentGameModel>,
    action: updateQuestCardActivated
  ) {
    const { questCardActivated } = action;

    const state = ctx.getState();
    const activation = questCardActivated;
    ctx.patchState({
      ...state,
      game: {
        ...state.game,
        questCardActivated: activation,
      },
    });
  }
}

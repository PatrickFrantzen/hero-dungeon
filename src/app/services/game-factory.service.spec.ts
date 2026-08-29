import { TestBed } from '@angular/core/testing';

import { GameFactoryService } from './game-factory.service';

describe('GameFactoryService', () => {
  let service: GameFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('buildNewGame builds a game with the given metadata and an initial enemy/boss/mob', () => {
    const game = service.buildNewGame(3, 'easy', 'game-1');

    expect(game.numberOfPlayers).toBe(3);
    expect(game.difficulty).toBe('easy');
    expect(game.gameId).toBe('game-1');
    expect(game.choosenHeros).toEqual([]);
    expect(game.isLost).toBeFalse();
    expect(game.questCardActivated).toBeFalse();
    expect(game.currentBoss.name).toBe('Baby-Barbar');
    expect(game.currentEnemy).toBeTruthy();
    expect(Array.isArray(game.Mob)).toBeTrue();
    expect(Array.isArray(game.allBosses)).toBeTrue();
  });
});

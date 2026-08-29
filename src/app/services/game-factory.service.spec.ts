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
    expect(game.gameStatus).toBe('playing');
    expect(game.questCardActivated).toBeFalse();
    expect(game.timerStartedAt).toBeNull();
    expect(game.timerDurationSeconds).toBe(300);
    expect(game.currentBoss.name).toBe('Baby-Barbar');
    expect(game.currentEnemy).toBeTruthy();
    expect(Array.isArray(game.Mob)).toBeTrue();
    expect(Array.isArray(game.allBosses)).toBeTrue();
  });

  it('buildNewGame creates six pre-boss encounters for a singleplayer game', () => {
    const game = service.buildNewGame(1, 'easy', 'solo-1');
    const preBossEncounters = [game.currentEnemy, ...game.Mob];

    expect(game.numberOfPlayers).toBe(1);
    expect(game.currentBoss.name).toBe('Baby-Barbar');
    expect(preBossEncounters.length).toBe(6);
    expect(preBossEncounters.filter((entry) => entry.token.includes('event')).length).toBe(1);
    expect(preBossEncounters.some((entry) => entry.name === 'Chaos')).toBeFalse();
  });
});

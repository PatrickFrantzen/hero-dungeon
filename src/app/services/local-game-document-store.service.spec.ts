import { TestBed } from '@angular/core/testing';

import { LocalGameDocumentStoreService } from './local-game-document-store.service';

describe('LocalGameDocumentStoreService', () => {
  let service: LocalGameDocumentStoreService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalGameDocumentStoreService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getDoc for a game path returns undefined when no save exists yet', () => {
    expect(service.getDoc(['games', 'local-1'])).toBeUndefined();
  });

  it('setDoc on a game path creates the save, readable via getDoc', () => {
    service.setDoc(['games', 'local-1'], { gameId: 'local-1', numberOfPlayers: 1 });

    expect(service.getDoc(['games', 'local-1'])).toEqual({ gameId: 'local-1', numberOfPlayers: 1 });
  });

  it('setDoc on a player path is readable via getDoc without touching the game doc', () => {
    service.setDoc(['games', 'local-1'], { gameId: 'local-1', numberOfPlayers: 1 });

    service.setDoc(['games', 'local-1', 'player', 'solo'], { userId: 'solo', handstack: [] });

    expect(service.getDoc(['games', 'local-1', 'player', 'solo'])).toEqual({ userId: 'solo', handstack: [] });
    expect(service.getDoc(['games', 'local-1'])).toEqual({ gameId: 'local-1', numberOfPlayers: 1 });
  });

  it('updateFields merges a patch into the game doc instead of replacing it', () => {
    service.setDoc(['games', 'local-1'], { gameId: 'local-1', numberOfPlayers: 1, gameStatus: 'playing' });

    service.updateFields(['games', 'local-1'], { gameStatus: 'won' });

    expect(service.getDoc(['games', 'local-1'])).toEqual({ gameId: 'local-1', numberOfPlayers: 1, gameStatus: 'won' });
  });

  it('updateFields merges a patch into the player doc instead of replacing it', () => {
    service.setDoc(['games', 'local-1'], { gameId: 'local-1', numberOfPlayers: 1 });
    service.setDoc(['games', 'local-1', 'player', 'solo'], { userId: 'solo', handstack: [], cardstack: ['red'] });

    service.updateFields(['games', 'local-1', 'player', 'solo'], { handstack: ['blue'] });

    expect(service.getDoc(['games', 'local-1', 'player', 'solo'])).toEqual({
      userId: 'solo',
      handstack: ['blue'],
      cardstack: ['red'],
    });
  });
});

import { TestBed } from '@angular/core/testing';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { FirestoreRepositoryService } from './firestore-repository.service';
import { GameRepositoryService } from './game-repository.service';

describe('GameRepositoryService', () => {
  let service: GameRepositoryService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(GameRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getGame reads the games/{gameId} document via the repository', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'getDoc').and.resolveTo({ gameId: 'game-1' });

    const result = await service.getGame('game-1');

    expect(spy).toHaveBeenCalledWith(['games', 'game-1']);
    expect(result).toEqual({ gameId: 'game-1' });
  });

  it('addPlayerToGame updates the choosenHeros field via the repository', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'updateFields').and.resolveTo();

    await service.addPlayerToGame('game-1', [{ playerId: 'p1' }]);

    expect(spy).toHaveBeenCalledWith(
      ['games', 'game-1'],
      jasmine.objectContaining({ choosenHeros: [{ playerId: 'p1' }], lastActivityAt: jasmine.anything() })
    );
  });

  it('createGame writes the full game document via the repository, with lastActivityAt added', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'setDoc').and.resolveTo();
    const game = { gameId: 'game-1', numberOfPlayers: 2 };

    await service.createGame('game-1', game);

    expect(spy).toHaveBeenCalledWith(
      ['games', 'game-1'],
      jasmine.objectContaining({ ...game, lastActivityAt: jasmine.anything() })
    );
  });

  it('createGame does NOT add lastActivityAt for a local (non-Firestore) game', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'setDoc').and.resolveTo();
    const game = { gameId: 'local-1', numberOfPlayers: 1 };

    await service.createGame('local-1', game);

    expect(spy).toHaveBeenCalledWith(['games', 'local-1'], game);
  });
});

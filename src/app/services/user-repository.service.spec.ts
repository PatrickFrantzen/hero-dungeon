import { TestBed } from '@angular/core/testing';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { FirestoreRepositoryService } from './firestore-repository.service';
import { UserRepositoryService } from './user-repository.service';

describe('UserRepositoryService', () => {
  let service: UserRepositoryService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(UserRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUser reads the users/{uid} document via the repository', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'getDoc').and.resolveTo({ userId: 'uid-1', games: ['game-1'] });

    const result = await service.getUser('uid-1');

    expect(spy).toHaveBeenCalledWith(['users', 'uid-1']);
    expect(result).toEqual({ userId: 'uid-1', games: ['game-1'] });
  });

  it('getJoinedGames migrates legacy string entries to { gameId, lastPlayedAt: 0 }', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    spyOn(repo, 'getDoc').and.resolveTo({ games: ['legacy-game'] });

    const result = await service.getJoinedGames('uid-1');

    expect(result).toEqual([{ gameId: 'legacy-game', lastPlayedAt: 0 }]);
  });

  it('getJoinedGames passes already-migrated entries through unchanged', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    spyOn(repo, 'getDoc').and.resolveTo({ games: [{ gameId: 'game-1', lastPlayedAt: 12345 }] });

    const result = await service.getJoinedGames('uid-1');

    expect(result).toEqual([{ gameId: 'game-1', lastPlayedAt: 12345 }]);
  });

  it('getJoinedGames returns an empty array when the user has no games field yet', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    spyOn(repo, 'getDoc').and.resolveTo({ userId: 'uid-1' });

    const result = await service.getJoinedGames('uid-1');

    expect(result).toEqual([]);
  });

  it('addJoinedGame writes the new game with a fresh lastPlayedAt, keeping other games untouched', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    spyOn(repo, 'getDoc').and.resolveTo({ games: [{ gameId: 'game-old', lastPlayedAt: 1 }] });
    const mergeSpy = spyOn(repo, 'setDocMerge').and.resolveTo();
    spyOn(Date, 'now').and.returnValue(999);

    await service.addJoinedGame('uid-1', 'game-new');

    expect(mergeSpy).toHaveBeenCalledWith(
      ['users', 'uid-1'],
      jasmine.objectContaining({
        games: [
          { gameId: 'game-old', lastPlayedAt: 1 },
          { gameId: 'game-new', lastPlayedAt: 999 },
        ],
      })
    );
  });

  it('addJoinedGame refreshes lastPlayedAt instead of duplicating an already-joined game', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    spyOn(repo, 'getDoc').and.resolveTo({ games: [{ gameId: 'game-1', lastPlayedAt: 1 }] });
    const mergeSpy = spyOn(repo, 'setDocMerge').and.resolveTo();
    spyOn(Date, 'now').and.returnValue(999);

    await service.addJoinedGame('uid-1', 'game-1');

    expect(mergeSpy).toHaveBeenCalledWith(
      ['users', 'uid-1'],
      jasmine.objectContaining({ games: [{ gameId: 'game-1', lastPlayedAt: 999 }] })
    );
  });
});

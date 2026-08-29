import { TestBed } from '@angular/core/testing';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { FirestoreRepositoryService } from './firestore-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

describe('PlayerRepositoryService', () => {
  let service: PlayerRepositoryService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(PlayerRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createPlayer merges playerJson and updateData into a single setDoc call', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'setDoc').and.resolveTo();

    await service.createPlayer('game-1', 'player-1', { userId: '', handstack: [] }, { userId: 'player-1' });

    expect(spy).toHaveBeenCalledWith(['games', 'game-1', 'player', 'player-1'], {
      userId: 'player-1',
      handstack: [],
    });
  });

  it('getPlayer reads the games/{gameId}/player/{playerId} document via the repository', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'getDoc').and.resolveTo({ userId: 'player-1' });

    const result = await service.getPlayer('game-1', 'player-1');

    expect(spy).toHaveBeenCalledWith(['games', 'game-1', 'player', 'player-1']);
    expect(result).toEqual({ userId: 'player-1' });
  });
});

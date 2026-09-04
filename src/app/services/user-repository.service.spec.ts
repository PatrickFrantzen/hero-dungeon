import { TestBed } from '@angular/core/testing';
import { arrayUnion } from '@angular/fire/firestore';
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

  it('addJoinedGame upserts games (arrayUnion) and lastActivityAt into users/{uid} via merge, without clobbering an existing profile', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'setDocMerge').and.resolveTo();

    await service.addJoinedGame('uid-1', 'game-1');

    expect(spy).toHaveBeenCalledWith(
      ['users', 'uid-1'],
      jasmine.objectContaining({ games: arrayUnion('game-1'), lastActivityAt: jasmine.anything() })
    );
  });
});

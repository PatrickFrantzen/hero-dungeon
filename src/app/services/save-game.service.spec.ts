import { TestBed } from '@angular/core/testing';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { FirestoreRepositoryService } from './firestore-repository.service';
import { SaveGameService } from './save-game.service';

describe('SaveGameService', () => {
  let service: SaveGameService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(SaveGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updateHandstack updates the handstack field via the repository', async () => {
    const repo = TestBed.inject(FirestoreRepositoryService);
    const spy = spyOn(repo, 'updateFields').and.resolveTo();

    await service.updateHandstack('game-1', 'player-1', ['red', 'blue']);

    expect(spy).toHaveBeenCalledWith(['games', 'game-1', 'player', 'player-1'], { handstack: ['red', 'blue'] });
  });
});

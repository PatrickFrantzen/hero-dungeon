import { TestBed } from '@angular/core/testing';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { FirestoreOperationError, FirestoreRepositoryService } from './firestore-repository.service';

describe('FirestoreRepositoryService', () => {
  let service: FirestoreRepositoryService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(FirestoreRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('wraps a failing getDoc in a FirestoreOperationError with the offending path', async () => {
    // Ein leerer Pfad ist für Firestore immer ungültig (kein Emulator/Netzwerk nötig, um den
    // Fehlerpfad zu testen).
    await expectAsync(service.getDoc([])).toBeRejectedWith(
      jasmine.objectContaining({
        name: 'FirestoreOperationError',
        operation: 'getDoc',
        path: [],
      } as Partial<FirestoreOperationError>)
    );
  });

  it('wraps a failing queryAll in a FirestoreOperationError with the offending path', async () => {
    await expectAsync(service.queryAll([], [])).toBeRejectedWith(
      jasmine.objectContaining({
        name: 'FirestoreOperationError',
        operation: 'queryAll',
        path: [],
      } as Partial<FirestoreOperationError>)
    );
  });

  describe('local- games (local Singleplayer, no Firestore access)', () => {
    afterEach(() => localStorage.clear());

    it('setDoc/getDoc round-trip through local storage instead of Firestore', async () => {
      await service.setDoc(['games', 'local-1'], { gameId: 'local-1', numberOfPlayers: 1 });

      await expectAsync(service.getDoc(['games', 'local-1'])).toBeResolvedTo({
        gameId: 'local-1',
        numberOfPlayers: 1,
      } as never);
    });
  });
});

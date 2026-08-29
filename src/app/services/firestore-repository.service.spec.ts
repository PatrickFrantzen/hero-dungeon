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
});

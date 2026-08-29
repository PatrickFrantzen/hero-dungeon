import { TestBed } from '@angular/core/testing';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { FirestoreSyncService } from './firestore-sync.service';

describe('FirestoreSyncService', () => {
  let service: FirestoreSyncService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(FirestoreSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

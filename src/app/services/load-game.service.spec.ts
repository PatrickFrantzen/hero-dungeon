import { TestBed } from '@angular/core/testing';
import { ensureAngularFireSchedulersInitialized, ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { LoadGameService } from './load-game.service';

describe('LoadGameService', () => {
  let service: LoadGameService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({});
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(LoadGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

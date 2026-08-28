import { TestBed } from '@angular/core/testing';
import { ensureAngularFireSchedulersInitialized, ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { SaveGameService } from './save-game.service';

describe('SaveGameService', () => {
  let service: SaveGameService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({});
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(SaveGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

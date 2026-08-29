import { TestBed } from '@angular/core/testing';
import { ensureAngularFireSchedulersInitialized, ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { GamePlayerService } from './game-player.service';

describe('GamePlayerService', () => {
  let service: GamePlayerService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({});
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(GamePlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
